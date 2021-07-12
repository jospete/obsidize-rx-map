import { Predicate, Update, EntityTransform, EntityMapLike, KeySelector } from './entity-map';
import { RxEntityMap } from './rx-entity-map';

/**
 * Masked implementation of RxEntityMap where queries and mutation are segregated into different sub-maps.
 * This is a useful pattern when you want to manage value change requests and server responses separately (recommended).
 * 
 * - Watch and publish to "reported" to encapsulate server state
 * - Watch and publish to "desired" to encapsulate client state
 */
export class DuplexRxEntityMap<K, V> implements EntityMapLike<K, V> {

	constructor(
		public readonly desired: RxEntityMap<K, V>,
		public readonly reported: RxEntityMap<K, V>,
	) {
	}

	public static withKeySelector<IK, IV>(selectKey: KeySelector<IK, IV>): DuplexRxEntityMap<IK, IV> {
		return new DuplexRxEntityMap(new RxEntityMap(selectKey), new RxEntityMap(selectKey));
	}

	public destroy(): void {
		this.desired.destroy();
		this.reported.destroy();
	}

	public keyOf(entity: V): K | undefined {
		return this.reported.keyOf(entity);
	}

	public keys(): K[] {
		return this.reported.keys();
	}

	public values(): V[] {
		return this.reported.values();
	}

	public entries(): [K, V][] {
		return this.reported.entries();
	}

	public getOne(key: K): V | undefined {
		return this.reported.getOne(key);
	}

	public getMany(keys: K[]): V[] {
		return this.reported.getMany(keys);
	}

	public getManyExisting(keys: K[]): V[] {
		return this.reported.getManyExisting(keys);
	}

	public hasOne(key: K): boolean {
		return this.reported.hasOne(key);
	}

	public hasEvery(keys: K[]): boolean {
		return this.reported.hasEvery(keys);
	}

	public hasSome(keys: K[]): boolean {
		return this.reported.hasSome(keys);
	}

	public addOne(entity: V): V | undefined {
		return this.desired.addOne(entity);
	}

	public addMany(entities: V[]): V[] {
		return this.desired.addMany(entities);
	}

	public setOne(entity: V): V {
		return this.desired.setOne(entity);
	}

	public setMany(entities: V[]): V[] {
		return this.desired.setMany(entities);
	}

	public setAll(entities: V[]): V[] {
		return this.desired.setAll(entities);
	}

	public removeOne(key: K): boolean {
		return this.desired.removeOne(key);
	}

	public removeMany(keys: K[]): boolean[] {
		return this.desired.removeMany(keys);
	}

	public removeWhere(predicate: Predicate<V>): V[] {
		return this.desired.removeWhere(predicate);
	}

	public removeAll(): void {
		return this.desired.removeAll();
	}

	public updateOne(update: Update<K, V>): V | undefined {
		return this.desired.updateOne(update);
	}

	public updateMany(updates: Update<K, V>[]): V[] {
		return this.desired.updateMany(updates);
	}

	public upsertOne(entity: V): V | undefined {
		return this.desired.upsertOne(entity);
	}

	public upsertMany(entities: V[]): V[] {
		return this.desired.upsertMany(entities);
	}

	public transformOne(key: K, transform: EntityTransform<V>): V | undefined {
		return this.desired.transformOne(key, transform);
	}

	public transformMany(transform: EntityTransform<V>): V[] {
		return this.desired.transformMany(transform);
	}
}