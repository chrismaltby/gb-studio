#include <tinibios.h>

#include "pcf8591.h"

unsigned char ReadPCF8591(char address, char channel) {
  
  unsigned char id=PCF8591_ID+(address<<1);
  
  while (!I2CReset()) {
    //fprintf (stderr, "I2C bus busy, retrying.\n");
  }
  
  // set output enable, no autoincrement
  i2cTransmitBuffer[0]=(channel&0x03)+0x40;

  // read 2 bytes, since the first one is the old value
  if (I2CSendReceive(id, 1, 2))
    return 0;

  return i2cReceiveBuffer[1];
}

