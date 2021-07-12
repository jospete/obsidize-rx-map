import { isNil, merge, isFunction, identity } from 'lodash';
import 'tslib';

export type Predicate<T> = (entity: T) => boolean;
export type KeySelector<K, V> = (entity: V) => K;
export type EntityTransform<T> = (entity: T) => T;

export interface Update<K, V> {
	key: K;
	changes: Partial<V>;
}

/**
 * Heavily influenced by @ngrx/entity's entity adapter interface.
 * The methods defined here are intended to follow the same paradigm as the ngrx adapter collection methods:
 * https://ngrx.io/guide/entity/adapter#adapter-collection-methods
 */
export class EntityMap<K, V, T extends Map<K, V>> {

	constructor(
		protected readonly store: T,
		protected readonly selectKey: KeySelector<K, V>
	) {
	}

	protected onSetKeyValuePair(key: K, value: V): void {
		this.store.set(key, value);
	}

	public get count(): number {
		return this.store.size;
	}

	public keyOf(entity: V): K | undefined {
		return entity ? this.selectKey(entity) : undefined;
	}

	public isValidKey(key: K | undefined | null): boolean {
		return !isNil(key);
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

	public getOne(key: K): V | undefined {
		return this.store.get(key);
	}

	public getMany(keys: K[]): V[] {
		return Array.from(keys).map(key => this.getOne(key)!);
	}

	public getManyExisting(keys: K[]): V[] {
		return this.getMany(keys).filter(identity);
	}

	public hasOne(key: K): boolean {
		return this.store.has(key);
	}

	public hasEvery(keys: K[]): boolean {
		return Array.from(keys).every(key => this.hasOne(key));
	}

	public hasSome(keys: K[]): boolean {
		return Array.from(keys).some(key => this.hasOne(key));
	}

	public addOne(entity: V): V | undefined {
		return this.upsertOne(entity);
	}

	public addMany(entities: V[]): V[] {
		return Array.from(entities).map(e => this.addOne(e)!);
	}

	public setOne(entity: V): V {
		const key = this.keyOf(entity);
		if (this.isValidKey(key)) this.onSetKeyValuePair(key!, entity);
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
		const entities = this.values().filter(predicate);
		const keys: K[] = entities.map(e => this.keyOf(e)!).filter(key => this.isValidKey(key));
		this.removeMany(keys);
		return entities;
	}

	public removeAll(): void {
		this.store.clear();
	}

	public updateOne(update: Update<K, V>): V | undefined {
		if (!update) return undefined;
		const { key, changes } = update;
		const combinedValue = merge(this.store.get(key), changes);
		this.onSetKeyValuePair(key, combinedValue);
		return combinedValue;
	}

	public updateMany(updates: Update<K, V>[]): V[] {
		return Array.from(updates).map(u => this.updateOne(u)!);
	}

	public upsertOne(entity: V): V | undefined {
		const key = this.keyOf(entity)!;
		if (!this.isValidKey(key)) return entity;
		const entityUpdate = { key, changes: entity };
		return this.updateOne(entityUpdate);
	}

	public upsertMany(entities: V[]): V[] {
		return Array.from(entities).map(e => this.upsertOne(e)!);
	}

	public transformOne(key: K, transform: EntityTransform<V>): V | undefined {
		const entity = this.getOne(key);
		if (!entity || !isFunction(transform)) return entity;
		const changes = transform(entity);
		return this.updateOne({ key: key, changes });
	}

	public transformMany(transform: EntityTransform<V>): V[] {
		if (!isFunction(transform)) return this.values();
		return this.entries().map(([key, entity]) => {
			const changes = transform(entity);
			return this.updateOne({ key, changes })!;
		});
	}
}