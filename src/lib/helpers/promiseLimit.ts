const promiseLimit = async <T>(
  n: number,
  list: Array<() => Promise<T>>,
): Promise<T[]> => {
  const results: T[] = new Array(list.length);
  let nextIndex = 0;
  let active = 0;

  return new Promise<T[]>((resolve, reject) => {
    const runNext = () => {
      if (nextIndex >= list.length) {
        if (active === 0) resolve(results);
        return;
      }

      const current = nextIndex++;
      active++;

      list[current]()
        .then((value) => {
          results[current] = value;
          active--;
          runNext();
          if (active === 0 && nextIndex >= list.length) resolve(results);
        })
        .catch(reject);
    };

    if (list.length === 0) {
      resolve(results);
      return;
    }

    for (let i = 0; i < n && i < list.length; i++) {
      runNext();
    }
  });
};

export default promiseLimit;
