export enum MapStateChangeEventType {
	ADD = 'ADD',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
	EMPTY = 'EMPTY'
}

export interface MapStateChangeEvent<K, V> {
	readonly type: MapStateChangeEventType;
	readonly key?: K;
	readonly value?: V;
	readonly changes?: Partial<V>;
}