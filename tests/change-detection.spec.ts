import { ChangeDetectionEventType, detectChanges } from '../src';

describe('change detection utilities', () => {

	describe('detectChanges', () => {

		it('generates state change metadata between given states A and B', () => {

			expect(detectChanges(null, null)).toEqual({ type: ChangeDetectionEventType.NO_CHANGE });
			expect(detectChanges(null, { hello: true })).toEqual({ type: ChangeDetectionEventType.DELETE });
			expect(detectChanges({ hello: true }, null)).toEqual({ type: ChangeDetectionEventType.CREATE });
			expect(detectChanges({ hello: true }, undefined)).toEqual({ type: ChangeDetectionEventType.CREATE });
			expect(detectChanges({ hello: true }, 0 as any)).toEqual({ type: ChangeDetectionEventType.CREATE });
			expect(detectChanges({ hello: true }, '' as any)).toEqual({ type: ChangeDetectionEventType.CREATE });

			expect(detectChanges({ hello: false, potato: 5, yep: 'y' }, { hello: true, nope: '', yep: 'y' }))
				.toEqual({ type: ChangeDetectionEventType.UPDATE, changes: { hello: false, potato: 5 } });

			expect(detectChanges({ nested: { objectValue: true, staticVal: 'yep' } }, { nested: { objectValue: false, staticVal: 'yep' } }))
				.toEqual({ type: ChangeDetectionEventType.UPDATE, changes: { nested: { objectValue: true } } } as any);
		});
	});
});