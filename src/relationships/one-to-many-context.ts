import { castArray } from '../common/utility';

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

	public setForeignKeys(keys: ForeignKeyType[]): void {
		this.clear();
		castArray<ForeignKeyType>(keys).forEach(key => this.foreignKeySet.add(key));
	}
}