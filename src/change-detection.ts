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

export const isNil = (v: any): boolean => {
	return v === null || v === undefined;
};

export const isEqual = (a: any, b: any): boolean => {

	if (a === b) return true;
	if (Number.isNaN(a) && Number.isNaN(b)) return true;
	if (isNil(a) || isNil(b)) return false;

	const ta = typeof (a);
	const tb = typeof (b);

	if (ta !== tb || ta !== 'object') return false;

	const keys = new Set(Object.keys(a).concat(Object.keys(b)));
	return Array.from(keys.values()).every(key => isEqual(a[key], b[key]));
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