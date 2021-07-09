import { Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';

import { MapStateChangeEvent, MapStateChangeEventType } from './map-state-change-event';
import { detectChanges, ValueChangeType } from './change-detection';

export class RxMap<K, V> extends Map<K, V> {

	private readonly mStateChangeSubject: Subject<MapStateChangeEvent<K, V>> = new Subject();
	public readonly changes: Observable<MapStateChangeEvent<K, V>> = this.mStateChangeSubject.asObservable().pipe(share());

	private emitStateChange(type: MapStateChangeEventType, key: K, changes?: Partial<V> | V): void {
		this.mStateChangeSubject.next({ type, key, changes });
	}

	private emitAdd(key: K, value: V): void {
		this.emitStateChange(MapStateChangeEventType.ADD, key, value);
	}

	private emitUpdate(key: K, changes: Partial<V>): void {
		this.emitStateChange(MapStateChangeEventType.UPDATE, key, changes);
	}

	private emitDelete(key: K): void {
		this.emitStateChange(MapStateChangeEventType.DELETE, key);
	}

	public destroy(): void {
		this.mStateChangeSubject.error('destroyed');
		this.mStateChangeSubject.unsubscribe();
	}

	public clear(): void {
		const keys = Array.from(this.keys());
		super.clear();
		keys.forEach(key => this.emitDelete(key));
	}

	public delete(key: K): boolean {
		const didDelete = super.delete(key);
		if (didDelete) this.emitDelete(key);
		return didDelete;
	}

	public set(key: K, value: V): this {

		const previousValue = this.get(key);
		const { type, changes } = detectChanges(previousValue, value);

		super.set(key, value);

		switch (type) {
			case ValueChangeType.CREATE:
				this.emitAdd(key, value);
				break;
			case ValueChangeType.UPDATE:
				this.emitUpdate(key, changes as V);
				break;
			case ValueChangeType.DELETE:
				this.emitDelete(key);
				break;
			default:
				break;
		}

		return this;
	}
}
