import { castArray } from '../../src';

describe('utility', () => {

	describe('castArray', () => {

		it('guarantees that the output will be an array', () => {

			const value = null;
			expect(Array.isArray(value)).toBe(false);

			const castedValue = castArray(value);
			expect(Array.isArray(castedValue)).toBe(true);
			expect(castedValue).toEqual([null]);
		});
	});
});