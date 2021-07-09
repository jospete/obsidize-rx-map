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

	it('works as advertised', async () => {

		const users = new RxEntityMap((v: User) => v.id);
		const products = new RxEntityMap((v: Product) => v.id);
		const productOrders = new RxEntityMap((v: ProductOrder) => v.id);

		const user = await loadUser().pipe(
			storeEntityIn(users)
		).toPromise();

		const onCaptureUserProductOrder = productOrders.store.changes.pipe(
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
		expect(products.store.get(capturedOrder.productId).name).toBe('Milk');
	});
});