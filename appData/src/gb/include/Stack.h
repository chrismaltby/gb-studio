#ifndef STACK_H
#define STACK_H

#include <gb/gb.h>

#define DECLARE_STACK(NAME, MAX_ELEMS) UINT8 NAME[MAX_ELEMS + 1] = {0}

#define PRINT_STACK(STACK)             \
  printf("N:%u ={", (UINT16)STACK[0]); \
  for (i = 1u; i != STACK[0] + 1; ++i) \
    printf("%u, ", (UINT16)STACK[i]);  \
  printf("}\n");

#define StackPeek(STACK) STACK[STACK[0]]

#define StackSize(STACK) STACK[0]

void StackPush(UINT8* stack, UINT8 elem);
UINT8 StackPop(UINT8* stack);
UINT8 StackShift(UINT8* stack);

#endif
