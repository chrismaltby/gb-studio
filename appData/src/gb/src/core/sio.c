#pragma bank 255

#include <gb/gb.h>
#include "sio.h"

extern volatile UBYTE SIO_status;
void SIO_send_byte(UBYTE data) PRESERVES_REGS(b, c, d, e, h, l);
void SIO_receive() PRESERVES_REGS(b, c, d, e, h, l);

UBYTE link_operation_mode;

UBYTE link_packet[LINK_MAX_PACKET_LENGTH];
extern UBYTE link_byte_sent;
extern UBYTE link_next_mode;

UBYTE link_packet_len;
UBYTE * link_packet_ptr;
UBYTE link_packet_received;

UBYTE link_packet_snd_len;
const UBYTE * link_packet_snd_ptr;
UBYTE link_packet_sent;

void on_SIO_receive(UBYTE data) NONBANKED {
    if (link_packet_len) {
        link_packet_len--;
        *link_packet_ptr++ = data;
        if (link_packet_len == 0) {
            link_packet_ptr = link_packet;
            link_packet_received = TRUE;
        } else {
            SIO_receive();
        }
    } else {
        link_packet_len = data;
        link_packet_ptr = link_packet;
        SIO_receive();
    }
}

UBYTE SIO_update() NONBANKED {
    if (SIO_status == IO_ERROR) {
        link_operation_mode = LINK_MODE_NONE;
        link_packet_len = link_packet_snd_len = 0;
        link_packet_ptr = link_packet;
        SIO_status = IO_IDLE;
        return FALSE;
    }

    if (link_byte_sent) {
        if (link_packet_snd_len != 0) {
            link_byte_sent = FALSE;
            if (link_packet_snd_len == 1) link_next_mode = IO_RECEIVING;
            SIO_send_byte(*link_packet_snd_ptr++);
            link_packet_snd_len--;
        } else {
            link_packet_sent = TRUE;
        }
    }
    return TRUE;
}

void SIO_init() BANKED {
    link_operation_mode = LINK_MODE_NONE;

    link_packet_len = 0;
    link_packet_ptr = link_packet;
    link_packet_received = FALSE;

    link_packet_snd_len = 0;
    link_packet_snd_ptr = link_packet;
    link_packet_sent = FALSE;
}
