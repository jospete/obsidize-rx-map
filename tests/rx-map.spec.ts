import { bufferCount, first } from 'rxjs/operators';
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
			ofType(MapStateChangeEventType.ADD),
			pluckValue()
		);

		addStream.subscribe(addSpy);
		const onAdd = addStream.pipe(first()).toPromise();

		expect(games.get(tetris.id)).not.toBeDefined();
		expect(addSpy).not.toHaveBeenCalled();

		games.set(tetris.id, tetris);
		expect(games.get(tetris.id)).toBe(tetris);

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
			ofType(MapStateChangeEventType.ADD, MapStateChangeEventType.DELETE),
			first()
		).toPromise();

		// If we delete the same key twice, it should only emit once
		games.delete(tetris.id)
		games.set(tetris.id, tetris);

		const nextEvent = await nextEventStream;
		expect(nextEvent.type).toBe(MapStateChangeEventType.ADD);
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

	it('can be destroyed', () => {
		const games = new RxMap<number, Game>();
		games.destroy();
		expect(() => games.changes.subscribe()).toThrowError();
	});
});