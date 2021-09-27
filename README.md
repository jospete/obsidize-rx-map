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

### Example

Here is a minimal working example - keep in mind that this example only scratches the surface of the full extent of this module.

```typescript
import {RxStore} from '@obsidize/rx-map';

// Step 1 - Stand up your model structures

interface Customer {
	id: number;
	firstName: string;
	lastName: string;
}

interface Product {
	id: number;
	name: string;
}

interface Purchase {
	id: number;
	customerId: number;
	productId: number;
	productCount: number;
}

class AppSession extends RxStore {

	public readonly customers = this.defineEntity((customer: Customer) => customer.id);
	public readonly products = this.defineEntity((product: Product) => product.id);
	public readonly purchases = this.defineEntity((purchase: Purchase) => purchase.id);

	public readonly purchasesByCustomerId = this.defineEntityForeignKey(this.purchases, purchase => purchase.customerId);
	public readonly purchasesByProductId = this.defineEntityForeignKey(this.purchases, purchase => purchase.productId);
}

// Step 2 - Use the structure you created to store and fetch data

const session = new AppSession();

const [john, susan, bob] = session.customers.addMany([
	{ id: 0, firstName: 'John', lastName: 'Smith' },
	{ id: 1, firstName: 'Susan', lastName: 'Hopkins' },
	{ id: 2, firstName: 'Bob', lastName: 'Langley' }
]);

const [milk, eggs, bread] = session.products.addMany([
	{ id: 0, name: 'Milk' },
	{ id: 1, name: 'Eggs' },
	{ id: 2, name: 'Bread' }
]);

session.purchases.addMany([
	{ id: 0, customerId: bob.id, productId: eggs.id, productCount: 2 },
	{ id: 1, customerId: bob.id, productId: milk.id, productCount: 1 },
	{ id: 2, customerId: susan.id, productId: milk.id, productCount: 3 },
	{ id: 3, customerId: john.id, productId: bread.id, productCount: 5 },
	{ id: 4, customerId: bob.id, productId: bread.id, productCount: 1 },
	{ id: 5, customerId: susan.id, productId: eggs.id, productCount: 3 }
]);

console.log(session.customers.getOne(john.id)); // { id: 0, firstName: 'John', lastName: 'Smith' }
console.log(session.customers.getOne(susan.id)); // { id: 1, firstName: 'Susan', lastName: 'Hopkins' }
console.log(session.customers.getOne(bob.id)); // { id: 2, firstName: 'Bob', lastName: 'Langley' }

console.log(session.purchasesByCustomerId.getRelatedValues(john.id).length); // 1
console.log(session.purchasesByCustomerId.getRelatedValues(susan.id).length); // 2
console.log(session.purchasesByCustomerId.getRelatedValues(bob.id).length); // 3

console.log(session.purchasesByProductId.getRelatedValues(milk.id).length); // 2
console.log(session.purchasesByProductId.getRelatedValues(eggs.id).length); // 2
console.log(session.purchasesByProductId.getRelatedValues(bread.id).length); // 2
```

For more extensive examples, see the 
[General Usage](https://github.com/jospete/obsidize-rx-map/blob/master/tests/general-usage.spec.ts)
and [RxStore](https://github.com/jospete/obsidize-rx-map/blob/master/tests/rx-store.spec.ts)
test suites.

## API

Source documentation can be found [here](https://jospete.github.io/obsidize-rx-map/)