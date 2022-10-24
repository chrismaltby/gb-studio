#pragma bank 255

#include <gb/gb.h>
#ifdef CGB
    #include <gb/cgb.h>
#endif

#include "compat.h"
#include "system.h"
#include "fade_manager.h"
#include "palette.h"

#define FADED_OUT_FRAME 5
#define FADED_IN_FRAME 0

UBYTE fade_running;
UBYTE fade_frames_per_step;
UBYTE fade_timer;
UBYTE fade_style = 0;

const UBYTE fade_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F, 0x3F};

static UBYTE fade_frame;
static FADE_DIRECTION fade_direction;

#ifdef CGB

void CGBFadeToWhiteStep(const palette_entry_t * pal, UBYTE reg, UBYTE step) OLDCALL NAKED {
    pal; reg; step;
#if defined(__SDCC) && defined(NINTENDO)
__asm
        ldhl sp, #5
        ld a, (hl-)
        ld b, a

        ld a, (hl-)
        ld c, a
        ld a, #0x80
        ldh (c), a
        inc c

        ld a, (hl-)
        ld l, (hl)
        ld h, a

        ld de, #0x0000
        ld a, b
        or a
        jr z, 2$
0$:
        sla e
        rl d
        set 0, e
        set 5, e
        set 2, d
        dec b
        jr nz, 0$
2$:
        ld b, #(8 * 4)
1$:
        ldh a, (_STAT_REG)
        bit STATF_B_BUSY, a
        jr nz, 1$
        ld a, (hl+)
        or e
        ldh (c), a

3$:
        ldh a, (_STAT_REG)
        bit STATF_B_BUSY, a
        jr nz, 3$
        ld a, (hl+)
        or d
        ldh (c), a

        dec b
        jr nz, 1$

        ret
__endasm;
#endif
}

void CGBFadeToBlackStep(const palette_entry_t * pal, UBYTE reg, UBYTE step) OLDCALL NAKED {
    pal; reg; step;
#if defined(__SDCC) && defined(NINTENDO)
__asm
        ldhl sp, #5
        ld a, (hl-)
        ld b, a

        ld a, (hl-)
        ld c, a
        ld a, #0x80
        ldh (c), a
        inc c

        ld a, (hl-)
        ld l, (hl)
        ld h, a

        ld de, #0x7fff
        ld a, b
        or a
        jr z, 2$
0$:
        res 4, e
        res 1, d
        srl d
        rr e
        res 4, e
        res 1, d
        dec b
        jr nz, 0$
2$:
        ld b, #(8 * 4)
1$:
        ldh a, (_STAT_REG)
        bit STATF_B_BUSY, a
        jr nz, 1$
        ld a, (hl+)
        and e
        ldh (c), a

3$:
        ldh a, (_STAT_REG)
        bit STATF_B_BUSY, a
        jr nz, 3$
        ld a, (hl+)
        and d
        ldh (c), a

        dec b
        jr nz, 1$

        ret
__endasm;
#endif
}

void ApplyPaletteChangeColor(UBYTE index) {
    if (fade_style) {
        CGBFadeToBlackStep(BkgPalette, BCPS_REG_ADDR, index);
        CGBFadeToBlackStep(SprPalette, OCPS_REG_ADDR, index);
    } else {
        CGBFadeToWhiteStep(BkgPalette, BCPS_REG_ADDR, index);
        CGBFadeToWhiteStep(SprPalette, OCPS_REG_ADDR, index);
    }
}
#endif

UBYTE DMGFadeToWhiteStep(UBYTE pal, UBYTE step) OLDCALL NAKED {
    pal; step;
#if defined(__SDCC) && defined(NINTENDO)
__asm
        ldhl    SP, #3
        ld      A, (HL-)
        ld      E, (HL)
        or      A
        ret     Z

        ld      D, A
1$:
        ld      H, #4
2$:
        ld      A, E
        and     #3
        jr      Z, 3$
        dec     A
3$:
        srl     A
        rr      L
        srl     A
        rr      L

        srl     E
        srl     E

        dec     H
        jr      NZ, 2$

        ld      E, L

        dec     D
        jr      NZ, 1$
        ret
__endasm;
#endif
}

UBYTE DMGFadeToBlackStep(UBYTE pal, UBYTE step) OLDCALL NAKED {
    pal; step;
#if defined(__SDCC) && defined(NINTENDO)
__asm
        ldhl    SP, #3
        ld      A, (HL-)
        ld      E, (HL)
        or      A
        ret     Z

        ld      D, A
1$:
        ld      H, #4
2$:
        ld      A, E
        and     #3
        cp      #3
        jr      Z, 3$
        inc     A
3$:
        srl     A
        rr      L
        srl     A
        rr      L

        srl     E
        srl     E

        dec     H
        jr      NZ, 2$

        ld      E, L

        dec     D
        jr      NZ, 1$
        ret
__endasm;
#endif
}

void ApplyPaletteChangeDMG(UBYTE index) {
    if (index > 4) index = 4;
    if (!fade_style) {
        BGP_REG = DMGFadeToWhiteStep(DMG_palette[0], index);
        OBP0_REG = DMGFadeToWhiteStep(DMG_palette[1], index);
        OBP1_REG = DMGFadeToWhiteStep(DMG_palette[2], index);
    } else {
        BGP_REG = DMGFadeToBlackStep(DMG_palette[0], index);
        OBP0_REG = DMGFadeToBlackStep(DMG_palette[1], index);
        OBP1_REG = DMGFadeToBlackStep(DMG_palette[2], index);
    }
}

void fade_init() BANKED {
    fade_frames_per_step = fade_speeds[2];
    fade_timer = FADED_OUT_FRAME;
    fade_running = FALSE;
#ifdef CGB
    if (_is_CGB) {
        ApplyPaletteChangeColor(fade_timer);
        return;
    }
#endif
    ApplyPaletteChangeDMG(FADED_OUT_FRAME);
}

void fade_in() BANKED {
    if (fade_timer == FADED_IN_FRAME) {
        return;
    }
    fade_frame = 0;
    fade_direction = FADE_IN;
    fade_running = TRUE;
    fade_timer = FADED_OUT_FRAME;
#ifdef CGB
    if (_is_CGB) {
        ApplyPaletteChangeColor(FADED_OUT_FRAME);
        return;
    }
#endif
    ApplyPaletteChangeDMG(FADED_OUT_FRAME);
}

void fade_out() BANKED {
    if (fade_timer == FADED_OUT_FRAME) {
        return;
    }
    fade_frame = 0;
    fade_direction = FADE_OUT;
    fade_running = TRUE;
    fade_timer = FADED_IN_FRAME;
#ifdef CGB
    if (_is_CGB) {
        ApplyPaletteChangeColor(fade_timer);
        return;
    }
#endif
        ApplyPaletteChangeDMG(FADED_IN_FRAME);
}

void fade_update() BANKED {
    if (fade_running) {
        if ((fade_frame++ & fade_frames_per_step) == 0) {
            if (fade_direction == FADE_IN) {
                if (fade_timer > FADED_IN_FRAME) fade_timer--;
                if (fade_timer == FADED_IN_FRAME) fade_running = FALSE;
            } else {
                if (fade_timer < FADED_OUT_FRAME) fade_timer++;
                if (fade_timer == FADED_OUT_FRAME) fade_running = FALSE;
            }
#ifdef CGB
            if (_is_CGB) {
                ApplyPaletteChangeColor(fade_timer);
                return;
            }
#endif
            ApplyPaletteChangeDMG(fade_timer);
        }
    }
}

void fade_applypalettechange() BANKED {
#ifdef CGB
    if (_is_CGB) {
        ApplyPaletteChangeColor(fade_timer);
        return;
    }
#endif
    ApplyPaletteChangeDMG(fade_timer);
}

void fade_setspeed(UBYTE speed) BANKED {
    fade_frames_per_step = fade_speeds[speed];
}

void fade_in_modal() BANKED {
    fade_in();
    while (fade_isfading()) {
        wait_vbl_done();
        fade_update();
    }
}

void fade_out_modal() BANKED {
    fade_out();
    while (fade_isfading()) {
        wait_vbl_done();
        fade_update();
    }
}