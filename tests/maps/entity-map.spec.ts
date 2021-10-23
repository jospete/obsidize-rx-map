import { EntityMap } from '../../src';
import { Book } from '../test-utility';

describe('EntityMap', () => {

	it('inserts values in the backing storage mechanism with set() by default', () => {

		const storageMap = new Map<number, Book>();
		const map = new EntityMap(storageMap, (v: Book) => v.id);

		spyOn(storageMap, 'set').and.callThrough();
		map.setOne({ id: 1234, name: 'Test Book', pageCount: 42 });
		expect(storageMap.set).toHaveBeenCalled();
	});

	describe('removeWhere()', () => {

		it('returns an empty array when given an invalid predicate', () => {
			const storageMap = new Map<number, Book>();
			const map = new EntityMap(storageMap, (v: Book) => v.id);
			expect(map.removeWhere(null)).toEqual([]);
		});
	});
});