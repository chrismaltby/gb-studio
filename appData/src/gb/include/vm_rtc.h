#ifndef _VM_RTC_H_INCLUDE
#define _VM_RTC_H_INCLUDE

#include <gb/gb.h>

#include "vm.h"

BANKREF_EXTERN(VM_RTC)

void vm_rtc_latch() OLDCALL BANKED;
void vm_rtc_get(SCRIPT_CTX * THIS, INT16 idx, UBYTE what) OLDCALL BANKED;
void vm_rtc_set(SCRIPT_CTX * THIS, INT16 idx, UBYTE what) OLDCALL BANKED;
void vm_rtc_start(SCRIPT_CTX * THIS, UBYTE start) OLDCALL BANKED;

#endif