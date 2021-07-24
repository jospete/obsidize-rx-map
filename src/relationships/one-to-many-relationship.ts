import { distinct, filter, map, startWith, tap } from 'rxjs/operators';
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
		pluckValueChanges<K, V, T>(this.selectForeignKey),
		distinct(ev => ev.currentValue),
		tap(ev => this.consume(ev))
	);

	constructor(
		protected readonly entityMap: RxEntityMap<K, V>,
		protected readonly selectForeignKey: PropertySelector<T, V>
	) {
	}

	public associate(id: T, fk: K): void {
		const context = this.getPrimaryKeyContext(id);
		if (context) context.foreignKeySet.add(fk);
	}

	public disassociate(id: T, fk: K): void {
		const context = this.getPrimaryKeyContext(id);
		if (context) context.foreignKeySet.delete(fk);
	}

	public getForeignEntitiesByPrimaryKey(id: T): V[] {
		const context = this.getPrimaryKeyContext(id);
		return context ? this.entityMap.getManyExisting(context.getForeignKeys()) : [];
	}

	public consume(ev: EntityPropertyChangeEvent<K, T>): void {
		this.disassociate(ev.previousValue!, ev.entityId);
		this.associate(ev.currentValue!, ev.entityId);
	}

	public clear(): void {
		this.store.forEach(context => context.clear());
		this.store.clear();
	}

	public upsert(entity: V): void {
		if (!entity) return;
		const pk = this.selectForeignKey(entity);
		const fk = this.entityMap.keyOf(entity)!;
		this.associate(pk, fk);
	}

	public watchPrimaryKey(id: T): Observable<V[]> {
		return this.changes.pipe(
			filter(ev => !!ev && (ev.previousValue === id || ev.currentValue === id)),
			map(() => this.getForeignEntitiesByPrimaryKey(id)),
			startWith(this.getForeignEntitiesByPrimaryKey(id))
		);
	}

	public getPrimaryKeyContext(id: T): OneToManyContext<T, K> | undefined {

		if (isUndefined(id)) return undefined;

		let result = this.store.get(id);

		if (!result) {
			result = new OneToManyContext<T, K>(id);
			this.store.set(id, result);
		}

		return result;
	}
}