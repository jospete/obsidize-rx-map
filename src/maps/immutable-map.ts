import { isFunction, cloneObject } from '../common/utility';
import { ProxyIterableIterator } from './proxy-iterable-iterator';

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
		return cloneObject(this.source.get(key));
	}

	public has(key: K): boolean {
		return this.source.has(key);
	}

	public delete(key: K): boolean {
		return this.source.delete(key);
	}

	public set(key: K, value: V): this {
		this.source.set(cloneObject(key), cloneObject(value));
		return this;
	}

	public entries(): IterableIterator<[K, V]> {
		return new ProxyIterableIterator(this.source.entries(), v => cloneObject(v));
	}

	public keys(): IterableIterator<K> {
		return new ProxyIterableIterator(this.source.keys(), v => cloneObject(v));
	}

	public values(): IterableIterator<V> {
		return new ProxyIterableIterator(this.source.values(), v => cloneObject(v));
	}

	public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
		if (isFunction(callbackfn))
			this.source.forEach((value, key) => callbackfn(cloneObject(value), cloneObject(key), this));
	}
}