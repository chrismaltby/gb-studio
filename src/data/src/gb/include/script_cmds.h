#ifndef SCRIPT_CMDS_H
#define SCRIPT_CMDS_H

#include "game.h"

void script_cmd_line();
void script_cmd_end();
void script_cmd_goto();
void script_cmd_if_flag();
void script_cmd_unless_flag();
void script_cmd_set_flag();
void script_cmd_clear_flag();
void script_cmd_actor_dir();
void script_cmd_active_actor();
void script_cmd_camera_move();
void script_cmd_camera_lock();
void script_cmd_wait();
void script_fade_out();
void script_fade_in();
void script_load_map();
void script_cmd_actor_pos();
void script_actor_move_to();
void script_cmd_show_sprites();
void script_cmd_hide_sprites();
void script_load_battle();
void script_cmd_show_player();
void script_cmd_hide_player();
void script_cmd_set_emotion();
void script_cmd_camera_shake();
void script_cmd_return_title();

#endif
