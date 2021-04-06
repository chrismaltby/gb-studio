#pragma bank 2

#include <string.h>

#include "vm.h"

#include "sio.h"

void vm_sio_set_mode(SCRIPT_CTX * THIS, UBYTE mode) __banked {
    THIS;
    SIO_set_mode(mode);
}

void vm_sio_exchange(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB, UBYTE len) __banked {
    INT16 * data;
    // terminate if error
    if (link_operation_mode == LINK_MODE_NONE) return;
    // check length
    if (len > LINK_MAX_PACKET_LENGTH) len = LINK_MAX_PACKET_LENGTH;
    // process received first
    if (link_packet_received) {
        if (idxB < 0) data = THIS->stack_ptr + idxB; else data = script_memory + idxB;
        memcpy(data, link_packet, len);
        link_packet_received = FALSE;
        // rending reply packet when in SLAVE mode
        if (link_operation_mode == LINK_MODE_SLAVE) {
            if (idxA < 0) data = THIS->stack_ptr + idxA; else data = script_memory + idxA;
            memcpy(link_packet, data, len);
            SIO_send_async(len, link_packet);
        } else {
            link_exchange_finished = TRUE;
        } 
    }
    // process sending
    if (link_operation_mode == LINK_MODE_MASTER) {
        if (link_exchange_finished) {
            if (idxA < 0) data = THIS->stack_ptr + idxA; else data = script_memory + idxA;
            memcpy(link_packet, data, len);
            link_exchange_finished = FALSE;
            SIO_send_async(len, link_packet);
        };
    };
    if (!link_exchange_finished) THIS->PC -= (INSTRUCTION_SIZE + sizeof(idxA) + sizeof(idxB) + sizeof(len)), THIS->waitable = TRUE;
}
