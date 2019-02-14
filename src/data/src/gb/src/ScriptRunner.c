#include "ScriptRunner.h"
#include "BankData.h"
#include "game.h"

UBYTE script_ptr_bank = 0;
UWORD script_ptr = 0;
UBYTE script_cmd_args[6] = {0};
UBYTE script_cmd_args_len;

SCRIPT_CMD script_cmds[] = {
    {script_cmd_end, 0},          // 0x00
    {script_cmd_line, 2},         // 0x01
    {script_cmd_goto, 2},         // 0x02
    {script_cmd_if_flag, 4},      // 0x03
    {script_noop, 0},             // 0x04
    {script_cmd_set_flag, 2},     // 0x05
    {script_cmd_clear_flag, 2},   // 0x06
    {script_cmd_actor_dir, 1},    // 0x07
    {script_cmd_active_actor, 1}, // 0x08
    {script_cmd_camera_move, 3},  // 0x09
    {script_cmd_camera_lock, 1},  // 0x0A
    {script_cmd_wait, 1},         // 0x0B
    {script_fade_out, 1},         // 0x0C
    {script_fade_in, 1},          // 0x0D
    {script_load_map, 6},         // 0x0E
    {script_cmd_actor_pos, 2},    // 0x0F
    {script_actor_move_to, 2},    // 0x10
    {script_cmd_show_sprites, 0}, // 0x11
    {script_cmd_hide_sprites, 0}, // 0x12
    {script_load_battle, 1},      // 0x13
    {script_cmd_show_player, 0},  // 0x14
    {script_cmd_hide_player, 0},  // 0x15
    {script_cmd_set_emotion, 2},  // 0x16
    {script_cmd_camera_shake, 1}, // 0x17
    {script_cmd_return_title, 0}  // 0x18
};

void ScriptStart(BANK_PTR *events_ptr)
{
  script_ptr_bank = events_ptr->bank;
  script_ptr = ((UWORD)bank_data_ptrs[script_ptr_bank]) + events_ptr->offset;
}

void ScriptRunnerUpdate()
{
  UBYTE i, script_cmd_index;
  SCRIPT_CMD_FN script_cmd_fn;

  if (!script_ptr_bank)
  {
    return;
  }

  script_cmd_index = ReadBankedUBYTE(script_ptr_bank, script_ptr);

  // LOG("SCRIPT CMD INDEX WAS %u not=%u, zero=%u\n", script_cmd_index, !script_cmd_index, script_cmd_index == 0);

  if (!script_cmd_index)
  {
    LOG("SCRIPT FINISHED\n");
    script_ptr_bank = 0;
    script_ptr = 0;
    return;
  }

  script_cmd_args_len = script_cmds[script_cmd_index].args_len;
  script_cmd_fn = script_cmds[script_cmd_index].fn;

  // script_arg1 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 1);
  // script_arg2 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 2);
  // script_arg3 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 4);

  LOG("SCRIPT cmd [%u - %u] = %u (%u)\n", script_ptr_bank, script_ptr, script_cmd_index, script_cmd_args_len);

  for (i = 0; i != script_cmd_args_len; i++)
  {
    script_cmd_args[i] = ReadBankedUBYTE(script_ptr_bank, script_ptr + i + 1);
    LOG("SCRIPT ARG-%u = %u\n", i, script_cmd_args[i]);
  }

  // SWITCH_ROM_MBC1(11);
  // script_cmd_fn();
  // last_fn = script_cmd_fn;

  script_ptr += 1 + script_cmd_args_len;

  if (script_continue)
  {
    LOG("CONTINUE!\n");
    ScriptRunnerUpdate();
  }
}
