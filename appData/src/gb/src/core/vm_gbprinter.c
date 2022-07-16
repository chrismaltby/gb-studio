#pragma bank 2

#include "vm_gbprinter.h"

#include "vm.h"

#include "gbprinter.h"

void vm_print_detect(SCRIPT_CTX * THIS, INT16 idx, UBYTE delay) OLDCALL BANKED {
    uint16_t * error = VM_REF_TO_PTR(idx);
    uint8_t IE = IE_REG;
    set_interrupts(IE & ~SIO_IFLAG);
    *error = gbprinter_detect(delay);
    set_interrupts(IE);
}

void vm_print_overlay(SCRIPT_CTX * THIS, INT16 idx, UBYTE start, UBYTE height) OLDCALL BANKED {
    uint16_t * error = VM_REF_TO_PTR(idx);
    uint8_t IE = IE_REG;
    set_interrupts(IE & ~SIO_IFLAG);
    *error = gbprinter_print_overlay(start, height);
    set_interrupts(IE);
}
