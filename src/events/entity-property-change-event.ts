/**
 * Metadata for a single property change on an entity object.
 */
export interface EntityPropertyChangeEvent<K, V> {
	entityId: K;
	currentValue?: V;
	previousValue?: V;
}