#ifndef REGS_INCLUDE
#define REGS_INCLUDE

typedef enum {
    REG_ID_NONE,
    // Z80
    REG_ID_A,
    REG_ID_B,
    REG_ID_C,
    REG_ID_D,
    REG_ID_E,
    REG_ID_H,
    REG_ID_L,
    REG_ID_AF,
    REG_ID_BC,
    REG_ID_DE,
    REG_ID_HL,
    REG_ID_IX,
    REG_ID_IY,
    // TLCS-900H
    REG_ID_XBC,
    REG_ID_XDE,
    // i186
    REG_ID_AL,
    REG_ID_AH,
    REG_ID_AX,
    REG_ID_BL,
    REG_ID_BH,
    REG_ID_BX,

    REG_ID_BP,

    REG_ID_CL,
    REG_ID_CH,
    REG_ID_CX,
    REG_ID_DL,
    REG_ID_DH,
    REG_ID_DX,
    REG_ID_MAX
} REG_ID;

enum {
    REG_USED = 1,
    REG_USED_HIDDEN = 2
};

enum {
    REG_TYPE_CND = 1,
    REG_TYPE_GPR = 2
} REG_TYPE;

typedef struct regs {
    int size;
    REG_ID id;
    const char *name;
    int used;
    REG_ID hides[3];
} REG;

#endif
