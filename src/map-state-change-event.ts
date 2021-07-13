export enum MapStateChangeEventType {
	SET = 'SET',
	DELETE = 'DELETE'
}

export interface MapStateChangeEventContext {
	readonly source: string;
	[key: string]: any;
}

export interface MapStateChangeEvent<K, V> {
	readonly type: MapStateChangeEventType;
	readonly key: K;
	readonly value?: V;
	readonly previousValue?: V | Partial<V>;
	readonly context: MapStateChangeEventContext;
	changes?: Partial<V>;
	changeType?: string;
}