#ifndef __PLAT_METASPRITES_H_INVCLUDE
#define __PLAT_METASPRITES_H_INVCLUDE

#if defined(__TARGET_gb) || defined(__TARGET_ap) || defined(__TARGET_duck)
  #include <gb/metasprites.h>
#elif defined(__TARGET_sms) || defined(__TARGET_gg)
  #include <sms/metasprites.h>
#else
  #error Unrecognized port
#endif

#endif