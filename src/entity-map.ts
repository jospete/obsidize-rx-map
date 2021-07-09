import { merge, map } from 'lodash';

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
export class EntityMap<K, V> {

	constructor(
		public readonly backend: Map<K, V>,
		private readonly selectId: IdSelector<K, V>
	) {
	}

	setOne(entity: V): V {
		const id = this.selectId(entity);
		this.backend.set(id, entity);
		return entity;
	}

	setMany(entities: V[]): V[] {
		return map(entities, e => this.setOne(e));
	}

	setAll(entities: V[]): V[] {
		this.backend.clear();
		return this.setMany(entities);
	}

	removeOne(key: K): boolean {
		return this.backend.delete(key);
	}

	removeMany(keys: K[]): boolean[] {
		return map(keys, k => this.removeOne(k));
	}

	removeWhere(predicate: Predicate<V>): V[] {
		const entities = Array.from(this.backend.values()).filter(predicate);
		const keys = map(entities, e => this.selectId(e));
		this.removeMany(keys);
		return entities;
	}

	removeAll(): void {
		this.backend.clear();
	}

	updateOne(update: Update<K, V>): V {
		const { id, changes } = update;
		const combinedValue = merge({}, this.backend.get(id), changes);
		this.backend.set(id, combinedValue);
		return combinedValue;
	}

	updateMany(updates: Update<K, V>[]): V[] {
		return map(updates, u => this.updateOne(u));
	}

	upsertOne(entity: V): V {
		return this.updateOne({ id: this.selectId(entity), changes: entity });
	}

	upsertMany(entities: V[]): V[] {
		return map(entities, e => this.upsertOne(e));
	}

	transformOne(options: EntityTransformOne<K, V>): V {
		const { id, transform } = options;
		const changes = transform(this.backend.get(id));
		return this.updateOne({ id, changes });
	}

	transformMany(transform: EntityTransform<V>): V[] {
		return Array.from(this.backend.entries())
			.map(([id, entity]) => this.updateOne({ id, changes: transform(entity) }));
	}
}