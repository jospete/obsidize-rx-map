import { map, filter, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { MapStateChangeEvent } from '../events/map-state-change-event';
import { forKey, forKeyIn, pluckValue } from '../common/operators';
import { PropertySelector, identity } from '../common/utility';
import { EntityMap } from './entity-map';
import { RxMap } from './rx-map';

/**
 * Combinatory entity map that uses an RxMap as the store.
 */
export class RxEntityMap<K, V, T extends RxMap<K, V> = RxMap<K, V>> extends EntityMap<K, V, T> {

	constructor(
		selectKey: PropertySelector<K, V>,
		store: T
	) {
		super(store, selectKey);
	}

	/**
	 * Generate an RxEntityMap instance with a standard (mutable) Map store.
	 */
	public static mutable<K1, V1>(selectKey: PropertySelector<K1, V1>): RxEntityMap<K1, V1> {
		return new RxEntityMap(selectKey, RxMap.mutable());
	}

	/**
	 * Generate an RxEntityMap instance with an immutable backend store.
	 */
	public static immutable<K1, V1>(selectKey: PropertySelector<K1, V1>): RxEntityMap<K1, V1> {
		return new RxEntityMap(selectKey, RxMap.immutable());
	}

	public get allChanges(): Observable<MapStateChangeEvent<K, V>> {
		return this.store.allChanges;
	}

	public get changes(): Observable<MapStateChangeEvent<K, V>> {
		return this.store.changes;
	}

	public destroy(): void {
		this.store.destroy();
	}

	public watchOne(key: K): Observable<V> {
		return this.changes.pipe(
			forKey(key),
			pluckValue(),
			startWith(this.getOne(key)!),
			filter(identity)
		);
	}

	public watchMany(keys: K[]): Observable<V[]> {
		return this.changes.pipe(
			forKeyIn(keys),
			map(() => this.getManyExisting(keys)),
			startWith(this.getManyExisting(keys))
		);
	}

	public watchAll(): Observable<V[]> {
		return this.changes.pipe(
			map(() => this.values()),
			startWith(this.values())
		);
	}
}