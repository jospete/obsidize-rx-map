import { isEqual } from '../src';

describe('change detection utilities', () => {

	describe('isEqual', () => {

		it('performs common value matching to check if two things are equal "enough"', () => {
			expect(isEqual(null, null)).toBe(true);
			expect(isEqual(NaN, NaN)).toBe(true);
			expect(isEqual(NaN, parseInt('potato'))).toBe(true);
			expect(isEqual(0, 0)).toBe(true);
			expect(isEqual(3.14159, 3.14159)).toBe(true);
			expect(isEqual(undefined, undefined)).toBe(true);
			expect(isEqual('', '')).toBe(true);
			expect(isEqual('test', 'test')).toBe(true);
			expect(isEqual({ potato: { yes: true } }, { potato: { yes: true } })).toBe(true);
		});

		it('knows when things are not equal', () => {
			expect(isEqual(null, { potato: { yes: true } })).toBe(false);
			// expect(isEqual({ potato: { yes: true }, id: 42, name: 'johnson' }, undefined)).toBe(false);
			expect(isEqual({ potato: { yes: true }, id: 42, name: 'johnson' }, { potato: '{ yes: true }', id: 42, name: 'johnson' })).toBe(false);
		});
	});
});