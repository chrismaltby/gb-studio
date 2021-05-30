/* KeysMatching<T, V>
 *
 * Find all keys in T which have the type V
 * e.g. KeysMatching<Actor, boolean> to return "animate" | "isPinned"
 */
export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];
