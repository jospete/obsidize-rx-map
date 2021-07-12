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

export const isChangeDetectionResultTypeValid = (value: any): boolean => {
	return value !== ChangeDetectionResultType.NO_CHANGE
		&& Object.values(ChangeDetectionResultType).includes(value);
};