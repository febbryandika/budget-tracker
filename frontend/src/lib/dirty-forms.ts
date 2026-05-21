const predicates = new Set<() => boolean>()

export function registerDirty(predicate: () => boolean): () => void {
  predicates.add(predicate)
  return () => {
    predicates.delete(predicate)
  }
}

export function anyDirty(): boolean {
  for (const predicate of predicates) {
    if (predicate()) return true
  }
  return false
}
