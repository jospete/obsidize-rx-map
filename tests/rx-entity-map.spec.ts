import { bufferCount, take } from 'rxjs/operators';
import { MapStateChangeEventType, ofType, pluckValue, RxEntityMap } from '../src';

interface User {
	id: string;
	name: string;
	age: number;
}

describe('RxEntityMap', () => {

	it('is used to store and query entity models', async () => {

		const users = new RxEntityMap((user: User) => user.id);

		const addedUsersPromise = users.store.changes.pipe(
			ofType(MapStateChangeEventType.ADD),
			pluckValue()
		).pipe(
			bufferCount(2),
			take(1)
		).toPromise();

		const addedUsers = [
			{ id: 'asdf', name: 'Dennis', age: 37 },
			{ id: 'bvcx', name: 'Fred', age: 25 },
		];

		users.addMany(addedUsers);
		const addedUsersResult = await addedUsersPromise;
		expect(addedUsersResult).toEqual(addedUsers);
	});
});