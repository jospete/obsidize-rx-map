import { first } from 'rxjs/operators';

import { RxStore, accumulateChanges, pluckChanges } from '../src';
import { Product, ProductOrder, User } from './test-utility';

class AppStore extends RxStore {

	public readonly darkMode = this.defineProperty(true);
	public readonly clickCount = this.defineProperty(0);
	public readonly users = this.defineEntity((user: User) => user.id);
	public readonly products = this.defineEntity((product: Product) => product.id);
	public readonly productOrders = this.defineEntity((order: ProductOrder) => order.id);
}

describe('RxStore', () => {

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
});