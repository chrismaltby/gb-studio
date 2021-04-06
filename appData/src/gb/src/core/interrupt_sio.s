        .include "global.s"

        .globl  _SIO_status

        .area   _HEADER_SIO (ABS)

        .org    0x58            ; SIO
.int_SIO:
        ei
        jp .sio_ISR

        .area   _BSS
.start_sio_globals:

_SIO_status::
        .ds     0x01            ; Status of serial IO

_link_byte_sent::
        .ds     0x01            ; byte sent

.end_sio_globals:

        .area   _GSINIT
        
        xor a
        ld  hl,#.start_sio_globals
        ld  c,#(.end_sio_globals - .start_sio_globals)
        rst 0x28                ; memset small

        ld  a, #.IO_IDLE
        ld  (_SIO_status), a
        
        ldh (.SC), a            ; use external clock
        ld  a, #.DT_IDLE
        ldh (.SB), a            ; send idle byte
        ld  a, #0x80
        ldh (.SC), a            ; use external clock

        .area   _BASE

.sio_ISR::
        push af
        push hl
        push bc
        push de

        ld  a, (_SIO_status)    ; get status

        cp  #.IO_RECEIVING
        jr  nz, 1$

        ;; receiving data
        ldh a, (.SB)            ; get data byte
        push af
        inc sp

        ld  a, #.IO_IDLE
        ld  (_SIO_status),a     ; store status

        xor a
        ldh (.SC),a             ; use external clock
        ld  a,#.DT_IDLE
        ldh (.SB),a             ; reply with idle byte
        ld  a,#0x80
        ldh (.SC),a             ; enable transfer with external clock

        call _on_SIO_receive
        inc sp
        jr  5$

1$:
        cp  # .IO_SENDING
        jr  nz, 4$

        ldh a, (.SB)             ; get data byte
        cp  #.DT_RECEIVING
        ld  a, #.IO_IDLE
        jr  z, 3$
        ld  a, #.IO_ERROR

3$:
        ld  (_SIO_status), a    ; store status

        xor a
        ldh (.SC),a             ; use external clock
        ld  a,#.DT_IDLE
        ldh (.SB),a             ; reply with idle byte
        ld  a,#0x80
        ldh (.SC),a             ; enable transfer with external clock

        ld  a, #1
        ld  (_link_byte_sent), a; link_byte_sent = TRUE 

        jr  5$
        
4$:
        ld  a,#0x80
        ldh (.SC),a             ; enable transfer with external clock

5$:
        pop de
        pop bc
        pop hl

        WAIT_STAT
        
        pop af
        reti

        .area _CODE
        
        ;; Send byte in __io_out to the serial port
_SIO_send_byte::
        ld  a, #.IO_SENDING
        ld  (_SIO_status), a    ; store status
        ld  a, #0x01
        ldh (.SC), a            ; use internal clock

        ldhl sp, #2
        ld  a, (hl)

        ldh (.SB), a            ; send data byte
        ld  a, #0x81
        ldh (.SC), a            ; use internal clock
        ret

        ;; Receive byte from the serial port in __io_in
_SIO_receive::
        ld  a, #.IO_RECEIVING
        ld  (_SIO_status), a    ; store status
        xor a
        ldh (.SC), a            ; use external clock
        ld  a, #.DT_RECEIVING
        ldh (.SB), a            ; send receiving byte
        ld  a, #0x80
        ldh (.SC), a            ; use external clock
        ret
