#include <common.h>
#include "gen.h"
#include "regs.h"
#include "aop.h"

#define TEST(_d, _a) \
	(_a) ? (void)0 : (failures++, printf("Test %s \"%s\" failed.\n", #_a, _d), _dumpRegs())

#define NUM_OF(_a)	(sizeof(_a)/sizeof(*(_a)))

typedef struct {
    REG *regs;
    /// One for each size {1, 2, 4}
    REG *returnRegs[3];
    REG *scratch;
    REG *base_ptr;
} IZT_PORT;

IZT_PORT *izt_port;

void izt_init(IZT_PORT *port);
void izt_assignRegisters (eBBlock **ebbs, int count);
void izt_gen(iCode *ic);
/// Return the base 2 log of i, providing i is a power of 2.
int izt_util_binLog(int i);
