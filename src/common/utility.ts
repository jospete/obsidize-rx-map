import { transform, isEqual, merge, cloneDeep } from 'lodash';

import { ChangeDetectionResult, ChangeDetectionResultType } from '../events/change-detection-event';
import { MapStateChangeEvent } from '../events/map-state-change-event';

export type Predicate<V> = (value: V) => boolean;
export type PropertySelector<K, V> = (value: V) => K;

export function identity<T>(value: T, ..._args: any[]): any {
	return value;
}

export function isNull(value: any): boolean {
	return typeof value === null;
}

export function isUndefined(value: any): boolean {
	return typeof value === 'undefined';
}

export function isFunction(value: any): boolean {
	return typeof value === 'function';
}

export function isObject(value: any): boolean {
	return typeof value === 'object' && !isNull(value);
}

export function castArray<T>(v: any): T[] {
	return isObject(v) && Array.isArray(v) ? v : [v];
}

export function mergeObjects(a: any, b: any): any {
	return merge(a, b);
}

export function cloneObject(v: any): any {
	return cloneDeep(v);
}

// Shamelessly stolen from here:
// https://gist.github.com/Yimiprod/7ee176597fef230d1451#gistcomment-2565071
export function deepDifferenceBetween<T>(current: T, previous: T): Partial<T> {

	return transform<any, any>(current, (result, currentValue, key) => {

		const previousValue = (previous as any)[key];
		if (isEqual(currentValue, previousValue)) return;

		const recurse = (isObject(currentValue) && isObject(previousValue));
		result[key] = recurse ? deepDifferenceBetween(currentValue, previousValue) : currentValue;
	});
}

/**
 * Evaluates changes between the two given values, 
 * and constructs a change detection event instance based on the evaluation output.
 * 
 * The output in the "changes" object will consist of all the values that have changed
 * when transitioning from 'baseObj' to 'obj', and the plucked values will match the ones in 'obj'.
 */
export function detectChanges<T>(current: T, previous: T): ChangeDetectionResult<T> {

	const withType = (type: ChangeDetectionResultType, changes?: Partial<T>): ChangeDetectionResult<T> => {
		const result: ChangeDetectionResult<T> = { type };
		if (changes) (result as any).changes = changes;
		return result;
	};

	if (isEqual(current, previous)) return withType(ChangeDetectionResultType.NO_CHANGE);
	if (current && !previous) return withType(ChangeDetectionResultType.CREATE);
	if (!current && previous) return withType(ChangeDetectionResultType.DELETE);

	return withType(ChangeDetectionResultType.UPDATE, deepDifferenceBetween(current, previous));
}

/**
 * Convenience for running change detection on a map state change event and storing the results in the event.
 * This is implemented as an optional utility since change detection might not be necessary in some cases,
 * and can be quite expensive to run.
 */
export function extractChanges<K, V>(ev: MapStateChangeEvent<K, V>): MapStateChangeEvent<K, V> {

	const { value, previousValue } = ev;
	const result = detectChanges(value, previousValue);

	ev.changes = result.changes;
	ev.changeType = result.type;

	return ev;
}

export interface ChangeDetectionAccumulator<T> extends ChangeDetectionResult<T> {
	current: T;
	previous?: T;
}

/**
 * Special variant of change detection that compares against an accumulated state.
 */
export function detectAccumulatedChanges<T>(acc: ChangeDetectionAccumulator<T>, current: T): ChangeDetectionAccumulator<T> {
	const previous: T | undefined = acc ? acc.current : undefined;
	const changeDetectionResult = detectChanges(current, previous);
	return Object.assign({ current, previous }, changeDetectionResult);
}