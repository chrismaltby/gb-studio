const open = require("open");
window.open = open;

window.openUrl = function(url) {
  open(url);
  return false;
};
