import { RxEntityMap } from '../src';

interface User {
	id: string;
	name: string;
	age: number;
}

interface Product {
	id: number;
	name: string;
	serial: string;
	count: number;
}

interface ProductOrder {
	id: number;
	userId: string;
	productId: number;
}

describe('RxEntityMap', () => {

	it('can be created with implicit generics', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const products = new RxEntityMap((product: Product) => product.id);
		const orders = new RxEntityMap((order: ProductOrder) => order.id);

		users.addMany([
			{ id: 'asdf', name: 'Dennis', age: 37 },
			{ id: 'bvcx', name: 'Fred', age: 25 },
		]);
	});
});