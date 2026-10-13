/** Lookup table from a content list, keyed by each entry's id. */
export function byId<T extends { id: PropertyKey }>(items: readonly T[]): Record<T['id'], T> {
  return Object.fromEntries(items.map((item) => [item.id, item])) as Record<T['id'], T>;
}
