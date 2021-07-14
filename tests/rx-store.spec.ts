import { first } from 'rxjs/operators';

import { RxStore, accumulateChanges, pluckChanges } from '../src';
import { Product, ProductOrder, User } from './test-utility';

class AppStore extends RxStore {

	public readonly darkMode = this.defineProperty('darkMode', true);
	public readonly clickCount = this.defineProperty('clickCount', 0);
	public readonly users = this.defineEntityMap('users', (user: User) => user.id);
	public readonly products = this.defineEntityMap('products', (product: Product) => product.id);
	public readonly productOrders = this.defineEntityMap('productOrders', (order: ProductOrder) => order.id);
}

describe('RxStore', () => {

	it('is a base class for iteracting with the app root state', () => {

		const store = new AppStore();
		const usersId = 'users';
		const darkModeId = 'darkMode';

		expect(store.users).toBeDefined();
		expect(store.getEntityMapId(store.users)).toBe(usersId);
		expect(store.getEntityMap(usersId)).toBe(store.users);
		expect(store.getEntityMapId(null)).not.toBeDefined();

		expect(store.darkMode).toBeDefined();
		expect(store.getPropertyId(store.darkMode)).toBe(darkModeId);
		expect(store.getProperty(darkModeId)).toBe(store.darkMode);
		expect(store.getPropertyId(null)).not.toBeDefined();
	});

	it('throws an exception when one of the define methods is given an id that has already been defined', () => {

		class BadPropStore extends AppStore {
			public readonly dupeDarkMode = this.defineProperty('darkMode', false);
		}

		expect(() => new BadPropStore()).toThrowError();

		class BadMapStore extends AppStore {
			public readonly dupeUsers = this.defineEntityMap('users', null);
		}

		expect(() => new BadMapStore()).toThrowError();
	});

	it('will destroy all defined constructs when destroy() is called', async () => {

		const store = new AppStore();
		spyOn(store.users, 'destroy').and.callThrough();
		const onDestroyDarkModeStream = store.darkMode.asObservable().toPromise().catch(e => e);

		store.destroy();
		await onDestroyDarkModeStream;
		expect(store.users.destroy).toHaveBeenCalled();
	});

	it('can perform deep change detection on property entries', async () => {

		const seedUser: User = { id: '21234', name: 'John', email: '123@abc.com' };

		class CustomStore extends RxStore {
			public readonly selectedUser = this.defineProperty('selectedUser', null);
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
});