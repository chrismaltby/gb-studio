#ifndef _SIO_H_INCLUDE
#define _SIO_H_INCLUDE

#include <gb/gb.h>

#define LINK_MAX_PACKET_LENGTH 32

#define LINK_MODE_NONE 0
#define LINK_MODE_MASTER 1
#define LINK_MODE_SLAVE 2

extern volatile UBYTE SIO_status;
void SIO_send_byte(UBYTE data) __preserves_regs(b, c, d, e, h, l);
void SIO_receive() __preserves_regs(b, c, d, e, h, l);

extern UBYTE link_operation_mode;
extern UBYTE link_packet_len;
extern UBYTE link_packet[];
extern UBYTE * link_packet_ptr;
extern UBYTE link_packet_received;

extern UBYTE link_packet_snd_len;
extern const UBYTE * link_packet_snd_ptr;

extern UBYTE link_exchange_finished;
extern UBYTE link_byte_sent;

void SIO_init() __banked;

inline void SIO_set_mode(UBYTE mode) {
    link_operation_mode = mode;
    link_exchange_finished = TRUE;
    if (mode == LINK_MODE_SLAVE) {
        SIO_receive();
    }
}

inline void SIO_send_async(UBYTE len, const UBYTE * data) {
    link_packet_snd_len = len;
    link_packet_snd_ptr = data;
    link_byte_sent = FALSE;
    SIO_send_byte(link_packet_snd_len);
}

#endif
