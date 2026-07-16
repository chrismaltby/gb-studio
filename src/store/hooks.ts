import { shallowEqual, useDispatch, useSelector, useStore } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./configureStore";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore = useStore<RootState>;

const pickObject = <T extends object, const K extends readonly (keyof T)[]>(
  value: T,
  keys: K,
): Pick<T, K[number]> => {
  const result = {} as Pick<T, K[number]>;

  keys.forEach((key) => {
    result[key] = value[key];
  });

  return result;
};

export const shallowEqualArray = <T>(a: readonly T[], b: readonly T[]) =>
  a.length === b.length &&
  a.every((item, index) => shallowEqual(item, b[index]));

type AppSelector<T> = (state: RootState) => T;

export const useAppSelectorPick = <
  TSelector extends (...args: never[]) => object | undefined | null,
  const K extends readonly (keyof NonNullable<ReturnType<TSelector>>)[],
>(
  selector: TSelector & AppSelector<ReturnType<TSelector>>,
  keys: K,
): Pick<NonNullable<ReturnType<TSelector>>, K[number]> | undefined => {
  return useAppSelector((state) => {
    const value = selector(state);

    if (value == null) {
      return undefined;
    }

    return pickObject(value, keys);
  }, shallowEqual);
};

export const useAppSelectorPickArray = <
  TSelector extends (...args: never[]) => readonly object[],
  const K extends readonly (keyof ReturnType<TSelector>[number])[],
>(
  selector: TSelector & AppSelector<ReturnType<TSelector>>,
  keys: K,
): Pick<ReturnType<TSelector>[number], K[number]>[] => {
  return useAppSelector(
    (state) =>
      selector(state).map((value: ReturnType<TSelector>[number]) =>
        pickObject(value, keys),
      ),
    shallowEqualArray,
  );
};

export function useAppSelectorMapArray<
  TSelector extends (...args: never[]) => readonly object[],
  const K extends keyof ReturnType<TSelector>[number],
>(
  selector: TSelector & AppSelector<ReturnType<TSelector>>,
  key: K,
): ReturnType<TSelector>[number][K][];
export function useAppSelectorMapArray<
  TSelector extends (...args: never[]) => readonly unknown[],
  TResult,
>(
  selector: TSelector & AppSelector<ReturnType<TSelector>>,
  mapper: (value: ReturnType<TSelector>[number]) => TResult,
): TResult[];
export function useAppSelectorMapArray(
  selector: AppSelector<readonly unknown[]>,
  keyOrMapper: PropertyKey | ((value: unknown) => unknown),
): unknown[] {
  return useAppSelector((state) => {
    const values = selector(state);

    if (typeof keyOrMapper === "function") {
      return values.map(keyOrMapper);
    }

    return values.map(
      (value) => (value as Record<PropertyKey, unknown>)[keyOrMapper],
    );
  }, shallowEqualArray);
}
