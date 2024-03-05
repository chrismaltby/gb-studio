const promiseLimit = <T>(
  n: number,
  list: (() => Promise<T>)[]
): Promise<T[]> => {
  const tail = list.splice(n);
  const head = list;
  const resolved: Promise<T>[] = [];
  let processed = 0;
  return new Promise((resolve) => {
    if (list.length === 0) {
      return resolve([]);
    }
    head.forEach((x) => {
      const res = x();
      resolved.push(res);
      res.then((y) => {
        runNext();
        return y;
      });
    });
    function runNext() {
      if (processed === tail.length) {
        resolve(Promise.all(resolved));
      } else {
        resolved.push(
          tail[processed]().then((x) => {
            runNext();
            return x;
          })
        );
        processed++;
      }
    }
  });
};

export default promiseLimit;
