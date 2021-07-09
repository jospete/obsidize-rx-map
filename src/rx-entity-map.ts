import { EntityMap, IdSelector } from './entity-map';
import { RxMap } from './rx-map';


export class RxEntityMap<K, V> extends EntityMap<K, V> {

	public readonly store: RxMap<K, V>;

	constructor(selectId: IdSelector<K, V>) {
		const store = new RxMap<K, V>();
		super(store, selectId);
		this.store = store;
	}
}