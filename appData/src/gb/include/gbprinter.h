#ifndef __GBPRINTER_H_INCLUDE__
#define __GBPRINTER_H_INCLUDE__

#include <gbdk/platform.h>
#include <stdint.h>

/** Width of the printed image in tiles
*/
#define PRN_TILE_WIDTH          20

#define PRN_LOW(A) ((A) & 0xFF)
#define PRN_HIGH(A) ((A) >> 8)

/** 0x88,0x33 are mandatory first bytes to initialise a communication with printer
    Any command sequence begins by these
*/
#define PRN_MAGIC               0x3388
#define PRN_LE(A)               PRN_LOW(A),PRN_HIGH(A)

/** INIT command is mandatory to initialize communication protocol with the printer
    Two consecutive linked commands must never be more than 150 ms apart except the INIT command which is valid at least 10 seconds
*/
#define PRN_CMD_INIT            0x01

/** PRINT command
    Contains the palette, margins, number of prints and printing intensity
*/
#define PRN_CMD_PRINT           0x02

/** DATA command
    Can be any length between 0 and 640 bytes.
    DATA command with lenght 0 triggers PRN_STATUS_FULL and is mandatory before print command
*/
#define PRN_CMD_DATA            0x04

/** BREAK command
    Not very usefull but exists (see Game Boy Programming Manual)
*/
#define PRN_CMD_BREAK           0x08

/** STATUS command
    Used to check status bits
    Maybe be used alone before an INIT command to check physical connection with printer
    Resets PRN_STATUS_UNTRAN
*/
#define PRN_CMD_STATUS          0x0F

/** Palette format: the bits, grouped two by two, give the printing color of the encoded pixel value
    for the default palette 0xE4 = 0b11100100 = [3 2 1 0]
    Any value is valid, which means that 1 to 4 color images are possible
    0x00 acts the same as 0xE4 for the printer
*/
#define PRN_PALETTE_NORMAL      0b11100100u
#define PRN_PALETTE_INV         0b00011011u

/** Don't use margins
*/
#define PRN_NO_MARGINS          0x00

/** Exposure: 0x40 is default value, values from 0x80 to 0xFF act as 0x40
    Determines the time used by the printer head to heat the thermal paper
*/
#define PRN_EXPOSURE_LIGHT      0x00
#define PRN_EXPOSURE_DEFAULT    0x40
#define PRN_EXPOSURE_DARK       0x7F

/** Battery too low
*/
#define PRN_STATUS_LOWBAT       0x80

/** Error not specified according to the Game Boy Programming manual
*/
#define PRN_STATUS_ER2          0x40

/** Paper jam  (abnormal motor operation)
*/
#define PRN_STATUS_ER1          0x20

/** Packet error (but not checksum error)
*/
#define PRN_STATUS_ER0          0x10

/** Unprocessed data present in printer memory
    Allows to verify that printer got some data in memory with correct checksum
    is resetted by STATUS command
*/
#define PRN_STATUS_UNTRAN       0x08

/** status data ready, mandatory to allow printing
    is triggered by DATA command with lenght 0
*/
#define PRN_STATUS_FULL         0x04

/** Message sent by the printer while physically printing
*/
#define PRN_STATUS_BUSY         0x02

/** The received packet has a ckecksum error
*/
#define PRN_STATUS_SUM          0x01

/** Everything is fine, printer ready for further transmission
*/
#define PRN_STATUS_OK           0x00

#define PRN_STATUS_MASK_ERRORS  0xF0
#define PRN_STATUS_MASK_ANY     0xFF

#define PRN_SECONDS(A)          ((A)*60)

#define PRN_MAX_PROGRESS        8

#define PRN_STATUS_CANCELLED    PRN_STATUS_ER2

typedef struct start_print_pkt_t {
    uint16_t magic;
    uint16_t command;
    uint16_t length;
    uint8_t print;
    uint8_t margins;
    uint8_t palette;
    uint8_t exposure;
    uint16_t crc;
    uint16_t trail;
} start_print_pkt_t;

extern start_print_pkt_t PRN_PKT_START;

uint8_t gbprinter_detect(uint8_t delay) BANKED;
uint8_t gbprinter_print_overlay(uint8_t start, uint8_t rows, uint8_t margins) BANKED;

inline void gbprinter_set_print_params(uint8_t margins, uint8_t palette, uint8_t exposure) {
    PRN_PKT_START.crc = ((PRN_CMD_PRINT + 0x04u + 0x01u) + (PRN_PKT_START.margins = margins) + (PRN_PKT_START.palette = palette) + (PRN_PKT_START.exposure = exposure));
}

#endif