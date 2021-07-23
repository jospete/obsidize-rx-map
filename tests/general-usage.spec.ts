import { of } from 'rxjs';
import { first } from 'rxjs/operators';

import { storeEntityIn, storeEntityArrayIn, pluckValue, RxEntityMap, RxStore } from '../src';
import { loadProductOrdersByUserId, loadProducts, loadUser, Product, ProductOrder, User } from './test-utility';

describe('General Usage', () => {

	it('works as advertised', () => {

		// Define your "single source of truth" - all state changes should go through an instance of this.
		class AppStore extends RxStore {

			// There are two types of storage mechanisms we can define here:

			// 1. definedProperty() - declares an observable non-entity value
			public readonly darkMode = this.defineProperty('darkMode', false);

			// 2. defineEntityMap() - declares an observable map of entity values
			public readonly users = this.defineEntity('users', (user: User) => user.id);
		}

		const store = new AppStore();

		// update a store property
		store.darkMode.next(true);

		// watch a store property
		store.darkMode.subscribe(isDarkMode => console.log(isDarkMode)); // true

		const bobId = 'adsfzxcv';
		const bob: User = { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' };

		// Add an entity to the store
		store.users.addOne(bob);

		// ... somewhere else that's watching for updates ...
		store.users.watchOne(bobId).subscribe(user => {
			console.log('user model change -> ', user); // { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' }
		});

		// Get a model manually from the map
		const bobCopy = store.users.getOne(bobId);

		// NOTE: all returned / emitted instances are a deep copy to prevent callers from bypassing change detection
		console.log(bobCopy === bob); // false

		// Make some changes and publish back
		bobCopy.email = 'altbobemail@blah.com';
		store.users.upsertOne(bobCopy);

		// This module also has operator functions to capture entity models 
		// as they come in from other http / observable sources.
		of(bobCopy).pipe(
			storeEntityIn(store.users) // will publish emitted values into the 'users' map by side-effect
		).subscribe(user => console.log(user));

		expect(bobCopy).toEqual(store.users.getOne(bobId));
		expect(bobCopy).not.toBe(store.users.getOne(bobId));
	});

	it('can perform complex relational loading', async () => {

		const users = new RxEntityMap((v: User) => v.id);
		const products = new RxEntityMap((v: Product) => v.id);
		const productOrders = new RxEntityMap((v: ProductOrder) => v.id);

		const user = await loadUser().pipe(
			storeEntityIn(users)
		).toPromise();

		const onCaptureUserProductOrder = productOrders.changes.pipe(
			pluckValue(),
			first(order => !!order && order.userId === user.id)
		).toPromise();

		await loadProducts().pipe(
			storeEntityArrayIn(products)
		).toPromise();

		await loadProductOrdersByUserId(user.id).pipe(
			storeEntityArrayIn(productOrders)
		).toPromise();

		const capturedOrder = await onCaptureUserProductOrder;

		expect(capturedOrder.userId).toBe(user.id);
		expect(products.getOne(capturedOrder.productId).name).toBe('Milk');
	});
});