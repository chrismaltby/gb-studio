#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <assert.h>

#if defined(__APPLE__) && (__MACH__)
#ifdef _G
#undef _G
#endif
#endif

#include "SDCCglobl.h"
#include "SDCCmem.h"
#include "SDCCast.h"
#include "SDCCy.h"
#include "SDCChasht.h"
#include "SDCCbitv.h"
#include "SDCCset.h"
#include "SDCCicode.h"
#include "SDCClabel.h"
#include "SDCCBBlock.h"
#include "SDCCloop.h"
#include "SDCCcse.h"
#include "SDCCcflow.h"
#include "SDCCdflow.h"
#include "SDCClrange.h"
#include "SDCCptropt.h"
#include "SDCCopt.h"
#include "SDCCglue.h"
#include "SDCCpeeph.h"

#include "asm.h"
#include "port.h"

#include "newalloc.h"
