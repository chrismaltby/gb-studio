REM Automatically generated from Makefile

..\..\..\bin\png2hicolorgb res\hicolor\example_image.png --type=1 -L=1 -R=1 --csource --bank=255 -o obj\example_image.c
..\..\..\bin\lcc -Wm-yC  -Wf-MMD -Wf-Wp-MP  -Wl-yt0x19         -autobank -Wb-v -Wb-ext=.rel  -Iobj -Isrc -c -o obj\example_image.o obj\example_image.c
..\..\..\bin\png2hicolorgb res\hicolor\test_pattern_short.png --type=1 -L=1 -R=1 --csource --bank=255 -o obj\test_pattern_short.c
..\..\..\bin\lcc -Wm-yC  -Wf-MMD -Wf-Wp-MP  -Wl-yt0x19         -autobank -Wb-v -Wb-ext=.rel  -Iobj -Isrc -c -o obj\test_pattern_short.o obj\test_pattern_short.c
..\..\..\bin\png2hicolorgb res\hicolor\test_pattern_tall.png --type=1 -L=1 -R=1 --csource --bank=255 -o obj\test_pattern_tall.c
..\..\..\bin\lcc -Wm-yC  -Wf-MMD -Wf-Wp-MP  -Wl-yt0x19         -autobank -Wb-v -Wb-ext=.rel  -Iobj -Isrc -c -o obj\test_pattern_tall.o obj\test_pattern_tall.c
..\..\..\bin\lcc -Wm-yC  -Wf-MMD -Wf-Wp-MP  -Wl-yt0x19         -autobank -Wb-v -Wb-ext=.rel  -Iobj -Isrc -c -o obj\gbc_hicolor.o src\gbc_hicolor.c
..\..\..\bin\lcc -Wm-yC  -Wf-MMD -Wf-Wp-MP  -Wl-yt0x19         -autobank -Wb-v -Wb-ext=.rel  -Iobj -Isrc -c -o obj\main.o src\main.c
..\..\..\bin\lcc -Wm-yC  -Wf-MMD -Wf-Wp-MP  -Wl-yt0x19         -autobank -Wb-v -Wb-ext=.rel  -Iobj -Isrc -o bin\hicolor_pic.gbc obj\example_image.o obj\test_pattern_short.o obj\test_pattern_tall.o obj\gbc_hicolor.o obj\main.o 
