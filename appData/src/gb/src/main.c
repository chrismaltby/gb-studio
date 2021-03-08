#include <gb/gb.h>
#include <string.h>
#include <rand.h>

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
#ifdef SGB
    #include "sgb_border.h"
    #include "data/border.h"
#endif
#ifdef CGB
    #include "palette.h"
#endif
#include "parallax.h"
#include "shadow.h"
#include "data/data_bootstrap.h"

extern void __bank_bootstrap_script;
extern const UBYTE bootstrap_script[];

void engine_reset() {
    // cleanup core stuff
    sound_init();
    parallax_init();
    scroll_reset();
    fade_init();
    actors_init();
    ui_init();
    events_init(FALSE);
    timers_init(FALSE);
    music_init(FALSE);
    // kill all threads, clear VM memory
    script_runner_init(TRUE);
}

void process_VM() {
    while (TRUE) {
        switch (script_runner_update()) {
            case RUNNER_DONE:
            case RUNNER_IDLE: {                
                input_update();
                if (INPUT_SOFT_RESTART) {
                    // kill all threads (in case something is wrong and all contexts occupied) 
                    script_runner_init(FALSE);
                    // execute bootstrap script              
                    script_execute(BANK(bootstrap_script), bootstrap_script, 0, 0);
                    break;
                }
                if (joy != 0) events_update();
                if (!VM_ISLOCKED()) {
                    state_update();                                     // Update Current Scene Type
                    if ((game_time & 0x0F) == 0x00) timers_update();    // update timers
                    music_events_update();                              // update music events
                }

                toggle_shadow_OAM();                

                camera_update();
                scroll_update();
                actors_update();
                projectiles_update();                                   // update and render projectiles

                activate_shadow_OAM();

                ui_update();
                actors_handle_player_collision();

                game_time++;
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
                        engine_reset();
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
                        music_init(FALSE);
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
                        data_load(ReadBankedUBYTE(vm_exception_params_offset, vm_exception_params_bank));
                        fade_in = !(load_scene(current_scene.ptr, current_scene.bank, FALSE));
                        break;
                    }
                    default: {
                        // nothing: suppress any unknown exception
                        continue;
                    }
                }

                __critical {
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

                actor_set_anim_idle(&PLAYER);
                state_init();
                toggle_shadow_OAM();
                camera_update();
                scroll_update();
                actors_update();

                activate_shadow_OAM();

                if (fade_in) fade_in_modal();
            }
        }
    }
}

void main() {
#ifdef CGB
    if (_cpu == CGB_TYPE) {
        cpu_fast();
    }
#endif

    memset(shadow_OAM2, 0, sizeof(shadow_OAM2));

    data_init();
#ifdef SGB
    set_sgb_border(SGB_border_chr, SIZE(SGB_border_chr), BANK(SGB_border_chr),
                   SGB_border_map, SIZE(SGB_border_map), BANK(SGB_border_map), 
                   SGB_border_pal, SIZE(SGB_border_pal), BANK(SGB_border_pal));
#endif

    display_off();
#ifdef CGB
    palette_init();
#endif

    LCDC_REG = 0x67;

    BGP_REG = OBP0_REG = 0xE4u;
    OBP1_REG = 0xE0u;

    WX_REG = MINWNDPOSX;
    WY_REG = MENU_CLOSED_Y;

    initrand(DIV_REG);

    // reset everything (before init interrupts below!)
    engine_reset();

    __critical {
        parallax_row = parallax_rows;
        LYC_REG = 0u;

        add_VBL(VBL_isr);
        STAT_REG |= 0x40u; 

        #ifdef CGB
            // CGB_VAL = 256 - ((256 - DMG_VAL) * 2)
            TMA_REG = _cpu == CGB_TYPE ? 0x80u : 0xC0u;
        #else
            TMA_REG = 0xC0u;
        #endif
        TAC_REG = 0x07u;
        IE_REG |= (TIM_IFLAG | LCD_IFLAG);
    }
    DISPLAY_ON;

    // execute bootstrap script that just raises RESET exception
    script_execute(BANK(bootstrap_script), bootstrap_script, 0, 0);

    // execute VM
    process_VM();
}
