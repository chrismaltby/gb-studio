REM Automatically generated from Makefile
mkdir obj res
..\..\..\bin\lcc  -Wl-yt1 -Wl-yo4 -c -o obj\samptest.o src\samptest.c
..\..\..\bin\lcc  -Wl-yt1 -Wl-yo4 -c -o obj\samples_bank3.o src\samples_bank3.c
..\..\..\bin\lcc  -Wl-yt1 -Wl-yo4 -c -o obj\samples_bank2.o src\samples_bank2.c
..\..\..\bin\lcc  -Wl-yt1 -Wl-yo4 -c -o obj\sample_player.o src\sample_player.c
..\..\..\bin\lcc  -Wl-yt1 -Wl-yo4 -o obj\wav_sample.gb obj\samptest.o obj\samples_bank3.o obj\samples_bank2.o obj\sample_player.o 
