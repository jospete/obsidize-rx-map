import { BehaviorSubject, isObservable, Observable } from 'rxjs';

import { OneToManyRelationship } from './relationships/one-to-many-relationship';
import { RxEntityMap } from './maps/rx-entity-map';
import { PropertySelector } from './common/utility';
import { Subsink } from './common/subsink';

/**
 * Base class for defining an app's storage data.
 * Use the define***() methods to stand up your core storage infrastructure.
 */
export class RxStore {

	protected readonly effectSubscriptions: Subsink = new Subsink();
	protected readonly properties: Set<BehaviorSubject<any>> = new Set();
	protected readonly entityMaps: Set<RxEntityMap<any, any>> = new Set();
	protected readonly oneToManyRelationships: Set<OneToManyRelationship<any, any, any>> = new Set();

	protected onDestroyProperty(property: BehaviorSubject<any>): void {
		property.error('store_property_destroyed');
		property.unsubscribe();
	}

	protected onDestroyEntityMap(entityMap: RxEntityMap<any, any>): void {
		entityMap.destroy();
	}

	protected onDestroyOneToManyRelationship(relation: OneToManyRelationship<any, any, any>): void {
		relation.clear();
	}

	public destroy(): void {
		this.effectSubscriptions.unsubscribe();
		this.oneToManyRelationships.forEach((value) => this.onDestroyOneToManyRelationship(value));
		this.entityMaps.forEach((value) => this.onDestroyEntityMap(value));
		this.properties.forEach((value) => this.onDestroyProperty(value));
	}

	public defineProperty<V>(startValue: V): BehaviorSubject<V> {
		return this.registerProperty(new BehaviorSubject<V>(startValue));
	}

	public registerProperty<V>(property: BehaviorSubject<V>): BehaviorSubject<V> {
		this.properties.add(property);
		return property;
	}

	public defineEntity<K, V>(selectKey: PropertySelector<K, V>): RxEntityMap<K, V> {
		return this.registerEntity(new RxEntityMap<K, V>(selectKey));
	}

	public registerEntity<K, V>(entityMap: RxEntityMap<K, V>): RxEntityMap<K, V> {
		this.entityMaps.add(entityMap);
		return entityMap;
	}

	public registerEffect<T>(effect: Observable<T>): Observable<T> {
		if (isObservable(effect)) this.effectSubscriptions.add(effect.subscribe());
		return effect;
	}

	public defineEntityForeignKey<K, V, T>(
		entityMap: RxEntityMap<K, V>,
		selectForeignKey: PropertySelector<T, V>
	): OneToManyRelationship<K, V, T> {
		const entityFkRelationship = new OneToManyRelationship<K, V, T>(entityMap, selectForeignKey);
		this.oneToManyRelationships.add(entityFkRelationship);
		this.registerEffect(entityFkRelationship.changes);
		return entityFkRelationship;
	}
}