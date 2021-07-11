import { Observable, of } from 'rxjs';
import { first } from 'rxjs/operators';

import { storeEntityIn, storeEntityArrayIn, MapStateChangeEventType, ofType, pluckValue, RxEntityMap } from '../src';

interface User {
	id: number;
	name: string;
	email: string;
}

interface Product {
	id: number;
	name: string;
}

interface ProductOrder {
	id: number;
	userId: number;
	productId: number;
}

const loadUser = (): Observable<User> => of(
	{ id: 1, name: 'ted', email: 'tedrulez@tedswebsite.tv' },
);

const loadProducts = (): Observable<Product[]> => of([
	{ id: 0, name: 'Toast' },
	{ id: 1, name: 'Butter' },
	{ id: 2, name: 'Milk' },
]);

const loadProductOrdersByUserId = (userId: number): Observable<ProductOrder[]> => of([
	{ id: 0, userId, productId: 2 }
]);

describe('General Usage', () => {

	it('works as advertised', () => {

		// key and value types are inferred by the given id selector
		const users = new RxEntityMap((user: User) => user.id);

		const bobId = 1234;
		const bob: User = { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' };
		users.addOne(bob);

		// ... somewhere else that's watching for updates ...
		users.watchOne(bobId).subscribe(user => {
			console.log('added user -> ', user); // {id: 1234, name: 'Bob', age: 37}
		});

		// To get a model manually from the map
		const bobCopy = users.getOne(bobId);

		// You can also use this module's utility operator functions to 
		// capture values as they come in from http / other observable sources.
		of(bobCopy).pipe(
			storeEntityIn(users) // will publish emitted values into the 'users' map by side-effect
		);
	});

	it('can perform complex relational loading', async () => {

		const users = new RxEntityMap((v: User) => v.id);
		const products = new RxEntityMap((v: Product) => v.id);
		const productOrders = new RxEntityMap((v: ProductOrder) => v.id);

		const user = await loadUser().pipe(
			storeEntityIn(users)
		).toPromise();

		const onCaptureUserProductOrder = productOrders.changes.pipe(
			ofType(MapStateChangeEventType.ADD, MapStateChangeEventType.UPDATE),
			pluckValue(),
			first(order => order.userId === user.id)
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