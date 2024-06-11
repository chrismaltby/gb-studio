        ;; Maximum number of times LCD ISR can be repeatedly called
        .MAX_LCD_ISR_CALLS = 4

        ;; Transfer buffer (lower half of hardware stack)
        __vram_transfer_buffer = 0x100
        ;; Number of 8-cycles available each frame for transfer buffer
        VRAM_DELAY_CYCLES_X8  = 171

        ;;  Keypad
        .UP             = 0x08
        .DOWN           = 0x04
        .LEFT           = 0x02
        .RIGHT          = 0x01
        .A              = 0x80
        .B              = 0x40
        .SELECT         = 0x20
        .START          = 0x10

        ;;  Screen dimensions (in tiles)
        .DEVICE_SCREEN_WIDTH            = 32
        .DEVICE_SCREEN_HEIGHT           = 30
        .DEVICE_SCREEN_BUFFER_WIDTH     = 32
        .DEVICE_SCREEN_BUFFER_HEIGHT    = 30
        .MAXCURSPOSX    = 31
        .MAXCURSPOSY    = 29

        .SCREENWIDTH    = 256
        .SCREENHEIGHT   = 240

        ;; NAMETABLES
        PPU_NT0         = 0x2000
        PPU_AT0         = 0x23C0

        ATTRIBUTE_WIDTH                = 16
        ATTRIBUTE_HEIGHT               = 15
        ATTRIBUTE_PACKED_WIDTH         = 8
        ATTRIBUTE_PACKED_HEIGHT        = 8
        ATTRIBUTE_MASK_TL = 0b00000011
        ATTRIBUTE_MASK_TR = 0b00001100
        ATTRIBUTE_MASK_BL = 0b00110000
        ATTRIBUTE_MASK_BR = 0b11000000

        ;; Hardware registers / masks
        PPUCTRL             = 0x2000
        PPUCTRL_NMI         = 0b10000000
        PPUCTRL_SPR_8X8     = 0b00000000
        PPUCTRL_SPR_8X16    = 0b00100000
        PPUCTRL_BG_CHR      = 0b00010000
        PPUCTRL_SPR_CHR     = 0b00001000
        PPUCTRL_INC32       = 0b00000100
        ;
        PPUMASK             = 0x2001
        PPUMASK_BLUE        = 0b10000000
        PPUMASK_RED         = 0b01000000
        PPUMASK_GREEN       = 0b00100000
        PPUMASK_SHOW_SPR    = 0b00010000
        PPUMASK_SHOW_BG     = 0b00001000
        PPUMASK_SHOW_SPR_LC = 0b00000100
        PPUMASK_SHOW_BG_LC  = 0b00000010
        PPUMASK_MONOCHROME  = 0b00000001
        ;
        PPUSTATUS       = 0x2002
        ;
        OAMADDR         = 0x2003
        ;
        OAMDATA         = 0x2004
        ;
        PPUSCROLL       = 0x2005
        ;
        PPUADDR         = 0x2006
        ;
        PPUDATA         = 0x2007
        ;
        OAMDMA          = 0x4014
        ;
        JOY1            = 0x4016
        ;
        JOY2            = 0x4017

        ;; OAM related constants

        OAM_COUNT       = 64  ; number of OAM entries in OAM RAM

        OAM_POS_Y       = 0
        OAM_TILE_INDEX  = 1
        OAM_ATTRIBUTES  = 2
        OAM_POS_X       = 3

        OAMF_PRI        = 0b00100000 ; Priority
        OAMF_YFLIP      = 0b10000000 ; Y flip
        OAMF_XFLIP      = 0b01000000 ; X flip

        ;; GBDK library screen modes

        .G_MODE         = 0x01  ; Graphic mode
        .T_MODE         = 0x02  ; Text mode (bit 2)
        .T_MODE_OUT     = 0x02  ; Text mode output only
        .T_MODE_INOUT   = 0x03  ; Text mode with input
        .M_NO_SCROLL    = 0x04  ; Disables scrolling of the screen in text mode
        .M_NO_INTERP    = 0x08  ; Disables special character interpretation

        ;; Table of routines for modes
        .MODE_TABLE     = 0xFFE0

        ;; C related
        ;; Overheap of a banked call.  Used for parameters
        ;;  = ret + real ret + bank

        .BANKOV         = 6

        .globl  __current_bank
        .globl  __shadow_OAM_base

        ;; Global variables
        .globl  .mode
        .define .tmp "REGTEMP"

        .globl _shadow_PPUCTRL, _shadow_PPUMASK
        .globl _bkg_scroll_x, _bkg_scroll_y
        .globl __crt0_paletteShadow
        .globl _attribute_shadow, _attribute_row_dirty
        
        ;; Identity table for register-to-register-adds and bankswitching
        .globl .identity, _identity

        ;; Global routines

        .globl  .display_off, .display_on
        .globl  .wait_vbl_done

        ;; Symbols defined at link time
        .globl _shadow_OAM, __vram_transfer_buffer

        ;; Main user routine
        .globl  _main

.macro DIV_PART divident divisor ?lbl
        rol divident
        rol
        sec
        sbc divisor
        bcs lbl
        adc divisor
lbl:
.endm
.macro FAST_DIV8 divident divisor
        ; returns quotient in A
        .rept 8
                DIV_PART divident divisor
        .endm
        lda divident
        eor #0xFF
.endm
.macro FAST_MOD8 divident divisor
        ; returns modulus in A
        .rept 8
                DIV_PART divident divisor
        .endm
.endm
