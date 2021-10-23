import { first } from 'rxjs/operators';

import { RxEntityMap } from '../../src';
import { Book } from '../test-utility';

describe('MutableRxEntityMap', () => {

	it('bypasses change detection and emits all map changes that occur', async () => {

		const books = RxEntityMap.mutable((v: Book) => v.id);

		const deleteChangePromise = books.allChanges.pipe(first()).toPromise();

		expect(books.count).toBe(0);
		books.removeOne(42);

		const deleteEvent = await deleteChangePromise;
		expect(deleteEvent.key).toBe(42); // Events will emit even the store has not changed

		const addedBook = books.addOne({ id: 42, name: 'A Great Tale', pageCount: 394 });
		addedBook.pageCount++;

		expect(books.getOne(addedBook.id).pageCount).toBe(395);
	});
});