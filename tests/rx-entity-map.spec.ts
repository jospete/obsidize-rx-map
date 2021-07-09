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
	});
});