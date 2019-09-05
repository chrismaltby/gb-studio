/* This implemenation is based on an example I once grabbed from 
   the Philips bbs.
   Don't know who wrote it, but is has been hacked so heavely, he/she wouldn't
   recogize it anyway */

//#define DEBUG_I2C ==> DON'T DO THIS IS A LIBRARY <==

#ifdef DEBUG_I2C
#include <stdio.h>
#else
#include <tinibios.h>
#endif

// we are (ab)using the CAN CTX and CRX for serial data and serial clock
#define SCL_HIGH (P5 |= 1)
#define SCL_LOW (P5 &= ~1)
#define SDA_HIGH (P5 |= 2)
#define SDA_LOW (P5 &= ~2)

#define SDA_OUT(b) (b ? SDA_HIGH : SDA_LOW)
#define SDA_IN ((P5>>1)&1)
#define SCL_IN (P5&1)

/*
 * I2C error values
 */

#define I2CERR_OK       0       /* No error */
#define I2CERR_NAK      1       /* No ACK from slave */
#define I2CERR_LOST     2       /* Arbitration lost */
#define I2CERR_BUS      3       /* Bus is stuck (not used yet) */
#define I2CERR_TIMEOUT  4       /* Timeout on bus */

char i2cTransmitBuffer[I2C_BUFSIZE];     /* Global transfer buffers */
char i2cReceiveBuffer[I2C_BUFSIZE];

static char i2cError = 0;                 /* Last error */

#define I2CDELAY 1

void I2CDelay(volatile long delay) {
 while (delay--)
   ;
}

void I2CDumpError(char error);

/*
 * Makes sure that the bus is in a known condition. Returns 1 on success,
 * 0 if some other device is pulling on the bus.
 */

char I2CReset(void)
{
  SDA_LOW;
  SCL_LOW;
  SCL_HIGH;
  SDA_HIGH;
  i2cError = 0;
  return (SCL_IN && SDA_IN);
}


/*
 * Generates a start condition on the bus. Returns 0 on success, 1 if some
 * other device is holding the bus.
 */

char I2CStart(void)
{
  SDA_HIGH;
  SCL_HIGH;
  I2CDelay(I2CDELAY);
  SDA_LOW;        /* Pull SDA down... */
  I2CDelay(I2CDELAY);
  SCL_LOW;        /* ...and then SCL -> start condition. */
  I2CDelay(I2CDELAY);
  return 0;
}


/*
 * Generates a stop condition on the bus. Returns 0 on success, 1 if some
 * other device is holding the bus.
 */

char I2CStop(void)
{
  SDA_LOW;
  SCL_HIGH;        /* Let SCL go up */
  I2CDelay(I2CDELAY);
  SDA_HIGH;        /* ...and then SDA up -> stop condition. */
  I2CDelay(I2CDELAY);
  
  return (SCL_IN && SDA_IN);  /* Both will be up, if everything is fine */
}


/*
 * Clock out one bit.
 * Returns 0 on success, 1 if we lose arbitration.
 */

char BitOutI2C(char bout)
{
  SDA_OUT(bout);              /* Put data out on SDA */
  I2CDelay(I2CDELAY);
  SCL_HIGH;                    /* Let SCL go up */
  while(!SCL_IN)            /* Wait until all other devices are ready */
    {
      // should do a timeout here
    }
  
  if (SDA_IN != bout)       /* Arbitration lost, release bus and return */
    {
      SDA_HIGH;                /* Should be up anyway, but make sure */
      i2cError = I2CERR_LOST;
      I2CDumpError(i2cError);
      return 1;
    }
  I2CDelay(I2CDELAY);
  SCL_LOW;                    /* Pull SCL back down */
  I2CDelay(I2CDELAY);                
  return 0;                   /* OK */
}


/*
 * Clock in one bit.
 */

char BitInI2C(void)
{
  char bin;
  
  // SDA is opencollector, so:
  SDA_HIGH;
  
  SCL_HIGH;                    /* Let SCL go up */
  while(!SCL_IN)            /* Wait for other devices */
    {
      // should do a timeout here
    }
  bin = SDA_IN;             /* Read in data */
  I2CDelay(I2CDELAY);
  SCL_LOW;                    /* Pull SCL back up */
  I2CDelay(I2CDELAY);
  return bin;                 /* Return the sampled bit */
}


/*
 * Send one byte on the bus. No start or stop conditions are generated here,
 * but i2cError will be set according to the result.
 * Returns 0 on success, 1 if we lose arbitration or if the slave doesn't
 * acknowledge the byte. Check i2cError for the actual result on error.
 */

char ByteOutI2C(char dat)
{
  char bit_count;
  
  bit_count = 8;
  while(bit_count) {
    if (dat & 0x80) {
      if (BitOutI2C(1)) {
	I2CDumpError(i2cError);
	return 1;
      }
    } else {
      if (BitOutI2C(0)) {
	I2CDumpError(i2cError);
	return 1;
      }
    }
    dat <<= 1;
    bit_count--;
  }
  
  if (BitInI2C()) {
    i2cError = I2CERR_NAK;
    I2CDumpError(i2cError);
    return 1;
  }
  return 0;
}


/*
 * Reads one byte in from the slave. Ack must be 1 if this is the last byte
 * to be read during this transfer, 0 otherwise (as per I2C bus specification,
 * the receiving master must acknowledge all but the last byte during a
 * transfer).
 */

char I2CByteIn(char ack)
{
  char bit_count, byte_in;
  
  bit_count = 8;
  byte_in = 0;
  
  while(bit_count)
    {
      byte_in <<= 1;
      if (BitInI2C()) byte_in |= 0x01;
      bit_count--;
    }
  
  BitOutI2C(ack);
  SDA_HIGH;             /* Added 18-Jul-95 - thanks to Ray Bellis */
 return byte_in;
}


/*
 * Send 'count' bytes to slave 'addr'.
 * Returns 0 on success. Stop condition is sent only when send_stop is true.
 */

char I2CSendStop(char addr, char count, char send_stop)
{
  char byteptr, byte_out;
  
  if (I2CStart()) return 1;
  i2cError = 0;
  
  byte_out = addr & 0xfe;     /* Ensure that it's a write address */
  count++;                    /* Include slave address to byte count */
  byteptr = 0;
  while(count)
    {
      if (ByteOutI2C(byte_out))
        {
	  if (i2cError == I2CERR_NAK && send_stop) I2CStop();
	  return i2cError;
        }
      byte_out = i2cTransmitBuffer[byteptr];
      byteptr++;
      count--;
    }
  
  if (send_stop) I2CStop();
  return 0;
}


/*
 * Read in 'count' bytes from slave 'addr'.
 * Returns 0 on success.
 */

char i2c_recv(char addr, char count)
{
  char byteptr, byte_in;
  
  if (I2CStart()) return 1;
  i2cError = 0;
  byteptr = 0;
  
  byte_in = addr | 0x01;
  
  if (ByteOutI2C(byte_in))
    {
      if (i2cError == I2CERR_NAK) I2CStop();
      return i2cError;
    }
  
  while(count)
    {
      count-=1;
      if (count) {
	byte_in = I2CByteIn(0);
      } else {
	byte_in = I2CByteIn(1);   /* No ACK during last byte */
      }
      i2cReceiveBuffer[byteptr] = byte_in;
      byteptr++;
    }
  
  I2CStop();
  
  return (i2cError ? 1 : 0);
}


/*
 * Write 'tx_count' bytes to slave 'addr', then use a repeated start condition
 * to read 'rx_count' bytes from the same slave during the same transfer.
 * Returns 0 on success, 1 otherwise. On error, check i2cError for the actual
 * error value.
 */

char I2CSendReceive(char addr, char tx_count, char rx_count)
{
  if (I2CSendStop(addr, tx_count, 0))
    {
     /* If send fails, abort but don't send a stop condition if we lost
	 arbitration */
      
      if (i2cError != I2CERR_LOST) I2CStop();
      return 1;
    }
  
  SDA_HIGH; /* One of these may be low now, in which case the next */
  SCL_HIGH; /* start condition wouldn't be detected so make */
  I2CDelay(I2CDELAY); /*   sure that they're up and wait for one delay slot */
  
  if (i2c_recv((char)(addr|0x01), rx_count)) return 1;
  return (i2cError ? 1 : 0);
}

/*
 * Dump an error message.
 */

void I2CDumpError(char error)
{
#ifdef DEBUG_I2C
  switch(error)
    {
    case 0:
      puts("I2C: OK.");
      break;
    case I2CERR_NAK:
      puts("I2C: Slave didn't acknowledge");
      break;
    case I2CERR_LOST:
      puts("I2C: Lost arbitration with another master");
      break;
    case I2CERR_TIMEOUT:
      puts("I2C: Timeout on bus");
      break;
    case I2CERR_BUS:
      puts("I2C: The bus is stuck");
      break;
    default:
      puts("I2C: Unknown error");
      break;
    }
#else
  error; // hush the compiler
#endif
}
