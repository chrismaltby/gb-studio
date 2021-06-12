import { useEffect, useState } from "react";

type NamedObject = { name: string };

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: NamedObject, b: NamedObject) => {
  return collator.compare(a.name, b.name);
};

const useSorted = <T extends NamedObject>(input: T[]) => {
  const [values, setValues] = useState<T[]>(input);

  useEffect(() => {
    setValues([...input].sort(sortByName));
  }, [input]);

  return values;
};

export default useSorted;
