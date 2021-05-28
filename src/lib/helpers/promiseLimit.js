function promiseLimit(n, list) {
  const tail = list.splice(n);
  const head = list;
  const resolved = [];
  let processed = 0;
  return new Promise((resolve) => {
    if (list.length === 0) {
      return resolve([]);
    }
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
    head.forEach((x) => {
      const res = x();
      resolved.push(res);
      res.then((y) => {
        runNext();
        return y;
      });
    });
  });
}

export default promiseLimit;
