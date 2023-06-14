#include <gb/gb.h>
#include <stdint.h>
#include <stdio.h>      // Just for printf()
#include <gb/cgb.h>     // Just for the cpu_fast()/slow() calls in CGB 2x example

#include <gb/emu_debug.h> // Use this include to add the Emu debug functions


// This example shows how to use support for profiling
// and logging to the debug window in the emulator (BGB or Emulicious).
//
// 1. Build this ROM (emu_debug.gb) then load it in the emulator (BGB or Emulicious)
// 2. Open the internal debugger by pressing the "ESC" or "F1" key 
// 3. From the debugger menu choose "debug messages" to open the debug messages window
// 4. Reset the gameboy (you may need to press F9 in the debugger to resume running)
// 5. The debug window will show the debug messages
//
// See the BGB Manual for more information
// ("expressions, breakpoint conditions, and debug messages")
// https://bgb.bircd.org/manual.html#expressions

int main(void)
{
    int c;

    SHOW_BKG;
    DISPLAY_ON;
    enable_interrupts();

    // Display a message on the GameBoy's screen
    printf("Message to the \nGameBoy screen\n");

    // Log a message to the Emulator debug message window
    EMU_MESSAGE(""); // new line
    EMU_MESSAGE("Message to the EMU console");

    // ==== Normal Speed Mode ====
    // Profile code: a single NOP instruction
    //
    // The clock units are "1 nop in [CGB] doublespeed mode".
    // So when *not* running in CGB doublespeed mode you
    // have to divide by 2 to get the correct cycle count.
    //
    // You should see the message "NOP TIME: 2".
    //
    // So in this case, divide the printed value by 2 = The NOP took "1" cycle

    __critical {  // Temporarily turn off interrupts for more accurate measurements
        EMU_PROFILE_BEGIN("Profile a single NOP instruction at Normal Speed");
            __asm__("nop");
        EMU_PROFILE_END("NOP TIME:");
    }


    // ==== Color Game Boy in Double Speed Mode ====
    // Profile code: a single NOP instruction
    //
    // The EMU_PROFILE_BEGIN/END macros don't support the
    // Color Game Boy (CGB) in double speed mode (cpu_fast()).
    // The example below shows what to use instead (and how to
    // check for a CGB and turn on Double Speed mode).
    //
    // Check and only run this test if on CGB hardware
    if (DEVICE_SUPPORTS_COLOR) {

        // Set CGB into double speed mode
        // (Requires passing -Wm-yc or -Wm-yC with Lcc during build time)
        cpu_fast();
        // Set some default DMG styled colors in the CGB Palette
        set_default_palette();

        // In CGB Double Speed mode, you don't have to
        // divide by 2 to get the cycle count.
        //
        // You should see the message "NOP TIME: 1".

        __critical {  // Temporarily turn off interrupts for more accurate measurements
            EMU_PROFILE_BEGIN("Profile a single NOP instruction at CGB Double Speed");
                __asm__("nop");
            // The "-4+" subtracts 4 clocks to compensate for the ones
            // used by the debug message itself (Normal speed uses -8)
            EMU_MESSAGE("NOP TIME:%-4+LASTCLKS%");
        }

        // Return the CGB to normal speed
        cpu_slow();
    }


    __critical {  // Temporarily turn off interrupts for more accurate measurements

        // Profile code in a loop
        EMU_PROFILE_BEGIN("Profile code in a loop");
            for(c=0; c<5; c++) {
                // Do something
                printf("%d\n", c);
            }
        // Elapsed cycle count output is in hex.
        // Remember to divide by 2 for the result (Normal Speed)
        EMU_PROFILE_END("LOOP TIME:");
    }


    // ==== Some other things you can print ====

    // TOTALCLKS shows the clocks counter ("internal divider") in the BGB IO map
    EMU_MESSAGE("Total Clocks: %TOTALCLKS%");

    // CLKS2VBLANK
    EMU_MESSAGE("Clocks until VBLANK: %CLKS2VBLANK%");

    // Which Banks are currently active (for MBC based cartridges)
    EMU_MESSAGE("Current  ROM bank: %ROMBANK%");
    EMU_MESSAGE("Current SRAM bank: %SRAMBANK%");
    // These are only banked in the CGB
    EMU_MESSAGE("Current VRAM bank: %VRAMBANK%");
    EMU_MESSAGE("Current WRAM bank: %WRAMBANK%");

    // Registers (All in this case, or individual ones)
    EMU_MESSAGE("All Registers: %ALLREGS%");

    // Simple addition with a register
    EMU_MESSAGE("Register A + 1: %(A+1)%");

    // Read the LY Register a couple times
    // (Current Y coordinate being rendered to the LCD)
    EMU_MESSAGE("LY Register (0xFF44): %($ff44)%");
    EMU_MESSAGE("LY Register (0xFF44): %($ff44)%");
    // Now print a conditional debug message using it
    EMU_MESSAGE("Is LY Register > Line 67: %($ff44)>67%Yes;No;");

    // Print some profile info using a built-in function.
    EMU_MESSAGE("The following lines contain: PROFILE,(SP+$0),(SP+$1),A,TOTALCLKS,ROMBANK,WRAMBANK");
    EMU_profiler_message();
    // It's equivalent to:
    EMU_MESSAGE("PROFILE,%(SP+$0)%,%(SP+$1)%,%A%,%TOTALCLKS%,%ROMBANK%,%WRAMBANK%");

    uint8_t var0 = 16;
    int16_t var1 = -10;
    //
    EMU_printf("var0: %hd; var1: %d; var0*var1=%d", (uint8_t)var0, var1, var0 * var1);

    // The EMU_TEXT() macro will accept a non-quoted string
    EMU_TEXT("The End");

    return 0;
}
