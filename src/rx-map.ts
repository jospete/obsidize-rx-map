import { Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';

import { MapStateChangeEvent, MapStateChangeEventType } from './map-state-change-event';
import { detectChanges, ValueChangeType } from './change-detection';

/**
 * Extension of the standard ES6 Map with rxjs change event observables tacked on.
 */
export class RxMap<K, V> implements Map<K, V> {

	private readonly mStateChangeSubject: Subject<MapStateChangeEvent<K, V>> = new Subject();
	private readonly source: Map<K, V> = new Map();

	public readonly changes: Observable<MapStateChangeEvent<K, V>> = this.mStateChangeSubject.asObservable().pipe(share());

	private emitStateChange(type: MapStateChangeEventType, key: K, changes?: Partial<V> | V): void {
		this.mStateChangeSubject.next({ type, key, changes });
	}

	private emitAdd(key: K, value: V): void {
		this.emitStateChange(MapStateChangeEventType.ADD, key, value);
	}

	private emitUpdate(key: K, changes: Partial<V>): void {
		this.emitStateChange(MapStateChangeEventType.UPDATE, key, changes);
	}

	private emitDelete(key: K): void {
		this.emitStateChange(MapStateChangeEventType.DELETE, key);
	}

	public get size(): number {
		return this.source.size;
	}

	public get [Symbol.toStringTag](): string {
		return this.source[Symbol.toStringTag];
	}

	public [Symbol.iterator](): IterableIterator<[K, V]> {
		return this.source[Symbol.iterator]();
	}

	public get(key: K): V | undefined {
		return this.source.get(key);
	}

	public has(key: K): boolean {
		return this.source.has(key);
	}

	public entries(): IterableIterator<[K, V]> {
		return this.source.entries();
	}

	public keys(): IterableIterator<K> {
		return this.source.keys();
	}

	public values(): IterableIterator<V> {
		return this.source.values();
	}

	public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
		this.source.forEach(callbackfn);
	}

	public destroy(): void {
		this.mStateChangeSubject.error('destroyed');
		this.mStateChangeSubject.unsubscribe();
	}

	public clear(): void {
		const keys = Array.from(this.keys());
		this.source.clear();
		keys.forEach(key => this.emitDelete(key));
	}

	public delete(key: K): boolean {
		const didDelete = this.source.delete(key);
		if (didDelete) this.emitDelete(key);
		return didDelete;
	}

	public set(key: K, value: V): this {

		const previousValue = this.get(key);
		const { type, changes } = detectChanges(previousValue, value);

		this.source.set(key, value);

		switch (type) {
			case ValueChangeType.CREATE:
				this.emitAdd(key, value);
				break;
			case ValueChangeType.UPDATE:
				this.emitUpdate(key, changes as V);
				break;
			case ValueChangeType.DELETE:
				this.emitDelete(key);
				break;
			default:
				break;
		}

		return this;
	}
}
