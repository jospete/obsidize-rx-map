# @obsidize/rx-map

A minimalist implementation of the [@ngrx/entity](https://ngrx.io/api/entity) EntityAdapter [API](https://ngrx.io/guide/entity/adapter#adapter-collection-methods), 
which aims to completely eliminate action / reducer / effects boilerplate and stay out of your way as much as possible.

This module acts as a library rather than a framework to give you maximum control of in-memory your data storage.

The pattern of this module does **not** follow the redux / ngrx scheme of:

1. dispatch action
2. effects
3. store state mutation
4. store state selectors updated

Rather, this uses a simple observable datastructure called ```RxEntityMap``` that acts as a "slice" of your complete store:

1. create a long-lived ```RxEntityMap``` instance per entity type that you want to track (i.e. "User", "Product", "ProductOrder", etc.)
2. subscribe to ```RxEntityMap.changes``` as needed to watch any number of entities by id (or just watch the entire collection)
3. publish updates to the map instance directly

Step 3 above essentially bypasses steps 2, 3 and 4 of the redux paradigm, and rips out all of the action / reducer / effects boilerplate.

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
import {of} from 'rxjs';

import {
	RxEntityMap, 
	storeEntityIn
} from '@obsidize/rx-map';

interface User {
	id: number;
	name: string;
	email: string;
}

// key / Value types are inferred by the given key selector function
const users = new RxEntityMap((user: User) => user.id);

const bobId = 1234;
const bob: User = { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' };
users.addOne(bob);

// ... somewhere else that's watching for updates ...
users.watchOne(bobId).subscribe(user => {
	console.log('user model change -> ', user); // { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' }
});

// Get a model manually from the map
const bobCopy = users.getOne(bobId);

// NOTE: all returned / emitted instances are a deep copy to prevent callers from bypassing change detection
bobCopy.email = 'altbobemail@blah.com';
console.log(bobCopy === bob); // false

// Use this module's utility operator functions to capture entity models 
// as they come in from http / other observable sources.
of(bobCopy).pipe(
	storeEntityIn(users) // will publish emitted values into the 'users' map by side-effect
).subscribe();
```


NOTE: each level of this module is designed to be an extendable class, which you can customize at your leisure.

```typescript
import {
	RxEntityMap, 
	RxMap,
	KeySelector
} from '@obsidize/rx-map';

class MyCustomRxMap<K, V> extends RxMap<K, V> {

	// Inherited methods can be overridden
	public set(key: K, value: V): this {
		// Do some custom logic here
		return super.set(key, value);
	}
}

class MyCustomEntityMap<K, V> extends RxEntityMap<K, V, MyCustomRxMap<K, V>> {
	
	constructor(selectKey: KeySelector<K, V>) {
		super(new MyCustomRxMap<K, V>(), selectKey);
	}

	// You can also add on new methods to keep your entity map logic dry.
	public watchSomethingSpecific(): Observable<V> {
		return this.watchOne(SOME_STATIC_ID);
	}
}

enum FoodName {
	Pizza,
	Salad,
	Fries
}

interface Food {
	name: FoodName;
}

// The key selector can be any type you want - this behavior is built in by default
const customMapInst = new MyCustomEntityMap((food: Food) => food.name);
```

## API

- [RxEntityMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/rx-entity-map.ts) - core entry point; use this to store, update, and watch a collection of entities (Inherits from ```EntityMap```, and uses an ```RxMap``` as its storage mechanism by default).
- [EntityMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/entity-map.ts) - an overlay of an ES6 Map that is aware of the concept of "primary keys" in the map's values.
- [RxMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/rx-map.ts) - shares the same API as the standard [ES6 Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) with the addition of a ```changes``` Observable.
- [rxjs operators](https://github.com/jospete/obsidize-rx-map/blob/master/src/operators.ts) - helper operator functions for transforming events from the ```RxMap.changes``` Observable stream