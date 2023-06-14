/** @file gb/sgb.h
    Super Gameboy definitions.

    See the example SGB project for additional details.
*/
#ifndef _SGB_H
#define _SGB_H

#include <types.h>
#include <stdint.h>

#define SGB_PAL_01 0x00U    /**< SGB Command: Set SGB Palettes 0 & 1 */
#define SGB_PAL_23 0x01U    /**< SGB Command: Set SGB Palettes 2 & 3 */
#define SGB_PAL_03 0x02U    /**< SGB Command: Set SGB Palettes 0 & 3 */
#define SGB_PAL_12 0x03U    /**< SGB Command: Set SGB Palettes 1 & 2 */
#define SGB_ATTR_BLK 0x04U  /**< SGB Command: Set color attributes for rectangular regions */
#define SGB_ATTR_LIN 0x05U  /**< SGB Command: Set color attributes for horizontal or vertical character lines */
#define SGB_ATTR_DIV 0x06U  /**< SGB Command: Split screen in half and assign separate color attribes to each side and the divider */
#define SGB_ATTR_CHR 0x07U  /**< SGB Command: Set color attributes for separate charactersSet SGB Palette 0,1 Data */
#define SGB_SOUND 0x08U     /**< SGB Command: Start and stop a internal sound effect, and sounds using internal tone data */
#define SGB_SOU_TRN 0x09U   /**< SGB Command: Transfer sound code or data to the SNES APU RAM */
#define SGB_PAL_SET 0x0AU   /**< SGB Command: Apply (previously transferred) SGB system color palettes to actual SNES palettes */
#define SGB_PAL_TRN 0x0BU   /**< SGB Command: Transfer palette data into SGB system color palettes */
#define SGB_ATRC_EN 0x0CU   /**< SGB Command: Enable/disable Attraction mode. It is enabled by default */
#define SGB_TEST_EN 0x0DU   /**< SGB Command: Enable/disable test mode for "SGB-CPU variable clock speed function" */
#define SGB_ICON_EN 0x0EU   /**< SGB Command: Enable/disable ICON functionality */
#define SGB_DATA_SND 0x0FU  /**< SGB Command: Write one or more bytes into SNES Work RAM */
#define SGB_DATA_TRN 0x10U  /**< SGB Command: Transfer code or data into SNES RAM */
#define SGB_MLT_REQ 0x11U   /**< SGB Command: Request multiplayer mode (input from more than one joypad) */
#define SGB_JUMP 0x12U      /**< SGB Command: Set the SNES program counter and NMI (vblank interrupt) handler to specific addresses */
#define SGB_CHR_TRN 0x13U   /**< SGB Command: Transfer tile data (characters) to SNES Tile memory */
#define SGB_PCT_TRN 0x14U   /**< SGB Command: Transfer tile map and palette data to SNES BG Map memory */
#define SGB_ATTR_TRN 0x15U  /**< SGB Command: Transfer data to (color) Attribute Files (ATFs) in SNES RAM */
#define SGB_ATTR_SET 0x16U  /**< SGB Command: Transfer attributes from (color) Attribute Files (ATF) to the Game Boy window */
#define SGB_MASK_EN 0x17U   /**< SGB Command: Modify Game Boy window mask settings */
#define SGB_OBJ_TRN 0x18U   /**< SGB Command: Transfer OBJ attributes to SNES OAM memory */


/** Returns a non-null value if running on Super GameBoy */
uint8_t sgb_check() OLDCALL PRESERVES_REGS(b, c);

/** Transfer a SGB packet

    @param packet    Pointer to buffer with SGB packet data.

    The first byte of __packet__ should be a SGB command,
    then up to 15 bytes of command parameter data.

    See the `sgb_border` GBDK example project for a
    demo of how to use these the sgb functions.

    When using the SGB with a PAL SNES, a delay should be added
    just after program startup such as:

    \code{.c}
    // Wait 4 frames
    // For PAL SNES this delay is required on startup
    for (uint8_t i = 4; i != 0; i--) wait_vbl_done();
    \endcode

    @see sgb_check()
*/
void sgb_transfer(uint8_t * packet) OLDCALL PRESERVES_REGS(b, c);

#endif /* _SGB_H */
