ORIGIN		= Symantec C++
ORIGIN_VER	= Version 7.00
VERSION		= RELEASE

!IFDEF SUB_DEBUG
DEBUG		= $(SUB_DEBUG)
NDEBUG		= !$(SUB_DEBUG)
!ELSE
DEBUG		= 0
NDEBUG		= 1
!ENDIF

PROJ		= ASLINK
APPTYPE		= DOS EXE
PROJTYPE	= EXE

CC		= SC
CPP		= SPP
MAKE		= SMAKE
RC		= RCC
HC		= HC31
ASM		= SC
DISASM		= OBJ2ASM
LNK		= LINK
DLLS		= 

HEADERS		= ..\linksrc\aslink.h 

DEFFILE		= ASLINK.DEF

!IF $(DEBUG)
OUTPUTDIR	= .
CREATEOUTPUTDIR	=
TARGETDIR	= .
CREATETARGETDIR	=

LIBS		= 

CFLAGS		=  -A -Jm -J -ms -o+time -S -2 -a2 -c 
LFLAGS		=  /PACKF
DEFINES		= -D_DEBUG=1
!ELSE
OUTPUTDIR	= .
CREATEOUTPUTDIR	=
TARGETDIR	= .
CREATETARGETDIR	=

LIBS		= 

CFLAGS		=  -A -Jm -J -ms -o+time -S -2 -a2 -c 
LFLAGS		=  /PACKF
DEFINES		= 
!ENDIF

HFLAGS		= $(CFLAGS) 
MFLAGS		= MASTERPROJ=$(PROJ) 
LIBFLAGS	=  /C 
RESFLAGS	=  
DEBUGGERFLAGS	=  -LOADSYMBOLS 
AFLAGS		= $(CFLAGS) 
HELPFLAGS	= 

MODEL		= S

PAR		= PROJS BATS OBJS

RCDEFINES	= 

LIBDIRS		= 

INCLUDES	= -Ic:\asxxxx\linksrc

INCLUDEDOBJS	= 

OBJS		=  $(OUTPUTDIR)\lkarea.OBJ  $(OUTPUTDIR)\lkdata.OBJ  $(OUTPUTDIR)\lkeval.OBJ  \
		 $(OUTPUTDIR)\lkhead.OBJ  $(OUTPUTDIR)\lkihx.OBJ  $(OUTPUTDIR)\lklex.OBJ  $(OUTPUTDIR)\lklibr.OBJ  \
		 $(OUTPUTDIR)\lklist.OBJ  $(OUTPUTDIR)\lkmain.OBJ  $(OUTPUTDIR)\lkrloc.OBJ  $(OUTPUTDIR)\lks19.OBJ  \
		 $(OUTPUTDIR)\lksym.OBJ 

RCFILES		= 

RESFILES	= 

SYMS		= 

HELPFILES	= 

BATS		= 

.SUFFIXES: .C .CP .CPP .CXX .CC .H .HPP .HXX .COM .EXE .DLL .LIB .RTF .DLG .ASM .RES .RC .OBJ 

.C.OBJ:
	$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$*.obj $*.c

.CPP.OBJ:
	$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$*.obj $*.cpp

.CXX.OBJ:
	$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$*.obj $*.cxx

.CC.OBJ:
	$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$*.obj $*.cc

.CP.OBJ:
	$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$*.obj $*.cp

.H.SYM:
	$(CC) $(HFLAGS) $(DEFINES) $(INCLUDES) -HF -o$(*B).sym $*.h

.HPP.SYM:
	$(CC) $(HFLAGS) $(DEFINES) $(INCLUDES) -HF -o$(*B).sym $*.hpp

.HXX.SYM:
	$(CC) $(HFLAGS) $(DEFINES) $(INCLUDES) -HF -o$(*B).sym $*.hxx

.C.EXP:
	$(CPP) $(CFLAGS) $(DEFINES) $(INCLUDES)   $*.c   -o$*.lst

.CPP.EXP:
	$(CPP) $(CFLAGS) $(DEFINES) $(INCLUDES) $*.cpp -o$*.lst

.CXX.EXP:
	$(CPP) $(CFLAGS) $(DEFINES) $(INCLUDES) $*.cxx -o$*.lst

.CP.EXP:
	$(CPP) $(CFLAGS) $(DEFINES) $(INCLUDES)  $*.cp  -o$*.lst

.CC.EXP:
	$(CPP) $(CFLAGS) $(DEFINES) $(INCLUDES)  $*.cc  -o$*.lst

.ASM.EXP:
	$(CPP) $(CFLAGS) $(DEFINES) $(INCLUDES) $*.asm -o$*.lst

.OBJ.COD:
	$(DISASM) $*.OBJ >$*.cod

.OBJ.EXE:
	$(LNK) $(LFLAGS) @$(PROJ).LNK

.RTF.HLP:
	$(HC) $(HELPFLAGS) $*.HPJ

.ASM.OBJ:
	$(ASM) $(AFLAGS) $(DEFINES) $(INCLUDES) -o$*.obj $*.asm

.RC.RES: 
	$(RC) $(RCDEFINES) $(RESFLAGS) $(INCLUDES) $*.rc -o$*.res

.DLG.RES:
	echo ^#include "windows.h" >$$$*.rc
	echo ^IF EXIST "$*.h" >>$$$*.rc
	echo ^#include "$*.h" >>$$$*.rc
	echo ^#include "$*.dlg" >>$$$*.rc
	$(RC) $(RCDEFINES) $(RESFLAGS) $(INCLUDES) $$$*.rc
	-del $*.res
	-ren $$$*.res $*.res



all:	createdir $(PRECOMPILE) $(SYMS) $(OBJS) $(INCLUDEDOBJS) $(POSTCOMPILE) $(TARGETDIR)\$(PROJ).$(PROJTYPE) $(POSTLINK) _done

createdir:
	$(CREATEOUTPUTDIR)
	$(CREATETARGETDIR)

$(TARGETDIR)\$(PROJ).$(PROJTYPE): $(OBJS) $(INCLUDEDOBJS) $(RCFILES) $(RESFILES) $(HELPFILES) 
			$(LNK) $(LFLAGS) @$(PROJ).LNK;
			-del $(TARGETDIR)\$(PROJ).$(PROJTYPE)
			-ren $(TARGETDIR)\$$SCW$$.$(PROJTYPE) $(PROJ).$(PROJTYPE)
			-echo $(TARGETDIR)\$(PROJ).$(PROJTYPE) built

_done:
		-echo $(PROJ).$(PROJTYPE) done

buildall:	clean	all


clean:
		-del $(TARGETDIR)\$$SCW$$.$(PROJTYPE)
		-del $(TARGETDIR)\$(PROJ).CLE
		-del $(OUTPUTDIR)\SCPH.SYM
		-del $(OBJS)

cleanres:

res:		cleanres $(RCFILES) all


link:
		$(LNK) $(LFLAGS) @$(PROJ).LNK;
		-del $(TARGETDIR)\$(PROJ).$(PROJTYPE)
		-ren $(TARGETDIR)\$$SCW$$.$(PROJTYPE) $(PROJ).$(PROJTYPE)




!IF EXIST (ASLINK.dpd)
!INCLUDE ASLINK.dpd
!ENDIF



$(OUTPUTDIR)\lkarea.OBJ:	..\linksrc\lkarea.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lkarea.obj ..\linksrc\lkarea.c



$(OUTPUTDIR)\lkdata.OBJ:	..\linksrc\lkdata.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lkdata.obj ..\linksrc\lkdata.c



$(OUTPUTDIR)\lkeval.OBJ:	..\linksrc\lkeval.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lkeval.obj ..\linksrc\lkeval.c



$(OUTPUTDIR)\lkhead.OBJ:	..\linksrc\lkhead.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lkhead.obj ..\linksrc\lkhead.c



$(OUTPUTDIR)\lkihx.OBJ:	..\linksrc\lkihx.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lkihx.obj ..\linksrc\lkihx.c



$(OUTPUTDIR)\lklex.OBJ:	..\linksrc\lklex.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lklex.obj ..\linksrc\lklex.c



$(OUTPUTDIR)\lklibr.OBJ:	..\linksrc\lklibr.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lklibr.obj ..\linksrc\lklibr.c



$(OUTPUTDIR)\lklist.OBJ:	..\linksrc\lklist.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lklist.obj ..\linksrc\lklist.c



$(OUTPUTDIR)\lkmain.OBJ:	..\linksrc\lkmain.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lkmain.obj ..\linksrc\lkmain.c



$(OUTPUTDIR)\lkrloc.OBJ:	..\linksrc\lkrloc.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lkrloc.obj ..\linksrc\lkrloc.c



$(OUTPUTDIR)\lks19.OBJ:	..\linksrc\lks19.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lks19.obj ..\linksrc\lks19.c



$(OUTPUTDIR)\lksym.OBJ:	..\linksrc\lksym.c
		$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -o$(OUTPUTDIR)\lksym.obj ..\linksrc\lksym.c




