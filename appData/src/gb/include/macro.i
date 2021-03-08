.macro FAR_PTR SYM
    .db b'SYM
    .dw SYM
.endm
.macro IMPORT_FAR_PTR SYM
    .globl SYM, b'SYM
    FAR_PTR SYM
.endm

.macro FAR_PTR_DATA SYM
    .db ___bank'SYM
    .dw SYM
.endm
.macro IMPORT_FAR_PTR_DATA SYM
    .globl SYM, ___bank'SYM
    FAR_PTR_DATA SYM
.endm
