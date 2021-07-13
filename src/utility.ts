import { transform, isEqual, isObject } from 'lodash';

import { ChangeDetectionResult, ChangeDetectionResultType } from './change-detection-event';
import { MapStateChangeEvent } from './map-state-change-event';

// Shamelessly stolen from here:
// https://gist.github.com/Yimiprod/7ee176597fef230d1451#gistcomment-2565071
export const deepDifferenceBetween = <T>(current: T, previous: T): Partial<T> => {

	return transform<any, any>(current, (result, currentValue, key) => {

		const previousValue = (previous as any)[key];
		if (isEqual(currentValue, previousValue)) return;

		const recurse = (isObject(currentValue) && isObject(previousValue));
		result[key] = recurse ? deepDifferenceBetween(currentValue, previousValue) : currentValue;
	});
};

/**
 * Evaluates changes between the two given values, 
 * and constructs a change detection event instance based on the evaluation output.
 * 
 * The output in the "changes" object will consist of all the values that have changed
 * when transitioning from 'baseObj' to 'obj', and the plucked values will match the ones in 'obj'.
 */
export const detectChanges = <T>(current: T, previous: T): ChangeDetectionResult<T> => {

	if (isEqual(current, previous)) return { type: ChangeDetectionResultType.NO_CHANGE };
	if (current && !previous) return { type: ChangeDetectionResultType.CREATE };
	if (!current && previous) return { type: ChangeDetectionResultType.DELETE };

	return { type: ChangeDetectionResultType.UPDATE, changes: deepDifferenceBetween(current, previous) };
};

/**
 * Convenience for running change detection on a map state change event and storing the results in the event.
 * This is implemented as an optional utility since change detection might not be necessary in some cases,
 * and can be quite expensive to run.
 */
export const extractChanges = <K, V>(ev: MapStateChangeEvent<K, V>): MapStateChangeEvent<K, V> => {

	const { value, previousValue } = ev;
	const result = detectChanges(value, previousValue);

	ev.changes = result.changes;
	ev.changeType = result.type;

	return ev;
};