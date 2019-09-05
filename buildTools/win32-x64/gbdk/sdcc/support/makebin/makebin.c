/** @name makebin - turn a .ihx file into a binary image.
 */
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

typedef unsigned char BYTE;

#define FILL_BYTE 0xFF

int getnibble(char **p)
{
  int ret = *((*p)++) - '0';
  if (ret > 9) {
    ret -= 'A' - '9' - 1;
  }
  return ret;
}

int getbyte(char **p)
{
  return (getnibble(p) << 4) | getnibble(p);
}

void usage(void)
{
  fprintf(stderr, 
          "makebin: convert a Intel IHX file to binary.\n"
          "Usage: makebin [-p] [-s romsize] [-h]\n");
}

int main(int argc, char **argv)
{
    int size = 32768, pack = 0, real_size = 0;
    BYTE *rom;
    char line[256];
    char *p;

    argc--;
    argv++;

    while (argc--) {
        if (**argv != '-') {
            usage();
            return -1;
        }
        switch (argv[0][1]) {
	case 's':
            if (argc < 1) {
                usage();
                return -1;
            }
            argc--;
            argv++;
	    size = atoi(*argv);
	    break;
	case 'h':
            usage();
	    return 0;
	case 'p':
	    pack = 1;
	    break;
	default:
            usage();
            return -1;
	}
        argv++;
    }

    rom = malloc(size);
    if (rom == NULL) {
	fprintf(stderr, "error: couldn't allocate room for the image.\n");
	return -1;
    }
    memset(rom, FILL_BYTE, size);
    while (fgets(line, 256, stdin) != NULL) {
	int nbytes;
	int addr;

	if (*line != ':') {
	    fprintf(stderr, "error: invalid IHX line.\n");
	    return -2;
	}
	p = line+1;
	nbytes = getbyte(&p);
	addr = getbyte(&p)<<8 | getbyte(&p);
	getbyte(&p);

	while (nbytes--) {
	    if (addr < size)
		rom[addr++] = getbyte(&p);
	}

	if (addr > real_size)
	    real_size = addr;
    }

    if (pack)
        fwrite(rom, 1, real_size, stdout);
    else
        fwrite(rom, 1, size, stdout);
    
    return 0;
}
