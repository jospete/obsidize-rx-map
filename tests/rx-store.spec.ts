import { first } from 'rxjs/operators';

import { RxStore, accumulateChanges, pluckChanges } from '../src';
import { User, AppStore } from './test-utility';

describe('RxStore', () => {

	it('will destroy all defined constructs when destroy() is called', async () => {

		const store = new AppStore();
		spyOn(store.users, 'destroy').and.callThrough();
		spyOn(store.productOrdersByProductId, 'clear').and.callThrough();
		const onDestroyDarkModeStream = store.darkMode.asObservable().toPromise().catch(e => e);

		store.destroy();

		await onDestroyDarkModeStream;

		expect(store.users.destroy).toHaveBeenCalled();
		expect(store.productOrdersByProductId.clear).toHaveBeenCalled();
	});

	it('can perform deep change detection on property entries', async () => {

		const seedUser: User = { id: '21234', name: 'John', email: '123@abc.com' };

		class CustomStore extends RxStore {
			public readonly selectedUser = this.defineProperty<User>(null);
		}

		const store = new CustomStore();

		const changeResultPromise = store.selectedUser.asObservable().pipe(
			accumulateChanges(),
			pluckChanges(),
			first()
		).toPromise();

		const changes = { email: 'potato' };
		const updatedUser = Object.assign({}, seedUser, changes);

		// Need to emit both for accumulateChanges() to work properly
		store.selectedUser.next(seedUser);
		store.selectedUser.next(updatedUser);

		const changeResult = await changeResultPromise;
		expect(changeResult).toEqual(changes);
	});

	it('can quickly load entities related by foreign keys using a OneToManyRelationship instance', async () => {

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

		expect(store.productOrdersByProductId.getRelatedValues(toastId).length).toBe(1);
		expect(store.productOrdersByProductId.getRelatedValues(milkId).length).toBe(1);
		expect(store.productOrdersByProductId.getRelatedValues(breadId).length).toBe(3);

		const onOrderUpdate = store.productOrders.changes.pipe(
			first(ev => ev.key === 0)
		).toPromise();

		store.productOrders.updateOne({ key: 0, changes: { productId: milkId } });
		const ev = await onOrderUpdate;

		expect(ev.value).toBeDefined();
		expect(ev.value.productId).toBe(milkId);
		expect(ev.previousValue).toBeDefined();
		expect(ev.previousValue.productId).toBe(breadId);

		expect(store.productOrdersByProductId.getRelatedValues(milkId).length).toBe(2);
		expect(store.productOrdersByProductId.getRelatedValues(breadId).length).toBe(2);

		store.productOrders.removeOne(0);
		expect(store.productOrdersByProductId.getRelatedValues(milkId).length).toBe(1);
		expect(store.productOrdersByProductId.getRelatedValues(breadId).length).toBe(2);

		expect(() => store.destroy()).not.toThrow();
	});

	it('does not explode when given a bad effect to register', () => {

		class NullStore extends AppStore {

			public readonly nullEffect = this.registerEffect(null);
		}

		let store: NullStore;

		expect(() => store = new NullStore()).not.toThrow();
		expect(store.nullEffect).toBe(null);
	});

	it('does not explode when a relationship context is given bad input', () => {

		const store = new AppStore();

		expect(() => store.productOrdersByProductId.getRelatedValues(null)).not.toThrow();
		expect(() => store.productOrdersByProductId.associate(null, 5)).not.toThrow();
		expect(() => store.productOrdersByProductId.disassociate(null, 2)).not.toThrow();
		expect(() => store.productOrdersByProductId.associate(undefined, undefined)).not.toThrow();
		expect(() => store.productOrdersByProductId.consume(undefined)).not.toThrow();
		expect(store.productOrdersByProductId.getRelatedValues(undefined).length).toBe(0);
	});

	it('has an option to watch foreign key entities by a given primary key', async () => {

		const store = new AppStore();

		const firstSpy = jasmine.createSpy('firstSpy').and.callFake(values => values && values.length === 3);
		const targetProductId = 1;

		const waitForUpdates = store.productOrdersByProductId.watchPrimaryKey(targetProductId).pipe(
			first(firstSpy)
		).toPromise();

		const bobId = 'adsf';
		const tedId = 'zxcv';
		const frankId = 'mnbv';

		store.users.addMany([
			{ id: bobId, name: 'Bob' },
			{ id: tedId, name: 'Ted' },
			{ id: frankId, name: 'Frank' },
		]);

		const toastId = 0;
		const milkId = targetProductId;
		const breadId = 2;

		store.products.addMany([
			{ id: toastId, name: 'Toast' },
			{ id: milkId, name: 'Milk' },
			{ id: breadId, name: 'Bread' },
		]);

		store.productOrders.addMany([
			{ id: 0, userId: bobId, productId: breadId },
			{ id: 1, userId: bobId, productId: milkId },
			{ id: 2, userId: bobId, productId: milkId },
			{ id: 3, userId: tedId, productId: toastId },
			{ id: 4, userId: tedId, productId: milkId },
			{ id: 5, userId: tedId, productId: toastId },
		]);

		// Associations are added linearly
		expect(store.productOrdersByProductId.getPrimaryKeys()).toEqual([
			milkId,
			breadId,
			toastId,
		]);

		expect(store.productOrdersByProductId.hasAssociation(milkId, 1)).toBe(true);
		expect(store.productOrdersByProductId.hasAnyAssociation(milkId)).toBe(true);
		expect(store.productOrdersByProductId.hasAssociation(toastId, 5)).toBe(true);
		expect(store.productOrdersByProductId.hasAnyAssociation(toastId)).toBe(true);
		expect(store.productOrdersByProductId.hasAssociation(breadId, 1)).toBe(false);
		expect(store.productOrdersByProductId.hasAssociation(55, 1)).toBe(false);
		expect(store.productOrdersByProductId.hasAnyAssociation(55)).toBe(false);
		expect(store.productOrdersByProductId.hasAssociation(null, null)).toBe(false);

		const orders = await waitForUpdates;

		expect(orders).toEqual([
			{ id: 1, userId: bobId, productId: milkId },
			{ id: 2, userId: bobId, productId: milkId },
			{ id: 4, userId: tedId, productId: milkId },
		]);

		expect(firstSpy).toHaveBeenCalledTimes(4);
	});

	it('allows for manually overwriting a set of foreign keys', () => {

		const store = new AppStore();

		const productOrderContext = store.productOrdersByProductId.getPrimaryKeyContext(42);
		const originalKeys = productOrderContext.getForeignKeys();
		expect(originalKeys.length).toBe(0);

		const manuallyInsertedKeys = [1, 2, 3];
		productOrderContext.setForeignKeys(manuallyInsertedKeys);
		expect(productOrderContext.getForeignKeys()).toEqual(manuallyInsertedKeys);
	});

	it('allows for relationship primary key context deletion', () => {

		const store = new AppStore();
		const productOrderContext = store.productOrdersByProductId.getPrimaryKeyContext(42);

		spyOn(productOrderContext, 'clear').and.callThrough();

		store.productOrdersByProductId.deletePrimaryKeyContext(productOrderContext.id);
		expect(productOrderContext.clear).toHaveBeenCalled();

		// Should not explode when given a non-existent key
		expect(() => store.productOrdersByProductId.deletePrimaryKeyContext(-5)).not.toThrow();
	});
});