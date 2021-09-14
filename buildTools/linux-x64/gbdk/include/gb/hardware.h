/** @file gb/hardware.h
    Defines that let the GB's hardware registers be accessed
    from C.

    See the @ref Pandocs for more details on each register.
*/
#ifndef _HARDWARE_H
#define _HARDWARE_H

#include <types.h>

#define __BYTES extern UBYTE
#define __BYTE_REG extern volatile UBYTE
#define __REG extern volatile __sfr

/** Memoty map */

__BYTES _VRAM[];    
__BYTES _VRAM8000[];
__BYTES _VRAM8800[];
__BYTES _VRAM9000[];
__BYTES _SCRN0[];   
__BYTES _SCRN1[];   
__BYTES _SRAM[];    
__BYTES _RAM[];     
__BYTES _RAMBANK[]; 
__BYTES _OAMRAM[];  
__BYTE_REG _IO[];      
__BYTE_REG _AUD3WAVERAM[];
__BYTE_REG _HRAM[];       

/** MBC5 registers */

__BYTE_REG rRAMG; 
__BYTE_REG rROMB0;
__BYTE_REG rROMB1;
__BYTE_REG rRAMB; 

/** IO Registers */

__REG P1_REG;           /** Joystick: 1.1.P15.P14.P13.P12.P11.P10 */
#define rP1 P1_REG

#define P1F_5 0b00100000
#define P1F_4 0b00010000
#define P1F_3 0b00001000
#define P1F_2 0b00000100
#define P1F_1 0b00000010
#define P1F_0 0b00000001

#define P1F_GET_DPAD P1F_5
#define P1F_GET_BTN  P1F_4
#define P1F_GET_NONE (P1F_4 | P1F_5)

__REG SB_REG;           /** Serial IO data buffer */
#define rSB SB_REG
__REG SC_REG;           /** Serial IO control register */
#define rSC SC_REG
__REG DIV_REG;          /** Divider register */
#define rDIV DIV_REG
__REG TIMA_REG;         /** Timer counter */
#define rTIMA TIMA_REG
__REG TMA_REG;          /** Timer modulo */
#define rTMA TMA_REG
__REG TAC_REG;          /** Timer control */
#define rTAC TAC_REG

#define TACF_START  0b00000100
#define TACF_STOP   0b00000000
#define TACF_4KHZ   0b00000000
#define TACF_16KHZ  0b00000011
#define TACF_65KHZ  0b00000010
#define TACF_262KHZ 0b00000001

__REG IF_REG;           /** Interrupt flags: 0.0.0.JOY.SIO.TIM.LCD.VBL */
#define rIF IF_REG

__REG NR10_REG;         /** Sound Channel 1 Sweep */
#define rAUD1SWEEP NR10_REG
#define AUD1SWEEP_UP        0b00000000
#define AUD1SWEEP_DOWN      0b00001000
#define AUD1SWEEP_TIME(x)   ((x) << 4)
#define AUD1SWEEP_LENGTH(x) (x)
__REG NR11_REG;         /** Sound Channel 1 Sound length/Wave pattern duty */
#define rAUD1LEN NR11_REG
__REG NR12_REG;         /** Sound Channel 1 Volume Envelope */
#define rAUD1ENV NR12_REG
__REG NR13_REG;         /** Sound Channel 1 Frequency Low */
#define rAUD1LOW NR13_REG
__REG NR14_REG;         /** Sound Channel 1 Frequency High */
#define rAUD1HIGH NR14_REG

__REG NR21_REG;         /** Sound Channel 2 Tone */
#define rAUD2LEN NR21_REG
__REG NR22_REG;         /** Sound Channel 2 Volume Envelope */
#define rAUD2ENV NR22_REG
__REG NR23_REG;         /** Sound Channel 2 Frequency data Low */
#define rAUD2LOW NR23_REG
__REG NR24_REG;         /** Sound Channel 2 Frequency data High */
#define rAUD2HIGH NR24_REG

__REG NR30_REG;         /** Sound Channel 3 Sound on/off */
#define rAUD3ENA NR30_REG
__REG NR31_REG;         /** Sound Channel 3 Sound Length */
#define rAUD3LEN NR31_REG
__REG NR32_REG;         /** Sound Channel 3 Select output level */
#define rAUD3LEVEL NR32_REG
__REG NR33_REG;         /** Sound Channel 3 Frequency data Low */
#define rAUD3LOW NR33_REG
__REG NR34_REG;         /** Sound Channel 3 Frequency data High */
#define rAUD3HIGH NR34_REG

__REG NR41_REG;         /** Sound Channel 4 Sound Length */
#define rAUD4LEN NR41_REG
__REG NR42_REG;         /** Sound Channel 4 Volume Envelope */
#define rAUD4ENV NR42_REG
__REG NR43_REG;         /** Sound Channel 4 Polynomial Counter */
#define rAUD4POLY NR43_REG
#define AUD4POLY_WIDTH_15BIT 0x00
#define AUD4POLY_WIDTH_7BIT  0x08
__REG NR44_REG;         /** Sound Channel 4 Counter / Consecutive and Inital  */
#define rAUD4GO NR44_REG

__REG NR50_REG;         /** Sound Channel control / ON-OFF / Volume */
#define rAUDVOL NR50_REG

#define AUDVOL_VOL_LEFT(x)  ((x) << 4)
#define AUDVOL_VOL_RIGHT(x) ((x))
#define AUDVOL_VIN_LEFT         0b10000000
#define AUDVOL_VIN_RIGHT        0b00001000

__REG NR51_REG;         /** Sound Selection of Sound output terminal */
#define rAUDTERM NR51_REG

#define AUDTERM_4_LEFT  0b10000000
#define AUDTERM_3_LEFT  0b01000000
#define AUDTERM_2_LEFT  0b00100000
#define AUDTERM_1_LEFT  0b00010000
#define AUDTERM_4_RIGHT 0b00001000
#define AUDTERM_3_RIGHT 0b00000100
#define AUDTERM_2_RIGHT 0b00000010
#define AUDTERM_1_RIGHT 0b00000001

__REG NR52_REG;         /** Sound Master on/off */
#define rAUDENA NR52_REG

#define AUDENA_ON    0b10000000
#define AUDENA_OFF   0b00000000

__BYTE_REG AUD3WAVE[16];

__REG LCDC_REG;         /** LCD control */
#define rLCDC LCDC_REG

#ifdef __TARGET_ap
#define LCDCF_OFF       0b00000000
#define LCDCF_ON        0b00000001
#define LCDCF_WIN9800   0b00000000
#define LCDCF_WIN9C00   0b00000010
#define LCDCF_WINOFF    0b00000000
#define LCDCF_WINON     0b00000100
#define LCDCF_BG8800    0b00000000
#define LCDCF_BG8000    0b00001000
#define LCDCF_BG9800    0b00000000
#define LCDCF_BG9C00    0b00010000
#define LCDCF_OBJ8      0b00000000
#define LCDCF_OBJ16     0b00100000
#define LCDCF_OBJOFF    0b00000000
#define LCDCF_OBJON     0b01000000
#define LCDCF_BGOFF     0b00000000
#define LCDCF_BGON      0b10000000
#define LCDCF_B_ON      0
#define LCDCF_B_WIN9C00 1
#define LCDCF_B_WINON   2
#define LCDCF_B_BG8000  3
#define LCDCF_B_BG9C00  4
#define LCDCF_B_OBJ16   5
#define LCDCF_B_OBJON   6
#define LCDCF_B_BGON    7
#else
#define LCDCF_OFF     0b00000000
#define LCDCF_ON      0b10000000
#define LCDCF_WIN9800 0b00000000
#define LCDCF_WIN9C00 0b01000000
#define LCDCF_WINOFF  0b00000000
#define LCDCF_WINON   0b00100000
#define LCDCF_BG8800  0b00000000
#define LCDCF_BG8000  0b00010000
#define LCDCF_BG9800  0b00000000
#define LCDCF_BG9C00  0b00001000
#define LCDCF_OBJ8    0b00000000
#define LCDCF_OBJ16   0b00000100
#define LCDCF_OBJOFF  0b00000000
#define LCDCF_OBJON   0b00000010
#define LCDCF_BGOFF   0b00000000
#define LCDCF_BGON    0b00000001
#define LCDCF_B_ON      7
#define LCDCF_B_WIN9C00 6
#define LCDCF_B_WINON   5
#define LCDCF_B_BG8000  4
#define LCDCF_B_BG9C00  3
#define LCDCF_B_OBJ16   2
#define LCDCF_B_OBJON   1
#define LCDCF_B_BGON    0
#endif

__REG STAT_REG;         /** LCD status */
#define rSTAT STAT_REG

#ifdef __TARGET_ap
#define STATF_LYC       0b00000010
#define STATF_MODE10    0b00000100
#define STATF_MODE01    0b00001000
#define STATF_MODE00    0b00010000
#define STATF_LYCF      0b00100000
#define STATF_HBL       0b00000000
#define STATF_VBL       0b10000000
#define STATF_OAM       0b01000000
#define STATF_LCD       0b11000000
#define STATF_BUSY      0b01000000
#define STATF_B_LYC     1
#define STATF_B_MODE10  2
#define STATF_B_MODE01  3
#define STATF_B_MODE00  4
#define STATF_B_LYCF    5
#define STATF_B_VBL     7
#define STATF_B_OAM     6
#define STATF_B_BUSY    6
#else
#define STATF_LYC     0b01000000
#define STATF_MODE10  0b00100000
#define STATF_MODE01  0b00010000
#define STATF_MODE00  0b00001000
#define STATF_LYCF    0b00000100
#define STATF_HBL     0b00000000
#define STATF_VBL     0b00000001
#define STATF_OAM     0b00000010
#define STATF_LCD     0b00000011
#define STATF_BUSY    0b00000010
#define STATF_B_LYC     6
#define STATF_B_MODE10  5
#define STATF_B_MODE01  4
#define STATF_B_MODE00  3
#define STATF_B_LYCF    2
#define STATF_B_VBL     0
#define STATF_B_OAM     1
#define STATF_B_BUSY    1
#endif

__REG SCY_REG;          /** Scroll Y */
#define rSCY
__REG SCX_REG;          /** Scroll X */
#define rSCX SCX_REG
__REG LY_REG;           /** LCDC Y-coordinate */
#define rLY LY_REG
__REG LYC_REG;          /** LY compare */
#define rLYC LYC_REG
__REG DMA_REG;          /** DMA transfer */
#define rDMA DMA_REG
__REG BGP_REG;          /** BG palette data */
#define rBGP BGP_REG
__REG OBP0_REG;         /** OBJ palette 0 data */
#define rOBP0 OBP0_REG
__REG OBP1_REG;         /** OBJ palette 1 data */
#define rOBP1 OBP1_REG
__REG WY_REG;           /** Window Y coordinate */
#define rWY WY_REG
__REG WX_REG;           /** Window X coordinate */
#define rWX WX_REG
__REG KEY1_REG;         /** CPU speed */
#define rKEY1 KEY1_REG
#define rSPD  KEY1_REG

#define KEY1F_DBLSPEED 0b10000000
#define KEY1F_PREPARE  0b00000001

__REG VBK_REG;          /** VRAM bank */
#define rVBK VBK_REG
__REG HDMA1_REG;        /** DMA control 1 */
#define rHDMA1 HDMA1_REG
__REG HDMA2_REG;        /** DMA control 2 */
#define rHDMA2 HDMA2_REG
__REG HDMA3_REG;        /** DMA control 3 */
#define rHDMA3 HDMA3_REG
__REG HDMA4_REG;        /** DMA control 4 */
#define rHDMA4 HDMA4_REG
__REG HDMA5_REG;        /** DMA control 5 */
#define rHDMA5 HDMA5_REG

#define HDMA5F_MODE_GP  0b00000000
#define HDMA5F_MODE_HBL 0b10000000

#define HDMA5F_BUSY 0b10000000

__REG RP_REG;           /** IR port */
#define rRP RP_REG

#define RPF_ENREAD   0b11000000
#define RPF_DATAIN   0b00000010
#define RPF_WRITE_HI 0b00000001
#define RPF_WRITE_LO 0b00000000

__REG BCPS_REG;         /** BG color palette specification */
#define rBCPS BCPS_REG

#define BCPSF_AUTOINC 0b10000000
__REG BCPD_REG;         /** BG color palette data */
#define rBCPD BCPD_REG
__REG OCPS_REG;         /** OBJ color palette specification */
#define rOCPS OCPS_REG

#define OCPSF_AUTOINC 0b10000000
__REG OCPD_REG;         /** OBJ color palette data */
#define rOCPD OCPD_REG
__REG SVBK_REG;         /** WRAM bank */
#define rSVBK SVBK_REG
#define rSMBK SVBK_REG

__REG PCM12_REG;        /** Sound channel 1&2 PCM amplitude (R) */
#define rPCM12 PCM12_REG

__REG PCM34_REG;        /** Sound channel 3&4 PCM amplitude (R) */
#define rPCM34 PCM34_REG

__REG IE_REG;           /** Interrupt enable */
#define rIE IE_REG

#define IEF_HILO   0b00010000
#define IEF_SERIAL 0b00001000
#define IEF_TIMER  0b00000100
#define IEF_STAT   0b00000010
#define IEF_VBLANK 0b00000001


/* Square wave duty cycle */
#define AUDLEN_DUTY_12_5 0b00000000
#define AUDLEN_DUTY_25   0b01000000
#define AUDLEN_DUTY_50   0b10000000
#define AUDLEN_DUTY_75   0b11000000
#define AUDLEN_LENGTH(x) (x)

/* Audio envelope flags */
#define AUDENV_VOL(x)    ((x) << 4)
#define AUDENV_UP        0b00001000
#define AUDENV_DOWN      0b00000000
#define AUDENV_LENGTH(x) (x)

/* Audio trigger flags */
#define AUDHIGH_RESTART    0b10000000
#define AUDHIGH_LENGTH_ON  0b01000000
#define AUDHIGH_LENGTH_OFF 0b00000000

/* OAM attributes flags */
#define OAMF_PRI   0b10000000
#define OAMF_YFLIP 0b01000000
#define OAMF_XFLIP 0b00100000
#define OAMF_PAL0  0b00000000
#define OAMF_PAL1  0b00010000
#define OAMF_BANK0 0b00000000
#define OAMF_BANK1 0b00001000

#define OAMF_PALMASK 0b00000111

#endif
