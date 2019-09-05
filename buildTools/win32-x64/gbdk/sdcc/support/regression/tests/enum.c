/* Test the types of enum.
 */
#include <testfwk.h>

enum _SimpleEnum {
  SIMPLE_ZERO,
  SIMPLE_ONE,
  SIMPLE_TWO
};

enum _ValuesEnum {
  VALUES_ZERO,
  VALUES_FIVE = 5,
  VALUES_SIX,
  VALUES_SEVEN,
  VALUES_TWELVE = 12
};

enum _IndexedEnum {
  INDEXED_ZERO,
  INDEXED_ONE,
  /* PENDING: Fails */
  //INDEXED_ONE_ALIAS = INDEXED_ONE,
  INDEXED_TWO
};

void
testSimpleEnum(void)
{
  ASSERT(SIMPLE_ZERO == 0);
  ASSERT(SIMPLE_ONE == 1);
  ASSERT(SIMPLE_TWO == 2);
}

void 
testValuesEnum(void)
{
  ASSERT(VALUES_ZERO == 0);
  ASSERT(VALUES_FIVE == 5);
  ASSERT(VALUES_SIX == 6);
  ASSERT(VALUES_SEVEN == 7);
  ASSERT(VALUES_TWELVE == 12);
}

void
testIndexedEnum(void)
{
  ASSERT(INDEXED_ZERO == 0);
  ASSERT(INDEXED_ONE == 1);
  //  ASSERT(INDEXED_ONE_ALIAS == 1);
  ASSERT(INDEXED_TWO == 2);
}
