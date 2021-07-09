export enum MapStateChangeEventType {
	ADD = 'ADD',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}

export interface MapStateChangeEvent<K, V> {
	readonly key: K;
	readonly type: MapStateChangeEventType;
	readonly changes?: Partial<V>;
}