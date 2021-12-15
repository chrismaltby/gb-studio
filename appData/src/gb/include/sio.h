#ifndef _SIO_H_INCLUDE
#define _SIO_H_INCLUDE

#include <gb/gb.h>

#include "compat.h"

#define LINK_MAX_PACKET_LENGTH 32

#define LINK_MODE_NONE 0
#define LINK_MODE_MASTER 1
#define LINK_MODE_SLAVE 2

extern volatile UBYTE SIO_status;
void SIO_send_byte(UBYTE data) PRESERVES_REGS(b, c, d, e, h, l);
void SIO_receive() PRESERVES_REGS(b, c, d, e, h, l);

extern UBYTE link_operation_mode;

extern UBYTE link_packet[];
extern UBYTE link_byte_sent;

extern UBYTE link_packet_len;
extern UBYTE * link_packet_ptr;
extern UBYTE link_packet_received;

extern UBYTE link_packet_snd_len;
extern const UBYTE * link_packet_snd_ptr;
extern UBYTE link_packet_sent;

void SIO_init() BANKED;

inline void SIO_set_mode(UBYTE mode) {
    link_operation_mode = mode;
    if (mode == LINK_MODE_SLAVE) {
        SIO_receive();
    }
}

inline void SIO_send_async(UBYTE len, const UBYTE * data) {
    link_packet_snd_len = len;
    link_packet_snd_ptr = data;
    link_byte_sent = FALSE;
    SIO_send_byte(len);
    link_packet_sent = (link_packet_snd_len == 0);
}

#endif
