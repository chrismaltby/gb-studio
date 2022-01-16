function bindResize() {
  let canvas = document.getElementById("mainCanvas");
  let gameRatio = 160 / 144;

  function onResize() {
    let windowRatio = window.innerWidth / window.innerHeight;
    if (windowRatio < gameRatio) {
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = "auto";
    } else {
      canvas.style.height = window.innerHeight + "px";
      canvas.style.width = "auto";
    }
  }

  window.addEventListener("resize", onResize);
  onResize();
}

bindResize();
