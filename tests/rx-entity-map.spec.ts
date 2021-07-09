import { bufferCount, take } from 'rxjs/operators';
import { MapStateChangeEventType, ofType, pluckValue, RxEntityMap } from '../src';

interface User {
	id: string;
	name: string;
	age: number;
}

const getTestUsers = () => [
	{ id: 'asdf', name: 'Dennis', age: 37 },
	{ id: 'bvcx', name: 'Fred', age: 25 },
];

describe('RxEntityMap', () => {

	it('is used to store and query entity models', async () => {

		const users = new RxEntityMap((user: User) => user.id);
		const addedUsers = getTestUsers();

		const addedUsersPromise = users.store.changes.pipe(
			ofType(MapStateChangeEventType.ADD),
			pluckValue()
		).pipe(
			bufferCount(2),
			take(1)
		).toPromise();

		users.addMany(addedUsers);
		const addedUsersResult = await addedUsersPromise;
		expect(addedUsersResult).toEqual(addedUsers);
	});

	it('has a shortcut for obtaining keys', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const addedUsers = getTestUsers();
		users.addMany(addedUsers);

		const keys = users.keys();
		expect(keys.includes(addedUsers[0].id)).toBe(true);
		expect(keys.includes(addedUsers[1].id)).toBe(true);
	});

	it('has a shortcut for obtaining values', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const addedUsers = getTestUsers();
		users.addMany(addedUsers);

		const values = users.values();
		expect(values.some((v) => v.id === addedUsers[0].id)).toBe(true);
		expect(values.some((v) => v.id === addedUsers[1].id)).toBe(true);
	});

	it('has a shortcut for obtaining entries', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const addedUsers = getTestUsers();
		users.addMany(addedUsers);

		const entries = users.entries();
		expect(entries.some(([k]) => k === addedUsers[0].id)).toBe(true);
		expect(entries.some(([k]) => k === addedUsers[1].id)).toBe(true);
	});

	it('returns undefined id for nullish entities', () => {
		const users = new RxEntityMap((user: User) => user.id);
		expect(users.getId(null)).not.toBeDefined();
	});

	it('has a shortcut for clearing the store', () => {
		const users = new RxEntityMap((user: User) => user.id);
		spyOn(users.store, 'clear').and.callThrough();
		users.removeAll();
		expect(users.store.clear).toHaveBeenCalled();
	});

	it('has a shortcut for overwriting a single entity', () => {

		const users = new RxEntityMap((user: User) => user.id);

		expect(() => users.setOne(null)).not.toThrowError();

		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'asdf', name: 'Potato', age: 5 };

		users.setOne(a);
		expect(users.store.get(a.id)).toEqual(a);

		users.setOne(b);
		expect(users.store.get(a.id)).toEqual(b);
	});

	it('can overwrite multiple instances at once', () => {

		const users = new RxEntityMap((user: User) => user.id);

		expect(() => users.setOne(null)).not.toThrowError();

		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'zxcv', name: 'Potato', age: 5 };

		users.setMany([a, b]);
		expect(users.store.get(a.id)).toEqual(a);
		expect(users.store.get(b.id)).toEqual(b);
	});

	it('can overwrite the entire map at once', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'zxcv', name: 'Potato', age: 5 };

		users.setMany([a, b]);
		expect(users.store.get(a.id)).toEqual(a);
		expect(users.store.get(b.id)).toEqual(b);

		users.setAll([b]);
		expect(users.store.get(a.id)).not.toBeDefined();
		expect(users.store.get(b.id)).toEqual(b);
	});

	it('can remove one or multiple ids from the map', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'zxcv', name: 'Potato', age: 5 };

		users.setMany([a, b]);
		expect(users.store.get(a.id)).toEqual(a);
		expect(users.store.get(b.id)).toEqual(b);

		users.removeOne(b.id);
		expect(users.store.get(a.id)).toEqual(a);
		expect(users.store.get(b.id)).not.toBeDefined();

		users.removeMany([a.id]);
		expect(users.store.get(a.id)).not.toBeDefined();
	});

	it('can remove by a predicate', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };
		const b: User = { id: 'zxcv', name: 'David', age: 25 };
		const c: User = { id: 'gggg', name: 'Bob', age: 15 };

		users.setMany([a, b, c]);
		expect(users.store.get(a.id)).toEqual(a);
		expect(users.store.get(b.id)).toEqual(b);
		expect(users.store.get(c.id)).toEqual(c);

		users.removeWhere(v => v.age >= 20);
		expect(users.store.has(a.id)).toBe(false);
		expect(users.store.has(b.id)).toBe(false);
	});
});