import { detectChanges, isEqual, ValueChangeType } from '../src';

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
			expect(isEqual({ potato: { yes: true }, id: 42, name: 'johnson' }, undefined)).toBe(false);
			const a: any = { potato: { yes: true }, id: 42, name: 'johnson' };
			const b: any = { potato: '{ yes: true }', id: 42, name: 'johnson' };
			expect(a === b).toBe(false);
			expect(isEqual(a, b)).toBe(false);
			expect(isEqual('yes', 'but not really')).toBe(false);
		});
	});

	describe('detectChanges', () => {

		it('generates state change metadata between given states A and B', () => {
			expect(detectChanges(null, null)).toEqual({ type: ValueChangeType.NONE });
			expect(detectChanges(null, { hello: true })).toEqual({ type: ValueChangeType.CREATE });
			expect(detectChanges({ hello: true }, null)).toEqual({ type: ValueChangeType.DELETE });
			expect(detectChanges({ hello: true }, undefined)).toEqual({ type: ValueChangeType.DELETE });
			expect(detectChanges({ hello: true }, 0 as any)).toEqual({ type: ValueChangeType.DELETE });
			expect(detectChanges({ hello: true }, '' as any)).toEqual({ type: ValueChangeType.DELETE });
			expect(detectChanges({ hello: true, nope: '', yep: 'y' }, { hello: false, potato: 5, yep: 'y' }))
				.toEqual({ type: ValueChangeType.UPDATE, changes: { hello: false, potato: 5 } });
		});
	});
});