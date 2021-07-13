import { Observable, Subject } from 'rxjs';
import { filter, map, share } from 'rxjs/operators';
import { cloneDeep } from 'lodash';

import { MapStateChangeEvent, MapStateChangeEventContext, MapStateChangeEventType } from './map-state-change-event';
import { isActionableChangeDetectionResultType } from './change-detection-event';
import { ImmutableMap } from './immutable-map';
import { extractChanges } from './utility';

/**
 * Extension of the standard ES6 Map with rxjs change event observables tacked on.
 */
export class RxMap<K, V, T extends Map<K, V> = Map<K, V>> implements Map<K, V> {

	protected readonly mStateChangeSubject: Subject<MapStateChangeEvent<K, V>> = new Subject();

	public readonly allChanges: Observable<MapStateChangeEvent<K, V>> = this.mStateChangeSubject.asObservable().pipe(
		share()
	);

	public readonly changes: Observable<MapStateChangeEvent<K, V>> = this.allChanges.pipe(
		map(ev => extractChanges(ev)),
		filter(ev => isActionableChangeDetectionResultType(ev.changeType))
	);

	constructor(
		protected readonly source: T = (new ImmutableMap<K, V>() as any)
	) {
	}

	protected emit(
		type: MapStateChangeEventType,
		key: K,
		value?: V,
		previousValue?: Partial<V>,
		context: MapStateChangeEventContext = { source: 'unknown' }
	): void {
		this.mStateChangeSubject.next({ type, key, value, previousValue, context });
	}

	protected emitSet(key: K, value: V, previousValue?: V, context?: MapStateChangeEventContext): void {
		this.emit(MapStateChangeEventType.SET, key, value, previousValue, context);
	}

	protected emitDelete(key: K, value: V, context?: MapStateChangeEventContext): void {
		this.emit(MapStateChangeEventType.DELETE, key, value, undefined, context);
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
		const s = this.mStateChangeSubject;
		if (s.closed && s.isStopped) return;
		s.error('destroyed');
		s.unsubscribe();
	}

	public clear(): void {
		const keys = Array.from(this.keys());
		keys.forEach(key => this.delete(key));
	}

	public delete(key: K, context?: MapStateChangeEventContext): boolean {
		const value = this.get(key);
		const didDelete = this.source.delete(key);
		this.emitDelete(key, value!, context);
		return didDelete;
	}

	public set(key: K, value: V, context?: MapStateChangeEventContext): this {
		const storedValue = this.get(key);
		// Only clone the stored value when necessary since cloning can be expensive
		const previousValue = storedValue === value ? cloneDeep(storedValue) : storedValue;
		this.source.set(key, value);
		this.emitSet(key, value, previousValue, context);
		return this;
	}
}
