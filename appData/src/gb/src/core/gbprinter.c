#pragma bank 255

#include "system.h"
#include "scroll.h"
#include "gbprinter.h"

#define REINIT_SEIKO

#define START_TRANSFER 0x81

#define PRN_BUSY_TIMEOUT        PRN_SECONDS(2)
#define PRN_COMPLETION_TIMEOUT  PRN_SECONDS(20)
#define PRN_SEIKO_RESET_TIMEOUT 10

#define PRN_FINAL_MARGIN        0x03

static const uint8_t PRN_PKT_INIT[]    = { PRN_LE(PRN_MAGIC), PRN_LE(PRN_CMD_INIT),   PRN_LE(0), PRN_LE(0x01), PRN_LE(0) };
static const uint8_t PRN_PKT_STATUS[]  = { PRN_LE(PRN_MAGIC), PRN_LE(PRN_CMD_STATUS), PRN_LE(0), PRN_LE(0x0F), PRN_LE(0) };
static const uint8_t PRN_PKT_EOF[]     = { PRN_LE(PRN_MAGIC), PRN_LE(PRN_CMD_DATA),   PRN_LE(0), PRN_LE(0x04), PRN_LE(0) };
static const uint8_t PRN_PKT_CANCEL[]  = { PRN_LE(PRN_MAGIC), PRN_LE(PRN_CMD_BREAK),  PRN_LE(0), PRN_LE(0x01), PRN_LE(0) };

start_print_pkt_t PRN_PKT_START = {
    .magic = PRN_MAGIC, .command = PRN_CMD_PRINT, .length = 4,
    .print = TRUE, .margins = 0, .palette = PRN_PALETTE_NORMAL, .exposure = PRN_EXPOSURE_DARK,
    .crc = 0, .trail = 0
};

static uint16_t printer_status;
static uint8_t printer_tile_num;

uint8_t printer_send_receive(uint8_t b) {
    SB_REG = b;
    SC_REG = START_TRANSFER;
    while (SC_REG & 0x80);
    return SB_REG;
}

uint8_t printer_send_byte(uint8_t b) {
    return (uint8_t)(printer_status = ((printer_status << 8) | printer_send_receive(b)));
}

uint8_t printer_send_command(const uint8_t *command, uint8_t length) {
    uint8_t index = 0;
    while (index++ < length) printer_send_byte(*command++);
    return ((uint8_t)(printer_status >> 8) == 0x81) ? (uint8_t)printer_status : PRN_STATUS_MASK_ERRORS;
}
#define PRINTER_SEND_COMMAND(CMD) printer_send_command((const uint8_t *)&(CMD), sizeof(CMD))

uint8_t printer_print_tile(const uint8_t *tiledata) {
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
        return TRUE;
    }
    return FALSE;
}

inline void printer_init() {
    printer_tile_num = 0;
    PRINTER_SEND_COMMAND(PRN_PKT_INIT);
}

uint8_t printer_wait(uint16_t timeout, uint8_t mask, uint8_t value) {
    uint8_t error;
    while (((error = PRINTER_SEND_COMMAND(PRN_PKT_STATUS)) & mask) != value) {
        if (timeout-- == 0) return PRN_STATUS_MASK_ERRORS;
        if (error & PRN_STATUS_MASK_ERRORS) break;
        wait_vbl_done();
    }
    return error;
}


uint8_t gbprinter_detect(uint8_t delay) BANKED {
    printer_init();
    return printer_wait(delay, PRN_STATUS_MASK_ANY, PRN_STATUS_OK);
}

uint8_t gbprinter_print_overlay(uint8_t start, uint8_t rows, uint8_t margins) BANKED {
    uint8_t tile_data[16], error, packets, pkt_count = 0;
    if ((packets = rows >> 1) == 0) return PRN_STATUS_OK;

    uint8_t * map = GetWinAddr() + ((uint16_t)start << 5);
    printer_tile_num = 0;
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
            if (printer_print_tile(tile_data)) pkt_count++;
            if (pkt_count == 9) {
                pkt_count = 0;
                PRINTER_SEND_COMMAND(PRN_PKT_EOF);
                gbprinter_set_print_params((y == (rows - 1)) ? margins : PRN_NO_MARGINS, PRN_PALETTE_NORMAL, PRN_EXPOSURE_DARK);
                PRINTER_SEND_COMMAND(PRN_PKT_START);
                // query printer status
                if ((error = printer_wait(PRN_BUSY_TIMEOUT, PRN_STATUS_BUSY, PRN_STATUS_BUSY)) & PRN_STATUS_MASK_ERRORS) return error;
                if ((error = printer_wait(PRN_COMPLETION_TIMEOUT, PRN_STATUS_BUSY, 0)) & PRN_STATUS_MASK_ERRORS) return error;
#ifdef REINIT_SEIKO
                // reinit printer (required by Seiko?)
                PRINTER_SEND_COMMAND(PRN_PKT_INIT);
                if (error = printer_wait(PRN_SEIKO_RESET_TIMEOUT, PRN_STATUS_MASK_ANY, PRN_STATUS_OK)) return error;
#endif
            }
        }
    }
    if (pkt_count) {
        PRINTER_SEND_COMMAND(PRN_PKT_EOF);
        // setup printing if required
        gbprinter_set_print_params(margins, PRN_PALETTE_NORMAL, PRN_EXPOSURE_DARK);
        PRINTER_SEND_COMMAND(PRN_PKT_START);
        // query printer status
        if ((error = printer_wait(PRN_BUSY_TIMEOUT, PRN_STATUS_BUSY, PRN_STATUS_BUSY)) & PRN_STATUS_MASK_ERRORS) return error;
        if ((error = printer_wait(PRN_COMPLETION_TIMEOUT, PRN_STATUS_BUSY, 0)) & PRN_STATUS_MASK_ERRORS) return error;
    }
    return PRINTER_SEND_COMMAND(PRN_PKT_STATUS);
}