unsigned char success = 0;
unsigned char failures = 0;
unsigned char dummy = 0;

//bit bit0 = 0;
int int0 = 0;
int int1 = 0;
char char0 = 0;
char char1 = 0;
long long0 = 0;
long long1 = 0;
unsigned long ulong0 = 0;
unsigned long ulong1 = 0;
#define NULL 0
char *cP0=NULL;
char *cP1=NULL;
int *iP0=NULL;
int *iP1=NULL;

void
done ()
{

  dummy++;

}


/* pointer to char arithmetic */

void pc_add(void)
{

  if(*cP1)
    failures++;

  *cP1 += 1;
  if(*cP1 != 1)
    failures++;

  if(char0 != 1)
    failures++;

  char0++;

  if(*cP1 != 2)
    failures++;

  char1 = char0 + *cP1;

  if(char1 != 4)
    failures++;
}

/* pointer to integer arithmetic */
void pi_add(void)
{
  if(*iP0)
    failures++;

  *iP0 += 1;

  if(*iP0 != 1)
    failures++;

  if(int0 != 1)
    failures++;

  int1 = int0 + *iP0;
  if(int1 != 2)
    failures++;
}

void main(void)
{

  cP1 = &char0;
  pc_add();

  iP0 = &int0;
  pi_add();

  success = failures;
  done();
}
