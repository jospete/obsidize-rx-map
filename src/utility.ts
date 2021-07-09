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

	// If the values are exactly equal, no further processing needed
	if (a === b) return true;

	// NaN is a special case where the first check does not apply
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
	if (Number.isNaN(a) && Number.isNaN(b)) return true;

	// If either value is "nullish" and the first check did not pass, then
	// there is no way the two values are equal.
	if (isNil(a) || isNil(b)) return false;

	const ta = typeof (a);
	const tb = typeof (b);

	// If the types differ, or if they are the same but not an object,
	// we cannot do further comparison so they must not be equal (i.e., two strings / numbers / booleans)
	if (ta !== tb || ta !== 'object') return false;

	// Two valid objects were given, check all keys on both objects for equality.
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