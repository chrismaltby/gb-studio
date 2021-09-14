/** @file sms/hardware.h
    Defines that let the SMS/GG hardware registers be accessed
    from C.
*/
#ifndef _HARDWARE_H
#define _HARDWARE_H

#include <types.h>

#define __BYTES extern UBYTE
#define __BYTE_REG extern volatile UBYTE

static volatile __sfr __at(0x3E) MEMORY_CTL;

#define MEMCTL_JOYON   0b00000000
#define MEMCTL_JOYOFF  0b00000100
#define MEMCTL_BASEON  0b00000000
#define MEMCTL_BASEOFF 0b00001000
#define MEMCTL_RAMON   0b00000000
#define MEMCTL_RAMOFF  0b00010000
#define MEMCTL_CROMON  0b00000000
#define MEMCTL_CROMOFF 0b00100000
#define MEMCTL_ROMON   0b00000000
#define MEMCTL_ROMOFF  0b01000000
#define MEMCTL_EXTON   0b00000000
#define MEMCTL_EXTOFF  0b10000000

static volatile __sfr __at(0x3F) JOY_CTL;

#define JOY_P1_LATCH   0b00000010
#define JOY_P2_LATCH   0b00001000

static volatile __sfr __at(0x7E) VCOUNTER;
static volatile __sfr __at(0x7F) PSG;
static volatile __sfr __at(0x7F) HCOUNTER;

static volatile __sfr __at(0xBE) VDP_DATA;
static volatile __sfr __at(0xBF) VDP_CMD;
static volatile __sfr __at(0xBF) VDP_STATUS;

#define STATF_INT_VBL  0b10000000
#define STATF_9_SPR    0b01000000
#define STATF_SPR_COLL 0b00100000

#define VDP_REG_MASK   0b10000000
#define VDP_R0         0b10000000
extern UBYTE shadow_VDP_R0;

#define R0_VSCRL       0b00000000
#define R0_VSCRL_INH   0b10000000
#define R0_HSCRL       0b00000000
#define R0_HSCRL_INH   0b01000000
#define R0_NO_LCB      0b00000000
#define R0_LCB         0b00100000
#define R0_IE1_OFF     0b00000000
#define R0_IE1         0b00010000
#define R0_SS_OFF      0b00000000
#define R0_SS          0b00001000
#define R0_DEFAULT     0b00000110
#define R0_ES_OFF      0b00000000
#define R0_ES          0b00000001

#define VDP_R1         0b10000001
extern UBYTE shadow_VDP_R1;

#define R1_DEFAULT     0b10000000
#define R1_DISP_OFF    0b00000000
#define R1_DISP_ON     0b01000000
#define R1_IE_OFF      0b00000000
#define R1_IE          0b00100000
#define R1_SPR_8X8     0b00000000
#define R1_SPR_8X16    0b00000010

#define VDP_R2         0b10000010
extern UBYTE shadow_VDP_R2;

#define R2_MAP_0x3800  0xFF
#define R2_MAP_0x3000  0xFD
#define R2_MAP_0x2800  0xFB
#define R2_MAP_0x2000  0xF9
#define R2_MAP_0x1800  0xF7
#define R2_MAP_0x1000  0xF5
#define R2_MAP_0x0800  0xF3
#define R2_MAP_0x0000  0xF1

#define VDP_R3         0b10000011
extern UBYTE shadow_VDP_R3;
#define VDP_R4         0b10000100
extern UBYTE shadow_VDP_R4;
#define VDP_R5         0b10000101
extern UBYTE shadow_VDP_R5;
        
#define R5_SAT_0x3F00  0xFF
#define R5_SAT_MASK    0b10000001
     
#define VDP_R6         0b10000110
extern UBYTE shadow_VDP_R6;
        
#define R6_BANK0       0xFB
#define R6_DATA_0x0000 0xFB
#define R6_BANK1       0xFF
#define R6_DATA_0x2000 0xFF
     
#define VDP_R7         0b10000111
extern UBYTE shadow_VDP_R7;
#define VDP_RBORDER    0b10000111
extern UBYTE shadow_VDP_RBORDER;
        
#define R7_COLOR_MASK  0b11110000
     
#define VDP_R8         0b10001000
extern UBYTE shadow_VDP_R8;
#define VDP_RSCX       0b10001000
extern UBYTE shadow_VDP_RSCX;
        
#define VDP_R9         0b10001001
extern UBYTE shadow_VDP_R9;
#define VDP_RSCY       0b10001001
extern UBYTE shadow_VDP_RSCY;
     
#define VDP_R10        0b10001010
extern UBYTE shadow_VDP_R10;
        
#define R10_INT_OFF    0xFF
#define R10_INT_EVERY  0x00

static volatile __sfr __at(0xDC) JOY_PORT1;

#define JOY_P1_UP      0b00000001
#define JOY_P1_DOWN    0b00000010
#define JOY_P1_LEFT    0b00000100
#define JOY_P1_RIGHT   0b00001000
#define JOY_P1_SW1     0b00010000
#define JOY_P1_TRIGGER 0b00010000
#define JOY_P1_SW2     0b00100000
#define JOY_P2_UP      0b01000000
#define JOY_P2_DOWN    0b10000000

static volatile __sfr __at(0xDD) JOY_PORT2;

#define JOY_P2_LEFT    0b00000001
#define JOY_P2_RIGHT   0b00000010
#define JOY_P2_SW1     0b00000100
#define JOY_P2_TRIGGER 0b00000100
#define JOY_P2_SW2     0b00001000
#define JOY_RESET      0b00010000
#define JOY_P1_LIGHT   0b01000000
#define JOY_P2_LIGHT   0b10000000

static volatile __sfr __at(0xF0) FMADDRESS;
static volatile __sfr __at(0xF1) FMDATA;
static volatile __sfr __at(0xF2) AUDIOCTRL;

static volatile UBYTE __at(0xfffc) RAM_CONTROL; 
        
#define RAMCTL_BANK    0b00000100
#define RAMCTL_ROM     0b00000000
#define RAMCTL_RAM     0b00001000
#define RAMCTL_RO      0b00010000
#define RAMCTL_PROT    0b10000000
        
static volatile UBYTE __at(0xfffd) MAP_FRAME0; 
static volatile UBYTE __at(0xfffe) MAP_FRAME1; 
static volatile UBYTE __at(0xffff) MAP_FRAME2; 
        
#define SYSTEM_PAL     = 0x00
#define SYSTEM_NTSC    = 0x01

#endif
