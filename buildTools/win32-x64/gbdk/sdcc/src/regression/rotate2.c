// Shift bytes left and right by a variable.

unsigned char success=0;
unsigned char failures=0;
unsigned char dummy=0;

bit bit0 = 0;
unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;
unsigned char achar2 = 0;
unsigned char achar3 = 0;

void done()
{

  dummy++;

}

void shift_right_var(void)
{

  achar0 >>= achar1;
}

void shift_left_var(void)
{

  achar0 <<= achar1;
}

void shift_int_left_1(void)
{

  aint0 <<= 1;

}

void main(void)
{
  char i;

  achar0 = 1;
  achar1 = 1;
  shift_left_var();

  if(achar0 !=2)
    failures++;

  achar0 = 1;
  achar1 = 1;
  achar2 = 1;
  for(i=0; i<7; i++) {
    shift_left_var();
    achar2 <<= 1;

    if(achar2 != achar0)
      failures++;
  }

  success=failures;
  done();
}
