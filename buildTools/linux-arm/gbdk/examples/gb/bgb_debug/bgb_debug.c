#include <gb/gb.h>
#include <stdio.h>      // Just for printf()
#include <gb/cgb.h>     // Just for the cpu_fast()/slow() calls in CGB 2x example

#include <gb/bgb_emu.h> // Use this include to add the BGB functions


// This example shows how to use support for profiling 
// and logging to the debug window in the BGB emulator.
//
// 1. Build this ROM (bgb_debug.gb) then load it in the BGB emulator
// 2. Open the internal BGB debugger by pressing the "ESC" key
// 3. From the debugger menu choose "debug messages" to open the debug messages window
// 4. Reset the gameboy (you may need to press F9 in the debugger to resume running)
// 5. The debug window will show the BGB messages
//
// See the BGB Manual for more information 
// ("expressions, breakpoint conditions, and debug messages")
// http://bgb.bircd.org/manual.html#expressions

int main(void)
{
    int c;

    SHOW_BKG;
    DISPLAY_ON;
    enable_interrupts();

    // Display a message on the GameBoy's screen
    printf("Message to the \nGameBoy screen\n");

    // Log a message to the BGB debug message window
    BGB_MESSAGE("Message to the BGB console");

    // ==== Normal Speed Mode ====
    // Profile code: a single NOP instruction
    //
    // In BGB the clock units are "1 nop in [CGB] doublespeed mode".
    // So when *not* running in CGB doublespeed mode you
    // have to divide by 2 to get the correct cycle count.
    //
    // You should see the message "NOP TIME: 2".
    //
    // So in this case, divide the printed value by 2 = The NOP took "1" cycle
    BGB_MESSAGE("Profile a single NOP instruction at Normal Speed");

    __critical {  // Temporarily turn off interrupts for more accurate measurements
        BGB_PROFILE_BEGIN();
            __asm__("nop");
        BGB_PROFILE_END(NOP TIME);
    }


    // ==== Color Game Boy in Double Speed Mode ====
    // Profile code: a single NOP instruction
    //
    // The BGB_PROFILE_BEGIN/END macros don't support the 
    // Color Game Boy (CGB) in double speed mode (cpu_fast()).
    // The example below shows what to use instead (and how to
    // check for a CGB and turn on Double Speed mode).
    //
    // Check and only run this test if on CGB hardware
    if (_cpu == CGB_TYPE) {

        // Set CGB into double speed mode
        // (Requires passing -Wm-yc or -Wm-yC with Lcc during build time)
        cpu_fast();
        // Set some default DMG styled colors in the CGB Palette
        cgb_compatibility();

        // In CGB Double Speed mode, you don't have to 
        // divide by 2 to get the cycle count.
        //
        // You should see the message "NOP TIME: 1".
        BGB_MESSAGE("Profile a single NOP instruction at Double Speed");

        __critical {  // Temporarily turn off interrupts for more accurate measurements
            BGB_MESSAGE("%ZEROCLKS%");
                __asm__("nop");
            // The "-4+" subtracts 4 clocks to compensate for the ones
            // used by the debug message itself (Normal speed uses -8)
            BGB_MESSAGE("NOP TIME: %-4+LASTCLKS%");
        }

        // Return the CGB to normal speed
        cpu_slow();
    }


    BGB_MESSAGE("Profile code in a loop");
    __critical {  // Temporarily turn off interrupts for more accurate measurements

        // Profile code in a loop
        BGB_PROFILE_BEGIN();
            for(c=0; c<5; c++) {
                // Do something
                printf("%d\n", c);
            }
        // Elapsed cycle count output is in hex. 
        // Remember to divide by 2 for the result (Normal Speed)
        BGB_PROFILE_END(NOP TIME);
    }
    

    // ==== Some other things you can print ====

    // TOTALCLKS shows the clocks counter ("internal divider") in the BGB IO map
    BGB_MESSAGE("Total Clocks: %TOTALCLKS%");

    // CLKS2VBLANK
    BGB_MESSAGE("Clocks until VBLANK: %CLKS2VBLANK%");

    // Which Banks are currently active (for MBC based cartridges)
    BGB_MESSAGE("Current  ROM bank: %ROMBANK%");
    BGB_MESSAGE("Current XRAM bank: %XRAMBANK%");
    BGB_MESSAGE("Current SRAM bank: %SRAMBANK%");
    // These are only banked in the CGB
    BGB_MESSAGE("Current VRAM bank: %VRAMBANK%");
    BGB_MESSAGE("Current WRAM bank: %WRAMBANK%");

    // Registers (All in this case, or individual ones)
    BGB_MESSAGE("All Registers: %ALLREGS%");

    // Simple addition with a register
    BGB_MESSAGE("Register A + 1: %(A+1)%");

    // Read the LY Register a couple times
    // (Current Y coordinate being rendered to the LCD)
    BGB_MESSAGE("LY Register (0xFF44): %($ff44)%");
    BGB_MESSAGE("LY Register (0xFF44): %($ff44)%");
    // Now print a conditional debug message using it
    BGB_MESSAGE("Is LY Register > Line 67: %($ff44)>67%Yes;No;");

    // Print some profile info using a built-in function.
    BGB_MESSAGE("The following lines contain: PROFILE,(SP+$0),(SP+$1),A,TOTALCLKS,ROMBANK,WRAMBANK");
    BGB_profiler_message();
    // It's equivalent to:
    BGB_MESSAGE("PROFILE,%(SP+$0)%,%(SP+$1)%,%A%,%TOTALCLKS%,%ROMBANK%,%WRAMBANK%");

    // The BGB_TEXT() macro will accept a non-quoted string
    BGB_TEXT(The End);

    return 0;
}
