import { ChangeDetectionEvent, ChangeDetectionEventType } from './change-detection-event';

/**
 * Shorthand to test for "nullish" values.
 */
export const isNil = (v: any): boolean => {
	return v === null || v === undefined;
};

/**
 * Determines if two values are roughly equal.
 * See tests/change-detection.spec.ts to see what this supports.
 */
export const isEqual = (a: any, b: any): boolean => {

	if (a === b) return true;
	if (Number.isNaN(a) && Number.isNaN(b)) return true; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
	if (isNil(a) || isNil(b)) return false;

	const typeOfA = typeof (a);
	const typeOfB = typeof (b);
	if (typeOfA !== typeOfB || typeOfA !== 'object') return false;

	const keys = new Set(Object.keys(a).concat(Object.keys(b)));
	return Array.from(keys.values()).every(key => isEqual(a[key], b[key]));
};

/**
 * Evaluates changes between the two given values, 
 * and constructs a change detection event instance based on the evaluation output.
 */
export const detectChanges = <T>(a: T, b: T): ChangeDetectionEvent<T> => {

	if (isEqual(a, b)) return { type: ChangeDetectionEventType.NO_CHANGE };
	if (!a && b) return { type: ChangeDetectionEventType.CREATE };
	if (a && !b) return { type: ChangeDetectionEventType.DELETE };

	const changes: any = {};
	const updatedKeys = Object.keys(b).filter(k => !isEqual((a as any)[k], (b as any)[k]));

	updatedKeys.forEach(key => {
		changes[key] = (b as any)[key];
	});

	return { type: ChangeDetectionEventType.UPDATE, changes };
};