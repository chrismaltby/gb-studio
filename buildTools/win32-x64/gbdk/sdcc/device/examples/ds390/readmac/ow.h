#ifndef OW_H_
#define OW_H_

#ifndef FALSE
#define FALSE          0
#endif
#ifndef TRUE
#define TRUE           1
#endif

unsigned char owFirst(unsigned char,unsigned char);
unsigned char owNext(unsigned char,unsigned char);
void owSerialNum(unsigned char *,unsigned char);

/* Low level functions */
unsigned char owTouchReset(void);
unsigned char owTouchBit(unsigned char);
unsigned char owTouchByte(unsigned char);
unsigned char owWriteByte(unsigned char);
unsigned char owReadByte(void);
void msDelay(unsigned int);

unsigned char owBlock(unsigned char do_reset,
                      unsigned char *tran_buf,
                      unsigned char tran_len);
#endif
