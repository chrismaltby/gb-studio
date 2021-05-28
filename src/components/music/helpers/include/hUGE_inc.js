// https://raw.githubusercontent.com/untoxa/hUGEBuild/master/include/hUGE.inc

export default `dn: MACRO ;; (note, instr, effect)\n
    db \\1\n
    db ((\\2 << 4) | (\\3 >> 8))\n
    db LOW(\\3)\n
ENDM\n
\n
C_3 EQU 0\n
C#3 EQU 1\n
D_3 EQU 2\n
D#3 EQU 3\n
E_3 EQU 4\n
F_3 EQU 5\n
F#3 EQU 6\n
G_3 EQU 7\n
G#3 EQU 8\n
A_3 EQU 9\n
A#3 EQU 10\n
B_3 EQU 11\n
C_4 EQU 12\n
C#4 EQU 13\n
D_4 EQU 14\n
D#4 EQU 15\n
E_4 EQU 16\n
F_4 EQU 17\n
F#4 EQU 18\n
G_4 EQU 19\n
G#4 EQU 20\n
A_4 EQU 21\n
A#4 EQU 22\n
B_4 EQU 23\n
C_5 EQU 24\n
C#5 EQU 25\n
D_5 EQU 26\n
D#5 EQU 27\n
E_5 EQU 28\n
F_5 EQU 29\n
F#5 EQU 30\n
G_5 EQU 31\n
G#5 EQU 32\n
A_5 EQU 33\n
A#5 EQU 34\n
B_5 EQU 35\n
C_6 EQU 36\n
C#6 EQU 37\n
D_6 EQU 38\n
D#6 EQU 39\n
E_6 EQU 40\n
F_6 EQU 41\n
F#6 EQU 42\n
G_6 EQU 43\n
G#6 EQU 44\n
A_6 EQU 45\n
A#6 EQU 46\n
B_6 EQU 47\n
C_7 EQU 48\n
C#7 EQU 49\n
D_7 EQU 50\n
D#7 EQU 51\n
E_7 EQU 52\n
F_7 EQU 53\n
F#7 EQU 54\n
G_7 EQU 55\n
G#7 EQU 56\n
A_7 EQU 57\n
A#7 EQU 58\n
B_7 EQU 59\n
C_8 EQU 60\n
C#8 EQU 61\n
D_8 EQU 62\n
D#8 EQU 63\n
E_8 EQU 64\n
F_8 EQU 65\n
F#8 EQU 66\n
G_8 EQU 67\n
G#8 EQU 68\n
A_8 EQU 69\n
A#8 EQU 70\n
B_8 EQU 71\n
LAST_NOTE EQU 72\n
___ EQU 90 ; the default "no note" value\n`;
