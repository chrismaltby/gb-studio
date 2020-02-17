#ifndef GBDKJS_H
#define GBDKJS_H

#include <gb/gb.h>

#ifdef __EMSCRIPTEN__ 
  typedef void (*em_callback_func)(void);
  extern void emscripten_set_main_loop(em_callback_func func, int fps, int simulate_infinite_loop);    
  extern void emscripten_update_registers (UBYTE scx_reg, UBYTE scy_reg, UBYTE wx_reg, UBYTE wy_reg, UBYTE lyc_reg, UBYTE lcdc_reg, UBYTE bgp_reg, UBYTE obp0_reg, UBYTE obp1_reg);
  extern void emscripten_log_value(char *name, UBYTE value);
  #define LOG(args...) printf(args)
  #define LOG_VALUE(a, b) emscripten_log_value(a, b) 
  #define UBYTE unsigned char
  #define BYTE char
  #define UWORD unsigned short
  #define WORD short
  #define UINT16 unsigned short
  #define INT16 short
#else
  #define LOG(fmt, args...) 
  #define LOG_VALUE(a, b)
#endif

#endif
