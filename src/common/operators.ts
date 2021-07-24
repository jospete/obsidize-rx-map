import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs';
import { filter, map, scan } from 'rxjs/operators';
import { identity } from 'lodash';

import { isActionableChangeDetectionResultType } from '../events/change-detection-event';
import { MapStateChangeEvent, MapStateChangeEventType } from '../events/map-state-change-event';
import { EntityPropertyChangeEvent } from '../events/entity-property-change-event';
import { ChangeDetectionAccumulator, detectAccumulatedChanges, PropertySelector } from './utility';
import { RxEntityMap } from '../maps/rx-entity-map';

/**
 * Variant of filter() that uses a Set to increase lookup speed when checking emissions for a single property value.
 * NOTE: this variant is top-heavy, and more expensive on smaller value lists; only use this when 
 * the 'values' collection can become large.
 */
export function spreadFilterBy<T, R>(values: T[], extractValue: (emission: R) => T): MonoTypeOperatorFunction<R> {
	const lookup = new Set<T>(values);
	return source => source.pipe(
		filter(v => lookup.has(extractValue(v)))
	);
}

/**
 * filter by map change event types (useful if you only want to watch ADD or UPDATE changes)
 */
export function ofType<K, V>(...types: MapStateChangeEventType[]): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> {
	return source => source.pipe(
		spreadFilterBy(types, ev => ev.type)
	);
}

/**
 * filter by entity primary key
 */
export function forKey<K, V>(key: K): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> {
	return source => source.pipe(
		filter(ev => ev.key === key)
	);
}

/**
 * filter by a set of entity primary keys
 */
export function forKeyIn<K, V>(keys: K[]): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> {
	return source => source.pipe(
		spreadFilterBy(keys, ev => ev.key)
	);
}

/**
 * Narrows the scope of raw map change events into property-specific events.
 */
export function pluckValueChanges<K, V, T>(
	selectValue: PropertySelector<T, V>
): OperatorFunction<MapStateChangeEvent<K, V>, EntityPropertyChangeEvent<K, T>> {
	const selectSafe = (v?: V) => v ? selectValue(v) : undefined;
	return source => source.pipe(
		filter(ev => !!ev),
		map(ev => ({
			entityId: ev.key,
			currentValue: selectSafe(ev.value),
			previousValue: selectSafe(ev.previousValue as V),
		}))
	);
}

/**
 * map change events to their corresponding entity value
 */
export function pluckValue<T>(): OperatorFunction<{ value?: T }, T> {
	return source => source.pipe(
		map(ev => ev.value!),
		filter(identity)
	);
}

/**
 * map change events to their corresponding entity update differences (will be a partial entity object)
 */
export function pluckChanges<T>(): OperatorFunction<{ changes?: T }, Partial<T>> {
	return source => source.pipe(
		map(ev => ev.changes!),
		filter(identity)
	);
}

/**
 * capture emitted values and store them in the provided map reference by side-effect
 */
export function storeEntityIn<K, V>(entityMap: RxEntityMap<K, V>): MonoTypeOperatorFunction<V> {
	return source => source.pipe(
		map(v => entityMap.setOne(v)!)
	);
}

/**
 * capture emitted values and store them in the provided map reference by side-effect
 */
export function storeEntityArrayIn<K, V>(entityMap: RxEntityMap<K, V>): MonoTypeOperatorFunction<V[]> {
	return source => source.pipe(
		map(v => entityMap.setMany(v)!)
	);
}

/**
 * Emits change detection diffs between each emission and the one previous of it.
 * NOTE: if the detection result type is NO_CHANGE, then the emission will be dropped.
 */
export function accumulateChanges<T>(): OperatorFunction<T, ChangeDetectionAccumulator<T>> {
	return source => source.pipe(
		scan((acc: ChangeDetectionAccumulator<T>, current: T) => detectAccumulatedChanges(acc, current)),
		filter((next: ChangeDetectionAccumulator<T>) => !!next && isActionableChangeDetectionResultType(next.type)),
	);
}