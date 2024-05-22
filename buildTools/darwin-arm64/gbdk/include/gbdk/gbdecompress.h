#ifndef __GB_DECOMPRESS_H_INCLUDE
#define __GB_DECOMPRESS_H_INCLUDE

#if defined(__TARGET_gb) || defined(__TARGET_ap) || defined(__TARGET_duck)
  #include <gb/gbdecompress.h>
#elif defined(__TARGET_sms) || defined(__TARGET_gg)
  #include <sms/gbdecompress.h>
#else
  #error Unrecognized port
#endif

#endif