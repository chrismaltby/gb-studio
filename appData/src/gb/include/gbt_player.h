/*
 * GBT Player v2.1.3
 *
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2009-2020, Antonio Niño Díaz <antonio_nd@outlook.com>
 */

#ifndef _GBT_PLAYER_
#define _GBT_PLAYER_

#include <gb/gb.h>

// Plays the song pointed by data (pointer array to patterns) in given bank at
// given initial speed.
void gbt_play(void *data, UINT8 bank, UINT8 speed);

// Pauses or unpauses music.
// Parameter: 1 = un-pause/resume, 0 = pause
void gbt_pause(UINT8 pause);

// Stops music and turns off sound system. Called automatically when the last
// pattern ends and autoloop isn't activated.
void gbt_stop(void);

// Enables or disables autoloop
void gbt_loop(UINT8 loop);

// Updates player, should be called every frame.
// NOTE: This will change the active ROM bank to 1.
void gbt_update(void);

// Set enabled channels to prevent the player from using that channel.
// NOTE: If a channel is re-enabled, it can take some time to sound OK (until
// pan and volume are modified in the song). You should only disable unused
// channels or channels that don't change pan or volume.
void gbt_enable_channels(UINT8 channel_flags);

#define GBT_CHAN_1 (1<<0)
#define GBT_CHAN_2 (1<<1)
#define GBT_CHAN_3 (1<<2)
#define GBT_CHAN_4 (1<<3)

#endif //_GBT_PLAYER_
