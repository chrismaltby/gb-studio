#ifndef __PLATFORM_H_INCLUDE
#define __PLATFORM_H_INCLUDE

#if defined(__TARGET_gb) || defined(__TARGET_ap) || defined(__TARGET_duck)
  #include <gb/gb.h>
  #include <gb/cgb.h>
  #include <gb/sgb.h>
#elif defined(__TARGET_sms) || defined(__TARGET_gg)
  #include <sms/sms.h>
#else
  #error Unrecognized port
#endif

#endif