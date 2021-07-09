import { Observable, Subject } from 'rxjs';
import { filter, map, share } from 'rxjs/operators';

import { detectChanges, ValueChangeType } from './change-detection';

export interface RxEntityUpdate<T> {
	state: T;
	changes: Partial<T>;
}

/**
 * Simple pub-sub pattern for a single, non-mapped entity.
 * This can be used to watch one-off things in the root store like UI flags.
 */
export class RxEntity<T> {

	private readonly mStateChangeSubject: Subject<RxEntityUpdate<T>> = new Subject();
	private mState: T;

	public readonly changes: Observable<RxEntityUpdate<T>> = this.mStateChangeSubject.asObservable().pipe(share());

	constructor(state: T) {
		this.mState = Object.assign({}, state);
	}

	public get state(): T {
		return Object.assign({}, this.mState);
	}

	public destroy(): void {
		this.mStateChangeSubject.error('destroyed');
		this.mStateChangeSubject.unsubscribe();
	}

	public select<K extends keyof T, R extends T[K]>(key: K): Observable<R> {
		return this.changes.pipe(
			filter(ev => (key in ev.changes)),
			map(ev => ev.changes[key] as R)
		);
	}

	public update(props: Partial<T>): void {
		const { type, changes } = detectChanges(this.mState, props);
		if (type === ValueChangeType.NONE) return;
		Object.assign(this.mState, changes);
		const { state } = this;
		this.mStateChangeSubject.next({ state, changes: changes! });
	}
}