#include "Stack.h"

void StackPush(UINT8* stack, UINT8 elem) {
  stack[++stack[0]] = elem;
}

UINT8 StackPop(UINT8* stack) {
  return stack[(stack[0]--)];
}

UINT8 StackShift(UINT8* stack) {
  UBYTE i;
  UBYTE elem = stack[1];
  for (i = 0; i != stack[0]; i++) {
    stack[i + 1] = stack[i + 2];
  }
  stack[0]--;
  return elem;
}
