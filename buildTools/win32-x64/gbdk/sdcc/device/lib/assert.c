#include <stdio.h>
#include <stdlib.h>

void _assert(char *expr, const char *filename, unsigned int linenumber)
{
	printf("Assert(%s) failed at line %u in file %s.\n",
		expr, linenumber, filename);
	while(1);
}
