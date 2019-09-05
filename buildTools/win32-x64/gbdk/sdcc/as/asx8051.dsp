# Microsoft Developer Studio Project File - Name="asx8051" - Package Owner=<4>
# Microsoft Developer Studio Generated Build File, Format Version 6.00
# ** DO NOT EDIT **

# TARGTYPE "Win32 (x86) Console Application" 0x0103

CFG=asx8051 - Win32 Debug
!MESSAGE This is not a valid makefile. To build this project using NMAKE,
!MESSAGE use the Export Makefile command and run
!MESSAGE 
!MESSAGE NMAKE /f "asx8051.mak".
!MESSAGE 
!MESSAGE You can specify a configuration when running NMAKE
!MESSAGE by defining the macro CFG on the command line. For example:
!MESSAGE 
!MESSAGE NMAKE /f "asx8051.mak" CFG="asx8051 - Win32 Debug"
!MESSAGE 
!MESSAGE Possible choices for configuration are:
!MESSAGE 
!MESSAGE "asx8051 - Win32 Debug" (based on "Win32 (x86) Console Application")
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
# PROP Output_Dir "mcs51"
# PROP Intermediate_Dir "mcs51"
# PROP Ignore_Export_Lib 0
# PROP Target_Dir ""
# ADD BASE CPP /nologo /W3 /Gm /GX /ZI /Od /D "WIN32" /D "_DEBUG" /D "_CONSOLE" /D "_MBCS" /YX /FD /GZ /c
# ADD CPP /nologo /G3 /ML /W3 /WX /Gm /GX /ZI /Od /D "_DEBUG" /D "WIN32" /D "_CONSOLE" /D "_MBCS" /D "INDEXLIB" /D "MLH_MAP" /D "SDK" /FR /J /FD /GZ /c
# ADD BASE RSC /l 0x409 /d "_DEBUG"
# ADD RSC /l 0x409 /d "_DEBUG"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib /nologo /subsystem:console /debug /machine:I386 /pdbtype:sept
# ADD LINK32 /nologo /subsystem:console /debug /machine:I386 /out:"\sdcc\bin\asx8051.exe" /pdbtype:sept
# SUBTRACT LINK32 /incremental:no
# Begin Target

# Name "asx8051 - Win32 Debug"
# Begin Group "Source Files"

# PROP Default_Filter "cpp;c;cxx;rc;def;r;odl;idl;hpj;bat"
# Begin Source File

SOURCE=mcs51\asdata.c
# End Source File
# Begin Source File

SOURCE=mcs51\asexpr.c
# End Source File
# Begin Source File

SOURCE=mcs51\aslex.c
# End Source File
# Begin Source File

SOURCE=mcs51\aslist.c
# End Source File
# Begin Source File

SOURCE=mcs51\asmain.c
# End Source File
# Begin Source File

SOURCE=mcs51\asnoice.c
# End Source File
# Begin Source File

SOURCE=mcs51\asout.c
# End Source File
# Begin Source File

SOURCE=mcs51\asstore.c
# End Source File
# Begin Source File

SOURCE=mcs51\assubr.c
# End Source File
# Begin Source File

SOURCE=mcs51\assym.c
# End Source File
# Begin Source File

SOURCE=mcs51\i51adr.c
# End Source File
# Begin Source File

SOURCE=mcs51\i51ext.c
# End Source File
# Begin Source File

SOURCE=mcs51\i51mch.c
# End Source File
# Begin Source File

SOURCE=mcs51\i51pst.c
# End Source File
# End Group
# Begin Group "Header Files"

# PROP Default_Filter "h;hpp;hxx;hm;inl"
# Begin Source File

SOURCE=.\mcs51\asm.h
# End Source File
# Begin Source File

SOURCE=.\mcs51\i8051.h
# End Source File
# End Group
# Begin Group "Resource Files"

# PROP Default_Filter "ico;cur;bmp;dlg;rc2;rct;bin;rgs;gif;jpg;jpeg;jpe"
# End Group
# End Target
# End Project
