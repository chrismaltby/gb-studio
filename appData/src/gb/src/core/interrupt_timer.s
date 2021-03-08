        .include        "global.s"

        .globl  _music_update

        .area   _HEADER_TIMER (ABS)

        .org    0x50            ; TIM

        ei
        jp      _music_update
