import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { MapStateChangeEvent, MapStateChangeEventType } from './map-state-change-event';
import { RxEntityMap } from './rx-entity-map';

export const ofType = <K, V>(...types: MapStateChangeEventType[]): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> => {
	return source => source.pipe(
		filter(ev => types.includes(ev.type))
	);
};

export const forKey = <K, V>(id: K): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> => {
	return source => source.pipe(
		filter(ev => ev.key === id)
	);
};

export const pluckValue = <K, V>(): OperatorFunction<MapStateChangeEvent<K, V>, V | undefined> => {
	return source => source.pipe(
		map(ev => ev.value)
	);
};

export const pluckChanges = <K, V>(): OperatorFunction<MapStateChangeEvent<K, V>, Partial<V> | undefined> => {
	return source => source.pipe(
		map(ev => ev.changes)
	);
};

export const storeEntityIn = <K, V>(entityMap: RxEntityMap<K, V>): MonoTypeOperatorFunction<V> => {
	return source => source.pipe(
		map(v => entityMap.upsertOne(v)!)
	);
};

export const storeEntityArrayIn = <K, V>(entityMap: RxEntityMap<K, V>): MonoTypeOperatorFunction<V[]> => {
	return source => source.pipe(
		map(v => entityMap.upsertMany(v)!)
	);
};