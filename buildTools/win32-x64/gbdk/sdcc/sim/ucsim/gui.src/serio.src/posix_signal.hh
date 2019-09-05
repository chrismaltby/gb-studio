/******************************************************************************
 * posix_signal.hh - A signal handleing class for linux + solaris             *
 * to convert posix into somthing easier to use                               *
 * Tim Hurman - t.hurman@virgin.net                                           *
 * Last edited on 01th Oct 1999                                               *
 ******************************************************************************/
typedef void(*SIG_PF)(int);
class SigHandler
{
	public:
		SigHandler();
		~SigHandler();
		int SetSignal(int SIGNAL, SIG_PF ACTION);
		int BlockSignal(int SIGNAL);
		int UnBlockSignal(int SIGNAL);

	private:
		
};
