#include "MusicManager.h"
#include "BankManager.h"
#include "gbt_player.h"
#include "data_ptrs.h"
#include "BankData.h"

#define MAX_MUSIC 255

UBYTE current_index = MAX_MUSIC;

void MusicPlay(UBYTE index, UBYTE loop, UBYTE return_bank)
{
  UBYTE music_bank;
  UWORD music_track;

  if (index != current_index)
  {
    current_index = index;
    music_bank = ReadBankedUBYTE(16, &music_banks[index]);
    music_track = music_tracks[index];

    PUSH_BANK(return_bank);
    gbt_play(music_track, music_bank, 7);
    gbt_loop(loop);

    POP_BANK;
  }
}

void MusicStop(UBYTE return_bank)
{
  PUSH_BANK(return_bank);
  gbt_stop();
  current_index = MAX_MUSIC;
  POP_BANK;
}
