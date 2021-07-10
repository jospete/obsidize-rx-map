import { isEqual } from 'lodash';

import { ChangeDetectionEvent, ChangeDetectionEventType } from './change-detection-event';

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