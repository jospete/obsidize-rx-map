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

	public keyOf(entity: V): K | undefined {
		return entity ? this.selectId(entity) : undefined;
	}

	public setOne(entity: V): V {
		const id = this.keyOf(entity);
		if (id !== undefined) this.store.set(id, entity);
		return entity;
	}

	public setMany(entities: V[]): V[] {
		return Array.from(entities).map(e => this.setOne(e));
	}

	public setAll(entities: V[]): V[] {
		this.store.clear();
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
		const keys: K[] = Array.from(entities).map(e => this.keyOf(e)!).filter(k => k !== undefined);
		this.removeMany(keys);
		return entities;
	}

	public removeAll(): void {
		this.store.clear();
	}

	public updateOne(update: Update<K, V>): V {
		const { id, changes } = update;
		const combinedValue = Object.assign({}, this.store.get(id), changes);
		this.store.set(id, combinedValue);
		return combinedValue;
	}

	public updateMany(updates: Update<K, V>[]): V[] {
		return Array.from(updates).map(u => this.updateOne(u));
	}

	public upsertOne(entity: V): V {
		const id = this.keyOf(entity);
		if (id === undefined) return entity;
		const entityUpdate = { id, changes: entity };
		return this.updateOne(entityUpdate);
	}

	public upsertMany(entities: V[]): V[] {
		return Array.from(entities).map(e => this.upsertOne(e));
	}

	public transformOne(options: EntityTransformOne<K, V>): V {
		const { id, transform } = options;
		const changes = transform(this.store.get(id));
		return this.updateOne({ id, changes });
	}

	public transformMany(transform: EntityTransform<V>): V[] {
		return Array.from(this.store.entries()).map(([id, entity]) => {
			const entityUpdate = { id, changes: transform(entity) };
			return this.updateOne(entityUpdate);
		});
	}
}