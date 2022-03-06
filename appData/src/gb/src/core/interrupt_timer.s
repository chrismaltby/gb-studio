        .include        "global.s"

        .globl  _music_play_isr, _SIO_update

        .area   _HEADER_TIMER (ABS)

        .org    0x50            ; TIM

        ei
        jp      .timer_ISR

        .area   _HOME

.timer_ISR::
        push af
        push hl
        push bc
        push de

        call _music_play_isr
        call _SIO_update

        pop de
        pop bc
        pop hl

        WAIT_STAT
        
        pop af
        reti
