#ifndef __GBDK_BCD_H_INCLUDE
#define __GBDK_BCD_H_INCLUDE

#if defined(__TARGET_gb) || defined(__TARGET_ap) || defined(__TARGET_duck)
  #include <gb/bcd.h>
#elif defined(__TARGET_sms) || defined(__TARGET_gg)
  #error Not implemented yet
#else
  #error Unrecognized port
#endif

#endif