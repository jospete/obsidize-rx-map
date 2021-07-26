import { Observable, of } from 'rxjs';
import { first, tap } from 'rxjs/operators';

import { RxStore, ofType, MapStateChangeEventType, storeEntityArrayIn, storeEntityIn } from '../src';

interface User {
	id: string;
	firstName?: string;
	lastName?: string;
	email: string;
	emailVerified?: boolean;
}

interface Book {
	id: number;
	name: string;
	description?: string;
}

interface UserBookOwnership {
	id: number;
	userId: string;
	bookId: number;
}

// Define your "single source of truth" - all state changes should go through an instance of this.
class AppStore extends RxStore {

	// Use defineProperty() to make watchable non-entity content
	// (i.e. anything that you won't have multiple instances of)
	public readonly initialModelsLoaded = this.defineProperty(false);

	// Use defineEntity() to make a watchable map of entity values
	// (i.e. when you will need to store something like multiple User instances by id)
	//
	// Note that the generics for this "users" property are implied by the given key selector function.
	// You will almost never need to supply these generics manually.
	public readonly users = this.defineEntity((user: User) => user.id);

	// Each store-able entity should get its own define call
	public readonly books = this.defineEntity((book: Book) => book.id);

	// Even purely relational models - we want to effectively mirror a database architecture with these defines.
	public readonly userBooks = this.defineEntity((userBook: UserBookOwnership) => userBook.id);

	// Use defineEntityForeignKey() to indicate to RxStore the existence of a foreign key property on an entity.
	public readonly userBooksByUserId = this.defineEntityForeignKey(this.userBooks, userBook => userBook.userId);

	// You can define multiple foreign keys for the same model
	public readonly userBooksByBookId = this.defineEntityForeignKey(this.userBooks, userBook => userBook.bookId);

	// Register an effect stream so that when a User is deleted, we need to sync the userBooks map.
	public readonly onUserDelete = this.registerEffect(this.users.changes.pipe(
		ofType(MapStateChangeEventType.DELETE),
		tap(({ key }) => this.userBooks.removeWhere(v => v.userId === key))
	));

	// When a Book is deleted, we need to sync the userBooks map.
	public readonly onBookDelete = this.registerEffect(this.books.changes.pipe(
		ofType(MapStateChangeEventType.DELETE),
		tap(({ key }) => this.userBooks.removeWhere(v => v.bookId === key))
	));

	public loadPrimaryUser(): Observable<User> {

		const primaryUser: User = {
			id: 'asdfzxcv',
			firstName: 'Schmitty',
			email: 'vanwagnermeisn@boogienights.tv'
		};

		return of(primaryUser).pipe(
			// Coinvenience to capture a single entity from an outside source (storage / network / etc.)
			storeEntityIn(this.users)
		);
	}

	public loadAdditionalBooks(): Observable<Book[]> {

		const extraBooks: Book[] = [
			{ id: 42, name: 'The 42nd Thing' },
			{ id: 55, name: 'Schfifty Five' },
			{ id: 1941, name: 'Definitely Celcius' },
		];

		return of(extraBooks).pipe(
			// Coinvenience to capture an entity array from an outside source (storage / network / etc.)
			storeEntityArrayIn(this.books)
		);
	}
}

describe('General Usage', () => {

	it('Use RxStore to scaffold your core storage architecture', async () => {

		const store = new AppStore();
		const waitForModelLoad = store.initialModelsLoaded.pipe(first(loaded => loaded)).toPromise();

		const [bob, ted, frank] = store.users.addMany([
			{ id: 'a', firstName: 'Bob', email: 'bobbyboy@thing.com' },
			{ id: 'b', firstName: 'Ted', email: 'tedrulez@yahoo.com' },
			{ id: 'c', firstName: 'Frank', email: 'frankandbeans@squidz.com' },
		]);

		const [fireAndIce, mobyDick, potatoes] = store.books.addMany([
			{ id: 0, name: 'Fire and Ice or something' },
			{ id: 1, name: 'Moby Dick' },
			{ id: 2, name: '99 Ways to Peel a Potato' },
		]);

		const [bobFireIce, bobPotatoes, tedFireIce, frankMobyDick, bobFireIce2] = store.userBooks.addMany([
			{ id: 0, userId: bob.id, bookId: fireAndIce.id },
			{ id: 1, userId: bob.id, bookId: potatoes.id },
			{ id: 2, userId: ted.id, bookId: fireAndIce.id },
			{ id: 3, userId: frank.id, bookId: mobyDick.id },
			{ id: 4, userId: bob.id, bookId: fireAndIce.id }, // Bob really likes the fire and ice book for some reason
		]);

		store.initialModelsLoaded.next(true);
		await waitForModelLoad; // Somewhere else in the app can be notified by the above next() call.

		// Foreign key declarations allow for fast relational lookups
		expect(store.userBooksByUserId.getRelatedValues(bob.id)).toEqual([
			bobFireIce, bobPotatoes, bobFireIce2
		]);

		expect(store.userBooksByBookId.getRelatedValues(mobyDick.id)).toEqual([
			frankMobyDick
		]);

		expect(store.userBooksByBookId.getRelatedValues(fireAndIce.id)).toEqual([
			bobFireIce, tedFireIce, bobFireIce2
		]);

		store.books.removeOne(fireAndIce.id);

		// Our deletion registerEffect() calls will automatically take care of model dependencies
		expect(store.userBooksByBookId.getRelatedValues(fireAndIce.id)).toEqual([]);
		expect(store.books.count).toBe(2);

		const extraBooks = await store.loadAdditionalBooks().toPromise();
		expect(store.books.count).toBe(2 + extraBooks.length);

		const primaryUser = await store.loadPrimaryUser().toPromise();
		expect(store.users.getOne(primaryUser.id)).toEqual(primaryUser);

		// Be sure to tear down your store before de-referencing it (usually when your app completes / closes)
		store.destroy();
	});
});