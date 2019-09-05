/* Dumb strings stub.
   Wanted a quick hack for now - will use the libc version later.
*/
char *_strcpy(char *dest, const char *source)
{
    char *d = dest;
    const char *s = source;
    while (*d = *s)
	d++, s++;

    return dest;
}

void *_memcpy(void *dest, const void *source, int count)
{
    char *d = dest;
    const char *s = source;
    while (count--) {
	*d = *s;
	d++;
	s++;
    }

    return dest;
}

int _strcmp(const char *s1, const char *s2)
{
    char ret = 0;

    while (!(ret = *s1 - *s2) && *s2)
	++s1, ++s2;

    if (ret < 0)
	return -1;
    else if (ret > 0)
	return 1;
    return 0;
}
