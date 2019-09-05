unsigned char success=0;
unsigned char failures=0;
unsigned char dummy=0;

unsigned char achar0 = 0;
unsigned char achar1 = 0;
unsigned char achar2 = 0;

void done()
{

  dummy++;

}

void xor_chars_0_1(void)
{

  achar2 = achar0 ^ achar1;

  achar0 = achar0 ^ 0x1;

  achar1 = achar0 ^ achar1 ^ 4;
}

void xor_if(void)
{

  if(achar0 ^ achar1) 
    failures++;

  achar0 ^= 0xff;

  if( !(achar0 ^ achar1) ) 
    failures++;

}

void main(void)
{

  xor_chars_0_1();

  if(achar2)
    failures++;

  if(achar0 != 1)
    failures++;

  if(achar1 != 5)
    failures++;

  achar0 = achar1;
  xor_if();

  success = failures;
  done();
}
