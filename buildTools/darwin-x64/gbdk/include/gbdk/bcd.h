#ifndef __GBDK_BCD_H_INCLUDE
#define __GBDK_BCD_H_INCLUDE

#if defined(__TARGET_gb) || defined(__TARGET_ap) || defined(__TARGET_duck)
  #include <gb/bcd.h>
#elif defined(__TARGET_sms) || defined(__TARGET_gg) || defined(__TARGET_msxdos)
  #include <sms/bcd.h>
#elif defined(__TARGET_nes)
  #include <nes/bcd.h>
#else
  #error Unrecognized port
#endif

#endif