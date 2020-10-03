#ifndef __BGB_EMU_INCLUDE
#define __BGB_EMU_INCLUDE

#define BGB_ADD_DOLLARD(A) BGB_ADD_DOLLARD1 (A)
#define BGB_ADD_DOLLARD1(A) A##00$
#define BGB_MESSAGE(message_text) BGB_MESSAGE1(BGB_ADD_DOLLARD(__LINE__), message_text)
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

#define BGB_MESSAGE_FMT(buf, ...) sprintf(buf, __VA_ARGS__);BGB_MESSAGE2(BGB_ADD_DOLLARD(__LINE__), BGB_MAKE_LABEL(_##buf));
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
#define BGB_PROFILE_BEGIN(MSG) BGB_MESSAGE(BGB_CONCAT(MSG,%ZEROCLKS%));
#define BGB_PROFILE_END(MSG) BGB_MESSAGE(BGB_CONCAT(MSG,%-8+LASTCLKS%));
#define BGB_TEXT(MSG) BGB_MESSAGE(BGB_STR(MSG))


void BGB_profiler_message();

static void * __BGB_PROFILER_INIT = &BGB_profiler_message;

#endif