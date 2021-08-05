#include "gbs_types.h"

#define SHADOW_OAM_BASE_ADDRESS 0xDF00

#define add_check__(a,b) add_check___(a,b)
#define add_check___(a,b) check_##a##_##b
#define check_size(typ,sz) typedef char add_check__(typ,__LINE__)[ (sizeof(typ) == (sz)) ? 1 : -1]

OAM_item_t      __at(SHADOW_OAM_BASE_ADDRESS)                                           shadow_OAM2[40];        // 160 bytes
check_size(shadow_OAM2, 160);
palette_entry_t __at(SHADOW_OAM_BASE_ADDRESS + sizeof(shadow_OAM2))                     BkgPalette[8];          // 64 bytes
check_size(BkgPalette, 64);
UBYTE           __at(SHADOW_OAM_BASE_ADDRESS + sizeof(shadow_OAM2) +sizeof(BkgPalette)) vwf_tile_data[16 * 2];  // 32 bytes
check_size(vwf_tile_data, 32);
                                                                                                                // --------
                                                                                                                // 256 bytes total
