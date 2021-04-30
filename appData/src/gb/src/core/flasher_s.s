        .globl __start_save
        .globl __current_bank
        .globl _memcpy

.ENABLE_RAM_MBC5        = 0x0000 
.MBC1_ROM_PAGE          = 0x2000
.MBC1_RAM_PAGE          = 0x4000

        .area   _CODE_4

.macro .wb addr, val
        ld a, val
        ld (addr), a
.endm

_flash_data_routine:
        push    bc

        di

        ldh     a, (#__current_bank)
        push    af                              ; save current bank

        lda     hl, 6(sp)
        ld      a, (hl)

        ld      c, a                            ; c == SRAM bank

        srl     a
        add     #__start_save
        ld      (#.MBC1_ROM_PAGE), a            ; switch ROM bank

        ld      h, #0x40                        ; two SRAM banks are saved into one ROM bank.
        bit     0, c
        jr      z,0$
        set     5, h 
0$:
        xor     a
        ld      l, a                            ; destination HL == 0x4000 or HL == 0x6000

        ld      d, #0xA0                        ; source DE == 0xA000
        ld      e, a

1$:
        .wb     #.ENABLE_RAM_MBC5, #0x0A        ; enable SRAM
        .wb     #.MBC1_RAM_PAGE, c              ; switch SRAM
        ld      a, (de)                         ; read byte
        ld      b, a

        .wb     #.ENABLE_RAM_MBC5, #0x00        ; disable SRAM

        .wb     #0x0AAA, #0xA9
        .wb     #0x0555, #0x56
        .wb     #0x0AAA, #0xA0                  ; perform magic

        ld      a, b
        ld      (hl), a                         ; write byte

        ld      b, #0                           ; wait counter
2$:
        cp      (hl)
        jr      z, 3$                           ; check byte

        push    hl
        pop     hl
        push    hl
        pop     hl                              ; delay 4+3+4+3=14

        dec     b
        jr      nz, 2$

        ld      e, #0                           ; fail                  
        jr      5$
3$:
        inc     de                              ; next source
        inc     hl                              ; next destination

        ld      a, #0xc0                        ; until de == 0xc000
        cp      d
        jr      nz, 1$

        ld      e, #1                           ; success
5$:
        .wb     #0x4000, #0xF0                  ; reset?

        .wb     #.ENABLE_RAM_MBC5, #0x0A        ; enable SRAM back

        pop     af
        ld      (#.MBC1_ROM_PAGE), a            ; restore bank

        ei

        pop     bc
        ret

_end_flash_data_routine:

_save_sram_banks::
        push    bc
        lda     hl, 4(sp)
        ld      b, (hl)

        ld      hl, #(_flash_data_routine - _end_flash_data_routine)
        add     hl, sp
        ld      sp, hl                          ; allocate ram on stack for the routine
        
        ld      de, #(_end_flash_data_routine - _flash_data_routine)
        push    de
        ld      de, #_flash_data_routine
        push    de
        push    hl
        call    _memcpy                         ; copy routine onto stack
        ld      a, b
        pop     bc                              ; address of the routine on stack
        add     sp, #4                          ; remove src and len

        ld      e, #0
        sub     #1
        jr      c, 3$
        and     #3
1$:
        push    af

        ld      h, b
        ld      l, c
        inc     sp
        rst     0x20                            ; call routine, bc is preserved
        dec     sp

        ld      a, e
        or      a
        jr      z, 2$   

        pop     af
        sub     #1
        jr      nc, 1$

        push    af      
2$:
        pop     af
3$:
        ld      hl, #(_end_flash_data_routine - _flash_data_routine)
        add     hl, sp
        ld      sp, hl

        pop     bc
        ret

_erase_flash_sector_routine:
        di

        ldh     a, (#__current_bank)
        push    af                              ; save current bank

        .wb     #.ENABLE_RAM_MBC5, #0x00        ; disable SRAM
        
        .wb     #.MBC1_ROM_PAGE, #__start_save

        .wb     #0x4000, #0xF0                  ; reset?
        .wb     #0x0AAA, #0xA9
        .wb     #0x0555, #0x56
        .wb     #0x0AAA, #0x80
        .wb     #0x0AAA, #0xA9
        .wb     #0x0555, #0x56
        .wb     #0x4000, #0x30                  ; perform magic

        ld      de, #0                          ; wait counter
1$:
        ld      a, (#0x4000)
        cp      #0xFF
        jr      z, 2$                           ; check byte

        dec     e
        jr      nz, 1$
        dec     d
        jr      nz, 1$

        ld      e, #0                           ; fail
        jr      3$
2$:
        ld      e, #1                           ; success
3$:
        .wb     #.ENABLE_RAM_MBC5, #0x0A        ; enable SRAM back

        pop     af
        ld      (#.MBC1_ROM_PAGE), a            ; restore bank

        ei

        ret
_end_erase_flash_sector_routine:

_erase_flash::
        ld      hl, #(_erase_flash_sector_routine - _end_erase_flash_sector_routine)
        add     hl, sp
        ld      sp, hl                          ; allocate ram on stack for the routine

        ld      de, #(_end_erase_flash_sector_routine - _erase_flash_sector_routine)
        push    de
        ld      de, #_erase_flash_sector_routine
        push    de
        push    hl
        call    _memcpy                         ; copy routine onto stack
        pop     hl                              ; address of the routine on stack
        add     sp, #4                          ; remove src, len

        rst     0x20                            ; call routine on stack using call hl

        ld      hl, #(_end_erase_flash_sector_routine - _erase_flash_sector_routine)
        add     hl, sp
        ld      sp, hl

        ret
