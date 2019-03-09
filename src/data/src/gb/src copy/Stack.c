#include "Stack.h"

void StackPush(UINT8 * stack, UINT8 elem)
{
  stack[++stack[0]] = elem;
}

UINT8 StackPop(UINT8 * stack)
{
  return stack[(stack[0]--)];
}
