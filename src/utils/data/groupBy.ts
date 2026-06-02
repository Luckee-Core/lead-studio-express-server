/**
 * Group array items by a key
 * 
 * @param items - Array to group
 * @param keyFn - Function to extract grouping key
 * @returns Map of key -> items
 * 
 * @example
 * const users = [{ id: 1, role: 'admin' }, { id: 2, role: 'user' }];
 * const byRole = groupBy(users, (u) => u.role);
 * // Map { 'admin' => [...], 'user' => [...] }
 */
export const groupBy = <T, K>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> => {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
};

