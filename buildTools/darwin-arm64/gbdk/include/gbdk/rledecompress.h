/** @file gbdk/rledecompress.h

    Decompressor for RLE encoded data

    Decompresses data which has been compressed with
    @ref utility_gbcompress "gbcompress" using the `--alg=rle` argument.
*/

#ifndef __RLEDECOMPRESS_H_INCLUDE
#define __RLEDECOMPRESS_H_INCLUDE

#include <types.h>
#include <stdint.h>

#define RLE_STOP 0

#if defined(__TARGET_gb) || defined(__TARGET_ap) || defined(__TARGET_duck) || defined(__TARGET_nes)
/** Initialize the RLE decompressor with RLE data at address __data__

    @param data   Pointer to start of RLE compressed data

    @see rle_decompress
 */
uint8_t rle_init(void * data);

/** Decompress RLE compressed data into __dest__ for length __len__ bytes

    @param dest   Pointer to destination buffer/address
    @param len    Number of bytes to decompress
    @return       Returns `0` if compression is complete, `1` if there is more data to decompress

    Before calling this function @ref rle_init must be called
    one time to initialize the RLE decompressor.

    Decompresses data which has been compressed with
    @ref utility_gbcompress "gbcompress" using the `--alg=rle` argument.

    @see rle_init
 */
uint8_t rle_decompress(void * dest, uint8_t len);
#elif defined(__TARGET_sms) || defined(__TARGET_gg)
uint8_t rle_init(void * data) Z88DK_FASTCALL;
uint8_t rle_decompress(void * dest, uint8_t len) Z88DK_CALLEE;
#else
  #error Unrecognized port
#endif

#endif