REM Automatically generated from Makefile
mkdir -p obj
..\..\..\bin\lcc  -mgbz80:ap -Wl-j -Wm-yS -c -o obj\main.o src\main.c
..\..\..\bin\lcc  -mgbz80:ap -Wl-j -Wm-yS -o Example.pocket obj\main.o 
