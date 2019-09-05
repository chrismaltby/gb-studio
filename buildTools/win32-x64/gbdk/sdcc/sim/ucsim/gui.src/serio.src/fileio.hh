/******************************************************************************
 * to emulate the serial input and output of an 8051 controller               *
 * fileio.hh - file input and output                                          *
 ******************************************************************************/
#include "config.h"

class FileIO
{
	public:
		FileIO();
		FileIO(char *infile, char *outfile);
		~FileIO();

		int SendByte(char b);
		int RecvByte(char *b);
		int SendStr(char *str);
		int RecvStr(char *str);

	private:
		int fdin;
		int fdout;
};
