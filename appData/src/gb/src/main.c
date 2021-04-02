#include "core.h"

void core_reset_hook() {
    core_reset();
}

void main() {
    core_run();
}
