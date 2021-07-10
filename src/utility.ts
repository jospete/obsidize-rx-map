import { transform, isEqual, isObject } from 'lodash';

import { ChangeDetectionEvent, ChangeDetectionEventType } from './change-detection-event';

// Shamelessly stolen from here:
// https://gist.github.com/Yimiprod/7ee176597fef230d1451#gistcomment-2565071
export const deepDifferenceBetween = <T>(obj: T, baseObj: T): Partial<T> => {

	return transform<any, any>(obj, (result, value, key) => {

		const baseObjValue = (baseObj as any)[key];
		if (isEqual(value, baseObjValue)) return;

		const recurse = (isObject(value) && isObject(baseObjValue));
		result[key] = recurse ? deepDifferenceBetween(value, baseObjValue) : value;
	});
}

/**
 * Evaluates changes between the two given values, 
 * and constructs a change detection event instance based on the evaluation output.
 * 
 * The output in the "changes" object will consist of all the values that have changed
 * when transitioning from 'baseObj' to 'obj', and the plucked values will match the ones in 'obj'.
 */
export const detectChanges = <T>(obj: T, baseObj: T): ChangeDetectionEvent<T> => {
	if (isEqual(obj, baseObj)) return { type: ChangeDetectionEventType.NO_CHANGE };
	if (obj && !baseObj) return { type: ChangeDetectionEventType.CREATE };
	if (!obj && baseObj) return { type: ChangeDetectionEventType.DELETE };
	return { type: ChangeDetectionEventType.UPDATE, changes: deepDifferenceBetween(obj, baseObj) };
};