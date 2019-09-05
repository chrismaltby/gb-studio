/******************************************************************************
 * posix_signal.cc - A signal handleing class for linux + solaris             *
 * to convert posix into somthing easier to use                               *
 * Tim Hurman - t.hurman@virgin.net                                           *
 * Last edited on 01th Oct 19999                                              *
 ******************************************************************************/
/*
 * A quick note, fscking linux, none of this would be neccessary if
 * linux contained support for sighold, sigrelse, sigignore and sigpause.
 *
 */

#include <sys/types.h>
#include <iostream.h>
#include <sys/wait.h>   /* header for waitpid() and various macros */
#include <signal.h>     /* header for signal functions */
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <strings.h>
#include <errno.h>

#include "posix_signal.hh"

// constructor
SigHandler::SigHandler()
{
}

// destructor
SigHandler::~SigHandler()
{
}

/* set a signal */
int SigHandler::SetSignal(int SIGNAL, SIG_PF ACTION)
{
	struct sigaction act;

	/* declare what is going to be called when */
	act.sa_handler = ACTION;

	/* clear the structure's mask */
	sigemptyset(&act.sa_mask);

	/* set up some flags */
	if(SIGNAL == SIGCHLD) {
		act.sa_flags = SA_NOCLDSTOP;
	}

	/* set the signal handler */
	if(sigaction(SIGNAL, &act, NULL) < 0)
	{
		cerr << "sigaction(): " << strerror(errno) << "\n";
		exit(-1);
	}

	/* all ok */
	return(0);
}


/* block a signal */
int SigHandler::BlockSignal(int SIGNAL)
{
	sigset_t set;

	/* initalise */
	sigemptyset(&set);

	/* add the SIGNAL to the set */
	sigaddset(&set, SIGNAL);

	/* block it */
	if(sigprocmask(SIG_BLOCK, &set, NULL) < 0)
	{
		cerr << "sigprocmask(): " << strerror(errno) << "\n";
		exit(-1);
	}

	/* done */
	return(0);
}


/* unblock a signal */
int SigHandler::UnBlockSignal(int SIGNAL)
{
	sigset_t set;

	/* initalise */
	sigemptyset(&set);

	/* add the SIGNAL to the set */
	sigaddset(&set, SIGNAL);

	/* block it */
	if(sigprocmask(SIG_UNBLOCK, &set, NULL) < 0)
	{
		cerr << "sigprocmask(): " << strerror(errno) << "\n";
		exit(-1);
	}

	/* done */
	return(0);
}
