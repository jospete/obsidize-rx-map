/**
 * Utility for masking RxMap iterators, so that 
 * the underlying map values cannot be mutated while using them.
 */
export class ProxyIterableIterator<T, R> implements IterableIterator<R> {

	constructor(
		private readonly source: Iterator<T>,
		private readonly transform: (value: T) => R
	) {
	}

	public [Symbol.iterator](): IterableIterator<R> {
		return this;
	}

	public next(): IteratorResult<R> {
		const { value, done } = this.source.next();
		return {
			value: this.transform(value),
			done
		};
	}
}