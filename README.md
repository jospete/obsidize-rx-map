# @obsidize/rx-map

This is intended to be a very, _very_ light-weight entity storage management system that slightly resembles parts of [@ngrx/entity](https://ngrx.io/api/entity).

The idea here is that the most useful part of ngrx is the store itself, and being able to watch for "single source of truth" entity changes from anywhere.
However, ngrx completely undermines this useful feature by adding a million different constructs in the way of just publishing to something that is effectively _just a map of values_. (See: actions, reducers, effects, effects of effects, actions for effects of effects, etc...)

The mantra of this module is simple:

1. download some data from _somewhere_
2. put it in an ```RxMap``` or ```RxEntityMap``` instance
3. watch for changes on the exposed "changes" observable and render changes to the UI (or react to them in some other service(s))

What we lose in action publishing and redux "state history" features, we gain in immense reduction of boilerplate and a much easier syntax to pick up on.

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

