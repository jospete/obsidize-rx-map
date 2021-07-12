import { map, filter, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { identity } from 'lodash';

import { forKey, forKeyIn, pluckValue } from './operators';
import { MapStateChangeEvent } from './map-state-change-event';
import { EntityMap, KeySelector } from './entity-map';
import { RxMap } from './rx-map';

/**
 * Combinatory entity map that uses an RxMap as the store.
 */
export class RxEntityMap<K, V, T extends RxMap<K, V> = RxMap<K, V>> extends EntityMap<K, V, T> {

	public activeContext: string = 'RxEntityMap default context';

	constructor(
		selectKey: KeySelector<K, V>,
		store: T = (new RxMap<K, V>() as T)
	) {
		super(store, selectKey);
	}

	protected onSetKeyValuePair(k: K, v: V): void {
		this.store.set(k, v, { source: this.activeContext });
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