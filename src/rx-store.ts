import { BehaviorSubject } from 'rxjs';

import { KeySelector } from './entity-map';
import { RxEntityMap } from './rx-entity-map';

/**
 * Base class for defining an app's storage data.
 * Use the define***() methods to stand up your core storage infrastructure.
 * 
 * @example
 * 
 * export interface User {
 * 		id: string;
 * 		name: string;
 * 		age: number;
 * }
 * 
 * export class AppStore extends RxStore {
 * 		
 * 		public readonly darkMode = this.defineProperty('darkMode', true);
 * 		public readonly users = this.defineEntityMap('users', (user: User) => user.id);
 * }
 */
export class RxStore {

	protected readonly properties: Map<string, BehaviorSubject<any>> = new Map();
	protected readonly propertyKeys: Map<BehaviorSubject<any>, string> = new Map();
	protected readonly entityMaps: Map<string, RxEntityMap<any, any>> = new Map();
	protected readonly entityMapKeys: Map<RxEntityMap<any, any>, string> = new Map();

	public defineProperty<V>(id: string, startValue: V): BehaviorSubject<V> {
		return this.definePropertyBinding(id, new BehaviorSubject<V>(startValue));
	}

	public definePropertyBinding<V>(id: string, property: BehaviorSubject<V>): BehaviorSubject<V> {
		if (this.properties.has(id)) throw new Error('property ID already defined! -> ' + id);
		this.properties.set(id, property);
		this.propertyKeys.set(property, id);
		return property;
	}

	public defineEntityMap<K, V>(id: string, selectKey: KeySelector<K, V>): RxEntityMap<K, V> {
		return this.defineEntityMapBinding(id, new RxEntityMap<K, V>(selectKey));
	}

	public defineEntityMapBinding<K, V>(id: string, entityMap: RxEntityMap<K, V>): RxEntityMap<K, V> {
		if (this.entityMaps.has(id)) throw new Error('entity ID already defined! -> ' + id);
		this.entityMaps.set(id, entityMap);
		this.entityMapKeys.set(entityMap, id);
		return entityMap;
	}

	public getProperty(id: string): BehaviorSubject<any> | undefined {
		return this.properties.get(id);
	}

	public getPropertyId(property: BehaviorSubject<any>): string | undefined {
		return this.propertyKeys.get(property);
	}

	public getEntityMap(id: string): RxEntityMap<any, any> | undefined {
		return this.entityMaps.get(id);
	}

	public getEntityMapId(entityMap: RxEntityMap<any, any>): string | undefined {
		return this.entityMapKeys.get(entityMap);
	}

	public destroy(): void {
		this.entityMaps.forEach((value, key) => this.onDestroyEntityMap(value, key));
		this.properties.forEach((value, key) => this.onDestroyProperty(value, key));
	}

	protected onDestroyProperty(property: BehaviorSubject<any>, _id: string): void {
		property.error('store_property_destroyed');
		property.unsubscribe();
	}

	protected onDestroyEntityMap(entityMap: RxEntityMap<any, any>, _id: string): void {
		entityMap.destroy();
	}
}