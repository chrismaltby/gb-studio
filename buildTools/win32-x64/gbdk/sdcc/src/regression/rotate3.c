// Shift ints left and right

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

void shift_int_left_1(void)
{

  aint0 <<= 1;

}

void shift_int_left_2(void)
{

  aint0 <<= 2;

}

void shift_int_left_3(void)
{

  aint0 <<= 3;

}

void shift_int_left_4(void)
{

  aint0 <<= 4;

}

void shift_int_left_5(void)
{

  aint0 <<= 5;

}

void shift_int_left_6(void)
{

  aint0 <<= 6;

}

void shift_int_left_7(void)
{

  aint0 <<= 7;

}

void shift_int_left_8(void)
{

  aint0 <<= 8;

}

void shift_int_left_9(void)
{

  aint0 <<= 9;

}

void shift_int_left_10(void)
{

  aint0 <<= 10;

}

void shift_int_left_11(void)
{

  aint0 <<= 11;

}

void shift_int_left_12(void)
{

  aint0 <<= 12;

}

void shift_int_left_13(void)
{

  aint0 <<= 13;

}

void shift_int_left_14(void)
{

  aint0 <<= 14;

}

void shift_int_left_15(void)
{

  aint0 <<= 15;

}

/*****************************************************/
void shift_int_right_1(void)
{
  aint0 >>= 1;
}

void shift_int_right_2(void)
{
  aint0 >>= 2;
}

void shift_int_right_3(void)
{
  aint0 >>= 3;
}

void shift_int_right_4(void)
{
  aint0 >>= 4;
}

void shift_int_right_5(void)
{
  aint0 >>= 5;
}

void shift_int_right_6(void)
{
  aint0 >>= 6;
}

void shift_int_right_7(void)
{
  aint0 >>= 7;
}

void shift_int_right_8(void)
{
  aint0 >>= 8;
}

void shift_int_right_9(void)
{
  aint0 >>= 9;
}

void shift_int_right_10(void)
{
  aint0 >>= 10;
}

void shift_int_right_11(void)
{
  aint0 >>= 11;
}

void shift_int_right_12(void)
{
  aint0 >>= 12;
}

void shift_int_right_13(void)
{
  aint0 >>= 13;
}

void shift_int_right_14(void)
{
  aint0 >>= 14;
}

void shift_int_right_15(void)
{
  aint0 >>= 15;
}

/*****************************************************/
void main(void)
{
  //char i;

  aint0 = 0xabcd;

  shift_int_left_1();
  if(aint0 != 0x579a)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_2();
  if(aint0 != 0xaf34)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_3();
  if(aint0 != 0x5e68)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_4();
  if(aint0 != 0xbcd0)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_5();
  if(aint0 != 0x79a0)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_6();
  if(aint0 != 0xf340)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_7();
  if(aint0 != 0xe680)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_8();
  if(aint0 != 0xcd00)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_9();
  if(aint0 != 0x9a00)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_10();
  if(aint0 != 0x3400)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_11();
  if(aint0 != 0x6800)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_12();
  if(aint0 != 0xd000)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_13();
  if(aint0 != 0xa000)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_14();
  if(aint0 != 0x4000)
    failures++;

  aint0 = 0xabcd;

  shift_int_left_15();
  if(aint0 != 0x8000)
    failures++;

  /***********************/
  aint0 = 0xabcd;

  shift_int_right_1();
  if(aint0 != 0x55e6)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_2();
  if(aint0 != 0x2af3)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_3();
  if(aint0 != 0x1579)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_4();
  if(aint0 != 0x0abc)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_5();
  if(aint0 != 0x055e)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_6();
  if(aint0 != 0x02af)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_7();
  if(aint0 != 0x0157)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_8();
  if(aint0 != 0x00ab)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_9();
  if(aint0 != 0x0055)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_10();
  if(aint0 != 0x002a)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_11();
  if(aint0 != 0x0015)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_12();
  if(aint0 != 0x000a)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_13();
  if(aint0 != 0x0005)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_14();
  if(aint0 != 0x0002)
    failures++;

  aint0 = 0xabcd;

  shift_int_right_15();
  if(aint0 != 0x0001)
    failures++;

  success=failures;
  done();
}
