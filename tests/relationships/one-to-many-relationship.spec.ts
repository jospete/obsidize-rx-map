import { AppStore } from '../test-utility';

describe('OneToManyRelationship', () => {

	it('has an option to count the number of related foreign keys', () => {

		const store = new AppStore();

		const bobId = 'adsf';
		const tedId = 'zxcv';
		const frankId = 'mnbv';

		store.users.addMany([
			{ id: bobId, name: 'Bob' },
			{ id: tedId, name: 'Ted' },
			{ id: frankId, name: 'Frank' },
		]);

		const toastId = 0;
		const milkId = 1;
		const breadId = 2;

		store.products.addMany([
			{ id: toastId, name: 'Toast' },
			{ id: milkId, name: 'Milk' },
			{ id: breadId, name: 'Bread' },
		]);

		store.productOrders.addMany([
			{ id: 0, userId: bobId, productId: breadId },
			{ id: 1, userId: bobId, productId: breadId },
			{ id: 2, userId: bobId, productId: breadId },
			{ id: 3, userId: tedId, productId: toastId },
			{ id: 4, userId: tedId, productId: milkId },
		]);

		expect(store.productOrdersByProductId.getRelatedKeyCount(breadId)).toBe(3);
		expect(store.productOrdersByProductId.getRelatedKeys(breadId)).toEqual([0, 1, 2]);

		expect(store.productOrdersByProductId.getRelatedKeyCount(55)).toBe(0);
		expect(store.productOrdersByProductId.getRelatedKeys(55)).toEqual([]);

		expect(store.productOrdersByProductId.getRelatedKeyCount(undefined)).toBe(0);
		expect(store.productOrdersByProductId.getRelatedKeys(undefined)).toEqual([]);
	});
});