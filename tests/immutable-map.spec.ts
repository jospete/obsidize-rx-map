import { ImmutableMap } from '../src';

describe('ImmutableMap', () => {

	it('can have a custom storage backend passed to it', () => {
		const backingMap = new Map<number, string>();
		const map = new ImmutableMap<number, string>(backingMap);
		spyOn(backingMap, 'set').and.callThrough();
		map.set(1, '234');
		expect(backingMap.set).toHaveBeenCalled();
	});

	it('has the necessary iterator references to make it compatible with the standard map definition', () => {
		const map = new ImmutableMap<number, string>();
		expect(map[Symbol.toStringTag]).toBeDefined();
		expect(map[Symbol.iterator]()).toBeDefined();
	});

	it('can be cleared', () => {
		const map = new ImmutableMap<number, string>();
		expect(map.size).toBe(0);
		map.set(1, 'yes');
		expect(map.size).toBe(1);
		map.clear();
		expect(map.size).toBe(0);
	});

	it('does nothing when forEach() is passed a non-function value', () => {

		const map = new ImmutableMap<number, string>();
		map.set(3, 'potato');

		expect(() => map.forEach(null)).not.toThrow();
		expect(() => map.forEach(undefined)).not.toThrow();
		expect(() => map.forEach(0 as any)).not.toThrow();
		expect(() => map.forEach('' as any)).not.toThrow();

		const forEachSpy = jasmine.createSpy('forEachSpy');
		map.forEach(forEachSpy);
		expect(forEachSpy).toHaveBeenCalledTimes(1);
	});
});