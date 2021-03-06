import { Observable, Subject } from 'rxjs';
import { filter, map, share } from 'rxjs/operators';

import { MapStateChangeEvent, MapStateChangeEventContext, MapStateChangeEventType } from '../events/map-state-change-event';
import { isActionableChangeDetectionResultType } from '../events/change-detection-event';
import { extractChanges } from '../common/utility';
import { ImmutableMap } from './immutable-map';

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
		filter(ev => isActionableChangeDetectionResultType(ev.changeType)),
		share()
	);

	constructor(
		protected readonly source: T
	) {
	}

	/**
	 * Generate an RxMap instance with a standard (mutable) Map store.
	 */
	public static mutable<K1, V1>(): RxMap<K1, V1, Map<K1, V1>> {
		return new RxMap(new Map());
	}

	/**
	 * Generate an RxMap instance with an immutable backend store.
	 */
	public static immutable<K1, V1>(): RxMap<K1, V1, ImmutableMap<K1, V1>> {
		return new RxMap(ImmutableMap.standard());
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
		const previousValue = this.get(key);
		this.source.set(key, value);
		this.emitSet(key, value, previousValue, context);
		return this;
	}
}
