import { EntityMap } from '../src';

interface Book {
	id: number;
	name: string;
	pageCount: number;
}

describe('EntityMap', () => {

	it('inserts values in the backing storage mechanism with set() by default', () => {

		const storageMap = new Map<number, Book>();
		const map = new EntityMap(storageMap, (v: Book) => v.id);

		spyOn(storageMap, 'set').and.callThrough();
		map.setOne({ id: 1234, name: 'Test Book', pageCount: 42 });
		expect(storageMap.set).toHaveBeenCalled();
	});
});