import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { MapStateChangeEvent, MapStateChangeEventType } from './map-state-change-event';
import { RxEntityMap } from './rx-entity-map';

/**
 * filter by map change event types (useful if you only want to watch ADD or UPDATE changes)
 */
export const ofType = <K, V>(...types: MapStateChangeEventType[]): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> => {
	return source => source.pipe(
		filter(ev => types.includes(ev.type))
	);
};

/**
 * filter by entity primary key
 */
export const forKey = <K, V>(id: K): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> => {
	return source => source.pipe(
		filter(ev => ev.key === id)
	);
};

/**
 * map change events to their corresponding entity value
 */
export const pluckValue = <K, V>(): OperatorFunction<MapStateChangeEvent<K, V>, V | undefined> => {
	return source => source.pipe(
		map(ev => ev.value)
	);
};

/**
 * map change events to their corresponding entity update differences (will be a partial entity object)
 */
export const pluckChanges = <K, V>(): OperatorFunction<MapStateChangeEvent<K, V>, Partial<V> | undefined> => {
	return source => source.pipe(
		map(ev => ev.changes)
	);
};

/**
 * capture emitted values and store them in the provided map reference by side-effect
 */
export const storeEntityIn = <K, V>(entityMap: RxEntityMap<K, V>): MonoTypeOperatorFunction<V> => {
	return source => source.pipe(
		map(v => entityMap.setOne(v)!)
	);
};

/**
 * capture emitted values and store them in the provided map reference by side-effect
 */
export const storeEntityArrayIn = <K, V>(entityMap: RxEntityMap<K, V>): MonoTypeOperatorFunction<V[]> => {
	return source => source.pipe(
		map(v => entityMap.setMany(v)!)
	);
};