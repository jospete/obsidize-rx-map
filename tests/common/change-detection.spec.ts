import { ChangeDetectionResultType, detectChanges } from '../../src';

describe('change detection utilities', () => {

	describe('detectChanges', () => {

		it('generates state change metadata between given states A and B', () => {

			expect(detectChanges(null, null)).toEqual({ type: ChangeDetectionResultType.NO_CHANGE });
			expect(detectChanges(null, { hello: true })).toEqual({ type: ChangeDetectionResultType.DELETE });
			expect(detectChanges({ hello: true }, null)).toEqual({ type: ChangeDetectionResultType.CREATE });
			expect(detectChanges({ hello: true }, undefined)).toEqual({ type: ChangeDetectionResultType.CREATE });
			expect(detectChanges({ hello: true }, 0 as any)).toEqual({ type: ChangeDetectionResultType.CREATE });
			expect(detectChanges({ hello: true }, '' as any)).toEqual({ type: ChangeDetectionResultType.CREATE });

			expect(detectChanges({ hello: false, potato: 5, yep: 'y' }, { hello: true, nope: '', yep: 'y' }))
				.toEqual({ type: ChangeDetectionResultType.UPDATE, changes: { hello: false, potato: 5 } });

			expect(detectChanges({ nested: { objectValue: true, staticVal: 'yep' } }, { nested: { objectValue: false, staticVal: 'yep' } }))
				.toEqual({ type: ChangeDetectionResultType.UPDATE, changes: { nested: { objectValue: true } } } as any);
		});
	});
});