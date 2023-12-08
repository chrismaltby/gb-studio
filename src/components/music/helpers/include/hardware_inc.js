/* eslint-disable no-multi-str */
export default `
;*\n
;* Gameboy Hardware definitions\n
;*\n
;* Based on Jones' hardware.inc\n
;* And based on Carsten Sorensen's ideas.\n
;*\n
;* Rev 1.1 - 15-Jul-97 : Added define check\n
;* Rev 1.2 - 18-Jul-97 : Added revision check macro\n
;* Rev 1.3 - 19-Jul-97 : Modified for RGBASM V1.05\n
;* Rev 1.4 - 27-Jul-97 : Modified for new subroutine prefixes\n
;* Rev 1.5 - 15-Aug-97 : Added _HRAM, PAD, CART defines\n
;*                     :  and Nintendo Logo\n
;* Rev 1.6 - 30-Nov-97 : Added rDIV, rTIMA, rTMA, & rTAC\n
;* Rev 1.7 - 31-Jan-98 : Added _SCRN0, _SCRN1\n
;* Rev 1.8 - 15-Feb-98 : Added rSB, rSC\n
;* Rev 1.9 - 16-Feb-98 : Converted I/O registers to $FFXX format\n
;* Rev 2.0 -           : Added GBC registers\n
;* Rev 2.1 -           : Added MBC5 & cart RAM enable/disable defines\n
;* Rev 2.2 -           : Fixed NR42,NR43, & NR44 equates\n
;* Rev 2.3 -           : Fixed incorrect _HRAM equate\n
;* Rev 2.4 - 27-Apr-13 : Added some cart defines (AntonioND)\n
;* Rev 2.5 - 03-May-15 : Fixed format (AntonioND)\n
;* Rev 2.6 - 09-Apr-16 : Added GBC OAM and cart defines (AntonioND)\n
;* Rev 2.7 - 19-Jan-19 : Added rPCMXX (ISSOtm)\n
;* Rev 2.8 - 03-Feb-19 : Added audio registers flags (Álvaro Cuesta)\n
;* Rev 2.9 - 28-Feb-20 : Added utility rP1 constants\n
;* Rev 3.0 - 27-Aug-20 : Register ordering, byte-based sizes, OAM additions, general cleanup (Blitter Object)\n
;* Rev 4.0 - 03-May-21 : Updated to use RGBDS 0.5.0 syntax, changed IEF_LCDC to IEF_STAT (Eievui)\n
;* Rev 4.1 - 16-Aug-21 : Added more flags, bit number defines, and offset constants for OAM and window positions (rondnelson99)\n
;* Rev 4.2 - 04-Sep-21 : Added CH3- and CH4-specific audio registers flags (ISSOtm)\n
;* Rev 4.3 - 07-Nov-21 : Deprecate VRAM address constants (Eievui)\n
;* Rev 4.4 - 11-Jan-22 : Deprecate VRAM CART_SRAM_2KB constant (avivace)\n
;* Rev 4.5 - 03-Mar-22 : Added bit number definitions for OCPS, BCPS and LCDC (sukus)\n
;* Rev 4.6 - 15-Jun-22 : Added MBC3 registers and special values\n
;* Rev 4.7.0 - 27-Jun-22 : Added alternate names for some constants\n
;* Rev 4.7.1 - 05-Jul-22 : Added RPB_LED_ON constant\n
\n
; NOTE: REVISION NUMBER CHANGES MUST BE REFLECTED\n
; IN \`rev_Check_hardware_inc\` BELOW!\n
\n
IF __RGBDS_MAJOR__ == 0 && __RGBDS_MINOR__ < 5\n
    FAIL "This version of 'hardware.inc' requires RGBDS version 0.5.0 or later."\n
ENDC\n
\n
; If all of these are already defined, don't do it again.\n
\n
    IF !DEF(HARDWARE_INC)\n
DEF HARDWARE_INC EQU 1\n
\n
; Usage: rev_Check_hardware_inc <min_ver>\n
; Examples: rev_Check_hardware_inc 4.1.2\n
;           rev_Check_hardware_inc 4.1 (equivalent to 4.1.0)\n
;           rev_Check_hardware_inc 4 (equivalent to 4.0.0)\n
MACRO rev_Check_hardware_inc\n
    DEF CUR_VER equs "4,7,1"    ; ** UPDATE THIS LINE WHEN CHANGING THE REVISION NUMBER **\n
DEF MIN_VER equs STRRPL("huge\\1", ".", ",")\n
    DEF INTERNAL_CHK equs """MACRO ___internal\n
    IF \\1 != \\4 || \\2 < \\5 || (\\2 == \\5 && \\3 < \\6)\n
        FAIL "Version \\1.\\2.\\3 of 'hardware.inc' is incompatible with requested version \\4.\\5.\\6"\n
    ENDC\n
\\nENDM"""\n
    INTERNAL_CHK\n
    ___internal {CUR_VER}, {MIN_VER},0,0\n
    PURGE CUR_VER, MIN_VER, INTERNAL_CHK, ___internal\n
ENDM\n
\n
\n
;***************************************************************************\n
;*\n
;* General memory region constants\n
;*\n
;***************************************************************************\n
\n
DEF _VRAM        EQU $8000 ; $8000->$9FFF\n
DEF _SCRN0       EQU $9800 ; $9800->$9BFF\n
DEF _SCRN1       EQU $9C00 ; $9C00->$9FFF\n
DEF _SRAM        EQU $A000 ; $A000->$BFFF\n
DEF _RAM         EQU $C000 ; $C000->$CFFF / $C000->$DFFF\n
DEF _RAMBANK     EQU $D000 ; $D000->$DFFF\n
DEF _OAMRAM      EQU $FE00 ; $FE00->$FE9F\n
DEF _IO          EQU $FF00 ; $FF00->$FF7F,$FFFF\n
DEF _AUD3WAVERAM EQU $FF30 ; $FF30->$FF3F\n
DEF _HRAM        EQU $FF80 ; $FF80->$FFFE\n
\n
\n
;***************************************************************************\n
;*\n
;* MBC registers\n
;*\n
;***************************************************************************\n
\n
; *** Common ***\n
\n
; --\n
; -- RAMG ($0000-$1FFF)\n
; -- Controls whether access to SRAM (and the MBC3 RTC registers) is allowed (W)\n
; --\n
DEF rRAMG EQU $0000\n
\n
DEF CART_SRAM_ENABLE  EQU $0A\n
DEF CART_SRAM_DISABLE EQU $00\n
\n
\n
; --\n
; -- ROMB0 ($2000-$3FFF)\n
; -- Selects which ROM bank is mapped to the ROMX space ($4000-$7FFF) (W)\n
; --\n
; -- The range of accepted values, as well as the behavior of writing $00,\n
; -- varies depending on the MBC.\n
; --\n
DEF rROMB0 EQU $2000\n
\n
; --\n
; -- RAMB ($4000-$5FFF)\n
; -- Selects which SRAM bank is mapped to the SRAM space ($A000-$BFFF) (W)\n
; --\n
; -- The range of accepted values varies depending on the cartridge configuration.\n
; --\n
DEF rRAMB EQU $4000\n
\n
\n
; *** MBC3-specific registers ***\n
\n
; Write one of these to rRAMG to map the corresponding RTC register to all SRAM space\n
DEF RTC_S  EQU $08 ; Seconds  (0-59)\n
DEF RTC_M  EQU $09 ; Minutes  (0-59)\n
DEF RTC_H  EQU $0A ; Hours    (0-23)\n
DEF RTC_DL EQU $0B ; Lower 8 bits of Day Counter ($00-$FF)\n
DEF RTC_DH EQU $0C ; Bit 7 - Day Counter Carry Bit (1=Counter Overflow)\n
                   ; Bit 6 - Halt (0=Active, 1=Stop Timer)\n
                   ; Bit 0 - Most significant bit of Day Counter (Bit 8)\n
\n
\n
; --\n
; -- RTCLATCH ($6000-$7FFF)\n
; -- Write $00 then $01 to latch the current time into the RTC registers (W)\n
; --\n
DEF rRTCLATCH EQU $6000\n
\n
\n
; *** MBC5-specific register ***\n
\n
; --\n
; -- ROMB1 ($3000-$3FFF)\n
; -- A 9th bit that "extends" ROMB0 if more than 256 banks are present (W)\n
; --\n
; -- Also note that rROMB0 thus only spans $2000-$2FFF.\n
; --\n
DEF rROMB1 EQU $3000\n
\n
\n
; Bit 3 of RAMB enables the rumble motor (if any)\n
DEF CART_RUMBLE_ON EQU 1 << 3\n
\n
\n
;***************************************************************************\n
;*\n
;* Memory-mapped registers\n
;*\n
;***************************************************************************\n
\n
; --\n
; -- P1 ($FF00)\n
; -- Register for reading joy pad info. (R/W)\n
; --\n
DEF rP1 EQU $FF00\n
\n
DEF P1F_5 EQU %00100000 ; P15 out port, set to 0 to get buttons\n
DEF P1F_4 EQU %00010000 ; P14 out port, set to 0 to get dpad\n
DEF P1F_3 EQU %00001000 ; P13 in port\n
DEF P1F_2 EQU %00000100 ; P12 in port\n
DEF P1F_1 EQU %00000010 ; P11 in port\n
DEF P1F_0 EQU %00000001 ; P10 in port\n
\n
DEF P1F_GET_DPAD EQU P1F_5\n
DEF P1F_GET_BTN  EQU P1F_4\n
DEF P1F_GET_NONE EQU P1F_4 | P1F_5\n
\n
\n
; --\n
; -- SB ($FF01)\n
; -- Serial Transfer Data (R/W)\n
; --\n
DEF rSB EQU $FF01\n
\n
\n
; --\n
; -- SC ($FF02)\n
; -- Serial I/O Control (R/W)\n
; --\n
DEF rSC EQU $FF02\n
\n
DEF SCF_START  EQU %10000000 ; Transfer Start Flag (1=Transfer in progress, or requested)\n
DEF SCF_SPEED  EQU %00000010 ; Clock Speed (0=Normal, 1=Fast) ** CGB Mode Only **\n
DEF SCF_SOURCE EQU %00000001 ; Shift Clock (0=External Clock, 1=Internal Clock)\n
\n
DEF SCB_START  EQU 7\n
DEF SCB_SPEED  EQU 1\n
DEF SCB_SOURCE EQU 0\n
\n
; --\n
; -- DIV ($FF04)\n
; -- Divider register (R/W)\n
; --\n
DEF rDIV EQU $FF04\n
\n
\n
; --\n
; -- TIMA ($FF05)\n
; -- Timer counter (R/W)\n
; --\n
DEF rTIMA EQU $FF05\n
\n
\n
; --\n
; -- TMA ($FF06)\n
; -- Timer modulo (R/W)\n
; --\n
DEF rTMA EQU $FF06\n
\n
\n
; --\n
; -- TAC ($FF07)\n
; -- Timer control (R/W)\n
; --\n
DEF rTAC EQU $FF07\n
\n
DEF TACF_START  EQU %00000100\n
DEF TACF_STOP   EQU %00000000\n
DEF TACF_4KHZ   EQU %00000000\n
DEF TACF_16KHZ  EQU %00000011\n
DEF TACF_65KHZ  EQU %00000010\n
DEF TACF_262KHZ EQU %00000001\n
\n
DEF TACB_START  EQU 2\n
\n
\n
; --\n
; -- IF ($FF0F)\n
; -- Interrupt Flag (R/W)\n
; --\n
DEF rIF EQU $FF0F\n
\n
\n
; --\n
; -- AUD1SWEEP/NR10 ($FF10)\n
; -- Sweep register (R/W)\n
; --\n
; -- Bit 6-4 - Sweep Time\n
; -- Bit 3   - Sweep Increase/Decrease\n
; --           0: Addition    (frequency increases???)\n
; --           1: Subtraction (frequency increases???)\n
; -- Bit 2-0 - Number of sweep shift (# 0-7)\n
; -- Sweep Time: (n*7.8ms)\n
; --\n
DEF rNR10 EQU $FF10\n
DEF rAUD1SWEEP EQU rNR10\n
\n
DEF AUD1SWEEP_UP   EQU %00000000\n
DEF AUD1SWEEP_DOWN EQU %00001000\n
\n
\n
; --\n
; -- AUD1LEN/NR11 ($FF11)\n
; -- Sound length/Wave pattern duty (R/W)\n
; --\n
; -- Bit 7-6 - Wave Pattern Duty (00:12.5% 01:25% 10:50% 11:75%)\n
; -- Bit 5-0 - Sound length data (# 0-63)\n
; --\n
DEF rNR11 EQU $FF11\n
DEF rAUD1LEN EQU rNR11\n
\n
\n
; --\n
; -- AUD1ENV/NR12 ($FF12)\n
; -- Envelope (R/W)\n
; --\n
; -- Bit 7-4 - Initial value of envelope\n
; -- Bit 3   - Envelope UP/DOWN\n
; --           0: Decrease\n
; --           1: Range of increase\n
; -- Bit 2-0 - Number of envelope sweep (# 0-7)\n
; --\n
DEF rNR12 EQU $FF12\n
DEF rAUD1ENV EQU rNR12\n
\n
\n
; --\n
; -- AUD1LOW/NR13 ($FF13)\n
; -- Frequency low byte (W)\n
; --\n
DEF rNR13 EQU $FF13\n
DEF rAUD1LOW EQU rNR13\n
\n
\n
; --\n
; -- AUD1HIGH/NR14 ($FF14)\n
; -- Frequency high byte (W)\n
; --\n
; -- Bit 7   - Initial (when set, sound restarts)\n
; -- Bit 6   - Counter/consecutive selection\n
; -- Bit 2-0 - Frequency's higher 3 bits\n
; --\n
DEF rNR14 EQU $FF14\n
DEF rAUD1HIGH EQU rNR14\n
\n
\n
; --\n
; -- AUD2LEN/NR21 ($FF16)\n
; -- Sound Length; Wave Pattern Duty (R/W)\n
; --\n
; -- see AUD1LEN for info\n
; --\n
DEF rNR21 EQU $FF16\n
DEF rAUD2LEN EQU rNR21\n
\n
\n
; --\n
; -- AUD2ENV/NR22 ($FF17)\n
; -- Envelope (R/W)\n
; --\n
; -- see AUD1ENV for info\n
; --\n
DEF rNR22 EQU $FF17\n
DEF rAUD2ENV EQU rNR22\n
\n
\n
; --\n
; -- AUD2LOW/NR23 ($FF18)\n
; -- Frequency low byte (W)\n
; --\n
DEF rNR23 EQU $FF18\n
DEF rAUD2LOW EQU rNR23\n
\n
\n
; --\n
; -- AUD2HIGH/NR24 ($FF19)\n
; -- Frequency high byte (W)\n
; --\n
; -- see AUD1HIGH for info\n
; --\n
DEF rNR24 EQU $FF19\n
DEF rAUD2HIGH EQU rNR24\n
\n
\n
; --\n
; -- AUD3ENA/NR30 ($FF1A)\n
; -- Sound on/off (R/W)\n
; --\n
; -- Bit 7   - Sound ON/OFF (1=ON,0=OFF)\n
; --\n
DEF rNR30 EQU $FF1A\n
DEF rAUD3ENA EQU rNR30\n
\n
DEF AUD3ENA_OFF EQU %00000000\n
DEF AUD3ENA_ON  EQU %10000000\n
\n
\n
; --\n
; -- AUD3LEN/NR31 ($FF1B)\n
; -- Sound length (R/W)\n
; --\n
; -- Bit 7-0 - Sound length\n
; --\n
DEF rNR31 EQU $FF1B\n
DEF rAUD3LEN EQU rNR31\n
\n
\n
; --\n
; -- AUD3LEVEL/NR32 ($FF1C)\n
; -- Select output level\n
; --\n
; -- Bit 6-5 - Select output level\n
; --           00: 0/1 (mute)\n
; --           01: 1/1\n
; --           10: 1/2\n
; --           11: 1/4\n
; --\n
DEF rNR32 EQU $FF1C\n
DEF rAUD3LEVEL EQU rNR32\n
\n
DEF AUD3LEVEL_MUTE EQU %00000000\n
DEF AUD3LEVEL_100  EQU %00100000\n
DEF AUD3LEVEL_50   EQU %01000000\n
DEF AUD3LEVEL_25   EQU %01100000\n
\n
\n
; --\n
; -- AUD3LOW/NR33 ($FF1D)\n
; -- Frequency low byte (W)\n
; --\n
; -- see AUD1LOW for info\n
; --\n
DEF rNR33 EQU $FF1D\n
DEF rAUD3LOW EQU rNR33\n
\n
\n
; --\n
; -- AUD3HIGH/NR34 ($FF1E)\n
; -- Frequency high byte (W)\n
; --\n
; -- see AUD1HIGH for info\n
; --\n
DEF rNR34 EQU $FF1E\n
DEF rAUD3HIGH EQU rNR34\n
\n
\n
; --\n
; -- AUD4LEN/NR41 ($FF20)\n
; -- Sound length (R/W)\n
; --\n
; -- Bit 5-0 - Sound length data (# 0-63)\n
; --\n
DEF rNR41 EQU $FF20\n
DEF rAUD4LEN EQU rNR41\n
\n
\n
; --\n
; -- AUD4ENV/NR42 ($FF21)\n
; -- Envelope (R/W)\n
; --\n
; -- see AUD1ENV for info\n
; --\n
DEF rNR42 EQU $FF21\n
DEF rAUD4ENV EQU rNR42\n
\n
\n
; --\n
; -- AUD4POLY/NR43 ($FF22)\n
; -- Polynomial counter (R/W)\n
; --\n
; -- Bit 7-4 - Selection of the shift clock frequency of the (scf)\n
; --           polynomial counter (0000-1101)\n
; --           freq=drf*1/2^scf (not sure)\n
; -- Bit 3 -   Selection of the polynomial counter's step\n
; --           0: 15 steps\n
; --           1: 7 steps\n
; -- Bit 2-0 - Selection of the dividing ratio of frequencies (drf)\n
; --           000: f/4   001: f/8   010: f/16  011: f/24\n
; --           100: f/32  101: f/40  110: f/48  111: f/56  (f=4.194304 Mhz)\n
; --\n
DEF rNR43 EQU $FF22\n
DEF rAUD4POLY EQU rNR43\n
\n
DEF AUD4POLY_15STEP EQU %00000000\n
DEF AUD4POLY_7STEP  EQU %00001000\n
\n
\n
; --\n
; -- AUD4GO/NR44 ($FF23)\n
; --\n
; -- Bit 7 -   Initial (when set, sound restarts)\n
; -- Bit 6 -   Counter/consecutive selection\n
; --\n
DEF rNR44 EQU $FF23\n
DEF rAUD4GO EQU rNR44\n
\n
\n
; --\n
; -- AUDVOL/NR50 ($FF24)\n
; -- Channel control / ON-OFF / Volume (R/W)\n
; --\n
; -- Bit 7   - Vin->SO2 ON/OFF (left)\n
; -- Bit 6-4 - SO2 output level (left speaker) (# 0-7)\n
; -- Bit 3   - Vin->SO1 ON/OFF (right)\n
; -- Bit 2-0 - SO1 output level (right speaker) (# 0-7)\n
; --\n
DEF rNR50 EQU $FF24\n
DEF rAUDVOL EQU rNR50\n
\n
DEF AUDVOL_VIN_LEFT  EQU %10000000 ; SO2\n
DEF AUDVOL_VIN_RIGHT EQU %00001000 ; SO1\n
\n
\n
; --\n
; -- AUDTERM/NR51 ($FF25)\n
; -- Selection of Sound output terminal (R/W)\n
; --\n
; -- Bit 7   - Output channel 4 to SO2 terminal (left)\n
; -- Bit 6   - Output channel 3 to SO2 terminal (left)\n
; -- Bit 5   - Output channel 2 to SO2 terminal (left)\n
; -- Bit 4   - Output channel 1 to SO2 terminal (left)\n
; -- Bit 3   - Output channel 4 to SO1 terminal (right)\n
; -- Bit 2   - Output channel 3 to SO1 terminal (right)\n
; -- Bit 1   - Output channel 2 to SO1 terminal (right)\n
; -- Bit 0   - Output channel 1 to SO1 terminal (right)\n
; --\n
DEF rNR51 EQU $FF25\n
DEF rAUDTERM EQU rNR51\n
\n
; SO2\n
DEF AUDTERM_4_LEFT  EQU %10000000\n
DEF AUDTERM_3_LEFT  EQU %01000000\n
DEF AUDTERM_2_LEFT  EQU %00100000\n
DEF AUDTERM_1_LEFT  EQU %00010000\n
; SO1\n
DEF AUDTERM_4_RIGHT EQU %00001000\n
DEF AUDTERM_3_RIGHT EQU %00000100\n
DEF AUDTERM_2_RIGHT EQU %00000010\n
DEF AUDTERM_1_RIGHT EQU %00000001\n
\n
\n
; --\n
; -- AUDENA/NR52 ($FF26)\n
; -- Sound on/off (R/W)\n
; --\n
; -- Bit 7   - All sound on/off (sets all audio regs to 0!)\n
; -- Bit 3   - Sound 4 ON flag (read only)\n
; -- Bit 2   - Sound 3 ON flag (read only)\n
; -- Bit 1   - Sound 2 ON flag (read only)\n
; -- Bit 0   - Sound 1 ON flag (read only)\n
; --\n
DEF rNR52 EQU $FF26\n
DEF rAUDENA EQU rNR52\n
\n
DEF AUDENA_ON    EQU %10000000\n
DEF AUDENA_OFF   EQU %00000000  ; sets all audio regs to 0!\n
\n
\n
; --\n
; -- LCDC ($FF40)\n
; -- LCD Control (R/W)\n
; --\n
DEF rLCDC EQU $FF40\n
\n
DEF LCDCF_OFF     EQU %00000000 ; LCD Control Operation\n
DEF LCDCF_ON      EQU %10000000 ; LCD Control Operation\n
DEF LCDCF_WIN9800 EQU %00000000 ; Window Tile Map Display Select\n
DEF LCDCF_WIN9C00 EQU %01000000 ; Window Tile Map Display Select\n
DEF LCDCF_WINOFF  EQU %00000000 ; Window Display\n
DEF LCDCF_WINON   EQU %00100000 ; Window Display\n
DEF LCDCF_BG8800  EQU %00000000 ; BG & Window Tile Data Select\n
DEF LCDCF_BG8000  EQU %00010000 ; BG & Window Tile Data Select\n
DEF LCDCF_BG9800  EQU %00000000 ; BG Tile Map Display Select\n
DEF LCDCF_BG9C00  EQU %00001000 ; BG Tile Map Display Select\n
DEF LCDCF_OBJ8    EQU %00000000 ; OBJ Construction\n
DEF LCDCF_OBJ16   EQU %00000100 ; OBJ Construction\n
DEF LCDCF_OBJOFF  EQU %00000000 ; OBJ Display\n
DEF LCDCF_OBJON   EQU %00000010 ; OBJ Display\n
DEF LCDCF_BGOFF   EQU %00000000 ; BG Display\n
DEF LCDCF_BGON    EQU %00000001 ; BG Display\n
\n
DEF LCDCB_ON      EQU 7 ; LCD Control Operation\n
DEF LCDCB_WIN9C00 EQU 6 ; Window Tile Map Display Select\n
DEF LCDCB_WINON   EQU 5 ; Window Display\n
DEF LCDCB_BG8000  EQU 4 ; BG & Window Tile Data Select\n
DEF LCDCB_BG9C00  EQU 3 ; BG Tile Map Display Select\n
DEF LCDCB_OBJ16   EQU 2 ; OBJ Construction\n
DEF LCDCB_OBJON   EQU 1 ; OBJ Display\n
DEF LCDCB_BGON    EQU 0 ; BG Display\n
; "Window Character Data Select" follows BG\n
\n
\n
; --\n
; -- STAT ($FF41)\n
; -- LCDC Status   (R/W)\n
; --\n
DEF rSTAT EQU $FF41\n
\n
DEF STATF_LYC     EQU  %01000000 ; LYC=LY Coincidence (Selectable)\n
DEF STATF_MODE10  EQU  %00100000 ; Mode 10\n
DEF STATF_MODE01  EQU  %00010000 ; Mode 01 (V-Blank)\n
DEF STATF_MODE00  EQU  %00001000 ; Mode 00 (H-Blank)\n
DEF STATF_LYCF    EQU  %00000100 ; Coincidence Flag\n
DEF STATF_HBL     EQU  %00000000 ; H-Blank\n
DEF STATF_VBL     EQU  %00000001 ; V-Blank\n
DEF STATF_OAM     EQU  %00000010 ; OAM-RAM is used by system\n
DEF STATF_LCD     EQU  %00000011 ; Both OAM and VRAM used by system\n
DEF STATF_BUSY    EQU  %00000010 ; When set, VRAM access is unsafe\n
\n
DEF STATB_LYC     EQU  6\n
DEF STATB_MODE10  EQU  5\n
DEF STATB_MODE01  EQU  4\n
DEF STATB_MODE00  EQU  3\n
DEF STATB_LYCF    EQU  2\n
DEF STATB_BUSY    EQU  1\n
\n
; --\n
; -- SCY ($FF42)\n
; -- Scroll Y (R/W)\n
; --\n
DEF rSCY EQU $FF42\n
\n
\n
; --\n
; -- SCX ($FF43)\n
; -- Scroll X (R/W)\n
; --\n
DEF rSCX EQU $FF43\n
\n
\n
; --\n
; -- LY ($FF44)\n
; -- LCDC Y-Coordinate (R)\n
; --\n
; -- Values range from 0->153. 144->153 is the VBlank period.\n
; --\n
DEF rLY EQU $FF44\n
\n
\n
; --\n
; -- LYC ($FF45)\n
; -- LY Compare (R/W)\n
; --\n
; -- When LY==LYC, STATF_LYCF will be set in STAT\n
; --\n
DEF rLYC EQU $FF45\n
\n
\n
; --\n
; -- DMA ($FF46)\n
; -- DMA Transfer and Start Address (W)\n
; --\n
DEF rDMA EQU $FF46\n
\n
\n
; --\n
; -- BGP ($FF47)\n
; -- BG Palette Data (W)\n
; --\n
; -- Bit 7-6 - Intensity for %11\n
; -- Bit 5-4 - Intensity for %10\n
; -- Bit 3-2 - Intensity for %01\n
; -- Bit 1-0 - Intensity for %00\n
; --\n
DEF rBGP EQU $FF47\n
\n
\n
; --\n
; -- OBP0 ($FF48)\n
; -- Object Palette 0 Data (W)\n
; --\n
; -- See BGP for info\n
; --\n
DEF rOBP0 EQU $FF48\n
\n
\n
; --\n
; -- OBP1 ($FF49)\n
; -- Object Palette 1 Data (W)\n
; --\n
; -- See BGP for info\n
; --\n
DEF rOBP1 EQU $FF49\n
\n
\n
; --\n
; -- WY ($FF4A)\n
; -- Window Y Position (R/W)\n
; --\n
; -- 0 <= WY <= 143\n
; -- When WY = 0, the window is displayed from the top edge of the LCD screen.\n
; --\n
DEF rWY EQU $FF4A\n
\n
\n
; --\n
; -- WX ($FF4B)\n
; -- Window X Position (R/W)\n
; --\n
; -- 7 <= WX <= 166\n
; -- When WX = 7, the window is displayed from the left edge of the LCD screen.\n
; -- Values of 0-6 and 166 are unreliable due to hardware bugs.\n
; --\n
DEF rWX EQU $FF4B\n
\n
DEF WX_OFS EQU 7 ; add this to a screen position to get a WX position\n
\n
\n
; --\n
; -- SPEED ($FF4D)\n
; -- Select CPU Speed (R/W)\n
; --\n
DEF rKEY1 EQU $FF4D\n
DEF rSPD  EQU rKEY1\n
\n
DEF KEY1F_DBLSPEED EQU %10000000 ; 0=Normal Speed, 1=Double Speed (R)\n
DEF KEY1F_PREPARE  EQU %00000001 ; 0=No, 1=Prepare (R/W)\n
\n
\n
; --\n
; -- VBK ($FF4F)\n
; -- Select Video RAM Bank (R/W)\n
; --\n
; -- Bit 0 - Bank Specification (0: Specify Bank 0; 1: Specify Bank 1)\n
; --\n
DEF rVBK EQU $FF4F\n
\n
\n
; --\n
; -- HDMA1 ($FF51)\n
; -- High byte for Horizontal Blanking/General Purpose DMA source address (W)\n
; -- CGB Mode Only\n
; --\n
DEF rHDMA1 EQU $FF51\n
\n
\n
; --\n
; -- HDMA2 ($FF52)\n
; -- Low byte for Horizontal Blanking/General Purpose DMA source address (W)\n
; -- CGB Mode Only\n
; --\n
DEF rHDMA2 EQU $FF52\n
\n
\n
; --\n
; -- HDMA3 ($FF53)\n
; -- High byte for Horizontal Blanking/General Purpose DMA destination address (W)\n
; -- CGB Mode Only\n
; --\n
DEF rHDMA3 EQU $FF53\n
\n
\n
; --\n
; -- HDMA4 ($FF54)\n
; -- Low byte for Horizontal Blanking/General Purpose DMA destination address (W)\n
; -- CGB Mode Only\n
; --\n
DEF rHDMA4 EQU $FF54\n
\n
\n
; --\n
; -- HDMA5 ($FF55)\n
; -- Transfer length (in tiles minus 1)/mode/start for Horizontal Blanking, General Purpose DMA (R/W)\n
; -- CGB Mode Only\n
; --\n
DEF rHDMA5 EQU $FF55\n
\n
DEF HDMA5F_MODE_GP  EQU %00000000 ; General Purpose DMA (W)\n
DEF HDMA5F_MODE_HBL EQU %10000000 ; HBlank DMA (W)\n
DEF HDMA5B_MODE EQU 7 ; DMA mode select (W)\n
\n
; -- Once DMA has started, use HDMA5F_BUSY to check when the transfer is complete\n
DEF HDMA5F_BUSY EQU %10000000 ; 0=Busy (DMA still in progress), 1=Transfer complete (R)\n
\n
\n
; --\n
; -- RP ($FF56)\n
; -- Infrared Communications Port (R/W)\n
; -- CGB Mode Only\n
; --\n
DEF rRP EQU $FF56\n
\n
DEF RPF_ENREAD   EQU %11000000\n
DEF RPF_DATAIN   EQU %00000010 ; 0=Receiving IR Signal, 1=Normal\n
DEF RPF_WRITE_HI EQU %00000001\n
DEF RPF_WRITE_LO EQU %00000000\n
\n
DEF RPB_LED_ON   EQU 0\n
DEF RPB_DATAIN   EQU 1\n
\n
\n
; --\n
; -- BCPS/BGPI ($FF68)\n
; -- Background Color Palette Specification (aka Background Palette Index) (R/W)\n
; --\n
DEF rBCPS EQU $FF68\n
DEF rBGPI EQU rBCPS\n
\n
DEF BCPSF_AUTOINC EQU %10000000 ; Auto Increment (0=Disabled, 1=Increment after Writing)\n
DEF BCPSB_AUTOINC EQU 7\n
DEF BGPIF_AUTOINC EQU BCPSF_AUTOINC\n
DEF BGPIB_AUTOINC EQU BCPSB_AUTOINC\n
\n
\n
; --\n
; -- BCPD/BGPD ($FF69)\n
; -- Background Color Palette Data (aka Background Palette Data) (R/W)\n
; --\n
DEF rBCPD EQU $FF69\n
DEF rBGPD EQU rBCPD\n
\n
\n
; --\n
; -- OCPS/OBPI ($FF6A)\n
; -- Object Color Palette Specification (aka Object Background Palette Index) (R/W)\n
; --\n
DEF rOCPS EQU $FF6A\n
DEF rOBPI EQU rOCPS\n
\n
DEF OCPSF_AUTOINC EQU %10000000 ; Auto Increment (0=Disabled, 1=Increment after Writing)\n
DEF OCPSB_AUTOINC EQU 7\n
DEF OBPIF_AUTOINC EQU OCPSF_AUTOINC\n
DEF OBPIB_AUTOINC EQU OCPSB_AUTOINC\n
\n
\n
; --\n
; -- OCPD/OBPD ($FF6B)\n
; -- Object Color Palette Data (aka Object Background Palette Data) (R/W)\n
; --\n
DEF rOCPD EQU $FF6B\n
DEF rOBPD EQU rOCPD\n
\n
\n
; --\n
; -- SMBK/SVBK ($FF70)\n
; -- Select Main RAM Bank (R/W)\n
; --\n
; -- Bit 2-0 - Bank Specification (0,1: Specify Bank 1; 2-7: Specify Banks 2-7)\n
; --\n
DEF rSVBK EQU $FF70\n
DEF rSMBK EQU rSVBK\n
\n
\n
; --\n
; -- PCM12 ($FF76)\n
; -- Sound channel 1&2 PCM amplitude (R)\n
; --\n
; -- Bit 7-4 - Copy of sound channel 2's PCM amplitude\n
; -- Bit 3-0 - Copy of sound channel 1's PCM amplitude\n
; --\n
DEF rPCM12 EQU $FF76\n
\n
\n
; --\n
; -- PCM34 ($FF77)\n
; -- Sound channel 3&4 PCM amplitude (R)\n
; --\n
; -- Bit 7-4 - Copy of sound channel 4's PCM amplitude\n
; -- Bit 3-0 - Copy of sound channel 3's PCM amplitude\n
; --\n
DEF rPCM34 EQU $FF77\n
\n
\n
; --\n
; -- IE ($FFFF)\n
; -- Interrupt Enable (R/W)\n
; --\n
DEF rIE EQU $FFFF\n
\n
DEF IEF_HILO   EQU %00010000 ; Transition from High to Low of Pin number P10-P13\n
DEF IEF_SERIAL EQU %00001000 ; Serial I/O transfer end\n
DEF IEF_TIMER  EQU %00000100 ; Timer Overflow\n
DEF IEF_STAT   EQU %00000010 ; STAT\n
DEF IEF_VBLANK EQU %00000001 ; V-Blank\n
\n
DEF IEB_HILO   EQU 4\n
DEF IEB_SERIAL EQU 3\n
DEF IEB_TIMER  EQU 2\n
DEF IEB_STAT   EQU 1\n
DEF IEB_VBLANK EQU 0\n
\n
\n
;***************************************************************************\n
;*\n
;* Flags common to multiple sound channels\n
;*\n
;***************************************************************************\n
\n
; --\n
; -- Square wave duty cycle\n
; --\n
; -- Can be used with AUD1LEN and AUD2LEN\n
; -- See AUD1LEN for more info\n
; --\n
DEF AUDLEN_DUTY_12_5    EQU %00000000 ; 12.5%\n
DEF AUDLEN_DUTY_25      EQU %01000000 ; 25%\n
DEF AUDLEN_DUTY_50      EQU %10000000 ; 50%\n
DEF AUDLEN_DUTY_75      EQU %11000000 ; 75%\n
\n
\n
; --\n
; -- Audio envelope flags\n
; --\n
; -- Can be used with AUD1ENV, AUD2ENV, AUD4ENV\n
; -- See AUD1ENV for more info\n
; --\n
DEF AUDENV_UP           EQU %00001000\n
DEF AUDENV_DOWN         EQU %00000000\n
\n
\n
; --\n
; -- Audio trigger flags\n
; --\n
; -- Can be used with AUD1HIGH, AUD2HIGH, AUD3HIGH\n
; -- See AUD1HIGH for more info\n
; --\n
DEF AUDHIGH_RESTART     EQU %10000000\n
DEF AUDHIGH_LENGTH_ON   EQU %01000000\n
DEF AUDHIGH_LENGTH_OFF  EQU %00000000\n
\n
\n
;***************************************************************************\n
;*\n
;* CPU values on bootup (a=type, b=qualifier)\n
;*\n
;***************************************************************************\n
\n
DEF BOOTUP_A_DMG    EQU $01 ; Dot Matrix Game\n
DEF BOOTUP_A_CGB    EQU $11 ; Color GameBoy\n
DEF BOOTUP_A_MGB    EQU $FF ; Mini GameBoy (Pocket GameBoy)\n
\n
; if a=BOOTUP_A_CGB, bit 0 in b can be checked to determine if real CGB or\n
; other system running in GBC mode\n
DEF BOOTUP_B_CGB    EQU %00000000\n
DEF BOOTUP_B_AGB    EQU %00000001   ; GBA, GBA SP, Game Boy Player, or New GBA SP\n
\n
\n
;***************************************************************************\n
;*\n
;* Header\n
;*\n
;***************************************************************************\n
\n
;*\n
;* Nintendo scrolling logo\n
;* (Code won't work on a real GameBoy)\n
;* (if next lines are altered.)\n
MACRO NINTENDO_LOGO\n
    DB  $CE,$ED,$66,$66,$CC,$0D,$00,$0B,$03,$73,$00,$83,$00,$0C,$00,$0D\n
    DB  $00,$08,$11,$1F,$88,$89,$00,$0E,$DC,$CC,$6E,$E6,$DD,$DD,$D9,$99\n
    DB  $BB,$BB,$67,$63,$6E,$0E,$EC,$CC,$DD,$DC,$99,$9F,$BB,$B9,$33,$3E\n
ENDM\n
\n
; $0143 Color GameBoy compatibility code\n
DEF CART_COMPATIBLE_DMG     EQU $00\n
DEF CART_COMPATIBLE_DMG_GBC EQU $80\n
DEF CART_COMPATIBLE_GBC     EQU $C0\n
\n
; $0146 GameBoy/Super GameBoy indicator\n
DEF CART_INDICATOR_GB       EQU $00\n
DEF CART_INDICATOR_SGB      EQU $03\n
\n
; $0147 Cartridge type\n
DEF CART_ROM                     EQU $00\n
DEF CART_ROM_MBC1                EQU $01\n
DEF CART_ROM_MBC1_RAM            EQU $02\n
DEF CART_ROM_MBC1_RAM_BAT        EQU $03\n
DEF CART_ROM_MBC2                EQU $05\n
DEF CART_ROM_MBC2_BAT            EQU $06\n
DEF CART_ROM_RAM                 EQU $08\n
DEF CART_ROM_RAM_BAT             EQU $09\n
DEF CART_ROM_MMM01               EQU $0B\n
DEF CART_ROM_MMM01_RAM           EQU $0C\n
DEF CART_ROM_MMM01_RAM_BAT       EQU $0D\n
DEF CART_ROM_MBC3_BAT_RTC        EQU $0F\n
DEF CART_ROM_MBC3_RAM_BAT_RTC    EQU $10\n
DEF CART_ROM_MBC3                EQU $11\n
DEF CART_ROM_MBC3_RAM            EQU $12\n
DEF CART_ROM_MBC3_RAM_BAT        EQU $13\n
DEF CART_ROM_MBC5                EQU $19\n
DEF CART_ROM_MBC5_BAT            EQU $1A\n
DEF CART_ROM_MBC5_RAM_BAT        EQU $1B\n
DEF CART_ROM_MBC5_RUMBLE         EQU $1C\n
DEF CART_ROM_MBC5_RAM_RUMBLE     EQU $1D\n
DEF CART_ROM_MBC5_RAM_BAT_RUMBLE EQU $1E\n
DEF CART_ROM_MBC7_RAM_BAT_GYRO   EQU $22\n
DEF CART_ROM_POCKET_CAMERA       EQU $FC\n
DEF CART_ROM_BANDAI_TAMA5        EQU $FD\n
DEF CART_ROM_HUDSON_HUC3         EQU $FE\n
DEF CART_ROM_HUDSON_HUC1         EQU $FF\n
\n
; $0148 ROM size\n
; these are kilobytes\n
DEF CART_ROM_32KB   EQU $00 ; 2 banks\n
DEF CART_ROM_64KB   EQU $01 ; 4 banks\n
DEF CART_ROM_128KB  EQU $02 ; 8 banks\n
DEF CART_ROM_256KB  EQU $03 ; 16 banks\n
DEF CART_ROM_512KB  EQU $04 ; 32 banks\n
DEF CART_ROM_1024KB EQU $05 ; 64 banks\n
DEF CART_ROM_2048KB EQU $06 ; 128 banks\n
DEF CART_ROM_4096KB EQU $07 ; 256 banks\n
DEF CART_ROM_8192KB EQU $08 ; 512 banks\n
DEF CART_ROM_1152KB EQU $52 ; 72 banks\n
DEF CART_ROM_1280KB EQU $53 ; 80 banks\n
DEF CART_ROM_1536KB EQU $54 ; 96 banks\n
\n
; $0149 SRAM size\n
; these are kilobytes\n
DEF CART_SRAM_NONE  EQU 0\n
DEF CART_SRAM_8KB   EQU 2 ; 1 bank\n
DEF CART_SRAM_32KB  EQU 3 ; 4 banks\n
DEF CART_SRAM_128KB EQU 4 ; 16 banks\n
\n
; $014A Destination code\n
DEF CART_DEST_JAPANESE     EQU $00\n
DEF CART_DEST_NON_JAPANESE EQU $01\n
\n
\n
;***************************************************************************\n
;*\n
;* Keypad related\n
;*\n
;***************************************************************************\n
\n
DEF PADF_DOWN   EQU $80\n
DEF PADF_UP     EQU $40\n
DEF PADF_LEFT   EQU $20\n
DEF PADF_RIGHT  EQU $10\n
DEF PADF_START  EQU $08\n
DEF PADF_SELECT EQU $04\n
DEF PADF_B      EQU $02\n
DEF PADF_A      EQU $01\n
\n
DEF PADB_DOWN   EQU $7\n
DEF PADB_UP     EQU $6\n
DEF PADB_LEFT   EQU $5\n
DEF PADB_RIGHT  EQU $4\n
DEF PADB_START  EQU $3\n
DEF PADB_SELECT EQU $2\n
DEF PADB_B      EQU $1\n
DEF PADB_A      EQU $0\n
\n
\n
;***************************************************************************\n
;*\n
;* Screen related\n
;*\n
;***************************************************************************\n
\n
DEF SCRN_X    EQU 160 ; Width of screen in pixels\n
DEF SCRN_Y    EQU 144 ; Height of screen in pixels. Also corresponds to the value in LY at the beginning of VBlank.\n
DEF SCRN_X_B  EQU 20  ; Width of screen in bytes\n
DEF SCRN_Y_B  EQU 18  ; Height of screen in bytes\n
\n
DEF SCRN_VX   EQU 256 ; Virtual width of screen in pixels\n
DEF SCRN_VY   EQU 256 ; Virtual height of screen in pixels\n
DEF SCRN_VX_B EQU 32  ; Virtual width of screen in bytes\n
DEF SCRN_VY_B EQU 32  ; Virtual height of screen in bytes\n
\n
\n
;***************************************************************************\n
;*\n
;* OAM related\n
;*\n
;***************************************************************************\n
\n
; OAM attributes\n
; each entry in OAM RAM is 4 bytes (sizeof_OAM_ATTRS)\n
RSRESET\n
DEF OAMA_Y              RB  1   ; y pos plus 16\n
DEF OAMA_X              RB  1   ; x pos plus 8\n
DEF OAMA_TILEID         RB  1   ; tile id\n
DEF OAMA_FLAGS          RB  1   ; flags (see below)\n
DEF sizeof_OAM_ATTRS    RB  0\n
\n
DEF OAM_Y_OFS EQU 16 ; add this to a screen-relative Y position to get an OAM Y position\n
DEF OAM_X_OFS EQU 8  ; add this to a screen-relative X position to get an OAM X position\n
\n
DEF OAM_COUNT           EQU 40  ; number of OAM entries in OAM RAM\n
\n
; flags\n
DEF OAMF_PRI        EQU %10000000 ; Priority\n
DEF OAMF_YFLIP      EQU %01000000 ; Y flip\n
DEF OAMF_XFLIP      EQU %00100000 ; X flip\n
DEF OAMF_PAL0       EQU %00000000 ; Palette number; 0,1 (DMG)\n
DEF OAMF_PAL1       EQU %00010000 ; Palette number; 0,1 (DMG)\n
DEF OAMF_BANK0      EQU %00000000 ; Bank number; 0,1 (GBC)\n
DEF OAMF_BANK1      EQU %00001000 ; Bank number; 0,1 (GBC)\n
\n
DEF OAMF_PALMASK    EQU %00000111 ; Palette (GBC)\n
\n
DEF OAMB_PRI        EQU 7 ; Priority\n
DEF OAMB_YFLIP      EQU 6 ; Y flip\n
DEF OAMB_XFLIP      EQU 5 ; X flip\n
DEF OAMB_PAL1       EQU 4 ; Palette number; 0,1 (DMG)\n
DEF OAMB_BANK1      EQU 3 ; Bank number; 0,1 (GBC)\n
\n
\n
; Deprecated constants. Please avoid using.\n
\n
DEF IEF_LCDC   EQU %00000010 ; LCDC (see STAT)\n
DEF _VRAM8000  EQU _VRAM\n
DEF _VRAM8800  EQU _VRAM+$800\n
DEF _VRAM9000  EQU _VRAM+$1000\n
DEF CART_SRAM_2KB   EQU 1 ; 1 incomplete bank\n
\n
\n
    ENDC ;HARDWARE_INC`;
