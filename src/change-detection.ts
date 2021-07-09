import { isEqual, isNil, keys, get, pick } from 'lodash';

export enum ValueChangeType {
	CREATE = 'CREATE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
	NONE = 'NONE'
}

export interface ValueChangeMetadata<T> {
	readonly type: ValueChangeType;
	readonly changes?: Partial<T> | T;
}

/**
 * Determines change metadata between two values sharing the same id.
 */
export const detectChanges = <T>(a: T, b: T): ValueChangeMetadata<T> => {

	if (isEqual(a, b)) return { type: ValueChangeType.NONE };

	const hasA = !isNil(a);
	const hasB = !isNil(b);

	if (!hasA && hasB) return { type: ValueChangeType.CREATE };
	if (hasA && !hasB) return { type: ValueChangeType.DELETE };

	const updatedKeys = keys(b).filter(k => !isEqual(get(a, k), get(b, k)));
	const changes = pick(b, updatedKeys);

	return { type: ValueChangeType.UPDATE, changes };
};