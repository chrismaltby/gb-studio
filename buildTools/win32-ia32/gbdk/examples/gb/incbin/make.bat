REM Automatically generated from Makefile
mkdir -p obj
..\..\..\bin\lcc  -Wl-j -Wm-yS -c -o obj\main.o src\main.c
..\..\..\bin\lcc  -Wl-j -Wm-yS -o Example.gb obj\main.o 
