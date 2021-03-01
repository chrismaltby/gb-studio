/* eslint-disable no-multi-str */
export default "\
;*\n\
;* Gameboy Hardware definitions\n\
;*\n\
;* Based on Jones' hardware.inc\n\
;* And based on Carsten Sorensen's ideas.\n\
;*\n\
;* Rev 1.1 - 15-Jul-97 : Added define check\n\
;* Rev 1.2 - 18-Jul-97 : Added revision check macro\n\
;* Rev 1.3 - 19-Jul-97 : Modified for RGBASM V1.05\n\
;* Rev 1.4 - 27-Jul-97 : Modified for new subroutine prefixes\n\
;* Rev 1.5 - 15-Aug-97 : Added _HRAM, PAD, CART defines\n\
;*                     :  and Nintendo Logo\n\
;* Rev 1.6 - 30-Nov-97 : Added rDIV, rTIMA, rTMA, & rTAC\n\
;* Rev 1.7 - 31-Jan-98 : Added _SCRN0, _SCRN1\n\
;* Rev 1.8 - 15-Feb-98 : Added rSB, rSC\n\
;* Rev 1.9 - 16-Feb-98 : Converted I/O registers to $FFXX format\n\
;* Rev 2.0 -           : Added GBC registers\n\
;* Rev 2.1 -           : Added MBC5 & cart RAM enable/disable defines\n\
;* Rev 2.2 -           : Fixed NR42,NR43, & NR44 equates\n\
;* Rev 2.3 -           : Fixed incorrect _HRAM equate\n\
;* Rev 2.4 - 27-Apr-13 : Added some cart defines (AntonioND)\n\
;* Rev 2.5 - 03-May-15 : Fixed format (AntonioND)\n\
;* Rev 2.6 - 09-Apr-16 : Added GBC OAM and cart defines (AntonioND)\n\
;* Rev 2.7 - 19-Jan-19 : Added rPCMXX (ISSOtm)\n\
;* Rev 2.8 - 03-Feb-19 : Added audio registers flags (Alvaro Cuesta)\n\
;* Rev 2.9 - 28-Feb-20 : Added utility rP1 constants\n\
\n\
; If all of these are already defined, don't do it again.\n\
\n\
    IF !DEF(HARDWARE_INC)\n\
HARDWARE_INC SET 1\n\
\n\
rev_Check_hardware_inc : MACRO\n\
;NOTE: REVISION NUMBER CHANGES MUST BE ADDED\n\
;TO SECOND PARAMETER IN FOLLOWING LINE.\n\
    IF  \\1 > 2.9 ;PUT REVISION NUMBER HERE\n\
        WARN    \"Version \\1 or later of 'hardware.inc' is required.\"\n\
    ENDC\n\
ENDM\n\
\n\
_HW          EQU $FF00\n\
\n\
_VRAM        EQU $8000 ; $8000->$9FFF\n\
_SCRN0       EQU $9800 ; $9800->$9BFF\n\
_SCRN1       EQU $9C00 ; $9C00->$9FFF\n\
_SRAM        EQU $A000 ; $A000->$BFFF\n\
_RAM         EQU $C000 ; $C000->$DFFF\n\
_OAMRAM      EQU $FE00 ; $FE00->$FE9F\n\
_AUD3WAVERAM EQU $FF30 ; $FF30->$FF3F\n\
_HRAM        EQU $FF80 ; $FF80->$FFFE\n\
\n\
; *** MBC5 Equates ***\n\
\n\
rRAMG        EQU $0000 ; $0000->$1fff\n\
rROMB0       EQU $2000 ; $2000->$2fff\n\
rROMB1       EQU $3000 ; $3000->$3fff - If more than 256 ROM banks are present.\n\
rRAMB        EQU $4000 ; $4000->$5fff - Bit 3 enables rumble (if present)\n\
\n\
\n\
; --\n\
; -- OAM flags\n\
; --\n\
\n\
OAMF_PRI        EQU %10000000 ; Priority\n\
OAMF_YFLIP      EQU %01000000 ; Y flip\n\
OAMF_XFLIP      EQU %00100000 ; X flip\n\
OAMF_PAL0       EQU %00000000 ; Palette number; 0,1 (DMG)\n\
OAMF_PAL1       EQU %00010000 ; Palette number; 0,1 (DMG)\n\
OAMF_BANK0      EQU %00000000 ; Bank number; 0,1 (GBC)\n\
OAMF_BANK1      EQU %00001000 ; Bank number; 0,1 (GBC)\n\
\n\
OAMF_PALMASK    EQU %00000111 ; Palette (GBC)\n\
\n\
OAMB_PRI        EQU 7 ; Priority \n\
OAMB_YFLIP      EQU 6 ; Y flip \n\
OAMB_XFLIP      EQU 5 ; X flip \n\
OAMB_PAL1       EQU 4 ; Palette number; 0,1 (DMG) \n\
OAMB_BANK1      EQU 3 ; Bank number; 0,1 (GBC) \n\
\n\
\n\
;***************************************************************************\n\
;*\n\
;* Custom registers\n\
;*\n\
;***************************************************************************\n\
\n\
; --\n\
; -- P1 ($FF00)\n\
; -- Register for reading joy pad info.    (R/W)\n\
; --\n\
rP1 EQU $FF00\n\
\n\
P1F_5 EQU %00100000 ; P15 out port, set to 0 to get buttons\n\
P1F_4 EQU %00010000 ; P14 out port, set to 0 to get dpad\n\
P1F_3 EQU %00001000 ; P13 in port\n\
P1F_2 EQU %00000100 ; P12 in port\n\
P1F_1 EQU %00000010 ; P11 in port\n\
P1F_0 EQU %00000001 ; P10 in port\n\
\n\
P1F_GET_DPAD EQU P1F_5\n\
P1F_GET_BTN  EQU P1F_4\n\
P1F_GET_NONE EQU P1F_4 | P1F_5\n\
\n\
; --\n\
; -- SB ($FF01)\n\
; -- Serial Transfer Data (R/W)\n\
; --\n\
rSB EQU $FF01\n\
\n\
; --\n\
; -- SC ($FF02)\n\
; -- Serial I/O Control (R/W)\n\
; --\n\
rSC EQU $FF02\n\
\n\
; --\n\
; -- DIV ($FF04)\n\
; -- Divider register (R/W)\n\
; --\n\
rDIV EQU $FF04\n\
\n\
\n\
; --\n\
; -- TIMA ($FF05)\n\
; -- Timer counter (R/W)\n\
; --\n\
rTIMA EQU $FF05\n\
\n\
\n\
; --\n\
; -- TMA ($FF06)\n\
; -- Timer modulo (R/W)\n\
; --\n\
rTMA EQU $FF06\n\
\n\
\n\
; --\n\
; -- TAC ($FF07)\n\
; -- Timer control (R/W)\n\
; --\n\
rTAC EQU $FF07\n\
\n\
TACF_START  EQU %00000100\n\
TACF_STOP   EQU %00000000\n\
TACF_4KHZ   EQU %00000000\n\
TACF_16KHZ  EQU %00000011\n\
TACF_65KHZ  EQU %00000010\n\
TACF_262KHZ EQU %00000001\n\
\n\
; --\n\
; -- IF ($FF0F)\n\
; -- Interrupt Flag (R/W)\n\
; --\n\
rIF EQU $FF0F\n\
\n\
; --\n\
; -- LCDC ($FF40)\n\
; -- LCD Control (R/W)\n\
; --\n\
rLCDC EQU $FF40\n\
\n\
LCDCF_OFF     EQU %00000000 ; LCD Control Operation\n\
LCDCF_ON      EQU %10000000 ; LCD Control Operation\n\
LCDCF_WIN9800 EQU %00000000 ; Window Tile Map Display Select\n\
LCDCF_WIN9C00 EQU %01000000 ; Window Tile Map Display Select\n\
LCDCF_WINOFF  EQU %00000000 ; Window Display\n\
LCDCF_WINON   EQU %00100000 ; Window Display\n\
LCDCF_BG8800  EQU %00000000 ; BG & Window Tile Data Select\n\
LCDCF_BG8000  EQU %00010000 ; BG & Window Tile Data Select\n\
LCDCF_BG9800  EQU %00000000 ; BG Tile Map Display Select\n\
LCDCF_BG9C00  EQU %00001000 ; BG Tile Map Display Select\n\
LCDCF_OBJ8    EQU %00000000 ; OBJ Construction\n\
LCDCF_OBJ16   EQU %00000100 ; OBJ Construction\n\
LCDCF_OBJOFF  EQU %00000000 ; OBJ Display\n\
LCDCF_OBJON   EQU %00000010 ; OBJ Display\n\
LCDCF_BGOFF   EQU %00000000 ; BG Display\n\
LCDCF_BGON    EQU %00000001 ; BG Display\n\
; \"Window Character Data Select\" follows BG\n\
\n\
\n\
; --\n\
; -- STAT ($FF41)\n\
; -- LCDC Status   (R/W)\n\
; --\n\
rSTAT EQU $FF41\n\
\n\
STATF_LYC     EQU  %01000000 ; LYCEQULY Coincidence (Selectable)\n\
STATF_MODE10  EQU  %00100000 ; Mode 10\n\
STATF_MODE01  EQU  %00010000 ; Mode 01 (V-Blank)\n\
STATF_MODE00  EQU  %00001000 ; Mode 00 (H-Blank)\n\
STATF_LYCF    EQU  %00000100 ; Coincidence Flag\n\
STATF_HB      EQU  %00000000 ; H-Blank\n\
STATF_VB      EQU  %00000001 ; V-Blank\n\
STATF_OAM     EQU  %00000010 ; OAM-RAM is used by system\n\
STATF_LCD     EQU  %00000011 ; Both OAM and VRAM used by system\n\
STATF_BUSY    EQU  %00000010 ; When set, VRAM access is unsafe\n\
\n\
\n\
; --\n\
; -- SCY ($FF42)\n\
; -- Scroll Y (R/W)\n\
; --\n\
rSCY EQU $FF42\n\
\n\
\n\
; --\n\
; -- SCY ($FF43)\n\
; -- Scroll X (R/W)\n\
; --\n\
rSCX EQU $FF43\n\
\n\
\n\
; --\n\
; -- LY ($FF44)\n\
; -- LCDC Y-Coordinate (R)\n\
; --\n\
; -- Values range from 0->153. 144->153 is the VBlank period.\n\
; --\n\
rLY EQU $FF44\n\
\n\
\n\
; --\n\
; -- LYC ($FF45)\n\
; -- LY Compare (R/W)\n\
; --\n\
; -- When LYEQUEQULYC, STATF_LYCF will be set in STAT\n\
; --\n\
rLYC EQU $FF45\n\
\n\
\n\
; --\n\
; -- DMA ($FF46)\n\
; -- DMA Transfer and Start Address (W)\n\
; --\n\
rDMA EQU $FF46\n\
\n\
\n\
; --\n\
; -- BGP ($FF47)\n\
; -- BG Palette Data (W)\n\
; --\n\
; -- Bit 7-6 - Intensity for %11\n\
; -- Bit 5-4 - Intensity for %10\n\
; -- Bit 3-2 - Intensity for %01\n\
; -- Bit 1-0 - Intensity for %00\n\
; --\n\
rBGP EQU $FF47\n\
\n\
\n\
; --\n\
; -- OBP0 ($FF48)\n\
; -- Object Palette 0 Data (W)\n\
; --\n\
; -- See BGP for info\n\
; --\n\
rOBP0 EQU $FF48\n\
\n\
\n\
; --\n\
; -- OBP1 ($FF49)\n\
; -- Object Palette 1 Data (W)\n\
; --\n\
; -- See BGP for info\n\
; --\n\
rOBP1 EQU $FF49\n\
\n\
\n\
; --\n\
; -- WY ($FF4A)\n\
; -- Window Y Position (R/W)\n\
; --\n\
; -- 0 <EQU WY <EQU 143\n\
; --\n\
rWY EQU $FF4A\n\
\n\
\n\
; --\n\
; -- WX ($FF4B)\n\
; -- Window X Position (R/W)\n\
; --\n\
; -- 7 <EQU WX <EQU 166\n\
; --\n\
rWX EQU $FF4B\n\
\n\
\n\
; --\n\
; -- KEY 1 ($FF4D)\n\
; -- Select CPU Speed (R/W)\n\
; --\n\
rKEY1 EQU $FF4D\n\
\n\
\n\
; --\n\
; -- VBK ($FF4F)\n\
; -- Select Video RAM Bank (R/W)\n\
; --\n\
rVBK EQU $FF4F\n\
\n\
\n\
; --\n\
; -- HDMA1 ($FF51)\n\
; -- Horizontal Blanking, General Purpose DMA (W)\n\
; --\n\
rHDMA1 EQU $FF51\n\
\n\
\n\
; --\n\
; -- HDMA2 ($FF52)\n\
; -- Horizontal Blanking, General Purpose DMA (W)\n\
; --\n\
rHDMA2 EQU $FF52\n\
\n\
\n\
; --\n\
; -- HDMA3 ($FF53)\n\
; -- Horizontal Blanking, General Purpose DMA (W)\n\
; --\n\
rHDMA3 EQU $FF53\n\
\n\
\n\
; --\n\
; -- HDMA4 ($FF54)\n\
; -- Horizontal Blanking, General Purpose DMA (W)\n\
; --\n\
rHDMA4 EQU $FF54\n\
\n\
\n\
; --\n\
; -- HDMA5 ($FF55)\n\
; -- Horizontal Blanking, General Purpose DMA (R/W)\n\
; --\n\
rHDMA5 EQU $FF55\n\
\n\
\n\
; --\n\
; -- RP ($FF56)\n\
; -- Infrared Communications Port (R/W)\n\
; --\n\
rRP EQU $FF56\n\
\n\
\n\
; --\n\
; -- BCPS ($FF68)\n\
; -- Background Color Palette Specification (R/W)\n\
; --\n\
rBCPS EQU $FF68\n\
\n\
\n\
; --\n\
; -- BCPD ($FF69)\n\
; -- Background Color Palette Data (R/W)\n\
; --\n\
rBCPD EQU $FF69\n\
\n\
\n\
; --\n\
; -- BCPS ($FF6A)\n\
; -- Object Color Palette Specification (R/W)\n\
; --\n\
rOCPS EQU $FF6A\n\
\n\
\n\
; --\n\
; -- BCPD ($FF6B)\n\
; -- Object Color Palette Data (R/W)\n\
; --\n\
rOCPD EQU $FF6B\n\
\n\
\n\
; --\n\
; -- SVBK ($FF4F)\n\
; -- Select Main RAM Bank (R/W)\n\
; --\n\
rSVBK EQU $FF70\n\
\n\
\n\
; --\n\
; -- IE ($FFFF)\n\
; -- Interrupt Enable (R/W)\n\
; --\n\
rIE EQU $FFFF\n\
\n\
\n\
IEF_HILO   EQU %00010000 ; Transition from High to Low of Pin number P10-P13\n\
IEF_SERIAL EQU %00001000 ; Serial I/O transfer end\n\
IEF_TIMER  EQU %00000100 ; Timer Overflow\n\
IEF_LCDC   EQU %00000010 ; LCDC (see STAT)\n\
IEF_VBLANK EQU %00000001 ; V-Blank\n\
\n\
\n\
\n\
\n\
;***************************************************************************\n\
;*\n\
;* Sound control registers\n\
;*\n\
;***************************************************************************\n\
\n\
; --\n\
; -- AUDVOL/NR50 ($FF24)\n\
; -- Channel control / ON-OFF / Volume (R/W)\n\
; --\n\
; -- Bit 7   - Vin->SO2 ON/OFF (Vin??)\n\
; -- Bit 6-4 - SO2 output level (volume) (# 0-7)\n\
; -- Bit 3   - Vin->SO1 ON/OFF (Vin??)\n\
; -- Bit 2-0 - SO1 output level (volume) (# 0-7)\n\
; --\n\
rNR50 EQU $FF24\n\
rAUDVOL EQU rNR50\n\
\n\
AUDVOL_VIN_LEFT  EQU %10000000 ; SO2\n\
AUDVOL_VIN_RIGHT EQU %00001000 ; SO1\n\
\n\
\n\
; --\n\
; -- AUDTERM/NR51 ($FF25)\n\
; -- Selection of Sound output terminal (R/W)\n\
; --\n\
; -- Bit 7   - Output sound 4 to SO2 terminal\n\
; -- Bit 6   - Output sound 3 to SO2 terminal\n\
; -- Bit 5   - Output sound 2 to SO2 terminal\n\
; -- Bit 4   - Output sound 1 to SO2 terminal\n\
; -- Bit 3   - Output sound 4 to SO1 terminal\n\
; -- Bit 2   - Output sound 3 to SO1 terminal\n\
; -- Bit 1   - Output sound 2 to SO1 terminal\n\
; -- Bit 0   - Output sound 0 to SO1 terminal\n\
; --\n\
rNR51 EQU $FF25\n\
rAUDTERM EQU rNR51\n\
\n\
; SO2\n\
AUDTERM_4_LEFT  EQU %10000000\n\
AUDTERM_3_LEFT  EQU %01000000\n\
AUDTERM_2_LEFT  EQU %00100000\n\
AUDTERM_1_LEFT  EQU %00010000\n\
; SO1\n\
AUDTERM_4_RIGHT EQU %00001000\n\
AUDTERM_3_RIGHT EQU %00000100\n\
AUDTERM_2_RIGHT EQU %00000010\n\
AUDTERM_1_RIGHT EQU %00000001\n\
\n\
\n\
; --\n\
; -- AUDENA/NR52 ($FF26)\n\
; -- Sound on/off (R/W)\n\
; --\n\
; -- Bit 7   - All sound on/off (sets all audio regs to 0!)\n\
; -- Bit 3   - Sound 4 ON flag (doesn't work!)\n\
; -- Bit 2   - Sound 3 ON flag (doesn't work!)\n\
; -- Bit 1   - Sound 2 ON flag (doesn't work!)\n\
; -- Bit 0   - Sound 1 ON flag (doesn't work!)\n\
; --\n\
rNR52 EQU $FF26\n\
rAUDENA EQU rNR52\n\
\n\
AUDENA_ON    EQU %10000000\n\
AUDENA_OFF   EQU %00000000  ; sets all audio regs to 0!\n\
\n\
\n\
;***************************************************************************\n\
;*\n\
;* SoundChannel #1 registers\n\
;*\n\
;***************************************************************************\n\
\n\
; --\n\
; -- AUD1SWEEP/NR10 ($FF10)\n\
; -- Sweep register (R/W)\n\
; --\n\
; -- Bit 6-4 - Sweep Time\n\
; -- Bit 3   - Sweep Increase/Decrease\n\
; --           0: Addition    (frequency increases???)\n\
; --           1: Subtraction (frequency increases???)\n\
; -- Bit 2-0 - Number of sweep shift (# 0-7)\n\
; -- Sweep Time: (n*7.8ms)\n\
; --\n\
rNR10 EQU $FF10\n\
rAUD1SWEEP EQU rNR10\n\
\n\
AUD1SWEEP_UP   EQU %00000000\n\
AUD1SWEEP_DOWN EQU %00001000\n\
\n\
\n\
; --\n\
; -- AUD1LEN/NR11 ($FF11)\n\
; -- Sound length/Wave pattern duty (R/W)\n\
; --\n\
; -- Bit 7-6 - Wave Pattern Duty (00:12.5% 01:25% 10:50% 11:75%)\n\
; -- Bit 5-0 - Sound length data (# 0-63)\n\
; --\n\
rNR11 EQU $FF11\n\
rAUD1LEN EQU rNR11\n\
\n\
\n\
; --\n\
; -- AUD1ENV/NR12 ($FF12)\n\
; -- Envelope (R/W)\n\
; --\n\
; -- Bit 7-4 - Initial value of envelope\n\
; -- Bit 3   - Envelope UP/DOWN\n\
; --           0: Decrease\n\
; --           1: Range of increase\n\
; -- Bit 2-0 - Number of envelope sweep (# 0-7)\n\
; --\n\
rNR12 EQU $FF12\n\
rAUD1ENV EQU rNR12\n\
\n\
\n\
; --\n\
; -- AUD1LOW/NR13 ($FF13)\n\
; -- Frequency lo (W)\n\
; --\n\
rNR13 EQU $FF13\n\
rAUD1LOW EQU rNR13\n\
\n\
\n\
; --\n\
; -- AUD1HIGH/NR14 ($FF14)\n\
; -- Frequency hi (W)\n\
; --\n\
; -- Bit 7   - Initial (when set, sound restarts)\n\
; -- Bit 6   - Counter/consecutive selection\n\
; -- Bit 2-0 - Frequency's higher 3 bits\n\
; --\n\
rNR14 EQU $FF14\n\
rAUD1HIGH EQU rNR14\n\
\n\
\n\
;***************************************************************************\n\
;*\n\
;* SoundChannel #2 registers\n\
;*\n\
;***************************************************************************\n\
\n\
; --\n\
; -- AUD2LEN/NR21 ($FF16)\n\
; -- Sound Length; Wave Pattern Duty (R/W)\n\
; --\n\
; -- see AUD1LEN for info\n\
; --\n\
rNR21 EQU $FF16\n\
rAUD2LEN EQU rNR21\n\
\n\
\n\
; --\n\
; -- AUD2ENV/NR22 ($FF17)\n\
; -- Envelope (R/W)\n\
; --\n\
; -- see AUD1ENV for info\n\
; --\n\
rNR22 EQU $FF17\n\
rAUD2ENV EQU rNR22\n\
\n\
\n\
; --\n\
; -- AUD2LOW/NR23 ($FF18)\n\
; -- Frequency lo (W)\n\
; --\n\
rNR23 EQU $FF18\n\
rAUD2LOW EQU rNR23\n\
\n\
\n\
; --\n\
; -- AUD2HIGH/NR24 ($FF19)\n\
; -- Frequency hi (W)\n\
; --\n\
; -- see AUD1HIGH for info\n\
; --\n\
rNR24 EQU $FF19\n\
rAUD2HIGH EQU rNR24\n\
\n\
\n\
;***************************************************************************\n\
;*\n\
;* SoundChannel #3 registers\n\
;*\n\
;***************************************************************************\n\
\n\
; --\n\
; -- AUD3ENA/NR30 ($FF1A)\n\
; -- Sound on/off (R/W)\n\
; --\n\
; -- Bit 7   - Sound ON/OFF (1EQUON,0EQUOFF)\n\
; --\n\
rNR30 EQU $FF1A\n\
rAUD3ENA EQU rNR30\n\
\n\
\n\
; --\n\
; -- AUD3LEN/NR31 ($FF1B)\n\
; -- Sound length (R/W)\n\
; --\n\
; -- Bit 7-0 - Sound length\n\
; --\n\
rNR31 EQU $FF1B\n\
rAUD3LEN EQU rNR31\n\
\n\
\n\
; --\n\
; -- AUD3LEVEL/NR32 ($FF1C)\n\
; -- Select output level\n\
; --\n\
; -- Bit 6-5 - Select output level\n\
; --           00: 0/1 (mute)\n\
; --           01: 1/1\n\
; --           10: 1/2\n\
; --           11: 1/4\n\
; --\n\
rNR32 EQU $FF1C\n\
rAUD3LEVEL EQU rNR32\n\
\n\
\n\
; --\n\
; -- AUD3LOW/NR33 ($FF1D)\n\
; -- Frequency lo (W)\n\
; --\n\
; -- see AUD1LOW for info\n\
; --\n\
rNR33 EQU $FF1D\n\
rAUD3LOW EQU rNR33\n\
\n\
\n\
; --\n\
; -- AUD3HIGH/NR34 ($FF1E)\n\
; -- Frequency hi (W)\n\
; --\n\
; -- see AUD1HIGH for info\n\
; --\n\
rNR34 EQU $FF1E\n\
rAUD3HIGH EQU rNR34\n\
\n\
\n\
; --\n\
; -- AUD4LEN/NR41 ($FF20)\n\
; -- Sound length (R/W)\n\
; --\n\
; -- Bit 5-0 - Sound length data (# 0-63)\n\
; --\n\
rNR41 EQU $FF20\n\
rAUD4LEN EQU rNR41\n\
\n\
\n\
; --\n\
; -- AUD4ENV/NR42 ($FF21)\n\
; -- Envelope (R/W)\n\
; --\n\
; -- see AUD1ENV for info\n\
; --\n\
rNR42 EQU $FF21\n\
rAUD4ENV EQU rNR42\n\
\n\
\n\
; --\n\
; -- AUD4POLY/NR43 ($FF22)\n\
; -- Polynomial counter (R/W)\n\
; --\n\
; -- Bit 7-4 - Selection of the shift clock frequency of the (scf)\n\
; --           polynomial counter (0000-1101)\n\
; --           freqEQUdrf*1/2^scf (not sure)\n\
; -- Bit 3 -   Selection of the polynomial counter's step\n\
; --           0: 15 steps\n\
; --           1: 7 steps\n\
; -- Bit 2-0 - Selection of the dividing ratio of frequencies (drf)\n\
; --           000: f/4   001: f/8   010: f/16  011: f/24\n\
; --           100: f/32  101: f/40  110: f/48  111: f/56  (fEQU4.194304 Mhz)\n\
; --\n\
rNR43 EQU $FF22\n\
rAUD4POLY EQU rNR43\n\
\n\
\n\
; --\n\
; -- AUD4GO/NR44 ($FF23)\n\
; -- (has wrong name and value (ff30) in Dr.Pan's doc!)\n\
; --\n\
; -- Bit 7 -   Inital\n\
; -- Bit 6 -   Counter/consecutive selection\n\
; --\n\
rNR44 EQU $FF23\n\
rAUD4GO EQU rNR44 ; silly name!\n\
\n\
\n\
; --\n\
; -- PCM12 ($FF76)\n\
; -- Sound channel 1&2 PCM amplitude (R)\n\
; --\n\
; -- Bit 7-4 - Copy of sound channel 2's PCM amplitude\n\
; -- Bit 3-0 - Copy of sound channel 1's PCM amplitude\n\
; --\n\
rPCM12 EQU $FF76\n\
\n\
\n\
; --\n\
; -- PCM34 ($FF77)\n\
; -- Sound channel 3&4 PCM amplitude (R)\n\
; --\n\
; -- Bit 7-4 - Copy of sound channel 4's PCM amplitude\n\
; -- Bit 3-0 - Copy of sound channel 3's PCM amplitude\n\
; --\n\
rPCM34 EQU $FF77\n\
\n\
\n\
;***************************************************************************\n\
;*\n\
;* Flags common to multiple sound channels\n\
;*\n\
;***************************************************************************\n\
\n\
; --\n\
; -- Square wave duty cycle\n\
; --\n\
; -- Can be used with AUD1LEN and AUD2LEN\n\
; -- See AUD1LEN for more info\n\
; --\n\
AUDLEN_DUTY_12_5    EQU %00000000 ; 12.5%\n\
AUDLEN_DUTY_25      EQU %01000000 ; 25%\n\
AUDLEN_DUTY_50      EQU %10000000 ; 50%\n\
AUDLEN_DUTY_75      EQU %11000000 ; 75%\n\
\n\
\n\
; --\n\
; -- Audio envelope flags\n\
; --\n\
; -- Can be used with AUD1ENV, AUD2ENV, AUD4ENV\n\
; -- See AUD1ENV for more info\n\
; --\n\
AUDENV_UP           EQU %00001000\n\
AUDENV_DOWN         EQU %00000000\n\
\n\
\n\
; --\n\
; -- Audio trigger flags\n\
; --\n\
; -- Can be used with AUD1HIGH, AUD2HIGH, AUD3HIGH\n\
; -- See AUD1HIGH for more info\n\
; --\n\
\n\
AUDHIGH_RESTART     EQU %10000000\n\
AUDHIGH_LENGTH_ON   EQU %01000000\n\
AUDHIGH_LENGTH_OFF  EQU %00000000\n\
\n\
\n\
;***************************************************************************\n\
;*\n\
;* Cart related\n\
;*\n\
;***************************************************************************\n\
\n\
CART_COMPATIBLE_DMG     EQU $00\n\
CART_COMPATIBLE_DMG_GBC EQU $80\n\
CART_COMPATIBLE_GBC     EQU $C0\n\
\n\
CART_ROM                     EQU $00\n\
CART_ROM_MBC1                EQU $01\n\
CART_ROM_MBC1_RAM            EQU $02\n\
CART_ROM_MBC1_RAM_BAT        EQU $03\n\
CART_ROM_MBC2                EQU $05\n\
CART_ROM_MBC2_BAT            EQU $06\n\
CART_ROM_RAM                 EQU $08\n\
CART_ROM_RAM_BAT             EQU $09\n\
CART_ROM_MBC3_BAT_RTC        EQU $0F\n\
CART_ROM_MBC3_RAM_BAT_RTC    EQU $10\n\
CART_ROM_MBC3                EQU $11\n\
CART_ROM_MBC3_RAM            EQU $12\n\
CART_ROM_MBC3_RAM_BAT        EQU $13\n\
CART_ROM_MBC5                EQU $19\n\
CART_ROM_MBC5_BAT            EQU $1A\n\
CART_ROM_MBC5_RAM_BAT        EQU $1B\n\
CART_ROM_MBC5_RUMBLE         EQU $1C\n\
CART_ROM_MBC5_RAM_RUMBLE     EQU $1D\n\
CART_ROM_MBC5_RAM_BAT_RUMBLE EQU $1E\n\
CART_ROM_MBC7_RAM_BAT_GYRO   EQU $22\n\
CART_ROM_POCKET_CAMERA       EQU $FC\n\
\n\
CART_ROM_256K EQU 0 ; 2 banks\n\
CART_ROM_512K EQU 1 ; 4 banks\n\
CART_ROM_1M   EQU 2 ; 8 banks\n\
CART_ROM_2M   EQU 3 ; 16 banks\n\
CART_ROM_4M   EQU 4 ; 32 banks\n\
CART_ROM_8M   EQU 5 ; 64 banks\n\
CART_ROM_16M  EQU 6 ; 128 banks\n\
CART_ROM_32M  EQU 7 ; 256 banks\n\
CART_ROM_64M  EQU 8 ; 512 banks\n\
\n\
CART_RAM_NONE EQU 0\n\
CART_RAM_16K  EQU 1 ; 1 incomplete bank\n\
CART_RAM_64K  EQU 2 ; 1 bank\n\
CART_RAM_256K EQU 3 ; 4 banks\n\
CART_RAM_1M   EQU 4 ; 16 banks\n\
\n\
CART_RAM_ENABLE  EQU $0A\n\
CART_RAM_DISABLE EQU $00\n\
\n\
;***************************************************************************\n\
;*\n\
;* Keypad related\n\
;*\n\
;***************************************************************************\n\
\n\
PADF_DOWN   EQU $80\n\
PADF_UP     EQU $40\n\
PADF_LEFT   EQU $20\n\
PADF_RIGHT  EQU $10\n\
PADF_START  EQU $08\n\
PADF_SELECT EQU $04\n\
PADF_B      EQU $02\n\
PADF_A      EQU $01\n\
\n\
PADB_DOWN   EQU $7\n\
PADB_UP     EQU $6\n\
PADB_LEFT   EQU $5\n\
PADB_RIGHT  EQU $4\n\
PADB_START  EQU $3\n\
PADB_SELECT EQU $2\n\
PADB_B      EQU $1\n\
PADB_A      EQU $0\n\
\n\
;***************************************************************************\n\
;*\n\
;* Screen related\n\
;*\n\
;***************************************************************************\n\
\n\
SCRN_X    EQU 160 ; Width of screen in pixels\n\
SCRN_Y    EQU 144 ; Height of screen in pixels\n\
SCRN_X_B  EQU 20  ; Width of screen in bytes\n\
SCRN_Y_B  EQU 18  ; Height of screen in bytes\n\
\n\
SCRN_VX   EQU 256 ; Virtual width of screen in pixels\n\
SCRN_VY   EQU 256 ; Virtual height of screen in pixels\n\
SCRN_VX_B EQU 32  ; Virtual width of screen in bytes\n\
SCRN_VY_B EQU 32  ; Virtual height of screen in bytes\n\
\n\
;*\n\
;* Nintendo scrolling logo\n\
;* (Code won't work on a real GameBoy)\n\
;* (if next lines are altered.)\n\
NINTENDO_LOGO : MACRO\n\
    DB  $CE,$ED,$66,$66,$CC,$0D,$00,$0B,$03,$73,$00,$83,$00,$0C,$00,$0D\n\
    DB  $00,$08,$11,$1F,$88,$89,$00,$0E,$DC,$CC,$6E,$E6,$DD,$DD,$D9,$99\n\
    DB  $BB,$BB,$67,$63,$6E,$0E,$EC,$CC,$DD,$DC,$99,$9F,$BB,$B9,$33,$3E\n\
ENDM\n\
\n\
    ENDC ;HARDWARE_INC\n\
";
