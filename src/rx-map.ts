import { Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import { cloneDeep } from 'lodash';

import { MapStateChangeEvent, MapStateChangeEventType } from './map-state-change-event';
import { ChangeDetectionEventType } from './change-detection-event';
import { MonoProxyIterableIterator } from './proxy-iterable-iterator';
import { detectChanges } from './utility';

/**
 * Extension of the standard ES6 Map with rxjs change event observables tacked on.
 */
export class RxMap<K, V> implements Map<K, V> {

	protected readonly mStateChangeSubject: Subject<MapStateChangeEvent<K, V>> = new Subject();
	protected readonly source: Map<K, V> = new Map();

	public readonly changes: Observable<MapStateChangeEvent<K, V>> = this.mStateChangeSubject.asObservable().pipe(share());

	protected emitStateChange(type: MapStateChangeEventType, key: K, value?: V, changes?: Partial<V> | V): void {
		this.mStateChangeSubject.next({ type, key, value, changes });
	}

	protected emitAdd(key: K, value: V): void {
		this.emitStateChange(MapStateChangeEventType.ADD, key, value, value);
	}

	protected emitUpdate(key: K, changes: Partial<V>): void {
		this.emitStateChange(MapStateChangeEventType.UPDATE, key, this.get(key), changes);
	}

	protected emitDelete(key: K, value: V): void {
		this.emitStateChange(MapStateChangeEventType.DELETE, key, value);
	}

	public get size(): number {
		return this.source.size;
	}

	public get [Symbol.toStringTag](): string {
		return 'RxMap';
	}

	public [Symbol.iterator](): IterableIterator<[K, V]> {
		return this.entries();
	}

	public get(key: K): V | undefined {
		return cloneDeep(this.source.get(key));
	}

	public has(key: K): boolean {
		return this.source.has(key);
	}

	public entries(): IterableIterator<[K, V]> {
		return new MonoProxyIterableIterator<[K, V]>(this.source.entries(), (pair: [K, V]) => cloneDeep(pair));
	}

	public keys(): IterableIterator<K> {
		return new MonoProxyIterableIterator<K>(this.source.keys(), (k: K) => cloneDeep(k));
	}

	public values(): IterableIterator<V> {
		return new MonoProxyIterableIterator<V>(this.source.values(), (v: V) => cloneDeep(v));
	}

	public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
		this.source.forEach((value, key) => callbackfn(cloneDeep(value), cloneDeep(key), this));
	}

	public destroy(): void {
		this.mStateChangeSubject.error('destroyed');
		this.mStateChangeSubject.unsubscribe();
	}

	public delete(key: K): boolean {
		const value = this.get(key);
		const didDelete = this.source.delete(key);
		if (didDelete) this.emitDelete(key, value!);
		return didDelete;
	}

	public clear(): void {
		const keys = Array.from(this.keys());
		keys.forEach(key => this.delete(key));
	}

	public set(key: K, value: V): this {

		const targetValue = cloneDeep(value);
		const previousValue = this.get(key);
		const { type, changes } = detectChanges(targetValue, previousValue);

		switch (type) {
			case ChangeDetectionEventType.CREATE:
				this.source.set(key, targetValue);
				this.emitAdd(key, targetValue);
				break;
			case ChangeDetectionEventType.UPDATE:
				this.source.set(key, targetValue);
				this.emitUpdate(key, changes as V);
				break;
			case ChangeDetectionEventType.DELETE:
				this.delete(key);
				break;
			default:
				break;
		}

		return this;
	}
}
