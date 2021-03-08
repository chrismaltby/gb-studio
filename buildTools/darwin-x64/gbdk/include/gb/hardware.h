/** @file gb/hardware.h
    Defines that let the GB's hardware registers be accessed
    from C.

    See the @ref Pandocs for more details on each register.
*/
#ifndef _HARDWARE_H
#define _HARDWARE_H

#include <types.h>

#define __REG extern volatile __sfr

__REG P1_REG		; /**< Joystick: 1.1.P15.P14.P13.P12.P11.P10 */
__REG SB_REG		; /**< Serial IO data buffer */
__REG SC_REG		; /**< Serial IO control register */
__REG DIV_REG		; /**< Divider register */
__REG TIMA_REG		; /**< Timer counter */
__REG TMA_REG		; /**< Timer modulo */
__REG TAC_REG		; /**< Timer control */
__REG IF_REG		; /**< Interrupt flags: 0.0.0.JOY.SIO.TIM.LCD.VBL */
__REG NR10_REG		; /**< Sound Channel 1 Sweep */
__REG NR11_REG		; /**< Sound Channel 1 Sound length/Wave pattern duty */
__REG NR12_REG		; /**< Sound Channel 1 Volume Envelope */
__REG NR13_REG		; /**< Sound Channel 1 Frequency Low */
__REG NR14_REG		; /**< Sound Channel 1 Frequency High */
__REG NR21_REG		; /**< Sound Channel 2 Tone */
__REG NR22_REG		; /**< Sound Channel 2 Volume Envelope */
__REG NR23_REG		; /**< Sound Channel 2 Frequency data Low */
__REG NR24_REG		; /**< Sound Channel 2 Frequency data High */
__REG NR30_REG		; /**< Sound Channel 3 Sound on/off */
__REG NR31_REG		; /**< Sound Channel 3 Sound Length */
__REG NR32_REG		; /**< Sound Channel 3 Select output level */
__REG NR33_REG		; /**< Sound Channel 3 Frequency data Low */
__REG NR34_REG		; /**< Sound Channel 3 Frequency data High */
__REG NR41_REG		; /**< Sound Channel 4 Sound Length */
__REG NR42_REG		; /**< Sound Channel 4 Volume Envelope */
__REG NR43_REG		; /**< Sound Channel 4 Polynomial Counter */
__REG NR44_REG		; /**< Sound Channel 4 Counter / Consecutive and Inital  */
__REG NR50_REG		; /**< Sound Channel control / ON-OFF / Volume */
__REG NR51_REG		; /**< Sound Selection of Sound output terminal */
__REG NR52_REG		; /**< Sound Master on/off */
__REG LCDC_REG		; /**< LCD control */
__REG STAT_REG		; /**< LCD status */
__REG SCY_REG		; /**< Scroll Y */
__REG SCX_REG		; /**< Scroll X */
__REG LY_REG		; /**< LCDC Y-coordinate */
__REG LYC_REG		; /**< LY compare */
__REG DMA_REG		; /**< DMA transfer */
__REG BGP_REG		; /**< BG palette data */
__REG OBP0_REG		; /**< OBJ palette 0 data */
__REG OBP1_REG		; /**< OBJ palette 1 data */
__REG WY_REG		; /**< Window Y coordinate */
__REG WX_REG		; /**< Window X coordinate */
__REG KEY1_REG		; /**< CPU speed */
__REG VBK_REG		; /**< VRAM bank */
__REG HDMA1_REG		; /**< DMA control 1 */
__REG HDMA2_REG		; /**< DMA control 2 */
__REG HDMA3_REG		; /**< DMA control 3 */
__REG HDMA4_REG		; /**< DMA control 4 */
__REG HDMA5_REG		; /**< DMA control 5 */
__REG RP_REG		; /**< IR port */
__REG BCPS_REG		; /**< BG color palette specification */
__REG BCPD_REG		; /**< BG color palette data */
__REG OCPS_REG		; /**< OBJ color palette specification */
__REG OCPD_REG		; /**< OBJ color palette data */
__REG SVBK_REG		; /**< WRAM bank */
__REG IE_REG		; /**< Interrupt enable */

#endif /* _HARDWARE_H */
