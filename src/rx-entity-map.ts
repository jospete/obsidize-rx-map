import { map, filter, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { identity } from 'lodash';

import { forKey, forKeyIn, pluckValue } from './operators';
import { MapStateChangeEvent } from './map-state-change-event';
import { EntityMap, IdSelector } from './entity-map';
import { RxMap } from './rx-map';

/**
 * Combinatory entity map that uses an RxMap as the store.
 */
export class RxEntityMap<K, V> extends EntityMap<K, V, RxMap<K, V>> {

	constructor(selectId: IdSelector<K, V>) {
		super(new RxMap<K, V>(), selectId);
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

	public watchOne(id: K): Observable<V> {
		return this.changes.pipe(
			forKey(id),
			pluckValue(),
			startWith(this.getOne(id)!),
			filter(identity)
		);
	}

	public watchMany(ids: K[]): Observable<V[]> {
		return this.changes.pipe(
			forKeyIn(ids),
			map(() => this.getManyExisting(ids)),
			startWith(this.getManyExisting(ids))
		);
	}
}