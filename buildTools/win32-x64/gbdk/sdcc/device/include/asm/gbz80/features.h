/** Z80 specific features.
 */
#ifndef __SDC51_ASM_Z80_FEATURES_H
#define __SDC51_ASM_Z80_FEATURES_H   1

#define _REENTRANT
#define _CODE

#define _SDCC_MANGLES_SUPPORT_FUNS	1
#define _SDCC_Z80_STYLE_LIB_OPT		1

/* The following are disabled to make the dhrystone test more authentic.
 */
#define _SDCC_PORT_PROVIDES_MEMCPY	0
#define _SDCC_PORT_PROVIDES_STRCMP	0
/* Register allocator is as good as hand coded asm.  Cool. */
#define _SDCC_PORT_PROVIDES_STRCPY	0

#endif
