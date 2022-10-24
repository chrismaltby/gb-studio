#pragma bank 255

#include <string.h>

#include "vm.h"

#include "vm_sio.h"

#include "sio.h"

BANKREF(VM_SIO)

#define PACKET_SEND_INIT 1
#define PACKET_SEND_DONE 2

#define PACKET_RECV_INIT 4
#define PACKET_RECV_DONE 8

#define EXCHANGE_STARTED 0
#define EXCHANGE_COMPLETED (PACKET_SEND_INIT | PACKET_SEND_DONE | PACKET_RECV_INIT | PACKET_RECV_DONE)

UBYTE exchange_state = EXCHANGE_COMPLETED;

void vm_sio_set_mode(SCRIPT_CTX * THIS, UBYTE mode) OLDCALL BANKED {
    THIS;
    exchange_state = EXCHANGE_COMPLETED;
    SIO_set_mode(mode);
}

void vm_sio_exchange(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB, UBYTE len) OLDCALL BANKED {
    INT16 * data;
    // terminate if something is wrong
    if (link_operation_mode == LINK_MODE_NONE) {
        exchange_state = EXCHANGE_COMPLETED;
        return;
    }
    // start transfer if not already started
    if (exchange_state == EXCHANGE_COMPLETED) exchange_state = EXCHANGE_STARTED;
    // process transfer states
    switch (link_operation_mode) {
        case LINK_MODE_MASTER:
            if ((exchange_state & PACKET_SEND_INIT) == 0) {
                if (len > LINK_MAX_PACKET_LENGTH) len = LINK_MAX_PACKET_LENGTH;

                link_packet_sent = link_packet_received = FALSE;

                data = VM_REF_TO_PTR(idxA);
                memcpy(link_packet, data, len);
                SIO_send_async(len, link_packet);

                exchange_state |= PACKET_SEND_INIT;
            } else if ((exchange_state & PACKET_SEND_DONE) == 0) {
                if (link_packet_sent) exchange_state |= PACKET_SEND_DONE;
            } else if ((exchange_state & PACKET_RECV_INIT) == 0) {
                if (link_packet_received) exchange_state |= PACKET_RECV_INIT;
            } else if ((exchange_state & PACKET_RECV_DONE) == 0) {
                if (len > LINK_MAX_PACKET_LENGTH) len = LINK_MAX_PACKET_LENGTH;

                data = VM_REF_TO_PTR(idxB);
                memcpy(data, link_packet, len);
                exchange_state |= PACKET_RECV_DONE;
            }
            break;

        case LINK_MODE_SLAVE:
            if ((exchange_state & PACKET_RECV_INIT) == 0) {
                link_packet_sent = link_packet_received = FALSE;
                exchange_state |= PACKET_RECV_INIT;
            } else if ((exchange_state & PACKET_RECV_DONE) == 0) {
                if (link_packet_received) {
                    if (len > LINK_MAX_PACKET_LENGTH) len = LINK_MAX_PACKET_LENGTH;

                    data = VM_REF_TO_PTR(idxB);
                    memcpy(data, link_packet, len);
                    exchange_state |= PACKET_RECV_DONE;
                }
            } else if ((exchange_state & PACKET_SEND_INIT) == 0) {
                if (len > LINK_MAX_PACKET_LENGTH) len = LINK_MAX_PACKET_LENGTH;

                data = VM_REF_TO_PTR(idxA);
                memcpy(link_packet, data, len);
                SIO_send_async(len, link_packet);

                exchange_state |= PACKET_SEND_INIT;
            } else if ((exchange_state & PACKET_SEND_DONE) == 0) {
                if (link_packet_sent) exchange_state |= PACKET_SEND_DONE;
            }
            break;
    }
    // re-run next time if transfer is not completed
    if (exchange_state != EXCHANGE_COMPLETED) THIS->PC -= (INSTRUCTION_SIZE + sizeof(idxA) + sizeof(idxB) + sizeof(len)), THIS->waitable = TRUE;
}
