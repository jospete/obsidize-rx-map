import { map, filter, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { forKey, forKeyIn, pluckValue } from '../common/operators';
import { MapStateChangeEvent } from '../events/map-state-change-event';
import { PropertySelector, identity } from '../common/utility';
import { EntityMap } from './entity-map';
import { RxMap } from './rx-map';

/**
 * Combinatory entity map that uses an RxMap as the store.
 */
export class RxEntityMap<K, V, T extends RxMap<K, V> = RxMap<K, V>> extends EntityMap<K, V, T> {

	constructor(
		selectKey: PropertySelector<K, V>,
		store?: T
	) {
		super(store || (new RxMap<K, V>() as T), selectKey);
	}

	public static mutable<K, V>(selectKey: PropertySelector<K, V>): RxEntityMap<K, V> {
		return new RxEntityMap(selectKey, new RxMap<K, V>(new Map<K, V>()));
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