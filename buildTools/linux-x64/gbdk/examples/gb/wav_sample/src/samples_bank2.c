#pragma bank 2

#include <gbdk/platform.h>

#include "sample_player.h"
#include "sample_data_1.h"

void play_sample1(void) BANKED {
  set_sample(CURRENT_BANK, sample1, sizeof(sample1)); 
}
