; this is a windows batch file to compile hi.c

; set SDCCINC=c:\usr\local\sdcc\device\include
; set SDCCLIBS=c:\usr\local\sdcc\device\lib\small

set SDCCINC=c:\sdcc\include
set SDCCLIBS=c:\sdcc\lib\small

sdcc -I %SDCCINC% -L %SDCCLIBS% hi.c

