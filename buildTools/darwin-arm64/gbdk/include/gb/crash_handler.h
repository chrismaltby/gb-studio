/** @file gb/crash_handler.h

    When crash_handler.h is included, a crash dump screen
    will be displayed if the CPU executes uninitalized
    memory (with a value of 0xFF, the opcode for RST 38).
    A handler is installed for RST 38 that calls
    @ref __HandleCrash().

    \code{.c}
    #include <gb/crash_handler.h>
    \endcode

    Also see the `crash` example project included with gbdk.
*/
#ifndef __CRASH_HANDLER_INCLUDE
#define __CRASH_HANDLER_INCLUDE

/** Display the crash dump screen.

    See the intro for this file for more details.
*/
void __HandleCrash(void);
static void * __CRASH_HANDLER_INIT = &__HandleCrash;

#endif