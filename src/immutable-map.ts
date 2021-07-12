import { cloneDeep, isFunction } from 'lodash';

import { MonoProxyIterableIterator } from './proxy-iterable-iterator';

/**
 * ES6 Map implementation that prevents entry mutation outside of explicit set() calls.
 * This is the default map implementation used by RxMap, so as to prevent iterative / query methods
 * from passing back raw object refs (which would allow the caller to bypass change detection by direct editing).
 */
export class ImmutableMap<K, V> implements Map<K, V> {

	constructor(
		protected readonly source: Map<K, V> = new Map()
	) {
	}

	public get size(): number {
		return this.source.size;
	}

	public get [Symbol.toStringTag](): string {
		return 'ImmutableMap';
	}

	public [Symbol.iterator](): IterableIterator<[K, V]> {
		return this.entries();
	}

	public clear(): void {
		this.source.clear();
	}

	public get(key: K): V | undefined {
		return cloneDeep(this.source.get(key));
	}

	public has(key: K): boolean {
		return this.source.has(key);
	}

	public delete(key: K): boolean {
		return this.source.delete(key);
	}

	public set(key: K, value: V): this {
		this.source.set(cloneDeep(key), cloneDeep(value));
		return this;
	}

	public entries(): IterableIterator<[K, V]> {
		return new MonoProxyIterableIterator(this.source.entries(), v => cloneDeep(v));
	}

	public keys(): IterableIterator<K> {
		return new MonoProxyIterableIterator(this.source.keys(), v => cloneDeep(v));
	}

	public values(): IterableIterator<V> {
		return new MonoProxyIterableIterator(this.source.values(), v => cloneDeep(v));
	}

	public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
		if (isFunction(callbackfn))
			this.source.forEach((value, key) => callbackfn(cloneDeep(value), cloneDeep(key), this));
	}
}