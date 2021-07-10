export class ProxyIterableIterator<T, R> implements IterableIterator<R> {

	constructor(
		private readonly source: Iterator<T>,
		private readonly transform: (value: T) => R
	) {
	}

	public [Symbol.iterator](): IterableIterator<R> {
		return this;
	}

	next(): IteratorResult<R> {
		const { value, done } = this.source.next();
		return {
			value: this.transform(value),
			done
		};
	}
}

export class MonoProxyIterableIterator<T> extends ProxyIterableIterator<T, T> {
}