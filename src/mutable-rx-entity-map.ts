import { Observable } from 'rxjs';

import { MapStateChangeEvent } from './map-state-change-event';
import { KeySelector } from './entity-map';
import { RxEntityMap } from './rx-entity-map';
import { RxMap } from './rx-map';

/**
 * Special variant of RxEntityMap that has all the core 
 * saftey nets turned off for the sake of performance.
 * 
 * NOTE: If performance is not an issue for you, 
 * it is strongly recommended that you use RxEntityMap instead.
 */
export class MutableRxEntityMap<K, V, T extends RxMap<K, V> = RxMap<K, V>> extends RxEntityMap<K, V, T> {

	constructor(
		selectKey: KeySelector<K, V>,
		store: T = (new RxMap(new Map<K, V>()) as T)
	) {
		super(selectKey, store);
	}

	public get changes(): Observable<MapStateChangeEvent<K, V>> {
		return this.store.allChanges;
	}
}