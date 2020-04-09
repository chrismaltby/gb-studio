#include "ASMHelpers.h"

#ifdef __EMSCRIPTEN__

void WaitForMode0Or1() {}

void SetTile(UINT16 r, UINT8 t) {
  UWORD i;
  UBYTE x;
  UBYTE y;

  if (r > 0x9C00) {
    i = r - 0x9C00;
    x = i % 32;
    y = i / 32;
    set_win_tiles((x), (y), 1, 1, &t);
  } else if (r > 0x9800) {
    i = r - 0x9800;
    x = i % 32;
    y = i / 32;
    set_bkg_tiles((x), (y), 1, 1, &t);
  }
}

#endif
