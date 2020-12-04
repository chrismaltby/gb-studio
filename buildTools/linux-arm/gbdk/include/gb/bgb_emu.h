/** @file gb/bgb_emu.h

    Debug window logging and profiling support for the BGB emulator.

    Also see the `bgb_debug` example project included with gbdk.

    See the BGB Manual for more information
    ("expressions, breakpoint conditions, and debug messages")
    http://bgb.bircd.org/manual.html#expressions

*/
#ifndef __BGB_EMU_INCLUDE
#define __BGB_EMU_INCLUDE

/// \cond DOXYGEN_DO_NOT_DOCUMENT
#define BGB_ADD_DOLLARD(A) BGB_ADD_DOLLARD1 (A)
#define BGB_ADD_DOLLARD1(A) A##00$
/// \endcond DOXYGEN_DO_NOT_DOCUMENT

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
#define BGB_MESSAGE(message_text) BGB_MESSAGE1(BGB_ADD_DOLLARD(__LINE__), message_text)
/// \cond DOXYGEN_DO_NOT_DOCUMENT
#define BGB_MESSAGE1(lbl, message_text) \
__asm \
  ld d, d \
  jr lbl \
  .dw 0x6464 \
  .dw 0x0000 \
  .ascii message_text \
lbl: \
__endasm

#define BGB_HASH #
#define BGB_ADD_HASH(x) x
#define BGB_MAKE_LABEL(a) BGB_ADD_HASH(BGB_HASH)a
/// \endcond DOXYGEN_DO_NOT_DOCUMENT

/** Macro to display a sprintf formatted message in the BGB emulator debug message window

    @param buf  Pointer to a globally defined char buffer
    @param ...  VA Args list of sprintf parameters

    To avoid buffer overflows __buf__ must be large
    enough to store the entire printed message.

    Example:
    \code{.c}
    char mybuf[100]; // should be globally defined

    BGB_MESSAGE_FMT(mybuf, "An integer:%d, a string: %s", 12345, "hello bgb")
    \endcode

    @see BGB_MESSAGE()
 */
#define BGB_MESSAGE_FMT(buf, ...) sprintf(buf, __VA_ARGS__);BGB_MESSAGE2(BGB_ADD_DOLLARD(__LINE__), BGB_MAKE_LABEL(_##buf));
/// \cond DOXYGEN_DO_NOT_DOCUMENT
#define BGB_MESSAGE2(lbl, buf) \
__asm \
  ld d, d \
  jr lbl \
  .dw 0x6464 \
  .dw 0x0001 \
  .dw buf \
  .dw 0 \
lbl: \
__endasm

#define BGB_STR(A) #A
#define BGB_CONCAT(A,B) BGB_STR(A:B)
/// \endcond DOXYGEN_DO_NOT_DOCUMENT

/** Macro to __Start__ a profiling block for the BGB emulator

    @param MSG  Quoted text string to display in the debug message window

    To complete the profiling block and print
    the result call @ref BGB_PROFILE_END.

    @see BGB_PROFILE_END(), BGB_MESSAGE()
 */
#define BGB_PROFILE_BEGIN(MSG) BGB_MESSAGE(BGB_CONCAT(MSG,%ZEROCLKS%));
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
#define BGB_PROFILE_END(MSG) BGB_MESSAGE(BGB_CONCAT(MSG,%-8+LASTCLKS%));
#define BGB_TEXT(MSG) BGB_MESSAGE(BGB_STR(MSG))

/** Display preset debug information in the BGB debug messages window.

    This function is equivalent to:
    \code{.c}
    BGB_MESSAGE("PROFILE,%(SP+$0)%,%(SP+$1)%,%A%,%TOTALCLKS%,%ROMBANK%,%WRAMBANK%");
    \endcode

*/
void BGB_profiler_message();

static void * __BGB_PROFILER_INIT = &BGB_profiler_message;

#endif