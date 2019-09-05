
unsigned char success=0;
unsigned char failures=0;
unsigned char dummy=0;


unsigned int uint0 = 0;
unsigned int uint1 = 0;
unsigned char uchar0 = 0;
unsigned char uchar1 = 0;
unsigned long ulong0 = 0;

void done()
{

  dummy++;

}

// uchar0 = 0xff;
void and_lit2uchar(void)
{

  if(uchar0 != 0xff)
    failures++;

  uchar0 &= 0x7f;

  if(uchar0 != 0x7f)
    failures++;

  uchar0 &= 0x3f;

  if(uchar0 != 0x3f)
    failures++;

  uchar0 &= 0xdf;

  if(uchar0 != 0x1f)
    failures++;
}

void and_lit2uint(void)
{
  if(uint0 != 0xffff)
    failures++;

  uint0 &= 0x7fff;

  if(uint0 != 0x7fff)
    failures++;

  uint0 &= 0x3fff;

  if(uint0 != 0x3fff)
    failures++;

  uint0 &= 0xdfff;

  if(uint0 != 0x1fff)
    failures++;


  uint0 &= 0xff7f;

  if(uint0 != 0x1f7f)
    failures++;

  uint0 &= 0x0f0f;

  if(uint0 != 0x0f0f)
    failures++;

  uint0 &= 0xfefe;

  if(uint0 != 0x0e0e)
    failures++;

  uint0 &= 0xf0f0;

  if(uint0 != 0)
    failures++;
}

void and_lit2ulong(void)
{

  if(ulong0 != 0xffffffff)
    failures++;

  ulong0 &= 0x7fffffff;

  if(ulong0 != 0x7fffffff)
    failures++;

  ulong0 &= 0xff00ffff;

  if(ulong0 != 0x7f00ffff)
    failures++;

  ulong0 &= 0xfeff00ff;

  if(ulong0 != 0x7e0000ff)
    failures++;
}

/*-----------*/
void and_uchar2uchar(void)
{

  uchar0 &= uchar1;

  if(uchar0 != 0x0f)
    failures++;

  uchar1 &= 0xf7;

  uchar0 = uchar1 & 0xfe;

  if(uchar0 != 0x06)
    failures++;

}

void main(void)
{

  uchar0 = 0xff;
  and_lit2uchar();

  uint0 = 0xffff;
  and_lit2uint();

  ulong0 = 0xffffffff;
  and_lit2ulong();

  uchar0 = 0xff;
  uchar1 = 0x0f;
  and_uchar2uchar();

  success = failures;
  done();
}
