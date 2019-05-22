const open = require("open");

window.open = open;

window.openUrl = url => {
  open(url);
  return false;
};
