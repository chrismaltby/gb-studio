function handleFirstTab(e) {
  if (e.keyCode === 9) {
    document.body.classList.add("user-is-tabbing");

    window.removeEventListener("keydown", handleFirstTab);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    window.addEventListener("mousedown", handleMouseDownOnce);
  }
}

function handleMouseDownOnce() {
  document.body.classList.remove("user-is-tabbing");

  window.removeEventListener("mousedown", handleMouseDownOnce);
  window.addEventListener("keydown", handleFirstTab);
}

window.addEventListener("keydown", handleFirstTab);
