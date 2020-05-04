#include "MusicManager.h"

#include "BankData.h"
#include "BankManager.h"
#include "data_ptrs.h"
#include "gbt_player.h"

#define MAX_MUSIC 255

UBYTE current_index = MAX_MUSIC;

void MusicPlay(UBYTE index, UBYTE loop, UBYTE return_bank) {
  UBYTE music_bank;

  if (index != current_index) {
    current_index = index;
    music_bank = ReadBankedUBYTE(DATA_PTRS_BANK, &music_banks[index]);

    PUSH_BANK(return_bank);
#ifndef __EMSCRIPTEN__
    PUSH_BANK(DATA_PTRS_BANK);
    gbt_play(music_tracks[index], music_bank, 7);
    gbt_loop(loop);
    POP_BANK;
#endif
    POP_BANK;
  }
}

void MusicStop(UBYTE return_bank) {
  PUSH_BANK(return_bank);
#ifndef __EMSCRIPTEN__
  gbt_stop();
#endif
  current_index = MAX_MUSIC;
  POP_BANK;
}

void MusicUpdate() {
#ifndef __EMSCRIPTEN__
  gbt_update();
#endif
  REFRESH_BANK;
}
