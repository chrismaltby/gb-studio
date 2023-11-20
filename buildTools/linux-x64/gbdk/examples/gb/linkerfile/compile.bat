REM Automatically generated from Makefile
mkdir obj
mkdir res
..\..\..\bin\lcc   -c -o obj\main.o src\main.c
rm -f obj\linkfile.lk
for obj in obj\main.o ; do \
	echo $obj >>obj\linkfile.lk; \
done
..\..\..\bin\lcc   -o obj\Example.gb -Wl-fobj\linkfile.lk
