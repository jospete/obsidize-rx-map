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
export class RxEntityMap<K, V> extends EntityMap<K, V, RxMap<K, V>> {

	constructor(selectKey: KeySelector<K, V>) {
		super(new RxMap<K, V>(), selectKey);
	}

	public get changes(): Observable<MapStateChangeEvent<K, V>> {
		return this.store.changes;
	}

	public watchAll(): Observable<V[]> {
		return this.changes.pipe(
			map(() => this.values()),
			startWith(this.values())
		);
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
}