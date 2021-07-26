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

See the [General Usage](https://github.com/jospete/obsidize-rx-map/blob/master/tests/general-usage.spec.ts)
and [RxStore](https://github.com/jospete/obsidize-rx-map/blob/master/tests/rx-store.spec.ts)
test suites to get a feel for how to use this module.

## API

Source documentation can be found [here](https://jospete.github.io/obsidize-rx-map/)