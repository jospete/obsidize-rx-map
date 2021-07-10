import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { MapStateChangeEvent, MapStateChangeEventType } from './map-state-change-event';
import { RxEntityMap } from './rx-entity-map';

/**
 * Variant of filter() that uses a Set to increase lookup speed when checking emissions for a single property value.
 * NOTE: this variant is top-heavy, and more expensive on smaller value lists; only use this when 
 * the 'values' collection can become large.
 */
export const spreadFilterBy = <T, R>(values: T[], extractValue: (emission: R) => T): MonoTypeOperatorFunction<R> => {
	const lookup = new Set<T>(values);
	return source => source.pipe(
		filter(v => lookup.has(extractValue(v)))
	);
};

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
 * filter by a set of entity primary keys
 */
export const forKeyIn = <K, V>(ids: K[]): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> => {
	return source => source.pipe(
		spreadFilterBy(ids, ev => ev.key)
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