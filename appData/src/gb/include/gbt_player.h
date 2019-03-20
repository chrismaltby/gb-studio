/*
*        --------------------------------------------------------------
*        ---                                                        ---
*        ---                                                        ---
*        ---                       GBT PLAYER  v2.1.1               ---
*        ---                                                        ---
*        ---                                                        ---
*        ---              Copyright (C) 2009-2015 Antonio Niño Díaz ---
*        ---                      All rights reserved.              ---
*        --------------------------------------------------------------
*
*                                          antonio_nd@outlook.com
*/

#ifndef _GBT_PLAYER_
#define _GBT_PLAYER_

#include <gb/gb.h>

//plays the song pointed by data (pointer array to patterns) in given bank at initial given speed
void gbt_play(void * data, UINT8 bank, UINT8 speed);

//pauses/unpauses music.
void gbt_pause(UINT8 pause);

//stops music and turns off sound system. Called automatically when ends last pattern and loop
//isn't activated.
void gbt_stop(void);

//enables/disables looping
void gbt_loop(UINT8 loop);

//updates player. should be called every frame.
//THIS WILL CHANGE TO BANK 1!!!
void gbt_update(void);

#define GBT_CHAN_1 (1<<0)
#define GBT_CHAN_2 (1<<1)
#define GBT_CHAN_3 (1<<2)
#define GBT_CHAN_4 (1<<3)
//Set enabled channels to prevent the player from using that channel. If you re-enable a 
//channel, it could need some time to sound OK (until pan and volume are modified in the song).
//You should only disable unused channels or channels that don't change pan or volume.
void gbt_enable_channels(UINT8 channel_flags);

#endif //_GBT_PLAYER_

