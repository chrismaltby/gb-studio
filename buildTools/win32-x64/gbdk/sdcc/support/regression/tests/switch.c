/*  Test the types of switch statement.

    type: char, int, long
    sign: signed, unsigned
    storage: static, 
    attr: volatile
 */
#include <testfwk.h>

{sign} {type}
sparseSwitch({sign} {type} val)
{
  {sign} {type} ret;
  {storage} {attr} {sign} {type} local;

  local = val;

  switch (local) {
  case 1:
    ret = 7;
    break;
  case 4:
    ret = 12;
    break;
  case 6:
    ret = 13;
    /* Fall through */
  case 12:
    ret = 14;
    break;
  case 13:
  case 14:
  case 15:
    ret = 19;
    break;
  default:
    ret = 30;
  }

  return ret;
}

void
testSparseSwitch(void)
{
  ASSERT(sparseSwitch(1) == 7);
  ASSERT(sparseSwitch(4) == 12);
  ASSERT(sparseSwitch(6) == 14);
  ASSERT(sparseSwitch(12) == 14);
  ASSERT(sparseSwitch(13) == 19);
  ASSERT(sparseSwitch(14) == 19);
  ASSERT(sparseSwitch(15) == 19);
  ASSERT(sparseSwitch(19) == 30);
  ASSERT(sparseSwitch(0) == 30);
}

{sign} {type}
denseSwitch({sign} {type} val)
{
  {sign} {type} ret;
  {storage} {attr} {sign} {type} local;

  local = val;
  ret = 12;

  switch (local) {
  case 0:
    ret = 1;
    break;
  case 1:
    ret = 14;
    break;
  case 2:
    ret = 15;
    break;
  case 3:
    ret = 34;
    break;
  case 4:
    ret = 17;
    break;
    /* No default */
  }

  return ret;
}

void
testDenseSwitch(void)
{
  ASSERT(denseSwitch(0) == 1);
  ASSERT(denseSwitch(1) == 14);
  ASSERT(denseSwitch(2) == 15);
  ASSERT(denseSwitch(3) == 34);
  ASSERT(denseSwitch(4) == 17);
  ASSERT(denseSwitch(5) == 12);
  ASSERT(denseSwitch(100) == 12);
}

void
testDenseIntSwitch(void)
{
  volatile int val = 1000;
  volatile int ret = 0;

  switch (val) {
  case 999:
    ret = 5;
    break;
  case 1000:
    ret = 6;
    break;
  case 1001:
    ret = 7;
    break;
  case 1002:
    ret = 12;
    break;
  case 1003:
    ret = 14;
    break;
  }

  ASSERT(ret == 6);

  val = 129;

  switch (val) {
  case 126:
    ret = 5;
    break;
  case 127:
    ret = 6;
    break;
  case 128:
    ret = 7;
    break;
  case 129:
    ret = 8;
    break;
  default:
    ret = 9;
  }

  ASSERT(ret == 8);
}
