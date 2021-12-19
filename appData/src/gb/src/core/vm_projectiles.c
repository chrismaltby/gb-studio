#pragma bank 2

#include "vm.h"

#include "projectiles.h"
#include "actor.h"

typedef struct projectile_launch_t {
    upoint16_t pos;
    UBYTE angle;
} projectile_launch_t;

void vm_projectile_launch(SCRIPT_CTX * THIS, UBYTE type, INT16 idx) OLDCALL BANKED {
    projectile_launch_t * params = VM_REF_TO_PTR(idx);
    projectile_launch(type, &params->pos, params->angle);
}
