/** @file gb/bgb_emu.h

    Debug window logging and profiling support for the BGB emulator.

    Also see the `bgb_debug` example project included with gbdk.

    See the BGB Manual for more information
    ("expressions, breakpoint conditions, and debug messages")
    http://bgb.bircd.org/manual.html#expressions

*/
#ifndef __BGB_EMU_INCLUDE
#define __BGB_EMU_INCLUDE

#include <types.h>

/** Macro to display a message in the BGB emulator debug message window

    @param message_text  Quoted text string to display in the debug message window

    The following special parameters can be
    used when bracketed with "%" characters.
    \li CPU registers: AF, BC, DE, HL, SP, PC, B, C, D,
        E, H, L, A, ZERO, ZF, Z, CARRY, CY, IME, ALLREGS
    \li Other state values: ROMBANK, XRAMBANK, SRAMBANK,
        WRAMBANK, VRAMBANK, TOTALCLKS, LASTCLKS, CLKS2VBLANK

    Example: print a message along with the currently active ROM bank.
    \code{.c}
    BGB_MESSAGE("Current ROM Bank is: %ROMBANK%");
    \endcode


    See the BGB Manual for more information
    ("expressions, breakpoint conditions, and debug messages")
    http://bgb.bircd.org/manual.html#expressions

    @see BGB_PROFILE_BEGIN(), BGB_PROFILE_END()
 */
#define BGB_MESSAGE(message_text) BGB_MESSAGE1(BGB_MACRONAME(__LINE__), message_text)
/// \cond DOXYGEN_DO_NOT_DOCUMENT
#define BGB_MACRONAME(A) BGB_MACRONAME1(A)
#define BGB_MACRONAME1(A) BGBLOG##A

#define BGB_MESSAGE1(name, message_text) \
__asm \
.MACRO name msg_t, ?llbl\
  ld d, d \
  jr llbl \
  .dw 0x6464 \
  .dw 0x0000 \
  .ascii msg_t \
llbl: \
.ENDM \
name ^/message_text/ \
__endasm

#define BGB_MESSAGE_SUFFIX(message_text, message_suffix) BGB_MESSAGE3(BGB_MACRONAME(__LINE__), message_text, message_suffix)
#define BGB_MESSAGE3(name, message_text, message_suffix) \
__asm \
.MACRO name msg_t, msg_s, ?llbl\
  ld d, d \
  jr llbl \
  .dw 0x6464 \
  .dw 0x0000 \
  .ascii msg_t \
  .ascii msg_s \
llbl: \
.ENDM \
name ^/message_text/, ^/message_suffix/ \
__endasm
/// \endcond DOXYGEN_DO_NOT_DOCUMENT

/** Macro to __Start__ a profiling block for the BGB emulator

    @param MSG  Quoted text string to display in the
                debug message window along with the result

    To complete the profiling block and print
    the result call @ref BGB_PROFILE_END.

    @see BGB_PROFILE_END(), BGB_MESSAGE()
 */
#define BGB_PROFILE_BEGIN(MSG) BGB_MESSAGE_SUFFIX(MSG, "%ZEROCLKS%");
/** Macro to __End__ a profiling block and print the results in the BGB  emulator debug message window

    @param MSG  Quoted text string to display in the
                debug message window along with the result

    This should only be called after a previous call
    to @ref BGB_PROFILE_BEGIN()

    The results are in BGB clock units, which are
    "1 nop in [CGB] doublespeed mode".

    So when running in Normal Speed mode (i.e. non-CGB doublespeed)
    the printed result should be __divided by 2__ to get the actual
    ellapsed cycle count.

    If running in CB Double Speed mode use the below call instead,
    it correctly compensates for the speed difference. In this
    scenario, the result does  __not need to be divided by 2__ to
    get the ellapsed cycle count.
    \code{.c}
    BGB_MESSAGE("NOP TIME: %-4+LASTCLKS%");
    \endcode

    @see BGB_PROFILE_BEGIN(), BGB_MESSAGE()
 */
#define BGB_PROFILE_END(MSG) BGB_MESSAGE_SUFFIX(MSG,"%-8+LASTCLKS%");
#define BGB_TEXT(MSG) BGB_MESSAGE(MSG)

/** Display preset debug information in the BGB debug messages window.

    This function is equivalent to:
    \code{.c}
    BGB_MESSAGE("PROFILE,%(SP+$0)%,%(SP+$1)%,%A%,%TOTALCLKS%,%ROMBANK%,%WRAMBANK%");
    \endcode

*/
void BGB_profiler_message();

/** Print the string and arguments given by format to the BGB emulator debug message window

    @param format   The format string as per printf

    Does not return the number of characters printed.
	Result string MUST BE LESS OR EQUAL THAN 128 BYTES LONG, INCLUDING THE TRAILIG ZERO BYTE!

    Currently supported:
    \li \%hx (char as hex)
    \li \%hu (unsigned char)
    \li \%hd (signed char)
    \li \%c (character)
    \li \%u (unsigned int)
    \li \%d (signed int)
    \li \%x (unsigned int as hex)
    \li \%s (string)

    Warning: to correctly pass chars for printing as chars, they *must*
    be explicitly re-cast as such when calling the function.
    See @ref docs_chars_varargs for more details.
 */
void BGB_printf(const char *format, ...) OLDCALL;

static void * __BGB_PROFILER_INIT = &BGB_profiler_message;

/** BGB will break into debugger when encounters this line
 */
#define BGB_BREAKPOINT __asm__("ld b, b");

#endif