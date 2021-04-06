#pragma bank 3

#include <gb/gb.h>
#include "sio.h"

extern volatile UBYTE SIO_status;
void SIO_send_byte(UBYTE data) __preserves_regs(b, c, d, e, h, l);
void SIO_receive() __preserves_regs(b, c, d, e, h, l);

UBYTE link_operation_mode;
UBYTE link_packet_len;
UBYTE link_packet[LINK_MAX_PACKET_LENGTH];
UBYTE * link_packet_ptr;
UBYTE link_packet_received;

UBYTE link_packet_snd_len;
const UBYTE * link_packet_snd_ptr;

UBYTE link_exchange_finished;
extern UBYTE link_byte_sent;

void on_SIO_receive(UBYTE data) __nonbanked {
    if (link_packet_len) {
        *link_packet_ptr++ = data;
        link_packet_len--;
    } else {
        link_packet_len = data;
    }
    if (!link_packet_len) {
        // null length packet is also possible reply
        link_packet_ptr = link_packet;
        link_packet_received = TRUE;
    } else {
        SIO_receive();
    }
}

UBYTE SIO_update() __nonbanked {
    if (SIO_status == IO_ERROR) {
        link_exchange_finished = TRUE;
        link_operation_mode = LINK_MODE_NONE;
        link_packet_len = link_packet_snd_len = 0;
        link_packet_ptr = link_packet;
        SIO_status = IO_IDLE;
        return FALSE;
    }

    if (link_byte_sent) {
        if (link_packet_snd_len) {
            link_byte_sent = FALSE;
            SIO_send_byte(*link_packet_snd_ptr++);
            link_packet_snd_len--;
            if (!link_packet_snd_len) {
                SIO_receive();
            };
        };
    }
    return TRUE;
}

void SIO_init() __banked {
    link_operation_mode = LINK_MODE_NONE;
    link_packet_len = 0;
    link_packet_ptr = link_packet;
    link_packet_received = FALSE;

    link_packet_snd_len = 0;
    link_packet_snd_ptr = NULL;

    link_exchange_finished = TRUE;
}
