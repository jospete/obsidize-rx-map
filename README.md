# @obsidize/rx-map

A minimalist implementation of the [@ngrx/entity](https://ngrx.io/api/entity) EntityAdapter [API](https://ngrx.io/guide/entity/adapter#adapter-collection-methods), 
except without the action / reducer / effects boilerplate that typically comes with a state management system.

This module acts as a library rather than a framework to give you maximum control over your in-memory data stores.

The pattern of this module does _**not**_ follow the redux / ngrx scheme of:

1. dispatch action
2. effects
3. store state mutation
4. store state selectors updated

But rather uses a simple observable datastructure called ```RxEntityMap``` that acts as a "slice" of your database:

1. create a long-lived ```RxEntityMap``` instance per entity type that you want to track (i.e. "User", "Product", "ProductOrder", etc.)
2. subscribe to ```RxEntityMap.changes``` as needed to watch any number of entities by id (or just watch the entire collection)
3. publish updates to the map instance directly

Step 3 above essentially bypasses steps 1, 2, and 3 of the redux paradigm, and rips out all of the action / reducer / effects boilerplate.

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
	id: string;
	name: string;
	email: string;
}

// key / Value types are inferred by the given key selector function
const users = new RxEntityMap((user: User) => user.id);

const bobId = 'adsfzxcv';
const bob: User = { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' };
users.addOne(bob);

// ... somewhere else that's watching for updates ...
users.watchOne(bobId).subscribe(user => {
	console.log('user model change -> ', user); // { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' }
});

// Get a model manually from the map
const bobCopy = users.getOne(bobId);

// NOTE: all returned / emitted instances are a deep copy to prevent callers from bypassing change detection
console.log(bobCopy === bob); // false

// Make some changes and publish back
bobCopy.email = 'altbobemail@blah.com';
users.upsertOne(bobCopy);

// This module also has operator functions to capture entity models 
// as they come in from other http / observable sources.
of(bobCopy).pipe(
	storeEntityIn(users) // will publish emitted values into the 'users' map by side-effect
).subscribe(user => console.log(user));
```


NOTE: each level of this module is designed to be an extendable class, which you can customize at your leisure.

```typescript
import {map} from 'rxjs/operators';

import {
	RxEntityMap, 
	RxMap,
	KeySelector,
	Predicate
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
	public watchManyWhere(predicate: Predicate<V>): Observable<V> {
		return this.watchAll().pipe(
			map(values => values.filter(predicate))
		);
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

// Note that the key selector can return any type you want, and is not limited to strings and numbers
const customMapInst = new MyCustomEntityMap((food: Food) => food.name);
```

## API

- [RxEntityMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/rx-entity-map.ts) - core entry point; use this to store, update, and watch a collection of entities (Inherits from ```EntityMap```, and uses an ```RxMap``` as its storage mechanism by default).
- [EntityMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/entity-map.ts) - an overlay of an ES6 Map that is aware of the concept of "primary keys" in the map's values.
- [RxMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/rx-map.ts) - shares the same API as the standard [ES6 Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) with the addition of a ```changes``` Observable.
- [ImmutableMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/immutable-map.ts) - special flavor of an ES6 Map who's values cannot be mutated outside of the ```set()``` and ```delete()``` methods. Deep object cloning is used to enforce this for all query methods.
- [rxjs operators](https://github.com/jospete/obsidize-rx-map/blob/master/src/operators.ts) - helper operator functions for transforming events from the ```RxMap.changes``` Observable stream

## Supplemental Notes

```RxMap``` is backed by ```ImmutableMap``` by default to prevent bypassing of change detection via direct object editing. This means that ```RxMap``` can reduce change emissions to only happen when there are actual changes (avoids set() redundancies).

While this is a "nice to have" for reducing map state change event noise, change detection can become very expensive if the size of the entity object(s) or the amount of them  in the map is substantial.

To bypass these features for potential performance gains, use [MutableRxEntityMap](https://github.com/jospete/obsidize-rx-map/blob/master/src/mutable-rx-entity-map.ts) (**use with caution - you probably don't need this**)