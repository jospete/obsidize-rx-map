import { EntityMap, IdSelector } from './entity-map';
import { RxMap } from './rx-map';

/**
 * Combinatory entity map that uses an RxMap as the store.
 */
export class RxEntityMap<K, V> extends EntityMap<K, V, RxMap<K, V>> {

	constructor(selectId: IdSelector<K, V>) {
		super(new RxMap<K, V>(), selectId);
	}
}