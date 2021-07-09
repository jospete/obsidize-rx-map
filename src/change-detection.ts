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

export const isNil = (v: any) => v === null || v === undefined;

export const isEqual = (a: any, b: any): boolean => {

	if (a === b) return true;
	if (isNaN(a) && isNaN(b)) return true;
	if (isNil(a) || isNil(b)) return false;

	const ta = typeof (a);
	const tb = typeof (b);

	if (ta !== tb) return false;
	if (ta === 'object') return Object.keys(a).every(key => isEqual(a[key], b[key]));

	return false;
};

/**
 * Determines change metadata between two values sharing the same id.
 */
export const detectChanges = <T>(a: T, b: T): ValueChangeMetadata<T> => {

	if (isEqual(a, b)) return { type: ValueChangeType.NONE };

	const hasA = !isNil(a);
	const hasB = !isNil(b);

	if (!hasA && hasB) return { type: ValueChangeType.CREATE };
	if (hasA && !hasB) return { type: ValueChangeType.DELETE };

	const changes: any = {};
	const updatedKeys = Object.keys(b).filter(k => !isEqual((a as any)[k], (b as any)[k]));

	updatedKeys.forEach(key => {
		changes[key] = (b as any)[key];
	});

	return { type: ValueChangeType.UPDATE, changes };
};