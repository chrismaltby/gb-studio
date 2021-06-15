REM Automatically generated from Makefile
mkdir -p obj
mkdir -p res
..\..\..\bin\lcc   -c -o obj\main.o src\main.c
rm -f obj\linkfile.lk
echo obj\main.o >>obj\linkfile.lk;
..\..\..\bin\lcc   -o obj\Example.gb -Wl-fobj\linkfile.lk
