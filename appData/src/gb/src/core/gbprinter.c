#pragma bank 4

#include "system.h"
#include "scroll.h"
#include "gbprinter.h"

#define SECONDS(A) ((A)*60)

const uint8_t PRINTER_INIT[]    = { sizeof(PRINTER_INIT),  0x88,0x33,0x01,0x00,0x00,0x00,0x01,0x00,0x00,0x00 };
const uint8_t PRINTER_STATUS[]  = { sizeof(PRINTER_STATUS),0x88,0x33,0x0F,0x00,0x00,0x00,0x0F,0x00,0x00,0x00 };
const uint8_t PRINTER_EOF[]     = { sizeof(PRINTER_EOF),   0x88,0x33,0x04,0x00,0x00,0x00,0x04,0x00,0x00,0x00 };
const uint8_t PRINTER_START[]   = { sizeof(PRINTER_START), 0x88,0x33,0x02,0x00,0x04,0x00,0x01,0x00,0xE4,0x7F,0x6A,0x01,0x00,0x00 };

uint16_t printer_status;
uint8_t printer_tile_num, printer_packet_num;

uint8_t printer_send_receive(uint8_t b) {
    SB_REG = b;             // data to send
    SC_REG = 0x81;          // 1000 0001 - start, internal clock
    while (SC_REG & 0x80);  // wait until b1 reset
    return SB_REG;          // return response stored in SB_REG
}

uint8_t printer_send_byte(uint8_t b) {
    return (uint8_t)(printer_status = ((printer_status << 8) | printer_send_receive(b)));
}

uint8_t printer_send_command(const uint8_t *command) {
    uint8_t index = 0, length = *command++ - 1;
    while (index++ < length) printer_send_byte(*command++);
    return ((uint8_t)(printer_status >> 8) == 0x81) ? (uint8_t) printer_status : STATUS_MASK_ERRORS;
}

uint8_t printer_print_tile(const uint8_t *tiledata, uint8_t num_packets) {
    static const uint8_t PRINT_TILE[] = { 0x88,0x33,0x04,0x00,0x80,0x02 };
    static uint16_t printer_CRC;
    if (printer_tile_num == 0) {
        const uint8_t * data = PRINT_TILE;
        for (uint8_t i = sizeof(PRINT_TILE); i != 0; i--) printer_send_receive(*data++);
        printer_CRC = 0x04 + 0x80 + 0x02;
    }

    for(uint8_t i = 0x10; i != 0; i--, tiledata++) {
        printer_CRC += *tiledata;
        printer_send_receive(*tiledata);
    }

    if (++printer_tile_num == 40) {
        printer_send_receive((uint8_t)printer_CRC);
        printer_send_receive((uint8_t)(printer_CRC >> 8));
        printer_send_receive(0x00);
        printer_send_receive(0x00);
        printer_CRC = printer_tile_num = 0;

        if (++printer_packet_num == num_packets) {
            printer_packet_num = 0;
            printer_send_command(PRINTER_EOF);
            printer_send_command(PRINTER_START);
            return printer_send_command(PRINTER_STATUS);
        }
    }
    return STATUS_OK;
}

inline void printer_init() {
    printer_tile_num = printer_packet_num = 0;
    printer_send_command(PRINTER_INIT);
}

uint8_t printer_wait(uint16_t timeout, uint8_t mask, uint8_t value) {
    uint8_t error;
    while (((error = printer_send_command(PRINTER_STATUS)) & mask) != value) {
        if (timeout-- == 0) return STATUS_MASK_ERRORS;
        if (error & STATUS_MASK_ERRORS) break;
        wait_vbl_done();
    }
    return error;
}

uint8_t gbprinter_detect(uint8_t delay) BANKED {
    printer_init();
    return printer_wait(delay, STATUS_MASK_ANY, STATUS_OK);
}

uint8_t gbprinter_print_overlay(uint8_t start, uint8_t rows) BANKED {
    uint8_t tile_data[16], error, packets;
    if ((packets = rows >> 1) == 0) return STATUS_OK;

    uint8_t * map = GetWinAddr() + ((uint16_t)start << 5);
    printer_tile_num = printer_packet_num = 0;
    for (uint8_t y = packets << 1; y != 0; y--, map += 0x20) {
        for (uint8_t x = 0, *row = map; x != 20; x++, row++) {
            uint8_t tileno = get_vram_byte(row);
#ifdef CGB
            if (_is_CGB) {
                VBK_REG = 1;
                VBK_REG = ((_is_CGB) && (get_vram_byte(row) & 0x08u)) ? 1 : 0;
            }
            get_win_data(tileno, 1, tile_data);
            VBK_REG = 0;
#else
            get_win_data(tileno, 1, tile_data);
#endif
            if ((error = printer_print_tile(tile_data, packets)) & STATUS_MASK_ERRORS) return error;
        }
    }
    if ((error = printer_wait(SECONDS(1), STATUS_BUSY, STATUS_BUSY)) & STATUS_MASK_ERRORS) return error;
    return printer_wait(SECONDS(30), STATUS_BUSY, 0);
}