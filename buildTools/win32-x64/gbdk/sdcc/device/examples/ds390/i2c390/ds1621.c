#include <tinibios.h>

#include "ds1621.h"

float ReadDS1621(char address) {
  float temperature;
  signed char counter, slope;

  int id=DS1621_ID + (address<<1);
  
  while (!I2CReset()) {
    //fprintf (stderr, "I2C bus busy, retrying.\n");
  }
  
  i2cTransmitBuffer[0]=0xac; // access config command
  i2cTransmitBuffer[1]=0x09; // mode (8=continuous, 9=one-shot)
  if (I2CSend(id, 2)) return -999;
  
  i2cTransmitBuffer[0]=0xee; // start conversion command
  if (I2CSend(id, 1)) return -999;
    
  do {
    i2cTransmitBuffer[0]=0xac; // access config command
    if (I2CSendReceive(id, 1, 1)) return -999;
  } while ((i2cReceiveBuffer[0]&0x80)==0); // wait for conversion done

  i2cTransmitBuffer[0]=0xaa; // read temperature command

  if (I2CSendReceive(id, 1, 1)) return -999;
  temperature=i2cReceiveBuffer[0];
  i2cTransmitBuffer[0]=0xa8; // read counter command
  if (I2CSendReceive(id, 1, 1)) return -999;
  counter=i2cReceiveBuffer[0];
  
  i2cTransmitBuffer[0]=0xa9; // read slope command
  if (I2CSendReceive(id, 1, 1)) return -999;
  slope=i2cReceiveBuffer[0];
  
  temperature=temperature - 0.25 +
    ((float)slope-(float)counter)/(float)slope;
  return temperature;
}  
