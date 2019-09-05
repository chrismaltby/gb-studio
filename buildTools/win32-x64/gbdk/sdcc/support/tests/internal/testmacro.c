#include <SDCCmacro.h>
#include <stdio.h>

static const char *_maps[] = 
  {
    "immedzero", "#0",
    "immedvala", "#0x%02X",
    "stra", "%s",
    "port", "z80",
    "stdlibpath", "{basepath}/lib/{port}",
    "stdlibname", "{port}.lib",
    "portouttypeflag", "-i",
    "srcfilename", "fish",
    "portoutext", ".ihx",
    "crt0name", "{stdlibpath}/crt0{portobjext}",
    "portobjext", ".o",
    "otherobjfiles", "none",
    "basepath", "/home/michaelh/sdcc",
    NULL
  };

static hTab *
_populateHash(const char **pin)
{
  hTab *pret = NULL;

  while (*pin)
    {
      printf("Adding %s -> %s\n", pin[0], pin[1]);
      shash_add (&pret, pin[0], pin[1]);
      pin += 2;

    }

  return pret;
}

static void
_testEval(hTab *ph, const char *pin, const char *pexpect, ...)
{
  va_list ap;
  char *pgot;

  va_start(ap, pexpect);

  pgot = mvsprintf(ph, pin, ap);

  if (strcmp(pgot, pexpect) != 0)
    {
      printf("Fail: expected: %s, got %s\n", pexpect, pgot);
    }
  else
    {
      printf("%s -> %s\n", pin, pgot);
    }

  va_end(ap);
}

void
testMacros(void)
{
  hTab *ph = _populateHash(_maps);

  _testEval(ph, "{immedzero}", "#0");
  _testEval(ph, "{immedvala}", "#0x23", 0x23);
  _testEval(ph, "{stra}", "#0", "{immedzero}");

  printf("Link command:\n%s\n", 
         msprintf(ph, 
                  "link-{port} -n -c -- -b_CODE=0x%04X -b_DATA=0x%04X"
                  " -m -j -k{stdlibpath} -l{stdlibname} {portouttypeflag}"
                  " {srcfilename}{portoutext} {crt0name} {srcfilename}{portobjext} {otherobjfiles}", 
                  0x1234, 0x3456));
  
}

int
main(void)
{
  testMacros();

  return 0; 
}
