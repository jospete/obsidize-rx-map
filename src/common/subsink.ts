/**
 * Alias for standard rxjs Unsubscribable entities.
 * Re-defined here to keep this implementation as isolated as possible.
 */
export interface Unsubscribable {
	unsubscribe(): void;
}

/**
 * Simple subscription aggregator.
 * This is needed to prevent unwarrented rxjs exceptions when attempting to mass-unsubscribe.
 */
export class Subsink implements Unsubscribable {

	private readonly mSubscriptions: Set<Unsubscribable> = new Set();

	public static unsubscribeSafe(target: Unsubscribable): void {
		try { target.unsubscribe(); } catch { }
	}

	public add(...targets: Unsubscribable[]): this {
		return this.addMany(targets);
	}

	public set(...targets: Unsubscribable[]): this {
		return this.setAll(targets);
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
}