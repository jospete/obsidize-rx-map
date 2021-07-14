# @obsidize/rx-map

A simple application state management mechanism reminiscent of  [@ngrx/entity](https://ngrx.io/api/entity) EntityAdapter [API](https://ngrx.io/guide/entity/adapter#adapter-collection-methods).

This module differs from ngrx / redux in that it does not bother with the concept of actions / effects / reducers.

Rather, this module supplies a few simple base-line classes to build up a state structure that can be observed for changes and mutated directly (thus bypassing the constructs listed above).

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
import {RxStore, storeEntityIn} from '@obsidize/rx-map';

// Define the shape of the entity instances you will store.
interface User {
	id: string;
	name: string;
	email: string;
}

// Define your "single source of truth" - all state changes should go through an instance of this.
class AppStore extends RxStore {

	// There are two types of storage mechanisms we can define here:

	// 1. definedProperty() - declares an observable non-entity value
	public readonly darkMode = this.defineProperty('darkMode', false);

	// 2. defineEntityMap() - declares an observable map of entity values
	public readonly users = this.defineEntityMap('users', (user: User) => user.id);
}

const store = new AppStore();

// update a store property
store.darkMode.next(true);

// watch a store property
store.darkMode.subscribe(isDarkMode => console.log(isDarkMode)); // true

const bobId = 'adsfzxcv';
const bob: User = { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' };

// Add an entity to the store
store.users.addOne(bob);

// ... somewhere else that's watching for updates ...
store.users.watchOne(bobId).subscribe(user => {
	console.log('user model change -> ', user); // { id: bobId, name: 'Bob', email: 'whatsy@whosit.org' }
});

// Get a model manually from the map
const bobCopy = store.users.getOne(bobId);

// NOTE: all returned / emitted instances are a deep copy to prevent callers from bypassing change detection
console.log(bobCopy === bob); // false

// Make some changes and publish back
bobCopy.email = 'altbobemail@blah.com';
store.users.upsertOne(bobCopy);

// This module also has operator functions to capture entity models 
// as they come in from other http / observable sources.
of(bobCopy).pipe(
	storeEntityIn(store.users) // will publish emitted values into the 'users' map by side-effect
).subscribe(user => console.log(user));
```

Note that for angular projects, your store should be a root-level service:

```typescript
@Injectable({
	providedIn: 'root'
})
export class AppStoreService extends RxStore {
	// TODO: add properties and entity maps here
}
```

## API

- Source documentation can be found [here](https://jospete.github.io/obsidize-rx-map/)