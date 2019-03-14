#include "MusicManager.h"
#include "BankManager.h"
#include "gbt_player.h"
#include "data_ptrs.h"
#include "BankData.h"

void MusicPlay(UBYTE index, UBYTE loop, UBYTE return_bank)
{
  UBYTE music_bank = ReadBankedUBYTE(16, &music_banks[index]);

  PUSH_BANK(return_bank);
  gbt_play(music_tracks[index], music_bank, 7);
  gbt_loop(loop);

  POP_BANK;
}

void MusicStop(UBYTE return_bank)
{
  PUSH_BANK(return_bank);
  gbt_stop();
  POP_BANK;
}
