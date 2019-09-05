/******************************************************************************
 * to emulate the serial input and output of an 8051 controller               *
 * fileio.cc - file input and output                                          *
 ******************************************************************************/
#include <sys/types.h>
#include <iostream.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <errno.h>
#include <string.h>
#include <unistd.h>
#include "fileio.hh"

FileIO::FileIO()
{

	// make the input fifo
	if(mkfifo(DEF_INFILE, S_IRUSR|S_IWUSR|S_IRGRP|S_IROTH) == -1) {
		if(errno != EEXIST) {
			cerr << "mkfifo(): Error number " << errno << " occourred: " << strerror(errno) << "\n";
			exit(-1);
		}
	}

	// the input fifo - non blocking
	if ((fdin = open(DEF_INFILE, O_RDONLY|O_NONBLOCK)) == -1) {
		cerr << "open(): Error number " << errno << " occourred: " << strerror(errno) << "\n";
		exit(-1);
	}

	// make the output fifo
	if(mkfifo(DEF_OUTFILE, S_IRUSR|S_IWUSR|S_IRGRP|S_IROTH) == -1) {
		if(errno != EEXIST) {
			cerr << "mkfifo(): Error number " << errno << " occourred: " << strerror(errno) << "\n";
			exit(-1);
		}
	}

	// the output fifo
	if ((fdout = open(DEF_OUTFILE, O_RDWR|O_NONBLOCK)) == -1) {
		cerr << "open(): Error number " << errno << " occourred: " << strerror(errno) << "\n";
		exit(-1);
	}
}

FileIO::FileIO(char *infile, char *outfile)
{
	// make the input fifo
	if(mkfifo(infile, S_IRUSR|S_IWUSR|S_IRGRP|S_IROTH) == -1) {
		if(errno != EEXIST) {
			cerr << "mkfifo(): Error number " << errno << " occourred: " << strerror(errno);
			exit(-1);
		}
	}

	// the input fifo - non blocking
	if ((fdin = open(infile, O_RDONLY|O_NONBLOCK)) == -1) {
		cerr << "open(): Error number " << errno << " occourred: " << strerror(errno);
		exit(-1);
	}

	// make the output fifo
	if(mkfifo(outfile, S_IRUSR|S_IWUSR|S_IRGRP|S_IROTH) == -1) {
		if(errno != EEXIST) {
			cerr << "mkfifo(): Error number " << errno << " occourred: " << strerror(errno);
			exit(-1);
		}
	}

	// the output fifo
	if ((fdout = open(outfile, O_RDWR|O_NONBLOCK)) == -1) {
		cerr << "open(): Error number " << errno << " occourred: " << strerror(errno);
		exit(-1);
	}
}


FileIO::~FileIO()
{
	close(fdin);
	close(fdout);
}

int FileIO::SendByte(char b)
{
	int ret;

	if((ret = write(fdout, &b, 1)) != 1)
	{
		cerr << "write(): Error number " << errno << " occourred: " << strerror(errno);
		exit(-1);
	}

	return(ret);
}


int FileIO::RecvByte(char *b)
{
	int ret;

	ret = read(fdin, b, 1);

	if((ret == -1) && (errno != EAGAIN))
	{
		cerr << "read(): Error number " << errno << " occourred: " << strerror(errno);
		exit(-1);
	}

	return(ret);
}

// send a string
int FileIO::SendStr(char *str)
{
	int ret;

	if((ret = write(fdout, str, strlen(str))) != (int)strlen(str))
	{
		cerr << "write(): Error number " << errno << " occourred: " << strerror(errno);
		exit(-1);
	}

	return(ret);
}


int FileIO::RecvStr(char *str)
{
	int ret;

	ret = read(fdin, str, MAX_SIZ-1);
	str[MAX_SIZ] = 0;

	if((ret == -1) && (errno != EAGAIN))
	{
		cerr << "read(): Error number " << errno << " occourred: " << strerror(errno);
		exit(-1);
	}

	return(ret);
}
