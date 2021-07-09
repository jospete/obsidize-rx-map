import { get } from 'lodash';

import { EntityMap, IdSelector } from './entity-map';
import { RxMap } from './rx-map';

export class RxEntityMap<K, V> extends EntityMap<K, V> {

	public readonly store: RxMap<K, V>;

	constructor(selectId: IdSelector<K, V>) {
		const store = new RxMap<K, V>();
		super(store, selectId);
		this.store = store;
	}

	public static withPrimaryKey<Entity, KeyType extends keyof Entity = keyof Entity>(
		primaryKey: KeyType
	): RxEntityMap<Entity[KeyType], Entity> {
		return new RxEntityMap(v => get(v, primaryKey));
	}
}