#include "MusicManager.h"
#include "BankManager.h"
#include "gbt_player.h"
#include "data_ptrs.h"

void MusicPlay(UBYTE index, UBYTE loop, UBYTE return_bank)
{
  PUSH_BANK(return_bank);
  gbt_play(music_tracks[index], music_banks[index], 7);
  gbt_loop(loop);
  POP_BANK;
}

void MusicStop(UBYTE return_bank)
{
  PUSH_BANK(return_bank);
  gbt_stop();
  POP_BANK;
}
