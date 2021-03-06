import { Predicate, PropertySelector, isUndefined, isFunction, identity, mergeObjects, castArray } from '../common/utility';

export type EntityTransform<T> = (entity: T) => T;

export interface Update<K, V> {
	key: K;
	changes: Partial<V>;
}

export interface EntityMapLike<K, V> {
	keyOf(entity: V): K | undefined;
	keys(): K[];
	values(): V[];
	entries(): [K, V][];
	getOne(key: K): V | undefined;
	getMany(keys: K[]): V[];
	getManyExisting(keys: K[]): V[];
	hasOne(key: K): boolean;
	hasEvery(keys: K[]): boolean;
	hasSome(keys: K[]): boolean;
	addOne(entity: V): V | undefined;
	addMany(entities: V[]): V[];
	setOne(entity: V): V;
	setMany(entities: V[]): V[];
	setAll(entities: V[]): V[];
	removeOne(key: K): boolean;
	removeMany(keys: K[]): boolean[];
	removeWhere(predicate: Predicate<V>): V[];
	removeAll(): void;
	updateOne(update: Update<K, V>): V | undefined;
	updateMany(updates: Update<K, V>[]): V[];
	updateOneByKey(key: K, changes: Partial<V>): V | undefined;
	upsertOne(entity: V): V | undefined;
	upsertMany(entities: V[]): V[];
	transformOne(key: K, transform: EntityTransform<V>): V | undefined;
	transformMany(transform: EntityTransform<V>): V[];
}

/**
 * Heavily influenced by @ngrx/entity's entity adapter interface.
 * The methods defined here are intended to follow the same paradigm as the ngrx adapter collection methods:
 * https://ngrx.io/guide/entity/adapter#adapter-collection-methods
 */
export class EntityMap<K, V, T extends Map<K, V>> implements EntityMapLike<K, V> {

	constructor(
		protected readonly store: T,
		protected readonly selectKey: PropertySelector<K, V>
	) {
	}

	protected onSetEntry(key: K, value: V): void {
		this.store.set(key, value);
	}

	protected onDeleteEntry(key: K): boolean {
		return this.store.delete(key);
	}

	protected onMergeEntries(a?: Partial<V>, b?: Partial<V>): V {
		return mergeObjects(a, b);
	}

	public get count(): number {
		return this.store.size;
	}

	public keyOf(entity: V): K | undefined {
		return entity ? this.selectKey(entity) : undefined;
	}

	public isValidKey(key: K | undefined | null): boolean {
		return !isUndefined(key);
	}

	public iterableKeys(): IterableIterator<K> {
		return this.store.keys();
	}

	public keys(): K[] {
		return Array.from(this.iterableKeys());
	}

	public iterableValues(): IterableIterator<V> {
		return this.store.values();
	}

	public values(): V[] {
		return Array.from(this.iterableValues());
	}

	public iterableEntries(): IterableIterator<[K, V]> {
		return this.store.entries();
	}

	public entries(): [K, V][] {
		return Array.from(this.iterableEntries());
	}

	public getOne(key: K): V | undefined {
		return this.store.get(key);
	}

	public getMany(keys: K[]): V[] {
		return castArray<K>(keys).map(key => this.getOne(key)!);
	}

	public getManyExisting(keys: K[]): V[] {
		return this.getMany(keys).filter(identity);
	}

	public hasOne(key: K): boolean {
		return this.store.has(key);
	}

	public hasEvery(keys: K[]): boolean {
		return castArray<K>(keys).every(key => this.hasOne(key));
	}

	public hasSome(keys: K[]): boolean {
		return castArray<K>(keys).some(key => this.hasOne(key));
	}

	public addOne(entity: V): V | undefined {
		return this.upsertOne(entity);
	}

	public addMany(entities: V[]): V[] {
		return castArray<V>(entities).map(e => this.addOne(e)!);
	}

	public setOne(entity: V): V {

		const key = this.keyOf(entity);

		if (this.isValidKey(key)) {
			this.onSetEntry(key!, entity);
		}

		return entity;
	}

	public setMany(entities: V[]): V[] {
		return castArray<V>(entities).map(e => this.setOne(e));
	}

	public setAll(entities: V[]): V[] {
		this.removeAll();
		return this.setMany(entities);
	}

	public removeOne(key: K): boolean {
		return this.onDeleteEntry(key);
	}

	public removeMany(keys: K[]): boolean[] {
		return castArray<K>(keys).map(k => this.removeOne(k));
	}

	public removeWhere(predicate: Predicate<V>): V[] {

		let result: V[] = [];

		if (!isFunction(predicate)) {
			return result;
		}

		this.store.forEach((entity: V, key: K) => {

			if (!predicate(entity)) return;

			this.removeOne(key);
			result.push(entity);
		});

		return result;
	}

	public removeAll(): void {
		this.store.clear();
	}

	public updateOneByKey(key: K, changes: Partial<V>): V | undefined {
		const combinedValue = this.onMergeEntries(this.store.get(key), changes);
		this.onSetEntry(key, combinedValue);
		return combinedValue;
	}

	public updateOne(update: Update<K, V>): V | undefined {

		if (!update) {
			return undefined;
		}

		const { key, changes } = update;
		return this.updateOneByKey(key, changes);
	}

	public updateMany(updates: Update<K, V>[]): V[] {
		return castArray<Update<K, V>>(updates).map(u => this.updateOne(u)!);
	}

	public upsertOne(entity: V): V | undefined {

		const key = this.keyOf(entity)!;

		if (!this.isValidKey(key)) {
			return entity;
		}

		const entityUpdate = { key, changes: entity };
		return this.updateOne(entityUpdate);
	}

	public upsertMany(entities: V[]): V[] {
		return castArray<V>(entities).map(e => this.upsertOne(e)!);
	}

	public transformOne(key: K, transform: EntityTransform<V>): V | undefined {

		const entity = this.getOne(key);

		if (!entity || !isFunction(transform)) {
			return entity;
		}

		const changes = transform(entity);
		return this.updateOne({ key: key, changes });
	}

	public transformMany(transform: EntityTransform<V>): V[] {

		const result: V[] = [];

		if (!isFunction(transform)) {
			return result;
		}

		this.store.forEach((entity: V, key: K) => {

			const changes = transform(entity);
			const v = this.updateOne({ key, changes })!;

			result.push(v);
		});

		return result;
	}
}