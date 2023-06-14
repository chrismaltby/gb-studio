REM Automatically generated from Makefile
mkdir obj res
..\..\..\bin\lcc  -mz80:sms -autobank -c -o obj\cowbell_8bit_pcm_unsigned.o src\cowbell_8bit_pcm_unsigned.c
..\..\..\bin\lcc  -mz80:sms -autobank -c -o obj\risset_drum_8bit_pcm_unsigned.o src\risset_drum_8bit_pcm_unsigned.c
..\..\..\bin\lcc  -mz80:sms -autobank -c -o obj\sample_player.o src\sample_player.c
..\..\..\bin\lcc  -mz80:sms -autobank -c -o obj\samptest.o src\samptest.c
..\..\..\bin\lcc  -mz80:sms -autobank -o obj\wav_sample.sms obj\cowbell_8bit_pcm_unsigned.o obj\risset_drum_8bit_pcm_unsigned.o obj\sample_player.o obj\samptest.o 
