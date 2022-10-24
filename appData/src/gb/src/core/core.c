#pragma bank 255

#include <gb/gb.h>
#ifdef SGB
    #include <gb/sgb.h>
#endif

#include <string.h>
#include <rand.h>

#include "system.h"
#include "interrupts.h"
#include "bankdata.h"
#include "game_time.h"
#include "actor.h"
#include "projectiles.h"
#include "camera.h"
#include "linked_list.h"
#include "ui.h"
#include "input.h"
#include "events.h"
#include "data_manager.h"
#include "music_manager.h"
#include "fade_manager.h"
#include "scroll.h"
#include "vm.h"
#include "vm_exceptions.h"
#include "states_caller.h"
#include "load_save.h"
#include "sio.h"
#ifdef SGB
    #include "sgb_border.h"
    #include "data/border.h"
#endif
#include "palette.h"
#include "parallax.h"
#include "shadow.h"
#include "data/data_bootstrap.h"

extern void __bank_bootstrap_script;
extern const UBYTE bootstrap_script[];

extern void core_reset_hook(); 

void core_reset() BANKED {
    // cleanup core stuff
    SIO_init();
    input_init();
    load_init();
    music_init_driver();
    parallax_init();
    scroll_init();
    fade_init();
    camera_init();
    actors_init();
    ui_init();
    events_init(FALSE);
    timers_init(FALSE);
    music_init_events(FALSE);
}

void process_VM() {
    while (TRUE) {
        switch (script_runner_update()) {
            case RUNNER_DONE:
            case RUNNER_IDLE: {                
                input_update();
                if (INPUT_SOFT_RESTART) {
                    // kill all threads and clear VM memory 
                    script_runner_init(TRUE);
                    // execute bootstrap script              
                    script_execute(BANK(bootstrap_script), bootstrap_script, 0, 0);
                    break;
                }
                if (!VM_ISLOCKED()) {
                    if (joy != 0) events_update();                      // update joypad events (must be the first)
                    state_update();                                     // update current scene, depending on its type
                    if ((game_time & 0x0F) == 0x00) timers_update();    // update timers
                    music_events_update();                              // update music events
                }

                toggle_shadow_OAM();                

                camera_update();
                scroll_update();
                actors_update();
                projectiles_update();                                   // update and render projectiles

                ui_update();
                actors_handle_player_collision();

                game_time++;

                activate_shadow_OAM();

                wait_vbl_done();
                break;
            }
            case RUNNER_BUSY: break;
            case RUNNER_EXCEPTION: {
                UBYTE fade_in = TRUE;
                switch (vm_exception_code) {
                    case EXCEPTION_RESET: {
                        // remove previous LCD ISR's
                        remove_LCD_ISRs();
                        // reset everything
                        core_reset_hook();
                        // kill all threads, but don't clear VM memory
                        script_runner_init(FALSE);
                        // load start scene
                        fade_in = !(load_scene(start_scene.ptr, start_scene.bank, TRUE));
                        // load initial player
                        load_player();
                        break;
                    }
                    case EXCEPTION_CHANGE_SCENE: {
                        // remove previous LCD ISR's
                        remove_LCD_ISRs();
                        // kill all threads, but don't clear variables 
                        script_runner_init(FALSE);
                        // reset timers on scene change
                        timers_init(FALSE);
                        // reset input events on scene change
                        events_init(FALSE);
                        // reset music events
                        music_init_events(FALSE);
                        // load scene
                        far_ptr_t scene;
                        ReadBankedFarPtr(&scene, vm_exception_params_offset, vm_exception_params_bank);
                        fade_in = !(load_scene(scene.ptr, scene.bank, TRUE));
                        break;
                    }
                    case EXCEPTION_SAVE: {
                        data_save(ReadBankedUBYTE(vm_exception_params_offset, vm_exception_params_bank));
                        continue;
                    }
                    case EXCEPTION_LOAD: {
                        fade_out_modal();
                        // remove previous LCD ISR's
                        remove_LCD_ISRs();
                        // load game state from SRAM
                        vm_loaded_state = data_load(ReadBankedUBYTE(vm_exception_params_offset, vm_exception_params_bank));
                        fade_in = !(load_scene(current_scene.ptr, current_scene.bank, FALSE));
                        break;
                    }
                    default: {
                        // nothing: suppress any unknown exception
                        continue;
                    }
                }

                CRITICAL {
                    switch (scene_LCD_type) {
                        case LCD_parallax: 
                            add_LCD(parallax_LCD_isr);
                            break;
                        case LCD_fullscreen:
                            add_LCD(fullscreen_LCD_isr);
                            break;
                        default:
                            add_LCD(simple_LCD_isr);
                            break;
                    }
                    LYC_REG = 0u;
                }
                if (!hide_sprites) SHOW_SPRITES;    // show sprites back if we switched LCD ISR while sprites were hidden 

                player_init();
                state_init();
                toggle_shadow_OAM();
                camera_update();
                scroll_repaint();
                actors_update();

                activate_shadow_OAM();

                if (fade_in) fade_in_modal();
            }
        }
    }
}

void core_run() BANKED {
#ifdef SGB
    for (UBYTE i = 4; i != 0; i--) wait_vbl_done(); // this delay is required for PAL SNES
    _is_SGB = sgb_check();
    if (_is_SGB) set_sgb_border(SGB_border_chr, SIZE(SGB_border_chr), BANK(SGB_border_chr),
                                SGB_border_map, SIZE(SGB_border_map), BANK(SGB_border_map), 
                                SGB_border_pal, SIZE(SGB_border_pal), BANK(SGB_border_pal));
    // both CGB + SGB modes at once are not supported
    _is_CGB = ((!_is_SGB) && (_cpu == CGB_TYPE) && (*(UBYTE *)0x0143 & 0x80));
#else
    _is_SGB = FALSE;
    _is_CGB = ((_cpu == CGB_TYPE) && (*(UBYTE *)0x0143 & 0x80));
#endif
    // GBA features only available together with CGB
    _is_GBA = (_is_GBA && _is_CGB);

#ifdef CGB
    if (_is_CGB) cpu_fast();
#endif

    memset(shadow_OAM2, 0, sizeof(shadow_OAM2));

    data_init();

    display_off();
    palette_init();

    LCDC_REG = LCDCF_OFF | LCDCF_WIN9C00 | LCDCF_WINON | LCDCF_BG8800 | LCDCF_BG9800 | LCDCF_OBJ16 | LCDCF_OBJON | LCDCF_BGON;

    WX_REG = MINWNDPOSX;
    WY_REG = MENU_CLOSED_Y;

    initrand(DIV_REG);

    // reset everything (before init interrupts below!)
    core_reset_hook();
    // kill all threads and clear VM memory
    script_runner_init(TRUE);

    CRITICAL {
        parallax_row = parallax_rows;
        LYC_REG = 0u;

        add_VBL(VBL_isr);
        STAT_REG |= STATF_LYC; 

        music_setup_timer();
        IE_REG |= (TIM_IFLAG | LCD_IFLAG | SIO_IFLAG);
    }
    DISPLAY_ON;

    // execute bootstrap script that just raises RESET exception
    script_execute(BANK(bootstrap_script), bootstrap_script, 0, 0);

    // execute VM
    process_VM();
}
