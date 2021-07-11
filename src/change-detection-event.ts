export enum ChangeDetectionEventType {
	CREATE = 'CREATE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
	NO_CHANGE = 'NO_CHANGE'
}

export interface ChangeDetectionEvent<T> {
	readonly type: ChangeDetectionEventType;
	readonly changes?: Partial<T>;
}