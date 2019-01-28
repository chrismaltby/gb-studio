function walkScript(script = [], callback) {
  for (let i = 0; i < script.length; i++) {
    callback(script[i]);
    if (script[i].true) {
      walkScript(script[i].true, callback);
    }
    if (script[i].false) {
      walkScript(script[i].false, callback);
    }
  }
}

export default walkScript;
