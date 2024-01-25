        .GG_STATE       = 0x00
        
        .GGSTATE_STT    = 0b10000000
        .GGSTATE_NJAP   = 0b01000000
        .GGSTATE_NNTS   = 0b00100000

        .GG_EXT_7BIT    = 0x01

        .GG_EXT_CTL     = 0x02

        .GGEXT_NINIT    = 0b10000000

        .GG_SIO_SEND    = 0x03
        .GG_SIO_RECV    = 0x04
        .GG_SIO_CTL     = 0x05

        .SIOCTL_TXFL    = 0b00000001
        .SIOCTL_RXRD    = 0b00000010
        .SIOCTL_FRER    = 0b00000100
        .SIOCTL_INT     = 0b00001000
        .SIOCTL_TON     = 0b00010000
        .SIOCTL_RON     = 0b00100000
        .SIOCTL_BS0     = 0b01000000
        .SIOCTL_BS1     = 0b10000000

        .GG_SOUND_PAN   = 0x06

        .SOUNDPAN_TN1R  = 0b00000001
        .SOUNDPAN_TN2R  = 0b00000010
        .SOUNDPAN_TN3R  = 0b00000100
        .SOUNDPAN_NOSR  = 0b00001000
        .SOUNDPAN_TN1L  = 0b00010000
        .SOUNDPAN_TN2L  = 0b00100000
        .SOUNDPAN_TN3L  = 0b01000000
        .SOUNDPAN_NOSL  = 0b10000000

        .MEMORY_CTL     = 0x3E

        .MEMCTL_JOYON   = 0b00000000
        .MEMCTL_JOYOFF  = 0b00000100
        .MEMCTL_BASEON  = 0b00000000
        .MEMCTL_BASEOFF = 0b00001000
        .MEMCTL_RAMON   = 0b00000000
        .MEMCTL_RAMOFF  = 0b00010000
        .MEMCTL_CROMON  = 0b00000000
        .MEMCTL_CROMOFF = 0b00100000
        .MEMCTL_ROMON   = 0b00000000
        .MEMCTL_ROMOFF  = 0b01000000
        .MEMCTL_EXTON   = 0b00000000
        .MEMCTL_EXTOFF  = 0b10000000

        .JOY_CTL        = 0x3F

        .JOY_P1_LATCH   = 0b00000010
        .JOY_P2_LATCH   = 0b00001000

        .VDP_VRAM       = 0x4000
        .VDP_TILEMAP    = 0x7800
        .VDP_CRAM       = 0xC000
        .VDP_SAT        = 0x7F00

        .VDP_SAT_TERM   = 0xD0

        .VDP_VCOUNTER   = 0x7E
        .VDP_PSG        = 0x7F
        .VDP_HCOUNTER   = 0x7F

        .VDP_DATA       = 0xBE
        .VDP_CMD        = 0xBF
        .VDP_STAT       = 0xBF

        .STATF_INT_VBL  = 0b10000000
        .STATF_9_SPR    = 0b01000000
        .STATF_SPR_COLL = 0b00100000

        .VDP_REG_MASK   = 0b10000000
        .VDP_R0         = 0b10000000

        .R0_VSCRL       = 0b00000000
        .R0_VSCRL_INH   = 0b10000000
        .R0_HSCRL       = 0b00000000
        .R0_HSCRL_INH   = 0b01000000
        .R0_NO_LCB      = 0b00000000
        .R0_LCB         = 0b00100000
        .R0_IE1_OFF     = 0b00000000
        .R0_IE1         = 0b00010000
        .R0_SS_OFF      = 0b00000000
        .R0_SS          = 0b00001000
        .R0_DEFAULT     = 0b00000110
        .R0_ES_OFF      = 0b00000000
        .R0_ES          = 0b00000001

        .VDP_R1         = 0b10000001

        .R1_DEFAULT     = 0b10000000
        .R1_DISP_OFF    = 0b00000000
        .R1_DISP_ON     = 0b01000000
        .R1_IE_OFF      = 0b00000000
        .R1_IE          = 0b00100000
        .R1_SPR_8X8     = 0b00000000
        .R1_SPR_8X16    = 0b00000010

        .VDP_R2         = 0b10000010

        .R2_MAP_0x3800  = 0xFF
        .R2_MAP_0x3000  = 0xFD
        .R2_MAP_0x2800  = 0xFB
        .R2_MAP_0x2000  = 0xF9
        .R2_MAP_0x1800  = 0xF7
        .R2_MAP_0x1000  = 0xF5
        .R2_MAP_0x0800  = 0xF3
        .R2_MAP_0x0000  = 0xF1

        .VDP_R3         = 0b10000011
        .VDP_R4         = 0b10000100
        .VDP_R5         = 0b10000101

        .R5_SAT_0x3F00  = 0xFF
        .R5_SAT_MASK    = 0b10000001

        .VDP_R6         = 0b10000110

        .R6_BANK0       = 0xFB
        .R6_DATA_0x0000 = 0xFB
        .R6_BANK1       = 0xFF
        .R6_DATA_0x2000 = 0xFF

        .VDP_R7         = 0b10000111
        .VDP_RBORDER    = 0b10000111

        .R7_COLOR_MASK  = 0b11110000

        .VDP_R8         = 0b10001000
        .VDP_RSCX       = 0b10001000

        .VDP_R9         = 0b10001001
        .VDP_RSCY       = 0b10001001

        .VDP_R10        = 0b10001010

        .R10_INT_OFF    = 0xFF
        .R10_INT_EVERY  = 0x00

        .JOYPAD_COUNT   = 1

        .UP             = 0b00000001
        .DOWN           = 0b00000010
        .LEFT           = 0b00000100
        .RIGHT          = 0b00001000
        .A              = 0b00010000
        .B              = 0b00100000
        .SELECT         = 0b00100000    ; map to B
        .START          = 0b10000000    ; Game Gear Start button

        .JOY_PORT1      = 0xDC

        .JOY_P1_UP      = 0b00000001
        .JOY_P1_DOWN    = 0b00000010
        .JOY_P1_LEFT    = 0b00000100
        .JOY_P1_RIGHT   = 0b00001000
        .JOY_P1_SW1     = 0b00010000
        .JOY_P1_TRIGGER = 0b00010000
        .JOY_P1_SW2     = 0b00100000
        .JOY_P2_UP      = 0b01000000
        .JOY_P2_DOWN    = 0b10000000

        .JOY_PORT2      = 0xDD

        .JOY_P2_LEFT    = 0b00000001
        .JOY_P2_RIGHT   = 0b00000010
        .JOY_P2_SW1     = 0b00000100
        .JOY_P2_TRIGGER = 0b00000100
        .JOY_P2_SW2     = 0b00001000
        .JOY_RESET      = 0b00010000
        .JOY_P1_LIGHT   = 0b01000000
        .JOY_P2_LIGHT   = 0b10000000

        .FMADDRESS      = 0xF0
        .FMDATA         = 0xF1
        .AUDIOCTRL      = 0xF2

        .RAM_CONTROL    = 0xfffc

        .RAMCTL_BANK    = 0b00000100
        .RAMCTL_ROM     = 0b00000000
        .RAMCTL_RAM     = 0b00001000
        .RAMCTL_RO      = 0b00010000
        .RAMCTL_PROT    = 0b10000000

        .GLASSES_3D     = 0xfff8

        .MAP_FRAME0     = 0xfffd
        .MAP_FRAME1     = 0xfffe
        .MAP_FRAME2     = 0xffff

        .BIOS           = 0xC000

        .SYSTEM_PAL     = 0x00
        .SYSTEM_NTSC    = 0x01

        .CPU_CLOCK      = 3579545

        ;; GBDK library screen modes

        .T_MODE         = 0x02  ; Text mode (bit 2)
        .T_MODE_OUT     = 0x02  ; Text mode output only
        .T_MODE_INOUT   = 0x03  ; Text mode with input
        .M_NO_SCROLL    = 0x04  ; Disables scrolling of the screen in text mode
        .M_NO_INTERP    = 0x08  ; Disables special character interpretation

        ;; Screen dimentions in tiles

        .SCREEN_X_OFS   = 6
        .SCREEN_Y_OFS   = 3
        .SCREEN_WIDTH   = 20
        .SCREEN_HEIGHT  = 18
        .VDP_MAP_HEIGHT = 28
        .VDP_MAP_WIDTH  = 32

        ;; Interrupt flags

        .VBL_IFLAG      = 0x01
        .LCD_IFLAG      = 0x02

        ; characters
        .CR             = 0x0A
        .SPACE          = 0x00

        ;; Global variables
        .globl  .mode

        ;; Interrupt routines
        .globl _INT_ISR
        .globl _NMI_ISR

        ;; Symbols defined at link time
        .globl  .STACK
        .globl  _shadow_OAM
        .globl  __shadow_OAM_OFF

        ;; Main user routine
        .globl  _main

        ;; Macro definitions

.macro SMS_WRITE_VDP_DATA regH regL ?lbl
        ld a, i
        ld a, regL
        di
        out (#.VDP_DATA), a     ; 11
        ld a, regH              ; 4
        jp po, lbl              ; 7/12
        ei                      ; 4 (total: 26/27)
lbl:
        out (#.VDP_DATA), a
.endm

.macro SMS_WRITE_VDP_CMD regH regL ?lbl
        ld a, i
        ld a, regL
        di
        out (#.VDP_CMD), a
        ld a, regH
        jp po, lbl
        ei
lbl:
        out (#.VDP_CMD), a
.endm

.macro VDP_DELAY ?lbl
        nop
        jr lbl
lbl:
.endm

.macro VDP_CANCEL_INT
        in a, (.VDP_STAT)       ; cancel pending VDP interrupts
.endm

.macro WRITE_VDP_CMD_HL
        rst 0x10
.endm

.macro WRITE_VDP_DATA_HL
        rst 0x20
.endm

.macro CALL_HL
        rst 0x30
.endm

.macro DISABLE_VBLANK_COPY
        ld a, #1
        ld (__shadow_OAM_OFF), a
.endm

.macro ENABLE_VBLANK_COPY
        xor a
        ld (__shadow_OAM_OFF), a
.endm

.macro ADD_A_REG16 regH regL
        add regL
        ld regL, a
        adc regH
        sub regL
        ld regH, a
.endm

.macro MUL_DE_BY_A_RET_HL ?lbl1 ?lbl2
        ; Multiply DE by A, return result in HL; preserves: BC
        ld hl, #0
lbl1:
        srl a
        jp nc, lbl2
        add hl, de
lbl2:
        sla e
        rl d
        or a
        jp nz, lbl1
.endm

.macro DIV_PART divident divisor ?lbl
        rl divident
        rla
        sub divisor
        jr  nc, lbl
        add divisor
lbl:
.endm
.macro FAST_DIV8 divident divisor
        ; returns modulus in A
        .rept 8
                DIV_PART divident divisor
        .endm
        ld a, divident
        cpl
.endm
.macro FAST_MOD8 divident divisor
        ; returns modulus in A
        .rept 8
                DIV_PART divident divisor
        .endm
.endm
