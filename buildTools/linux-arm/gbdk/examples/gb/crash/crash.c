#include <gb/crash_handler.h>

typedef void (*somefunc_t)(void);

void main() {
    ((somefunc_t)0x3000)(); // call something in the middle of nowhere
}