export interface Unsubscribable {
	unsubscribe(): void;
}

export class Subsink implements Unsubscribable {

	private readonly mSubscriptions: Set<Unsubscribable> = new Set();

	public static unsubscribeSafe(target: Unsubscribable): void {
		try { target.unsubscribe(); } catch { }
	}

	public unsubscribe(): void {
		this.mSubscriptions.forEach(Subsink.unsubscribeSafe);
		this.mSubscriptions.clear();
	}

	public addMany(targets: Unsubscribable[]): this {
		Array.from(targets).forEach(target => this.add(target));
		return this;
	}

	public setAll(targets: Unsubscribable[]): this {
		this.unsubscribe();
		return this.addMany(targets);
	}

	public add(...targets: Unsubscribable[]): this {
		return this.addMany(targets);
	}

	public set(...targets: Unsubscribable[]): this {
		return this.setAll(targets);
	}
}