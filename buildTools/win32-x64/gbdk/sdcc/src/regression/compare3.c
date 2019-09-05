//
// compare3.c
// regression testing program for comparing literals to variables
//


unsigned char success = 0;
unsigned char failures = 0;
unsigned char dummy = 0;

bit bit0 = 0;
unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;

void
done ()
{

  dummy++;

}

// compare to 0
// assumes
// achar0 == 0
// achar1 != 0
// aint0  == 0
// aint1  != 0

void c_0(void)
{

  if(achar0 != 0)
    failures++;

  if(achar0)
    failures++;

  if(achar1 == 0)
    failures++;

  if(!achar1)
    failures++;

  if(aint0 != 0)
    failures++;

  if(aint0)
    failures++;

  if(aint1 == 0)
    failures++;

  if(!aint1)
    failures++;

}

// compare to 1
// assumes
// achar0 != 1
// achar1 == 1
// aint0  != 1
// aint1  == 1

void c_1(void)
{

  if(achar0 == 1)
    failures++;

  if(achar1 != 1)
    failures++;

  if(aint0 == 1)
    failures++;

  if(aint1 != 1)
    failures++;

}

// compare to 2
// assumes
// achar0 == 2
// aint0  == 2

void c_2(void)
{

  if(achar0 != 2)
    failures++;

  if(aint0 != 2)
    failures++;

}

// compare to 0xff
// assumes
// achar0 == 0xff
// aint0  == 0xff

void c_ff(void)
{

  if(achar0 != 0xff)
    failures++;

  if(aint0 != 0xff)
    failures++;

  if(aint0 == 0xfe)
    failures++;

  if(aint0 == 0xff00)
    failures++;

}


// compare to 0x00a5
// assumes
// achar0  == 0xa5
// aint0  == 0x00a5

void c_a5(void)
{

  if(achar0 != 0xa5)
    failures++;

  if(aint0 != 0xa5)
    failures++;

  if(aint0 == 0xa4)
    failures++;

  if(aint0 == 0xa500)
    failures++;

}

// compare to 0xa500
// assumes
// achar0  == 0xa5
// aint0  == 0xa500

void c_a500(void)
{

  if(achar0 == 0xa500)
    failures++;

  if(aint0 != 0xa500)
    failures++;

  if(aint0 == 0xa400)
    failures++;

  if(aint0 == 0x00a5)
    failures++;

}

// compare to 0xabcd
// assumes
// achar0  == 0xa5
// aint0  == 0xabcd

void c_abcd(void)
{

  if(achar0 == 0xabcd)
    failures++;

  if(aint0 != 0xabcd)
    failures++;

  if(aint0 == 0xab00)
    failures++;

  if(aint0 == 0x00cd)
    failures++;

  if(aint0 == 0x05cd)
    failures++;

  if(aint0 == 0xab05)
    failures++;

  if(aint0 == 0xab01)
    failures++;

  if(aint0 == 0x01cd)
    failures++;

  //  if(aint0 == 0x1234abcd)
    //    failures++;

}

// assumes achar1 == 0
void c_ifelse1(void)
{

  if(achar0)
    achar0 = achar1;
  else
    achar0 = 0;

  if(achar0)
    failures++;
}

void
main (void)
{

  aint1 = 1;
  achar1 = 1;
  c_0();
  c_1();

  aint0 = 2;
  achar0 = 2;
  c_2();

  aint0 = 0xff;
  achar0 = 0xff;
  c_ff();

  aint0 = 0xa5;
  achar0 = 0xa5;
  c_a5();

  aint0 = 0xabcd;
  c_abcd();

  achar0 = 0;
  achar1 = 0;
  c_ifelse1();

  achar0 = 1;
  c_ifelse1();

  success = failures;
  done ();
}
