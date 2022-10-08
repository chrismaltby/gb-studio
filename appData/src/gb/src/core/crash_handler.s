; Crash handler support
; Original code by ISSOtm from gb-starter-kit: https://github.com/ISSOtm/gb-starter-kit
; Adapted by Toxa

        .include        "global.s"

        SCRN_X    = 160         ; Width of screen in pixels
        SCRN_Y    = 144         ; Height of screen in pixels
        SCRN_X_B  = 20          ; Width of screen in bytes
        SCRN_Y_B  = 18          ; Height of screen in bytes

        SCRN_VX   = 256         ; Virtual width of screen in pixels
        SCRN_VY   = 256         ; Virtual height of screen in pixels
        SCRN_VX_B = 32          ; Virtual width of screen in bytes
        SCRN_VY_B = 32          ; Virtual height of screen in bytes


        .area _CRASH_HEADER(ABS)

        .org    0x00

        nop
        nop
        jp      1$

        .org    0x38
1$:
        di
        jp      ___HandleCrash


        .area _CODE

___HandleCrash::
        push    hl
        ld      hl, #.MBC_ROM_PAGE
        ld      (hl), #b___HandleCrash_banked
        pop     hl
        jp      ___HandleCrash_banked 


        .area   _CODE_255
.globl b___HandleCrash_banked
b___HandleCrash_banked = 255

___HandleCrash_banked::

        ; We will use VRAM as scratch, since we are going to overwrite it for
        ; screen output anyways. The thing is, we need to turn the LCD off
        ; *without* affecting flags... fun task, eh?

        ; Note: it's assumed that this was jumped to with IME off.
        ; Don't call this directly, use `rst Crash`.

        ld      (wCrashA), a    ; We need to have at least one working register, so...
        ldh     a, (.IE)        ; We're also going to overwrite this
        ld      (wCrashIE), a
        ldh     a, (.LCDC)
        ld      (wCrashLCDC), a
        ld      a, #LCDCF_ON    ; LCDCF_ON Make sure the LCD is turned on to avoid waiting infinitely
        ldh     (.LCDC), a
        ld      a, #IEF_VBLANK  ; IEF_VBLANK
        ld      (.IE), a
        ld      a, #0           ; `xor a` would overwrite flags
        ld      (.IF), a        ; No point in backing up that register, it's always changing
        halt                    ; With interrupts disabled, this will exit when `IE & IF != 0`
        nop                     ; Handle hardware bug if it becomes true *before* starting to execute the instruction (1-cycle window)

        ; We're now in VBlank! So we can now use VRAM as scratch for some cycles
        ld      a, #0
        ldh     (.LCDC), a      ; Turn off LCD so VRAM can always be safely accessed
        ; Save regs
        ld      (vCrashSP), sp
        ld      sp, #vCrashSP
        push    hl
        push    de
        push    bc
        ld      a, (wCrashA)
        push    af

        ; We need to have all the data in bank 0, but we can't guarantee we were there
        ldh     a, (.VBK)
        ld      e, a
        bit     #0, a
        jr      z, .bank0
        ; Oh noes. We need to copy the data across banks!
        ld      hl, #vCrashAF
        ld      c, #(5 * 2)
.copyAcross:
        ld      b, (hl)
        xor     a
        ldh     (.VBK), a
        ld      (hl), b
        inc     l               ; inc hl
        inc     a               ; ld a, 1
        ldh     (.VBK), a
        dec     c
        jr      nz, .copyAcross
.bank0:
        xor     a
        ldh     (.NR52), a      ; Kill sound for this screen

        ldh     (.VBK), a
        ld      a, e
        ld      (vCrashVBK), a  ; copy vCrashVBK across banks

        ld      a, #1
        ldh     (.VBK), a
        ld      hl, #vCrashDumpScreen
        ld      b, #SCRN_Y_B
.writeAttrRow:
        xor     a
        ld      c, #(SCRN_X_B + 1)
        rst     #0x28           ; .MemsetSmall
        ld      a, l
        add     a, #(SCRN_VX_B - SCRN_X_B - 1)
        ld      l, a
        dec     b
        jr      nz, .writeAttrRow
        xor     a
        ldh     (.VBK), a

        ; Load palettes
        ld      a, #0x03
        ldh     (.BGP), a
        ld      a, #0x80
        ldh     (.BCPS), a
        xor     a
        ld      c, #.BCPD
        ldh     (c), a
        ldh     (c), a
        dec     a ; ld a, $FF
        ldh     (c), a
        ldh     (c), a
        ldh     (c), a
        ldh     (c), a
        ldh     (c), a
        ldh     (c), a

        ld      a, #(SCRN_VY - SCRN_Y)
        ldh     (.SCY), a
        ld      a, #(SCRN_VX - SCRN_X - 4)
        ldh     (.SCX), a

        call    loadfont

        ; Copy the registers to the dump viewers
        ld      hl, #vDumpHL
        ld      de, #vCrashHL
        ld      c, #4
        rst     #0x30           ; .MemcpySmall

        ; We're now going to draw the screen, top to bottom
        ld      hl, #vCrashDumpScreen

        ; First 3 lines of text
        ld      de, #.header
        ld      b, #3
.writeHeaderLine:
        ld      a, #0x20        ; " "
        ld      (hl+), a
        ld      c, #19
        rst     #0x30           ; .MemcpySmall
        ld      a, #0x20        ; " "
        ld      (hl+), a
        ld      a, l
        add     a, #(SCRN_VX_B - SCRN_X_B - 1)
        ld      l, a
        dec     b
        jr      nz, .writeHeaderLine

        ; Blank line
        ld      a, #0x20        ; " "
        ld      c, #(SCRN_X_B + 1)
        rst     #0x28           ; .MemsetSmall

        ; AF and console model
        ld      l, #<vCrashDumpScreenRow4
        ld      c, #4
        rst     #0x30           ; .MemcpySmall
        pop     bc
        call    .printHexBC
        ld      c, #8
        rst     #0x30           ; .MemcpySmall
        ld      a, (__cpu)
        call    .printHexA
        ld      a, #0x20        ; " "
        ld      (hl+), a
        ld      (hl+), a
        ld      (hl+), a

        ; BC and DE
        ld      l, #<vCrashDumpScreenRow5
        ld      c, #4
        rst     #0x30           ; .MemcpySmall
        pop     bc
        call    .printHexBC
        ld      c, #6
        rst     #0x30           ; .MemcpySmall
        pop     bc
        call    .printHexBC
        ld      a, #0x20
        ld      (hl+), a
        ld      (hl+), a
        ld      (hl+), a

        ; Now, the two memory dumps
.writeDump:
        ld      a, l
        add     a, #(SCRN_VX_B - SCRN_X_B - 1)
        ld      l, a
        ld      c, #4
        rst     #0x30           ; .MemcpySmall
        pop     bc
        push    bc
        call    .printHexBC
        ld      de, #.viewStr
        ld      c, #7
        rst     #0x30           ; .MemcpySmall
        pop     de
        call    .printDump
        ld      de, #.spStr
        bit     #7, l
        jr      z, .writeDump

        ld      de, #.hwRegsStrs
        ld      l, #<vCrashDumpScreenRow14
        ld      c, #6
        rst     #0x30           ; .MemcpySmall
        ld      a, (wCrashLCDC)
        call    .printHexA
        ld      c, #4
        rst     #0x30           ; .MemcpySmall
        ldh     a, (.KEY1)
        call    .printHexA
        ld      c, #4
        rst     #0x30           ; .MemcpySmall
        ld      a, (wCrashIE)
        call    .printHexA
        ld      (hl), #0x20     ; " "

        ld      l, #<vCrashDumpScreenRow15
        ld      c, #7
        rst     #0x30           ; .MemcpySmall
.writeBank:
        ld      a, #0x20        ; " "
        ld      (hl+), a
        ld      a, (de)
        inc     de
        ld      (hl+), a
        cp      #0x20           ; " "
        jr      z, .banksDone
        ld      a, (de)
        inc     de
        ld      c, a
        ld      a, (de)
        inc     de
        ld      b, a
        ld      a, (bc)
        call    .printHexA
        jr      .writeBank
.banksDone:

        ; Start displaying
        ld      a, #(LCDCF_ON | LCDCF_BG9C00 | LCDCF_BGON)
        ldh     (.LCDC), a

.loop:
        ; The code never lags, and IE is equal to IEF_VBLANK
        xor     a
        ldh     (.IF), a
        halt

        jr      .loop

.printHexBC:
        call      .printHexB
        ld      a, c
.printHexA:
        ld      b, a
.printHexB:
        ld      a, b
        and     #0xF0
        swap    a
        add     a, #0x30
        cp      #0x3a
        jr      c, 1$
        add     a, #(0x41 - 0x3a)
1$:
        ld      (hl+), a
        ld      a, b
        and     #0x0F
        add     a, #0x30
        cp      #0x3a
        jr      c, 2$
        add     a, #(0x41 - 0x3a)
2$:
        ld      (hl+), a
        ret

.printDump:
        ld      b, d
        ld      c, e
        call    .printHexBC
        ld      a, #0x20        ; " "
        ld      (hl+), a
        ld      (hl+), a
        ld      a, e
        sub     #8
        ld      e, a
        ld      a, d
        sbc     #0
        ld      d, a
.writeDumpLine:
        ld      a, l
        add     a, #(SCRN_VX_B - SCRN_X_B - 1)
        ld      l, a
        ld      a, #0x20        ; " "
        ld      (hl+), a
.writeDumpWord:
        ld      a, (de)
        inc     de
        call    .printHexA
        ld      a, (de)
        inc     de
        call    .printHexA
        ld      a, #0x20        ; " "
        ld      (hl+), a
        bit     4, l
        jr      nz, .writeDumpWord
        ld      a, l
        and     #0x7F
        jr      nz, .writeDumpLine
        ret

loadfont:
        ld      hl, #.font_data 
4$:
        ld      a, (hl+)
        ld      e, a
        ld      a, (hl+)
        ld      d, a
        or      e
        ret     Z
1$:
        ld      c, (hl)
        inc     hl
        bit     7, c
        jr      Z, 2$
        ld      a, (hl+)
3$:
        ld      (de), a
        inc     de
        ld      (de), a
        inc     de
        inc     c
        jr      NZ, 3$
        jr      1$
2$:
        inc     c
        dec     c
        jr      Z, 4$
5$:
        ld      a, (hl+)
        ld      (de), a
        inc     de
        ld      (de), a
        inc     de
        dec     c
        jr      NZ, 5$
        jr      1$
        
.font_data:      
        .dw     #0x9000
        .db     #-8, #0xff
        .db     #0
        
        .dw     #(0x9000 + (0x20 << 4))
        .db     #-8, #0xff
        .db     #0
        
        .dw     #(0x9000 + (0x2D << 4))
        .db     #8
        .db     #0xFF, #0xFF, #0xFF, #0xFF, #0xC3, #0xFF, #0xFF, #0xFF
        .db     #0

        .dw     #(0x9000 + (0x30 << 4))
        .db     #80
        .db     #0xFF, #0xCF, #0xA7, #0x33, #0x33, #0x33, #0x97, #0xCF
        .db     #0xFF, #0xCF, #0x8F, #0x0F, #0xCF, #0xCF, #0xCF, #0x03
        .db     #0xFF, #0x87, #0x33, #0xE7, #0xCF, #0x9F, #0x3F, #0x03
        .db     #0xFF, #0x87, #0x73, #0xF3, #0xC7, #0xF3, #0x73, #0x87
        .db     #0xFF, #0xC7, #0xA7, #0x67, #0x03, #0xE7, #0xE7, #0xE7
        .db     #0xFF, #0x03, #0x3F, #0x3F, #0x87, #0xF3, #0x33, #0x87
        .db     #0xFF, #0x87, #0x33, #0x3F, #0x07, #0x33, #0x33, #0x87
        .db     #0xFF, #0x03, #0xF3, #0xF3, #0xE7, #0xE7, #0xCF, #0xCF
        .db     #0xFF, #0x87, #0x33, #0x33, #0x87, #0x33, #0x33, #0x87
        .db     #0xFF, #0x87, #0x33, #0x33, #0x83, #0xF3, #0x33, #0x87
        .db     #0

        .dw     #(0x9000 + (0x3A << 4))
        .db     #8
        .db     #0xFF, #0xFF, #0x9F, #0x9F, #0xFF, #0x9F, #0x9F, #0xFF
        .db     #0

        .dw     #(0x9000 + (0x41 << 4))
        .db     #66
        .db     #0xFF, #0xCF, #0xB7, #0x7B, #0x7B, #0x03, #0x7B, #0x7B
        .db     #0xFF, #0x07, #0x7B, #0x7B, #0x07, #0x7B, #0x7B, #0x07
        .db     #0xFF, #0xC3, #0xBF, #0x7F, #0x7F, #0x7F, #0xBF, #0xC3
        .db     #0xFF, #0x0F, #0x77, #0x7B, #0x7B, #0x7B, #0x77, #0x0F
        .db     #0xFF, #0x03, #0x7F, #0x7F, #0x03, #0x7F, #0x7F, #0x03
        .db     #0xFF, #0x03, #0x7F, #0x7F, #0x03, #0x7F, #0x7F, #0x7F
        .db     #0xFF, #0x83, #0x7F, #0x7F, #0x43, #0x7B, #0x7B, #0x87
        .db     #0xFF, #0x7B, #0x7B, #0x7B, #0x03, #0x7B, #0x7B, #0x7B
        .db     #0xFF, #0x83
        .db     #-5, #0xef
        .db     #2
        .db     #0x83, #0xFF
        .db     #-6, #0xfb
        .db     #10
        .db     #0x07, #0xFF, #0x7B, #0x77, #0x6F, #0x5F, #0x1F, #0x6F
        .db     #0x73, #0xFF
        .db     #-6, #0x7f
        .db     #19
        .db     #0x03, #0xFF, #0x7B, #0x33, #0x4B, #0x7B, #0x7B, #0x7B
        .db     #0x7B, #0xFF, #0x7B, #0x3B, #0x5B, #0x6B, #0x73, #0x7B
        .db     #0x7B, #0xFF, #0x87
        .db     #-5, #0x7b
        .db     #35
        .db     #0x87, #0xFF, #0x07, #0x7B, #0x7B, #0x07, #0x7F, #0x7F
        .db     #0x7F, #0xFF, #0x87, #0x7B, #0x7B, #0x7B, #0x5B, #0x67
        .db     #0x93, #0xFF, #0x07, #0x7B, #0x7B, #0x07, #0x6F, #0x77
        .db     #0x7B, #0xFF, #0x83, #0x7F, #0x7F, #0x87, #0xFB, #0x7B
        .db     #0x87, #0xFF, #0x01
        .db     #-6, #0xef
        .db     #1
        .db     #0xFF
        .db     #-6, #0x7b
        .db     #2
        .db     #0x87, #0xFF
        .db     #-5, #0x7b
        .db     #34
        .db     #0xB7, #0xCF, #0xFF, #0x7B, #0x7B, #0x7B, #0x7B, #0x4B
        .db     #0x33, #0x7B, #0xFF, #0x7B, #0x7B, #0xB7, #0xCF, #0xB7
        .db     #0x7B, #0x7B, #0xFF, #0xBB, #0xBB, #0xBB, #0xD7, #0xEF
        .db     #0xEF, #0xEF, #0xFF, #0x03, #0xFB, #0xF7, #0xEF, #0xDF
        .db     #0xBF, #0x03
        .db     #0
        .dw     #0

.header:
        ;   0123456789ABCDEFGHI  19 chars
        .ascii  "KERNEL PANIC PLEASE"
        .ascii  "SEND A CLEAR PIC OF"
        .ascii  "THIS SCREEN TO DEVS"
        .ascii  " AF:"
        .ascii  "  MODEL:"
        .ascii  " BC:"
        .ascii  "   DE:"
        .ascii  " HL:"
.viewStr:
        .ascii  "  VIEW:"
.spStr:
        .ascii  " SP:"
.hwRegsStrs:
        .ascii  " LCDC:"
        .ascii  " K1:"
        .ascii  " IE:"
        .ascii  "  BANK:"
        .ascii  "R"
        .dw     __current_bank 
        .ascii  "V" 
        .dw     vCrashVBK 
        .ascii  "W"
        .db     .SVBK, 0xff
        .ascii  " "


        .area   _DATA

wCrashA: 
        .ds     1               ; We need at least one working register, and A allows accessing memory
wCrashIE: 
        .ds     1
wCrashLCDC: 
        .ds     1


        .area _CRASH_SCRATCH(ABS)

        .org    0x9C00

        ; Put the crash dump screen at the bottom-right of the 9C00 tilemap, since that tends to be unused space
        .ds     SCRN_VX_B * (SCRN_VY_B - SCRN_Y_B - 2)      ; 2 rows reserved as scratch space

        .ds     SCRN_X_B        ; Try not to overwrite the window area
        .ds     2 * 1           ; Free stack entries (we spill into the above by 1 entry, though :/)
        ; These are the initial values of the registers
        ; They are popped off the stack when printed, freeing up stack space

vCrashAF: 
        .ds     2
vCrashBC: 
        .ds     2
vCrashDE: 
        .ds     2
vCrashHL: 
        .ds     2
vCrashSP: 
        .ds     2

        .ds     SCRN_X_B
vHeldKeys: 
        .ds     1               ; Keys held on previous frame
vUnlockCounter: 
        .ds     1               ; How many frames until dumps are "unlocked"
vWhichDump: 
        .ds     1
vDumpHL: 
        .ds     2
vDumpSP: 
        .ds     2
vCrashVBK: 
        .ds     1
        .ds     4               ; Unused

        .ds     SCRN_VX_B - SCRN_X_B - 1
vCrashDumpScreen:
vCrashDumpScreenRow0  = vCrashDumpScreen +  1 * SCRN_VX_B
vCrashDumpScreenRow1  = vCrashDumpScreen +  2 * SCRN_VX_B
vCrashDumpScreenRow2  = vCrashDumpScreen +  3 * SCRN_VX_B
vCrashDumpScreenRow3  = vCrashDumpScreen +  4 * SCRN_VX_B
vCrashDumpScreenRow4  = vCrashDumpScreen +  5 * SCRN_VX_B
vCrashDumpScreenRow5  = vCrashDumpScreen +  6 * SCRN_VX_B
vCrashDumpScreenRow6  = vCrashDumpScreen +  7 * SCRN_VX_B
vCrashDumpScreenRow7  = vCrashDumpScreen +  8 * SCRN_VX_B
vCrashDumpScreenRow8  = vCrashDumpScreen +  9 * SCRN_VX_B
vCrashDumpScreenRow9  = vCrashDumpScreen + 10 * SCRN_VX_B
vCrashDumpScreenRow10 = vCrashDumpScreen + 11 * SCRN_VX_B
vCrashDumpScreenRow11 = vCrashDumpScreen + 12 * SCRN_VX_B
vCrashDumpScreenRow12 = vCrashDumpScreen + 13 * SCRN_VX_B
vCrashDumpScreenRow13 = vCrashDumpScreen + 14 * SCRN_VX_B
vCrashDumpScreenRow14 = vCrashDumpScreen + 15 * SCRN_VX_B
vCrashDumpScreenRow15 = vCrashDumpScreen + 16 * SCRN_VX_B
vCrashDumpScreenRow16 = vCrashDumpScreen + 17 * SCRN_VX_B
vCrashDumpScreenRow17 = vCrashDumpScreen + 18 * SCRN_VX_B
