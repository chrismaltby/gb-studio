/* bug 460010
 */
#include <testfwk.h>

#ifdef __mcs51
#define XDATA xdata
#else
#define XDATA
#endif

void 
func( unsigned char a )
{
  UNUSED(a);
}

void
testBadPromotion(void)
{
  unsigned char c=*((unsigned XDATA char*)(0xa000));
  
  func(c); 
  
  c+='0'; /* is evaluated as an 8-bit expr */ 
  
  func(c); 

  c+='A'-'0'; /* is a 16-bit expr ??? */ 
  
  func(c); 
}
