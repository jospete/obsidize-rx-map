import { isNil, merge, isFunction } from 'lodash';

export type Predicate<T> = (entity: T) => boolean;
export type EntityTransform<T> = (entity: T | undefined) => T;
export type IdSelector<K, V> = (entity: V) => K;

export interface Update<K, V> {
	id: K;
	changes: Partial<V>;
}

export interface EntityTransformOne<K, V> {
	id: K;
	transform: EntityTransform<V>;
}

/**
 * Heavily influenced by @ngrx/entity's entity adapter interface.
 * The methods defined here are intended to follow the same paradigm as the ngrx adapter collection methods:
 * https://ngrx.io/guide/entity/adapter#adapter-collection-methods
 */
export class EntityMap<K, V, T extends Map<K, V>> {

	constructor(
		public readonly store: T,
		private readonly selectId: IdSelector<K, V>
	) {
	}

	public keys(): K[] {
		return Array.from(this.store.keys());
	}

	public values(): V[] {
		return Array.from(this.store.values());
	}

	public entries(): [K, V][] {
		return Array.from(this.store.entries());
	}

	public getId(entity: V): K | undefined {
		return entity ? this.selectId(entity) : undefined;
	}

	public isValidId(id: K | undefined | null): boolean {
		return !isNil(id);
	}

	public getOne(id: K): V | undefined {
		return this.store.get(id);
	}

	public getMany(ids: K[]): V[] {
		return Array.from(ids).map(id => this.getOne(id)!);
	}

	public hasOne(id: K): boolean {
		return this.store.has(id);
	}

	public hasEvery(ids: K[]): boolean {
		return Array.from(ids).every(id => this.hasOne(id));
	}

	public hasSome(ids: K[]): boolean {
		return Array.from(ids).some(id => this.hasOne(id));
	}

	public addOne(entity: V): V | undefined {
		return this.upsertOne(entity);
	}

	public addMany(entities: V[]): V[] {
		return Array.from(entities).map(e => this.addOne(e)!);
	}

	public setOne(entity: V): V {
		const id = this.getId(entity);
		if (this.isValidId(id)) this.store.set(id!, entity);
		return entity;
	}

	public setMany(entities: V[]): V[] {
		return Array.from(entities).map(e => this.setOne(e));
	}

	public setAll(entities: V[]): V[] {
		this.removeAll();
		return this.setMany(entities);
	}

	public removeOne(key: K): boolean {
		return this.store.delete(key);
	}

	public removeMany(keys: K[]): boolean[] {
		return Array.from(keys).map(k => this.removeOne(k));
	}

	public removeWhere(predicate: Predicate<V>): V[] {
		const entities = Array.from(this.store.values()).filter(predicate);
		const keys: K[] = Array.from(entities).map(e => this.getId(e)!).filter(id => this.isValidId(id));
		this.removeMany(keys);
		return entities;
	}

	public removeAll(): void {
		this.store.clear();
	}

	public updateOne(update: Update<K, V>): V | undefined {
		if (!update) return undefined;
		const { id, changes } = update;
		const combinedValue = merge(this.store.get(id), changes);
		this.store.set(id, combinedValue);
		return combinedValue;
	}

	public updateMany(updates: Update<K, V>[]): V[] {
		return Array.from(updates).map(u => this.updateOne(u)!);
	}

	public upsertOne(entity: V): V | undefined {
		const id = this.getId(entity);
		if (!this.isValidId(id)) return entity;
		const entityUpdate = { id: id!, changes: entity };
		return this.updateOne(entityUpdate);
	}

	public upsertMany(entities: V[]): V[] {
		return Array.from(entities).map(e => this.upsertOne(e)!);
	}

	public transformOne(options: EntityTransformOne<K, V>): V | undefined {
		if (!options) return undefined;
		const { id, transform } = options;
		const changes = transform(this.store.get(id));
		return this.updateOne({ id, changes });
	}

	public transformMany(transform: EntityTransform<V>): V[] {
		if (!isFunction(transform)) return this.values();
		return Array.from(this.store.entries()).map(([id, entity]) => {
			const entityUpdate = { id, changes: transform(entity) };
			return this.updateOne(entityUpdate)!;
		});
	}
}