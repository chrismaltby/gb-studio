REM Automatically generated from Makefile
mkdir -p obj
mkdir -p res
..\..\..\bin\lcc -mgbz80:ap -c -o obj\main.o src\main.c
rm -f obj\linkfile.lk
for obj in obj\main.o ; do \
	echo $obj >>obj\linkfile.lk; \
done
..\..\..\bin\lcc -mgbz80:ap -o obj\Example.pocket -Wl-fobj\linkfile.lk
