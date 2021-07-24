/**
 * Simple cache container used to relate a single id to a set of foreign keys.
 * Allows for fast lookup times of one-to-many projections.
 */
export class OneToManyContext<PrimaryKeyType, ForeignKeyType> {

	public readonly foreignKeySet: Set<ForeignKeyType> = new Set();

	constructor(
		public readonly id: PrimaryKeyType
	) {
	}

	public clear(): void {
		this.foreignKeySet.clear();
	}

	public getForeignKeys(): ForeignKeyType[] {
		return Array.from(this.foreignKeySet);
	}
}