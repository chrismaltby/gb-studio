#pragma bank 3

#include <gbdk/platform.h>

#include "sample_player.h"
#include "sample_data_2.h"

void play_sample2(void) BANKED {
  set_sample(CURRENT_BANK, sample2, sizeof(sample2)); 
}
