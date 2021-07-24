import { filter, map, share, startWith, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { isUndefined } from 'lodash';

import { EntityPropertyChangeEvent } from '../events/entity-property-change-event';
import { pluckValueChanges } from '../common/operators';
import { PropertySelector } from '../common/utility';
import { RxEntityMap } from '../maps/rx-entity-map';
import { OneToManyContext } from './one-to-many-context';

/**
 * Cache map for tracking model foreign key relationships so that we have rapid lookup speed for associated models.
 * 
 * @example
 * 
 * // Has many orders
 * interface Product {
 * 		id: number; // is the primary key
 * }
 * 
 * // Has exactly one product
 * interface ProductOrder {
 * 		id: number;
 * 		productId: number; // is the foreign key
 * }
 */
export class OneToManyRelationship<K, V, T> {

	protected readonly store: Map<T, OneToManyContext<T, K>> = new Map();

	/**
	 * Changes for foriegn entity relations usually happen on the foreign entity itself, rather than the primary entity.
	 * 
	 * For example:
	 * ProductOrder has 'id' and 'productId' - a Product can have many orders associated with it, but the value
	 * being changed is 'productId' on ProductOrder, not 'id' on Product.
	 */
	public readonly changes: Observable<EntityPropertyChangeEvent<K, T>> = this.entityMap.changes.pipe(
		pluckValueChanges<K, V, T>(ev => this.selectForeignKey(ev)),
		filter(ev => ev.currentValue !== ev.previousValue),
		tap(ev => this.consume(ev)),
		share()
	);

	constructor(
		protected readonly entityMap: RxEntityMap<K, V>,
		protected readonly selectForeignKey: PropertySelector<T, V>
	) {
	}

	public associate(id: T, fk: K): void {
		const context = this.getPrimaryKeyContext(id);
		context.foreignKeySet.add(fk);
	}

	public disassociate(id: T, fk: K): void {
		const context = this.getPrimaryKeyContext(id);
		context.foreignKeySet.delete(fk);
	}

	public getRelatedValues(id: T): V[] {
		const context = this.getPrimaryKeyContext(id);
		return this.entityMap.getManyExisting(context.getForeignKeys());
	}

	public consume(ev: EntityPropertyChangeEvent<K, T>): void {
		if (!ev) return;
		this.disassociate(ev.previousValue!, ev.entityId);
		this.associate(ev.currentValue!, ev.entityId);
	}

	public clear(): void {
		this.store.forEach(context => context.clear());
		this.store.clear();
	}

	public watchPrimaryKey(id: T): Observable<V[]> {
		return this.changes.pipe(
			filter(ev => !!ev && (ev.previousValue === id || ev.currentValue === id)),
			map(() => this.getRelatedValues(id)),
			startWith(this.getRelatedValues(id))
		);
	}

	public getPrimaryKeyContext(id: T): OneToManyContext<T, K> {

		let result = this.store.get(id);

		if (!result) {
			result = new OneToManyContext<T, K>(id);
			this.store.set(id, result);
		}

		return result;
	}
}