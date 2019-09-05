# Microsoft Developer Studio Project File - Name="src" - Package Owner=<4>
# Microsoft Developer Studio Generated Build File, Format Version 6.00
# ** DO NOT EDIT **

# TARGTYPE "Win32 (x86) Console Application" 0x0103

CFG=src - Win32 Debug
!MESSAGE This is not a valid makefile. To build this project using NMAKE,
!MESSAGE use the Export Makefile command and run
!MESSAGE 
!MESSAGE NMAKE /f "src.mak".
!MESSAGE 
!MESSAGE You can specify a configuration when running NMAKE
!MESSAGE by defining the macro CFG on the command line. For example:
!MESSAGE 
!MESSAGE NMAKE /f "src.mak" CFG="src - Win32 Debug"
!MESSAGE 
!MESSAGE Possible choices for configuration are:
!MESSAGE 
!MESSAGE "src - Win32 Debug" (based on "Win32 (x86) Console Application")
!MESSAGE 

# Begin Project
# PROP AllowPerConfigDependencies 0
# PROP Scc_ProjName ""
# PROP Scc_LocalPath ""
CPP=cl.exe
RSC=rc.exe
# PROP BASE Use_MFC 0
# PROP BASE Use_Debug_Libraries 1
# PROP BASE Output_Dir "Debug"
# PROP BASE Intermediate_Dir "Debug"
# PROP BASE Target_Dir ""
# PROP Use_MFC 0
# PROP Use_Debug_Libraries 1
# PROP Output_Dir ""
# PROP Intermediate_Dir ""
# PROP Ignore_Export_Lib 0
# PROP Target_Dir ""
# ADD BASE CPP /nologo /W3 /Gm /GX /ZI /Od /D "WIN32" /D "_DEBUG" /D "_CONSOLE" /D "_MBCS" /YX /FD /GZ /c
# ADD CPP /nologo /G3 /ML /W3 /WX /Gm /GX /ZI /Od /I ".." /I "..\support\util" /D "WIN32" /D "_DEBUG" /D "_CONSOLE" /D "_MBCS" /FR /J /FD /GZ /c
# ADD BASE RSC /l 0x409 /d "_DEBUG"
# ADD RSC /l 0x409 /d "_DEBUG"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib /nologo /subsystem:console /debug /machine:I386 /pdbtype:sept
# ADD LINK32 mcs51/port.lib z80/port.lib avr/port.lib ds390/port.lib pic/port.lib /nologo /subsystem:console /pdb:none /debug /machine:I386 /nodefaultlib:"libcd" /out:"..\bin\sdcc.exe"
# SUBTRACT LINK32 /verbose /nodefaultlib
# Begin Target

# Name "src - Win32 Debug"
# Begin Group "Source Files"

# PROP Default_Filter "cpp;c;cxx;rc;def;r;odl;idl;hpj;bat"
# Begin Source File

SOURCE=.\asm.c
# End Source File
# Begin Source File

SOURCE=..\support\Util\NewAlloc.c
# End Source File
# Begin Source File

SOURCE=.\SDCC.lex
USERDEP__SDCC_="sdccy.h"	
# Begin Custom Build
InputPath=.\SDCC.lex

"SDCClex.c" : $(SOURCE) "$(INTDIR)" "$(OUTDIR)"
	flex  -osdcclex.c sdcc.lex

# End Custom Build
# End Source File
# Begin Source File

SOURCE=.\SDCC.y
# Begin Custom Build
InputPath=.\SDCC.y

"sdccy.c" : $(SOURCE) "$(INTDIR)" "$(OUTDIR)"
	bison  -d -v -o sdccy.c sdcc.y

# End Custom Build
# End Source File
# Begin Source File

SOURCE=.\SDCCast.c
# End Source File
# Begin Source File

SOURCE=.\SDCCBBlock.c
# End Source File
# Begin Source File

SOURCE=.\SDCCbitv.c
# End Source File
# Begin Source File

SOURCE=.\SDCCcflow.c
# End Source File
# Begin Source File

SOURCE=.\SDCCcse.c
# End Source File
# Begin Source File

SOURCE=.\SDCCdflow.c
# End Source File
# Begin Source File

SOURCE=..\support\Util\sdccerr.c
# End Source File
# Begin Source File

SOURCE=.\SDCCglue.c
# End Source File
# Begin Source File

SOURCE=.\SDCChasht.c
# End Source File
# Begin Source File

SOURCE=.\SDCCicode.c
# End Source File
# Begin Source File

SOURCE=.\SDCClabel.c
# End Source File
# Begin Source File

SOURCE=.\SDCClex.c
# End Source File
# Begin Source File

SOURCE=.\SDCCloop.c
# End Source File
# Begin Source File

SOURCE=.\SDCClrange.c
# End Source File
# Begin Source File

SOURCE=.\SDCCmain.c
# End Source File
# Begin Source File

SOURCE=.\SDCCmem.c
# End Source File
# Begin Source File

SOURCE=.\SDCCopt.c
# End Source File
# Begin Source File

SOURCE=.\SDCCpeeph.c
# End Source File
# Begin Source File

SOURCE=.\SDCCptropt.c
# End Source File
# Begin Source File

SOURCE=.\SDCCset.c
# End Source File
# Begin Source File

SOURCE=.\SDCCsymt.c
# End Source File
# Begin Source File

SOURCE=.\SDCCval.c
# End Source File
# Begin Source File

SOURCE=.\sdccy.c
# End Source File
# End Group
# Begin Group "Header Files"

# PROP Default_Filter "h;hpp;hxx;hm;inl"
# Begin Source File

SOURCE=.\asm.h
# End Source File
# Begin Source File

SOURCE=.\common.h
# End Source File
# Begin Source File

SOURCE=..\support\Util\newalloc.h
# End Source File
# Begin Source File

SOURCE=.\port.h
# End Source File
# Begin Source File

SOURCE=..\sdcc_vc.h
# End Source File
# Begin Source File

SOURCE=.\SDCCast.h
# End Source File
# Begin Source File

SOURCE=.\SDCCBBlock.h
# End Source File
# Begin Source File

SOURCE=.\SDCCbitv.h
# End Source File
# Begin Source File

SOURCE=.\SDCCcflow.h
# End Source File
# Begin Source File

SOURCE=.\SDCCcse.h
# End Source File
# Begin Source File

SOURCE=.\SDCCdflow.h
# End Source File
# Begin Source File

SOURCE=.\SDCCglobl.h
# End Source File
# Begin Source File

SOURCE=.\SDCCglue.h
# End Source File
# Begin Source File

SOURCE=.\SDCChasht.h
# End Source File
# Begin Source File

SOURCE=.\SDCCicode.h
# End Source File
# Begin Source File

SOURCE=.\SDCClabel.h
# End Source File
# Begin Source File

SOURCE=.\SDCCloop.h
# End Source File
# Begin Source File

SOURCE=.\SDCClrange.h
# End Source File
# Begin Source File

SOURCE=.\SDCCmem.h
# End Source File
# Begin Source File

SOURCE=.\SDCCopt.h
# End Source File
# Begin Source File

SOURCE=.\SDCCpeeph.h
# End Source File
# Begin Source File

SOURCE=.\SDCCptropt.h
# End Source File
# Begin Source File

SOURCE=.\SDCCset.h
# End Source File
# Begin Source File

SOURCE=.\SDCCsymt.h
# End Source File
# Begin Source File

SOURCE=.\SDCCval.h
# End Source File
# Begin Source File

SOURCE=.\sdccy.h
# End Source File
# Begin Source File

SOURCE=.\spawn.h
# End Source File
# End Group
# Begin Group "Resource Files"

# PROP Default_Filter "ico;cur;bmp;dlg;rc2;rct;bin;rgs;gif;jpg;jpeg;jpe"
# End Group
# Begin Group "Regression Test"

# PROP Default_Filter ""
# Begin Source File

SOURCE=.\regression\add.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\arrays.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\b.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\bool1.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\call1.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\compare.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\compare2.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\for.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\pointer1.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\struct1.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\sub.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\TempTest.c
# PROP Exclude_From_Build 1
# End Source File
# Begin Source File

SOURCE=.\regression\while.c
# PROP Exclude_From_Build 1
# End Source File
# End Group
# End Target
# End Project
