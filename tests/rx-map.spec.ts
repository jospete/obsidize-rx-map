import { bufferCount, first, takeWhile } from 'rxjs/operators';

import { MapStateChangeEventType, ofType, pluckValue, RxMap } from '../src';

interface Game {
	id: number;
	name: string;
	playerCount: number;
}

describe('RxMap', () => {

	it('is a standard ES6 Map with a tacked-on change stream', async () => {

		const games = new RxMap<number, Game>();

		expect(games.size).toBe(0);

		const addSpy = jasmine.createSpy('addSpy');
		const tetris: Game = { id: 0, name: 'Tetris', playerCount: 9001 };

		const addStream = games.changes.pipe(
			ofType(MapStateChangeEventType.SET),
			pluckValue()
		);

		addStream.subscribe(addSpy);
		const onAdd = addStream.pipe(first()).toPromise();

		expect(games.get(tetris.id)).not.toBeDefined();
		expect(addSpy).not.toHaveBeenCalled();

		games.set(tetris.id, tetris);
		expect(games.get(tetris.id)).toEqual(tetris);

		const addResult = await onAdd;
		expect(addSpy).toHaveBeenCalledWith(addResult);
		expect(addResult).toEqual(tetris);
	});

	it('notifies when a value is deleted', async () => {

		const games = new RxMap<number, Game>();
		const tetris: Game = { id: 0, name: 'Tetris', playerCount: 9001 };

		games.set(tetris.id, tetris);
		expect(games.size).toBe(1);

		const removeStream = games.changes.pipe(
			ofType(MapStateChangeEventType.DELETE),
			pluckValue(),
			first()
		).toPromise();

		games.delete(tetris.id);

		const removeResult = await removeStream;
		expect(removeResult).toEqual(tetris);

		const nextEventStream = games.changes.pipe(
			first()
		).toPromise();

		// If we delete the same key twice, it should only emit once
		games.delete(tetris.id)
		games.set(tetris.id, tetris);

		const nextEvent = await nextEventStream;
		expect(nextEvent.type).toBe(MapStateChangeEventType.SET);
	});

	it('notifies when a values are deleted via map clear', async () => {

		const games = new RxMap<number, Game>();
		const tetris: Game = { id: 0, name: 'Tetris', playerCount: 9001 };
		const pong: Game = { id: 1, name: 'Pong', playerCount: 1234 };

		games.set(tetris.id, tetris);
		games.set(pong.id, pong);
		const gameCount = games.size;

		const removeStream = games.changes.pipe(
			ofType(MapStateChangeEventType.DELETE),
			bufferCount(gameCount),
			first()
		).toPromise();

		games.clear();

		const removeResults = await removeStream;
		expect(removeResults.length).toBe(gameCount);
		expect(removeResults.every(ev => ev.type === MapStateChangeEventType.DELETE)).toBe(true);
		expect(removeResults.some(ev => ev.key === tetris.id)).toBe(true);
		expect(removeResults.some(ev => ev.key === pong.id)).toBe(true);
	});

	it('augments the set() behavior based on previous values', async () => {

		const games = new RxMap<number, Game>();
		const tetris: Game = { id: 0, name: 'Tetris', playerCount: 9001 };

		games.set(tetris.id, tetris);

		const updateStream = games.changes.pipe(
			ofType(MapStateChangeEventType.SET),
			first()
		).toPromise();

		games.set(tetris.id, Object.assign({}, tetris, { playerCount: 5 }));
		const { changes } = await updateStream;
		expect(changes).toEqual({ playerCount: 5 });

		const deleteStream = games.changes.pipe(
			ofType(MapStateChangeEventType.DELETE),
			first()
		).toPromise();

		games.delete(tetris.id);
		const { key } = await deleteStream;
		expect(key).toBe(tetris.id);
	});

	it('does not emit an event when no value changes are detected from duplicate set calls', async () => {

		const games = new RxMap<number, Game>();
		const tetris: Game = { id: 0, name: 'Tetris', playerCount: 9001 };

		const changesSpy = jasmine.createSpy('changesSpy');

		games.changes.subscribe({
			next: changesSpy,
			error: () => { },
			complete: () => { }
		});

		games.set(tetris.id, tetris);

		// Both of these will be ignored by change stream
		games.set(tetris.id, tetris);
		games.set(tetris.id, tetris);

		const waitForClear = games.changes.pipe(
			takeWhile(() => games.size > 0)
		).toPromise();

		games.clear();
		await waitForClear;

		const destroyPromise = games.changes.toPromise().catch(e => e);
		games.destroy();

		const destroyedError = await destroyPromise;
		expect(destroyedError).toBeDefined();
		expect(changesSpy).toHaveBeenCalledTimes(2);
	});

	it('shares standard read accessors from the ES6 Map definition', () => {

		const tetris: Game = { id: 0, name: 'Tetris', playerCount: 9001 };
		const pong: Game = { id: 1, name: 'Pong', playerCount: 1234 };
		const games = new RxMap<number, Game>()
			.set(tetris.id, tetris)
			.set(pong.id, pong);

		games.forEach(v => expect(v).toBeDefined());
		expect(games.keys()).toBeDefined();
		expect(games.values()).toBeDefined();
		expect(games.entries()).toBeDefined();
	});

	it('shares standard symbols from the ES6 Map definition', () => {
		const games = new RxMap<number, Game>();
		expect(games[Symbol.toStringTag]).toBeDefined();
		expect(() => games[Symbol.iterator]()).not.toThrowError();
	});

	it('emits cloned data in the changes observable to prevent unauthorized mutation of the underlying data', async () => {

		const games = new RxMap<number, Game>();
		const tetris: Game = { id: 0, name: 'Tetris', playerCount: 9001 };

		const addEventPromise = games.changes.pipe(
			ofType(MapStateChangeEventType.SET),
			first()
		).toPromise();

		games.set(tetris.id, tetris);

		const addEvent = await addEventPromise;
		const addedGame = addEvent.value;
		const oldPlayerCount = addedGame.playerCount;

		addedGame.playerCount = 12;

		// The above line should not be able to mutate the internal map value
		expect(games.get(tetris.id).playerCount).toBe(oldPlayerCount);
	});
});