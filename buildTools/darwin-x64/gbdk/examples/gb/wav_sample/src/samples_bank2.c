#pragma bank 2

#include <gb/gb.h>

#include "sample_player.h"
#include "sample_data_1.h"

void play_sample1() __banked {
  set_sample(_current_bank, sample1, sizeof(sample1)); 
}
