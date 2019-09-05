/** Tests a few features of a driver struct - a struct with
    many function pointers.
*/
#include <testfwk.h>

/* Set to one to show the bug */
#if 0
#define NAME(_a)	_a
#else
#define NAME(_a)
#endif

typedef unsigned char uchar;

/* Originally from UZIX - http://uzix.sourceforge.net/
 */

typedef struct s_devsw {
	uchar	minors; 	/* # of minor device numbers */
	int	(*dev_init)(uchar NAME(minor)) REENTRANT;
	int	(*dev_open)(uchar NAME(minor)) REENTRANT;
	int	(*dev_close)(uchar NAME(minor)) REENTRANT;
	int	(*dev_read)(uchar NAME(minor), uchar NAME(w)) REENTRANT;
	int	(*dev_write)(uchar NAME(minor), uchar NAME(w)) REENTRANT;
	int	(*dev_ioctl)(uchar NAME(minor), int cmd, void *data) REENTRANT;
} devsw_t;

static int
_init(uchar minor) REENTRANT
{
  return minor;
}

static devsw_t _sillyDriver = {
  1,
  _init,
  NULL, NULL, NULL, NULL, NULL
};

int
initProxy(void)
{
  return (*_sillyDriver.dev_init)(5);
}

