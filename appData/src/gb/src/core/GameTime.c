#include "GameTime.h"
#include "ScriptRunner.h"

UBYTE wait_time = 0;

void HandleScriptWait() {
  // Handle Wait - @todo handle this outside scene?
  if (wait_time != 0) {
    wait_time--;
    if (wait_time == 0) {
      script_action_complete = TRUE;
    }
  }
}
