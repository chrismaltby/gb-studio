/** @file izt/util.c
 */
#include "izt.h"

int izt_util_binLog(int i)
{
    static const int lookup[] = {
	0, 0, 1, -1, 2, -1, -1, -1, 3
    };

    if (i < NUM_OF(lookup)) {
	if (lookup[i] != -1) {
	    return lookup[i];
	}
	else {
	    // Unsupported.
	    wassert(0);
	}
    }
    else {
	// Unsupported.
	wassert(0);
    }
    return 0;
}
