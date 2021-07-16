export enum ChangeDetectionResultType {
	CREATE = 'CREATE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
	NO_CHANGE = 'NO_CHANGE'
}

export interface ChangeDetectionResult<T> {
	readonly type: ChangeDetectionResultType;
	readonly changes?: Partial<T>;
}

/**
 * Returns true if the given value is a valid detection type, except for the NO_CHANGE type.
 * (i.e. any type that indicates state mutation has occurred)
 */
export function isActionableChangeDetectionResultType(value: any): boolean {
	return value !== ChangeDetectionResultType.NO_CHANGE
		&& Object.values(ChangeDetectionResultType).includes(value);
}