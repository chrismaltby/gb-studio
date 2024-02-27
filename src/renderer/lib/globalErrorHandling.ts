window.addEventListener("error", (error) => {
  if (error.message.indexOf("dead code elimination") > -1) {
    return true;
  }
  error.stopPropagation();
  error.preventDefault();
  document.body.innerHTML = `<div class="GlobalError">
      <div class="GlobalError__Content">
        <h2>${error.message}</h2>
        <p>
          ${error.filename}L:${error.lineno}C:${error.colno}
        </p>     
        <div class="GlobalError__StackTrace">
          ${
            error.error &&
            error.error.stack &&
            error.error.stack
              .split("\n")
              .map((line: string) => `<div>${line}</div>`)
              .join("")
          }
        </div>
      </div>       
      </div>
    </div>`;
  return false;
});

window.addEventListener("unhandledrejection", (error) => {
  error.stopPropagation();
  error.preventDefault();
  console.log(error);
  document.body.innerHTML = `<div class="GlobalError">
        <div class="GlobalError__Content">
          <h2>Unhandled Promise Rejection</h2>
          <p></p>
          <div class="GlobalError__StackTrace">
          ${
            error.reason &&
            error.reason.stack &&
            error.reason.stack
              .split("\n")
              .map((line: string) => `<div>${line}</div>`)
              .join("")
          }
        </div>          
        </div>       
        </div>
      </div>`;
  return false;
});

export default window;
