/** @file gbdk/emu_debug.h

    Debug window logging and profiling support for emulators (BGB, Emulicious, etc).

    Also see the `emu_debug` example project included with gbdk.

    See the BGB Manual for more information
    ("expressions, breakpoint conditions, and debug messages")
    http://bgb.bircd.org/manual.html#expressions

*/

// Suppress SDCC "info 128" warnings that are a non-issue
#pragma disable_warning 218

#ifndef __GBDK_EMU_DEBUG_H_INCLUDE
#define __GBDK_EMU_DEBUG_H_INCLUDE

#include <types.h>

#if defined(__TARGET_gb) || defined(__TARGET_ap) || defined(__TARGET_sms) || defined(__TARGET_gg)

/** Macro to display a message in the emulator debug message window

    @param message_text  Quoted text string to display in the debug message window

    The following special parameters can be
    used when bracketed with "%" characters.
    \li CPU registers: AF, BC, DE, HL, SP, PC, B, C, D,
        E, H, L, A, ZERO, ZF, Z, CARRY, CY, IME, ALLREGS
    \li Other state values: ROMBANK, XRAMBANK, SRAMBANK,
        WRAMBANK, VRAMBANK, TOTALCLKS, LASTCLKS, CLKS2VBLANK

    Example: print a message along with the currently active ROM bank.
    \code{.c}
    EMU_MESSAGE("Current ROM Bank is: %ROMBANK%");
    \endcode


    See the BGB Manual for more information
    ("expressions, breakpoint conditions, and debug messages")
    http://bgb.bircd.org/manual.html#expressions

    @see EMU_PROFILE_BEGIN(), EMU_PROFILE_END()
 */
#define EMU_MESSAGE(message_text) EMU_MESSAGE1(EMU_MACRONAME(__LINE__), message_text)
#define BGB_MESSAGE(message_text) EMU_MESSAGE(message_text)

/// \cond DOXYGEN_DO_NOT_DOCUMENT
#define EMU_MACRONAME(A) EMU_MACRONAME1(A)
#define EMU_MACRONAME1(A) EMULOG##A

#define EMU_MESSAGE1(name, message_text) \
__asm \
.MACRO name msg_t, ?llbl \
  ld d, d \
  jr llbl \
  .dw 0x6464 \
  .dw 0x0000 \
  .ascii msg_t \
llbl: \
.ENDM \
name ^/message_text/ \
__endasm

#define EMU_MESSAGE_SUFFIX(message_text, message_suffix) EMU_MESSAGE3(EMU_MACRONAME(__LINE__), message_text, message_suffix)
#define EMU_MESSAGE3(name, message_text, message_suffix) \
__asm \
.MACRO name msg_t, msg_s, ?llbl \
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

/** Macro to __Start__ a profiling block for the emulator (BGB, Emulicious, etc)

    @param MSG  Quoted text string to display in the
                debug message window along with the result

    To complete the profiling block and print
    the result call @ref EMU_PROFILE_END.

    @see EMU_PROFILE_END(), EMU_MESSAGE()
 */
#define EMU_PROFILE_BEGIN(MSG) EMU_MESSAGE_SUFFIX(MSG, "%ZEROCLKS%");
#define BGB_PROFILE_BEGIN(MSG) EMU_PROFILE_BEGIN(MSG)
/** Macro to __End__ a profiling block and print the results in the emulator debug message window

    @param MSG  Quoted text string to display in the
                debug message window along with the result

    This should only be called after a previous call
    to @ref EMU_PROFILE_BEGIN()

    The results are in Emulator clock units, which are
    "1 nop in [CGB] doublespeed mode".

    So when running in Normal Speed mode (i.e. non-CGB doublespeed)
    the printed result should be __divided by 2__ to get the actual
    ellapsed cycle count.

    If running in CB Double Speed mode use the below call instead,
    it correctly compensates for the speed difference. In this
    scenario, the result does  __not need to be divided by 2__ to
    get the ellapsed cycle count.
    \code{.c}
    EMU_MESSAGE("NOP TIME: %-4+LASTCLKS%");
    \endcode

    @see EMU_PROFILE_BEGIN(), EMU_MESSAGE()
 */
#if defined(NINTENDO)
#define EMU_PROFILE_END(MSG) EMU_MESSAGE_SUFFIX(MSG,"%-8+LASTCLKS%");
#define BGB_PROFILE_END(MSG) EMU_PROFILE_END(MSG)
#elif defined(SEGA)
#define EMU_PROFILE_END(MSG) EMU_MESSAGE_SUFFIX(MSG,"%-16+LASTCLKS%");
#define BGB_PROFILE_END(MSG) EMU_PROFILE_END(MSG)
#endif

#define EMU_TEXT(MSG) EMU_MESSAGE(MSG)
#define BGB_TEXT(MSG) EMU_TEXT(MSG)

#if defined(NINTENDO)
/** Display preset debug information in the Emulator debug messages window.

    This function is equivalent to:
    \code{.c}
    EMU_MESSAGE("PROFILE,%(SP+$0)%,%(SP+$1)%,%A%,%TOTALCLKS%,%ROMBANK%,%WRAMBANK%");
    \endcode

*/
void EMU_profiler_message(void);
#define BGB_profiler_message EMU_profiler_message()
#endif // NINTENDO

/** Print the string and arguments given by format to the emulator debug message window

    @param format   The format string as per printf

    Does not return the number of characters printed.
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

    Currently supported in the Emulicious emulator
 */
void EMU_printf(const char *format, ...) PRESERVES_REGS(a, b, c);
#define BGB_printf(...) EMU_printf(__VA_ARGS__)

/** Print the string and arguments in the buffer buffer by the pointer given by format to the emulator debug message window

    @param format   The format string as per printf
    @param data     Buffer containing arguments, for example some struct

    @see EMU_printf for the format string description

    Currently supported in the Emulicious emulator
*/
void EMU_fmtbuf(const unsigned char * format, void * data) PRESERVES_REGS(a, b, c);

#ifdef NINTENDO
static void * __EMU_PROFILER_INIT = &EMU_profiler_message;
#endif // NINTENDO

/** The Emulator will break into debugger when encounters this line
 */
#define EMU_BREAKPOINT __asm__("ld b, b");
#define BGB_BREAKPOINT EMU_BREAKPOINT

#elif defined(__TARGET_duck)
  #error Not implemented yet
#else
  #error Unrecognized port
#endif

#endif
