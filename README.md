# @obsidize/rx-map

This is intended to be a very, _very_ light-weight entity storage management system that slightly resembles parts of [@ngrx/entity](https://ngrx.io/api/entity).

The idea here is that the most useful part of ngrx is the store itself, and being able to watch for "single source of truth" entity changes from anywhere.
However, ngrx completely undermines this usefulness by adding a million different constructs in the way of just publishing to something that is effectively _just a map of values_. (See: actions, reducers, effects, effects of effects, actions for effects of effects, etc...)

The mantra of this module is simple:

1. download some data from _somewhere_
2. put it in an ```RxMap``` or ```RxEntityMap``` instance
3. watch for changes on the exposed "changes" observable and render changes to the UI (or react to them in some other service(s))

Although this format loses some of the rigidity and guarantees that ngrx offers, it grants a much easier syntax and does a much better job of not "getting in the way".

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

This module is primarily geared towards use of ```RxEntityMap```, which is a Map with "primary key" addons.
This means that ```RxEntityMap``` is aware of entity primary keys, and can make many useful mutations / transformations based on them.

The general idea is:

1. Make a bunch of ```RxEntityMap``` instances that will exist for the lifetime of the application
2. Subscribe to the change observables of those instances as needed
3. Publish changes to those instances (any changes made will be echoed to subscribers of the change observables)

```typescript
import {
	RxEntityMap, 
	storeEntityIn
} from '@obsidize/rx-map';

interface User {
	id: number;
	name: string;
	email: string;
}

// key and value types are inferred by the given id selector
const users = new RxEntityMap((user: User) => user.id);

const bobId = 1234;
const bob: User = { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' };
users.addOne(bob);

// ... somewhere else that's watching for updates ...
users.watchOne(bobId).subscribe(user => {
	console.log('added user -> ', user); // {id: 1234, name: 'Bob', age: 37}
});

// To get a model manually from the map
const bobCopy = users.getOne(bobId);

// You can also use this module's utility operator functions to 
// capture values as they come in from http / other observable sources.
of(bobCopy).pipe(
	storeEntityIn(users) // will publish emitted values into the 'users' map by side-effect
);
```

## API

- [RxEntityMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/rx-entity-map.ts) - core entry point, use this to update and watch a collection of entities (Inherits from ```EntityMap```, and uses an ```RxMap``` as its storage mechanism).
- [EntityMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/entity-map.ts) - an overlay of an ES6 Map that is aware of the concept of "primary keys" in the map's values.
- [RxMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/rx-map.ts) - shares the same API as the standard [ES6 Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) with the addition of a ```changes``` Observable.
- [rxjs operators](https://github.com/jospete/obsidize-rx-map/blob/master/src/operators.ts) - helper operator functions for transforming events from the ```RxMap``` "changes" Observable stream