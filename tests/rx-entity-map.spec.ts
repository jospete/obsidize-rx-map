import { some } from 'lodash';
import { bufferCount, first, tap, skipWhile, take } from 'rxjs/operators';

import { forKey, MapStateChangeEventType, ofType, pluckChanges, pluckValue, RxEntityMap } from '../src';

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

		const addedUsersPromise = users.changes.pipe(
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

	it('can be destroyed', async () => {

		const users = new RxEntityMap((user: User) => user.id);
		const errorPromise = users.changes.pipe(first()).toPromise().catch(e => e);

		users.destroy();

		// Should not blow up if destroy is called multiple times
		expect(() => users.destroy()).not.toThrow();

		const destroyedError = await errorPromise;
		expect(destroyedError).toBeDefined();
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
		expect(users.keyOf(null)).not.toBeDefined();
	});

	it('has a shortcut for clearing the store', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		expect(users.count).toBe(0);

		users.addOne(a);
		expect(users.count).toBe(1);

		users.removeAll();
		expect(users.count).toBe(0);
	});

	it('has a shortcut for overwriting a single entity', () => {

		const users = new RxEntityMap((user: User) => user.id);

		expect(() => users.setOne(null)).not.toThrowError();

		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'asdf', name: 'Potato', age: 5 };

		users.setOne(a);
		expect(users.getOne(a.id)).toEqual(a);

		users.setOne(b);
		expect(users.getOne(a.id)).toEqual(b);
	});

	it('has query utilities for entities by id', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'mnbv', name: 'Potato', age: 5 };

		expect(users.hasOne(a.id)).toBe(false);
		expect(users.hasSome([a.id, b.id])).toBe(false);
		expect(users.hasEvery([a.id, b.id])).toBe(false);

		users.addMany([a, b]);

		expect(users.hasOne(a.id)).toBe(true);
		expect(users.hasSome([a.id, b.id])).toBe(true);
		expect(users.hasEvery([a.id, b.id])).toBe(true);

		users.removeOne(b.id);

		expect(users.hasSome([a.id, b.id])).toBe(true);
		expect(users.hasEvery([a.id, b.id])).toBe(false);

		users.removeOne(a.id);

		expect(users.hasSome([a.id, b.id])).toBe(false);
	});

	it('can overwrite multiple instances at once', () => {

		const users = new RxEntityMap((user: User) => user.id);

		expect(() => users.setOne(null)).not.toThrowError();

		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'zxcv', name: 'Potato', age: 5 };

		users.setMany([a, b]);
		expect(users.getOne(a.id)).toEqual(a);
		expect(users.getOne(b.id)).toEqual(b);
	});

	it('can overwrite the entire map at once', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'zxcv', name: 'Potato', age: 5 };

		users.setMany([a, b]);
		expect(users.getOne(a.id)).toEqual(a);
		expect(users.getOne(b.id)).toEqual(b);

		users.setAll([b]);
		expect(users.getOne(a.id)).not.toBeDefined();
		expect(users.getOne(b.id)).toEqual(b);
	});

	it('can remove one or multiple ids from the map', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 37 };
		const b: User = { id: 'zxcv', name: 'Potato', age: 5 };

		users.setMany([a, b]);
		expect(users.getOne(a.id)).toEqual(a);
		expect(users.getOne(b.id)).toEqual(b);

		users.removeOne(b.id);
		expect(users.getOne(a.id)).toEqual(a);
		expect(users.getOne(b.id)).not.toBeDefined();

		users.removeMany([a.id]);
		expect(users.getOne(a.id)).not.toBeDefined();
	});

	it('can remove by a predicate', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };
		const b: User = { id: 'zxcv', name: 'David', age: 25 };
		const c: User = { id: 'gggg', name: 'Bob', age: 15 };

		users.setMany([a, b, c]);
		expect(users.getOne(a.id)).toEqual(a);
		expect(users.getOne(b.id)).toEqual(b);
		expect(users.getOne(c.id)).toEqual(c);

		users.removeWhere(v => v.age >= 20);
		expect(users.hasOne(a.id)).toBe(false);
		expect(users.hasOne(b.id)).toBe(false);
	});

	it('can update many at once', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };
		const b: User = { id: 'zxcv', name: 'David', age: 25 };
		const c: User = { id: 'gggg', name: 'Bob', age: 15 };

		users.setMany([a, b, c]);

		const a2 = Object.assign({}, a, { name: 'test update 1' });
		const c2 = Object.assign({}, c, { age: 42 });

		users.upsertMany([a2, null, c2]); // should be able to handle random non-entity values
		expect(users.getOne(a.id)).toEqual(a2);
		expect(users.getOne(b.id)).toEqual(b);
		expect(users.getOne(c.id)).toEqual(c2);

		users.updateMany([null, { key: b.id, changes: { name: 'test udpate 2' } }, { key: c.id, changes: { age: 33 } }]);
		expect(users.getOne(a.id)).toEqual(a2);
		expect(users.getOne(b.id).name).toEqual('test udpate 2');
		expect(users.getOne(c.id).age).toEqual(33);
	});

	it('can transform an entity in-place', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };

		users.addOne(a);

		users.transformOne(a.id, entity => {
			entity.name += '5';
			return entity;
		});

		expect(users.getOne(a.id).name).toBe('Dennis5');
		expect(() => users.transformOne(null, null)).not.toThrowError();
	});

	it('can transform many entities in-place', () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };
		const b: User = { id: 'zxcv', name: 'David', age: 25 };
		const c: User = { id: 'gggg', name: 'Bob', age: 15 };

		users.setMany([a, b, c]);

		users.transformMany(user => {
			if (user.age > 16) user.age = 16;
			return user;
		});

		expect(users.getOne(a.id).age).toBe(16);
		expect(users.getOne(b.id).age).toBe(16);
		expect(users.getOne(c.id).age).toBe(15);
		expect(() => users.transformMany(null)).not.toThrowError();
	});

	it('can watch for changes by a target entity id', async () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };

		users.addOne(a);

		const onUserPropChange = users.changes.pipe(
			ofType(MapStateChangeEventType.UPDATE),
			forKey(a.id),
			pluckChanges(),
			first()
		).toPromise();

		const updateProps = { age: 99 };
		users.upsertOne(Object.assign({}, a, updateProps));
		const update = await onUserPropChange;
		expect(update).toEqual(updateProps);
	});

	it('performs proper change detection when an entity is mutated and then re-inserted', async () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };

		users.setOne(a);

		const onUserPropChange = users.changes.pipe(
			pluckChanges(),
			first()
		).toPromise();

		a.age = 1234;
		users.setOne(a);

		const update = await onUserPropChange;
		expect(update).toEqual({ age: 1234 });
	});

	it('has a convenience method for watching the entire collection', async () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };
		const b: User = { id: 'nbvc', name: 'Bob', age: 42 };

		const onCollectionChange = users.watchAll().pipe(
			skipWhile(() => users.count < 2),
			first()
		).toPromise();

		users.addMany([a, b]);

		const update = await onCollectionChange;
		expect(update).toEqual(users.values());
	});

	it('has a convenience method for watching a single entity', async () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };
		const userUpdateSpy = jasmine.createSpy('userUpdateSpy');

		const onCollectionChange = users.watchOne(a.id).pipe(
			tap(userUpdateSpy),
			skipWhile(user => !user || user.age < 25),
			first()
		).toPromise();

		users.addOne(a); // event 1

		a.name += '-5';
		users.upsertOne(a); // event 2

		a.age = 25;
		users.upsertOne(a); // event 3

		const update = await onCollectionChange;
		expect(update).toEqual(a);
		expect(userUpdateSpy).toHaveBeenCalledTimes(3);
	});

	it('has a convenience method for watching a set of entity ids', async () => {

		const users = new RxEntityMap((user: User) => user.id);
		const a: User = { id: 'asdf', name: 'Dennis', age: 20 };
		const b: User = { id: 'jhgf', name: 'Bob', age: 32 };
		const c: User = { id: 'trew', name: 'Larry', age: 64 };
		const userUpdateSpy = jasmine.createSpy('userUpdateSpy');

		const onCollectionChange = users.watchMany([a.id, b.id, c.id]).pipe(
			tap(userUpdateSpy),
			skipWhile(users => !some(users, u => !!u && u.age > 99)),
			first()
		).toPromise();

		// 1st event is the startWith() operator for the current entity state
		users.setMany([a, b, c]); // event 2, 3, 4 (each add is atomic)

		a.name += '-5';
		users.upsertOne(a); // event 5
		users.upsertOne(b); // NOT an event, because b should still match the 'b' in the store

		b.age = 25;
		users.upsertOne(b); // event 6

		c.age = 55;
		users.upsertOne(c); // event 7

		a.age = 9001;
		users.upsertOne(a); // event 8

		const update = await onCollectionChange;
		expect(update).toEqual([a, b, c]);
		expect(userUpdateSpy).toHaveBeenCalledTimes(8);
	});
});