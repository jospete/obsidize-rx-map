# @obsidize/rx-map

This is intended to be a very, _very_ light-weight entity storage management system that slightly resembles parts of [@ngrx/entity](https://ngrx.io/api/entity).

The idea here is that the most useful part of ngrx is the store itself, and being able to watch for "single source of truth" entity changes from anywhere.
However, ngrx completely undermines this usefulness by adding a million different constructs in the way of just publishing to something that is effectively _just a map of values_. (See: actions, reducers, effects, effects of effects, actions for effects of effects, etc...)

The mantra of this module is simple:

1. download some data from _somewhere_
2. put it in an ```RxMap``` or ```RxEntityMap``` instance
3. watch for changes on the exposed "changes" observable and render changes to the UI (or react to them in some other service(s))

Although this format loses some of the rigidity and guarantees that ngrx offers, it grants a much easier syntax and general usage

## Installation

- npm:

```bash
npm install --save @obsidize/rx-map
```

- git:

```bash
npm install --save git+https://github.com/jospete/obsidize-rx-map.git
```

## Usage

```typescript
import {RxEntityMap, MapStateChangeEventType, ofType, pluckValue} from '@obsidize/rx-map';

interface User {
	id: number;
	name: string;
	age: number;
}

// key and value types are inferred by the given id selector
const users: RxEntityMap = new RxEntityMap((user: User) => user.id);
const bob: User = {id: 0, name: 'Bob', age: 37};
users.addOne(bob);

// ... somewhere else that's watching for updates ...

users.store.changes.pipe(
	ofType(MapStateChangeEventType.ADD),
	pluckValue()
).subscribe(user => {
	console.log('added user -> ', user); // {id: 0, name: 'Bob', age: 37}
});

// Or get Bob's model manually
const bob = users.store.get(0);
```