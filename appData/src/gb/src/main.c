#include "core.h"

void core_reset_hook(void) {
    core_reset();
}

void main(void) {
    core_run();
}
