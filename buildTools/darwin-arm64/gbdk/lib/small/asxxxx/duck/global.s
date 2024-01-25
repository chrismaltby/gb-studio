        .NEAR_CALLS = 1         ; <near_calls> - tag so that sed can change this
        
        ;; Changed by astorgb.pl to 1
        __RGBDS__       = 0

        _VRAM           = 0x8000 ; $8000->$9FFF
        _VRAM8000       = 0x8000
        _VRAM8800       = 0x8800
        _VRAM9000       = 0x9000
        _SCRN0          = 0x9800 ; $9800->$9BFF
        _SCRN1          = 0x9C00 ; $9C00->$9FFF
        _SRAM           = 0xA000 ; $A000->$BFFF
        _RAM            = 0xC000 ; $C000->$CFFF / $C000->$DFFF
        _RAMBANK        = 0xD000 ; $D000->$DFFF
        _OAMRAM         = 0xFE00 ; $FE00->$FE9F
        _IO             = 0xFF00 ; $FF00->$FF7F,$FFFF
        _AUD3WAVERAM    = 0xFF30 ; $FF30->$FF3F
        _HRAM           = 0xFF80 ; $FF80->$FFFE

        ;; MBC Equates

        .MBC1_ROM_PAGE  = 0x2000 ; Address to write to for MBC1 switching
        .MBC_ROM_PAGE   = 0x0001 ; Default platform MBC rom switching address

        rRAMG           = 0x0000 ; $0000->$1fff
        rROMB0          = 0x0001 ; $2000->$2fff
        rROMB1          = 0x3000 ; $3000->$3fff - If more than 256 ROM banks are present.
        rRAMB           = 0x4000 ; $4000->$5fff - Bit 3 enables rumble (if present)
        
        ;;  Keypad
        .START          = 0x80
        .SELECT         = 0x40
        .B              = 0x20
        .A              = 0x10
        .DOWN           = 0x08
        .UP             = 0x04
        .LEFT           = 0x02
        .RIGHT          = 0x01

        .P14            = 0x10
        .P15            = 0x20

        ;;  Screen dimensions 
        .MAXCURSPOSX    = 0x13  ; In tiles
        .MAXCURSPOSY    = 0x11

        .SCREENWIDTH    = 0xA0
        .SCREENHEIGHT   = 0x90
        .MINWNDPOSX     = 0x07
        .MINWNDPOSY     = 0x00
        .MAXWNDPOSX     = 0xA6
        .MAXWNDPOSY     = 0x8F

        ;; Hardware registers
 
        .P1             = 0x00  ; Joystick: 1.1.P15.P14.P13.P12.P11.P10
        rP1             = 0xFF00
        
        P1F_5           = 0b00100000 ; P15 out port, set to 0 to get buttons
        P1F_4           = 0b00010000 ; P14 out port, set to 0 to get dpad
        P1F_3           = 0b00001000 ; P13 in port
        P1F_2           = 0b00000100 ; P12 in port
        P1F_1           = 0b00000010 ; P11 in port
        P1F_0           = 0b00000001 ; P10 in port
        
        P1F_GET_DPAD    = 0b00100000
        P1F_GET_BTN     = 0b00010000
        P1F_GET_NONE    = 0b00110000

        .SB             = 0x01  ; Serial IO data buffer
        rSB             = 0xFF01

        .SC             = 0x02  ; Serial IO control register
        rSC             = 0xFF02

        .DIV            = 0x04  ; Divider register
        rDIV            = 0xFF04

        .TIMA           = 0x05  ; Timer counter
        rTIMA           = 0xFF05

        .TMA            = 0x06  ; Timer modulo
        rTMA            = 0xFF06
        
        .TAC            = 0x07  ; Timer control
        rTAC            = 0xFF07

        TACF_START      = 0b00000100
        TACF_STOP       = 0b00000000
        TACF_4KHZ       = 0b00000000
        TACF_16KHZ      = 0b00000011
        TACF_65KHZ      = 0b00000010
        TACF_262KHZ     = 0b00000001

        .IF             = 0x0F  ; Interrupt flags: 0.0.0.JST.SIO.TIM.LCD.VBL
        rIF             = 0xFF0F
        
        .NR10           = 0x20  ; Sound register
        rNR10           = 0xFF20
        rAUD1SWEEP      = 0xFF20

        AUD1SWEEP_UP    = 0b00000000
        AUD1SWEEP_DOWN  = 0b00001000

        .NR11           = 0x22  ; Sound register
        rNR11           = 0xFF22
        rAUD1LEN        = 0xFF22

        .NR12           = 0x21  ; Sound register
        rNR12           = 0xFF21
        rAUD1ENV        = 0xFF21
        
        .NR13           = 0x23  ; Sound register
        rNR13           = 0xFF23
        rAUD1LOW        = 0xFF23

        .NR14           = 0x24  ; Sound register
        rNR14           = 0xFF24
        rAUD1HIGH       = 0xFF24

        .NR21           = 0x25  ; Sound register
        rNR21           = 0xFF25
        rAUD2LEN        = 0xFF25

        .NR22           = 0x27  ; Sound register
        rNR22           = 0xFF27
        rAUD2ENV        = 0xFF27

        .NR23           = 0x28  ; Sound register
        rNR23           = 0xFF28
        rAUD2LOW        = 0xFF28

        .NR24           = 0x29  ; Sound register
        rNR24           = 0xFF29
        rAUD2HIGH       = 0xFF29

        .NR30           = 0x2A  ; Sound register
        rNR30           = 0xFF2A
        rAUD3ENA        = 0xFF2A

        .NR31           = 0x2B  ; Sound register
        rNR31           = 0xFF2B
        rAUD3LEN        = 0xFF2B

        .NR32           = 0x2C  ; Sound register
        rNR32           = 0xFF2C
        rAUD3LEVEL      = 0xFF2C

        .NR33           = 0x2E  ; Sound register
        rNR33           = 0xFF2E
        rAUD3LOW        = 0xFF2E

        .NR34           = 0x2D  ; Sound register
        rNR34           = 0xFF2D
        rAUD3HIGH       = 0xFF2D

        .NR41           = 0x40  ; Sound register
        rNR41           = 0xFF40
        rAUD4LEN        = 0xFF40

        .NR42           = 0x42  ; Sound register
        rNR42           = 0xFF42
        rAUD4ENV        = 0xFF42

        .NR43           = 0x41  ; Sound register
        rNR43           = 0xFF41
        rAUD4POLY       = 0xFF41

        .NR44           = 0x43  ; Sound register
        rNR44           = 0xFF43
        rAUD4GO         = 0xFF43

        .NR50           = 0x44  ; Sound register
        rNR50           = 0xFF44
        rAUDVOL         = 0xFF44

        AUDVOL_VIN_LEFT  = 0b10000000 ; SO2
        AUDVOL_VIN_RIGHT = 0b00001000 ; SO1

        .NR51           = 0x46  ; Sound register
        rNR51           = 0xFF46
        rAUDTERM        = 0xFF46

        AUDTERM_4_LEFT  = 0b10000000
        AUDTERM_3_LEFT  = 0b01000000
        AUDTERM_2_LEFT  = 0b00100000
        AUDTERM_1_LEFT  = 0b00010000
        AUDTERM_4_RIGHT = 0b00001000
        AUDTERM_3_RIGHT = 0b00000100
        AUDTERM_2_RIGHT = 0b00000010
        AUDTERM_1_RIGHT = 0b00000001

        .NR52           = 0x45  ; Sound register
        rNR52           = 0xFF45
        rAUDENA         = 0xFF45

        AUDENA_ON       = 0b10000000
        AUDENA_OFF      = 0b00000000  ; sets all audio regs to 0!

        .LCDC           = 0x10  ; LCD control
        rLCDC           = 0xFF10

        LCDCF_OFF       = 0b00000000 ; LCD Control Operation
        LCDCF_ON        = 0b10000000 ; LCD Control Operation
        LCDCF_WIN9800   = 0b00000000 ; Window Tile Map Display Select
        LCDCF_WIN9C00   = 0b00001000 ; Window Tile Map Display Select
        LCDCF_WINOFF    = 0b00000000 ; Window Display
        LCDCF_WINON     = 0b00100000 ; Window Display
        LCDCF_BG8800    = 0b00000000 ; BG & Window Tile Data Select
        LCDCF_BG8000    = 0b00010000 ; BG & Window Tile Data Select
        LCDCF_BG9800    = 0b00000000 ; BG Tile Map Display Select
        LCDCF_BG9C00    = 0b00000100 ; BG Tile Map Display Select
        LCDCF_OBJ8      = 0b00000000 ; OBJ Construction
        LCDCF_OBJ16     = 0b00000010 ; OBJ Construction
        LCDCF_OBJOFF    = 0b00000000 ; OBJ Display
        LCDCF_OBJON     = 0b00000001 ; OBJ Display
        LCDCF_BGOFF     = 0b00000000 ; BG Display
        LCDCF_BGON      = 0b01000000 ; BG Display
        LCDCF_B_ON      = 7
        LCDCF_B_WIN9C00 = 3
        LCDCF_B_WINON   = 5
        LCDCF_B_BG8000  = 4
        LCDCF_B_BG9C00  = 2
        LCDCF_B_OBJ16   = 1
        LCDCF_B_OBJON   = 0
        LCDCF_B_BGON    = 6

        .STAT           = 0x11  ; LCD status
        rSTAT           = 0xFF11

        STATF_LYC       = 0b01000000 ; LYC=LY Coincidence (Selectable)
        STATF_MODE10    = 0b00100000 ; Mode 10
        STATF_MODE01    = 0b00010000 ; Mode 01 (V-Blank)
        STATF_MODE00    = 0b00001000 ; Mode 00 (H-Blank)
        STATF_LYCF      = 0b00000100 ; Coincidence Flag
        STATF_HBL       = 0b00000000 ; H-Blank
        STATF_VBL       = 0b00000001 ; V-Blank
        STATF_OAM       = 0b00000010 ; OAM-RAM is used by system
        STATF_LCD       = 0b00000011 ; Both OAM and VRAM used by system
        STATF_BUSY      = 0b00000010 ; When set, VRAM access is unsafe
        STATF_B_LYC     = 6
        STATF_B_MODE10  = 5
        STATF_B_MODE01  = 4
        STATF_B_MODE00  = 3
        STATF_B_LYCF    = 2
        STATF_B_VBL     = 0
        STATF_B_OAM     = 1
        STATF_B_BUSY    = 1

        .SCY            = 0x12  ; Scroll Y
        rSCY            = 0xFF12

        .SCX            = 0x13  ; Scroll X
        rSCX            = 0xFF13

        .LY             = 0x18  ; LCDC Y-coordinate
        rLY             = 0xFF18

        .LYC            = 0x19  ; LY compare
        rLYC            = 0xFF19

        .DMA            = 0x1A  ; DMA transfer
        rDMA            = 0xFF1A

        .BGP            = 0x1B  ; BG palette data
        rBGP            = 0xFF1B

        .OBP0           = 0x14  ; OBJ palette 0 data
        rOBP0           = 0xFF14

        .OBP1           = 0x15  ; OBJ palette 1 data
        rOBP1           = 0xFF15

        .WY             = 0x16  ; Window Y coordinate
        rWY             = 0xFF16

        .WX             = 0x17  ; Window X coordinate
        rWX             = 0xFF17

        .KEY1           = 0x4D  ; CPU speed
        rKEY1           = 0xFF4D
        rSPD            = 0xFF4D

        KEY1F_DBLSPEED  = 0b10000000 ; 0=Normal Speed, 1=Double Speed (R)
        KEY1F_PREPARE   = 0b00000001 ; 0=No, 1=Prepare (R/W)

        .VBK            = 0x4F  ; VRAM bank
        rVBK            = 0xFF4F

        .HDMA1          = 0x51  ; DMA control 1
        rHDMA1          = 0xFF51

        .HDMA2          = 0x52  ; DMA control 2
        rHDMA2          = 0xFF52
        
        .HDMA3          = 0x53  ; DMA control 3
        rHDMA3          = 0xFF53
        
        .HDMA4          = 0x54  ; DMA control 4
        rHDMA4          = 0xFF54
        
        .HDMA5          = 0x55  ; DMA control 5
        rHDMA5          = 0xFF55
        
        HDMA5F_MODE_GP  = 0b00000000 ; General Purpose DMA (W)
        HDMA5F_MODE_HBL = 0b10000000 ; HBlank DMA (W)

        HDMA5F_BUSY     = 0b10000000 ; 0=Busy (DMA still in progress), 1=Transfer complete (R)
        
        .RP             = 0x56  ; IR port
        rRP             = 0xFF56

        RPF_ENREAD      = 0b11000000
        RPF_DATAIN      = 0b00000010 ; 0=Receiving IR Signal, 1=Normal
        RPF_WRITE_HI    = 0b00000001
        RPF_WRITE_LO    = 0b00000000

        .BCPS           = 0x68  ; BG color palette specification
        rBCPS           = 0xFF68
        
        BCPSF_AUTOINC   = 0b10000000 ; Auto Increment (0=Disabled, 1=Increment after Writing)

        .BCPD           = 0x69  ; BG color palette data
        rBCPD           = 0xFF69

        .OCPS           = 0x6A  ; OBJ color palette specification
        rOCPS           = 0xFF6A
        
        OCPSF_AUTOINC   = 0b10000000 ; Auto Increment (0=Disabled, 1=Increment after Writing)

        .OCPD           = 0x6B  ; OBJ color palette data
        rOCPD           = 0xFF6B
        
        .SVBK           = 0x70  ; WRAM bank
        rSVBK           = 0xFF70
        rSMBK           = 0xFF70

        rPCM12          = 0xFF76
        
        rPCM34          = 0xFF77

        .IE             = 0xFF  ; Interrupt enable
        rIE             = 0xFFFF

        .VBL_IFLAG      = 0x01
        .LCD_IFLAG      = 0x02
        .TIM_IFLAG      = 0x04
        .SIO_IFLAG      = 0x08
        .JOY_IFLAG      = 0x10

        IEF_HILO        = 0b00010000 ; Transition from High to Low of Pin number P10-P13
        IEF_SERIAL      = 0b00001000 ; Serial I/O transfer end
        IEF_TIMER       = 0b00000100 ; Timer Overflow
        IEF_STAT        = 0b00000010 ; STAT
        IEF_VBLANK      = 0b00000001 ; V-Blank

        ;; Flags common to multiple sound channels
        
        AUDLEN_DUTY_12_5 = 0b00000000 ; 12.5%
        AUDLEN_DUTY_25   = 0b01000000 ; 25%
        AUDLEN_DUTY_50   = 0b10000000 ; 50%
        AUDLEN_DUTY_75   = 0b11000000 ; 75%
                            
        AUDENV_UP       = 0b00001000
        AUDENV_DOWN     = 0b00000000
                            
        AUDHIGH_RESTART    = 0b10000000
        AUDHIGH_LENGTH_ON  = 0b01000000
        AUDHIGH_LENGTH_OFF = 0b00000000

        ;; OAM related constants
        
        OAM_COUNT       = 40  ; number of OAM entries in OAM RAM

        OAMF_PRI        = 0b10000000 ; Priority
        OAMF_YFLIP      = 0b01000000 ; Y flip
        OAMF_XFLIP      = 0b00100000 ; X flip
        OAMF_PAL0       = 0b00000000 ; Palette number; 0,1 (DMG)
        OAMF_PAL1       = 0b00010000 ; Palette number; 0,1 (DMG)
        OAMF_BANK0      = 0b00000000 ; Bank number; 0,1 (GBC)
        OAMF_BANK1      = 0b00001000 ; Bank number; 0,1 (GBC)

        OAMF_PALMASK    = 0b00000111 ; Palette (GBC)

        OAMB_PRI        = 7 ; Priority
        OAMB_YFLIP      = 6 ; Y flip
        OAMB_XFLIP      = 5 ; X flip
        OAMB_PAL1       = 4 ; Palette number; 0,1 (DMG)
        OAMB_BANK1      = 3 ; Bank number; 0,1 (GBC)

        ;; CPU detection
        .DMG_TYPE       = 0x01 ; Original GB or Super GB
        .MGB_TYPE       = 0xFF ; Pocket GB or Super GB 2
        .CGB_TYPE       = 0x11 ; Color GB        

        ;; GBDK library screen modes

        .G_MODE         = 0x01  ; Graphic mode
        .T_MODE         = 0x02  ; Text mode (bit 2)
        .T_MODE_OUT     = 0x02  ; Text mode output only
        .T_MODE_INOUT   = 0x03  ; Text mode with input
        .M_NO_SCROLL    = 0x04  ; Disables scrolling of the screen in text mode
        .M_NO_INTERP    = 0x08  ; Disables special character interpretation
        
        ;; Status codes for IO
        .IO_IDLE        = 0x00
        .IO_SENDING     = 0x01
        .IO_RECEIVING   = 0x02
        .IO_ERROR       = 0x04

        ;; Type of IO data
        .DT_IDLE        = 0x66
        .DT_RECEIVING   = 0x55

        ;; Table of routines for modes
        .MODE_TABLE     = 0x01E0

        ;; C related
        ;; Overheap of a banked call.  Used for parameters
        ;;  = ret + real ret + bank

        .if .NEAR_CALLS
        .BANKOV         = 2

        .else
        .BANKOV         = 6

        .endif

        .globl  __current_bank
        .globl  __shadow_OAM_base
        
        ;; Global variables
        .globl  .mode

        .globl  __cpu
        .globl  __is_GBA

        ;; Global routines
;       .globl  .set_mode       ;; don't link mode.o by default

        .globl  .reset

        .globl  .display_off

        .globl  .wait_vbl_done

        ;; Interrupt routines 
        .globl  .add_VBL
;       .globl  .add_LCD        ;; don't link LCD.o by default
;       .globl  .add_TIM        ;; don't link TIM.o by default
;       .globl  .add_SIO        ;; don't link serial.o by default
;       .globl  .add_JOY        ;; don't link JOY.o by default

        ;; Symbols defined at link time
        .globl  .STACK
        .globl  _shadow_OAM
        .globl  .refresh_OAM

        ;; Main user routine    
        .globl  _main

        ;; Macro definitions

.macro WAIT_STAT ?lbl
lbl:    LDH     A, (.STAT)
        AND     #STATF_BUSY     ; Check if in LCD modes 0 or 1
        JR      NZ, lbl
.endm

.macro ADD_A_REG16 regH regL
        ADD     regL
        LD      regL, A
        ADC     regH
        SUB     regL
        LD      regH, A
.endm

.macro SIGNED_ADD_A_REG16 regH regL ?lbl
        ; If A is negative, we need to subtract 1 from upper byte of 16-bit value
        BIT     7, A            ; set z if a signed bit is 0
        JR      Z, lbl          ; if z is set jump to positive
        dec     regH            ; if negative decrement upper byte
lbl:
        ADD_A_REG16     regH, regL
.endm

.macro SIGNED_SUB_A_REG16 regH regL ?lbl
        ; negate A then add to 16-bit value
        CPL
        INC     A
        SIGNED_ADD_A_REG16      regH, regL
.endm

.macro MUL_DE_BY_A_RET_HL ?lbl1 ?lbl2 ?lbl3
        ; Multiply DE by A, return result in HL; preserves: BC
        LD      HL, #0
lbl1:
        SRL     A
        JR      NC, lbl2
        ADD     HL, DE
lbl2:
        JR      Z, lbl3
        SLA     E
        RL      D
        JR      lbl1
lbl3:
.endm

