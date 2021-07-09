import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export enum MapStateChangeEventType {
	ADD = 'ADD',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}

export interface MapStateChangeEvent<K, V> {
	readonly type: MapStateChangeEventType;
	readonly key: K;
	readonly value?: V;
	readonly changes?: Partial<V>;
}

export const ofType = <K, V>(...types: MapStateChangeEventType[]): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> => {
	return source => source.pipe(
		filter(ev => types.includes(ev.type))
	);
};

export const forKey = <K, V>(id: K): MonoTypeOperatorFunction<MapStateChangeEvent<K, V>> => {
	return source => source.pipe(
		filter(ev => ev.key === id)
	);
};

export const pluckValue = <K, V>(): OperatorFunction<MapStateChangeEvent<K, V>, V | undefined> => {
	return source => source.pipe(
		map(ev => ev.value)
	);
};

export const pluckChanges = <K, V>(): OperatorFunction<MapStateChangeEvent<K, V>, Partial<V> | undefined> => {
	return source => source.pipe(
		map(ev => ev.changes)
	);
};