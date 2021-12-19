#include "gbs_types.h"

#define SHADOW_OAM2_BASE_ADDRESS 0xDF00
#define SHADOW_OAM_PAGE_WITH_GAP SHADOW_OAM2_BASE_ADDRESS

// Note: if we move SHADOW_OAM2_BASE_ADDRESS to 0xC100 then SHADOW_OAM_PAGE_WITH_GAP will be 0xC000
//       to do that, in the build scripts the base address of _DATA should be set to 0xC1A0 and 
//       .STACK should be set to 0xE000 (default value)

#define add_check__(a,b) add_check___(a,b)
#define add_check___(a,b) check_##a##_##b
#define check_size(typ,sz) typedef char add_check__(typ,__LINE__)[ (sizeof(typ) == (sz)) ? 1 : -1]

OAM_item_t      AT(SHADOW_OAM2_BASE_ADDRESS)                                           shadow_OAM2[40];        // 160 bytes
check_size(shadow_OAM2, 160);
palette_entry_t AT(SHADOW_OAM_PAGE_WITH_GAP + sizeof(shadow_OAM2))                     BkgPalette[8];          // 64 bytes
check_size(BkgPalette, 64);
UBYTE           AT(SHADOW_OAM_PAGE_WITH_GAP + sizeof(shadow_OAM2) +sizeof(BkgPalette)) vwf_tile_data[16 * 2];  // 32 bytes
check_size(vwf_tile_data, 32);
                                                                                                               // --------
                                                                                                               // 256 bytes total
