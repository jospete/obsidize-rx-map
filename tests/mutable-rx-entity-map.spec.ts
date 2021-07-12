import { first } from 'rxjs/operators';

import { MutableRxEntityMap, RxMap } from '../src';
import { Book } from './test-utility';

describe('MutableRxEntityMap', () => {

	it('bypasses change detection and emits all map changes that occur', async () => {

		const books = new MutableRxEntityMap((v: Book) => v.id);

		const deleteChangePromise = books.changes.pipe(first()).toPromise();

		expect(books.count).toBe(0);
		books.removeOne(42);

		const deleteEvent = await deleteChangePromise;
		expect(deleteEvent.key).toBe(42); // Events will emit even the store has not changed
	});

	it('can be initialized with a custom store instance', () => {

		const store = new RxMap<number, Book>();
		const books = new MutableRxEntityMap((v: Book) => v.id, store);

		spyOn(store, 'set').and.callThrough();
		books.setOne({ id: 23456, name: 'test book abc', pageCount: 111 });
		expect(store.set).toHaveBeenCalled();
	});
});