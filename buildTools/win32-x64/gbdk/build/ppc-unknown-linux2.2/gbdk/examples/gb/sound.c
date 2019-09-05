#include <gb/gb.h>
#include <stdio.h>
#include <gb/console.h>

#define ARROW_CHAR 3
#define SPACE_CHAR ' '

#define ARROW_X    0
#define VAL_X      15
#define TITLE_Y    0
#define FIRST_X    (ARROW_X+1)
#define FIRST_Y    (TITLE_Y+2)

#define PLAY       0x20
#define FREQUENCY  0x21

#define MIN(x,y) ((x) > (y) ? (y) : (x))
#define MAX(x,y) ((x) < (y) ? (y) : (x))

#define NB_MODES   5

enum notes {
  C0, Cd0, D0, Dd0, E0, F0, Fd0, G0, Gd0, A0, Ad0, B0,
  C1, Cd1, D1, Dd1, E1, F1, Fd1, G1, Gd1, A1, Ad1, B1,
  C2, Cd2, D2, Dd2, E2, F2, Fd2, G2, Gd2, A2, Ad2, B2,
  C3, Cd3, D3, Dd3, E3, F3, Fd3, G3, Gd3, A3, Ad3, B3,
  C4, Cd4, D4, Dd4, E4, F4, Fd4, G4, Gd4, A4, Ad4, B4,
  C5, Cd5, D5, Dd5, E5, F5, Fd5, G5, Gd5, A5, Ad5, B5,
  SILENCE, END
};

const UWORD frequencies[] = {
  44, 156, 262, 363, 457, 547, 631, 710, 786, 854, 923, 986,
  1046, 1102, 1155, 1205, 1253, 1297, 1339, 1379, 1417, 1452, 1486, 1517,
  1546, 1575, 1602, 1627, 1650, 1673, 1694, 1714, 1732, 1750, 1767, 1783,
  1798, 1812, 1825, 1837, 1849, 1860, 1871, 1881, 1890, 1899, 1907, 1915,
  1923, 1930, 1936, 1943, 1949, 1954, 1959, 1964, 1969, 1974, 1978, 1982,
  1985, 1988, 1992, 1995, 1998, 2001, 2004, 2006, 2009, 2011, 2013, 2015
};

const UBYTE music[] = {
  C3, C3, G3, G3, A3, A3, G3, SILENCE,
  F3, F3, E3, E3, D3, D3, C3, SILENCE,
  G3, G3, F3, F3, E3, E3, D3, D3,
  G3, G3, F3, F3, E3, E3, D3, D3,
  C3, C3, G3, G3, A3, A3, G3, SILENCE,
  F3, F3, E3, E3, D3, D3, C3, SILENCE,
  END
};

struct Params {
  char *name;
  UWORD max;
};

const struct Params params_0[] = {
  { "Main Controls" , 0    },
  { "All On/Off"    , 1    },
  { "Vin->SO1"      , 1    },
  { "Vin->SO2"      , 1    },
  { "SO1 Volume"    , 7    },
  { "SO2 Volume"    , 7    },
  { NULL            , 0    }
};

const struct Params params_1[] = {
  { "Sound Mode #1" , 0    },
  { "Swp Time"      , 7    },
  { "Swp Mode"      , 1    },
  { "Swp Shifts"    , 7    },
  { "Pat Duty"      , 3    },
  { "Sound Len"     , 63   },
  { "Env Init"      , 15   },
  { "Env Mode"      , 1    },
  { "Env Nb Swp"    , 7    },
  { "Frequency"     , 2047 },
  { "Cons Sel"      , 1    },
  { "Out to SO1"    , 1    },
  { "Out to SO2"    , 1    },
  { "On/Off"        , 1    },
  { NULL            , 0    }
};

const struct Params params_2[] = {
  { "Sound Mode #2" , 0    },
  { "Pat Duty"      , 3    },
  { "Sound Len"     , 63   },
  { "Env Init"      , 15   },
  { "Env Mode"      , 1    },
  { "Env Nb Step"   , 7    },
  { "Frequency"     , 2047 },
  { "Cons Sel"      , 1    },
  { "Out to SO1"    , 1    },
  { "Out to SO2"    , 1    },
  { "On/Off"        , 1    },
  { NULL            , 0    }
};

const struct Params params_3[] = {
  { "Sound Mode #3" , 0    },
  { "Sound On/Off"  , 1    },
  { "Sound Len"     , 255  },
  { "Sel Out Level" , 3    },
  { "Frequency"     , 2047 },
  { "Cons Sel"      , 1    },
  { "Out to SO1"    , 1    },
  { "Out to SO2"    , 1    },
  { "On/Off"        , 1    },
  { NULL            , 0    }
};

const struct Params params_4[] = {
  { "Sound Mode #4" , 0    },
  { "Sound Len"     , 63   },
  { "Env Init"      , 15   },
  { "Env Mode"      , 1    },
  { "Env Nb Step"   , 7    },
  { "Poly Cnt Freq" , 15   },
  { "Poly Cnt Step" , 1    },
  { "Poly Cnt Div"  , 7    },
  { "Cons Sel"      , 1    },
  { "Out to SO1"    , 1    },
  { "Out to SO2"    , 1    },
  { "On/Off"        , 1    },
  { NULL            , 0    }
};

const struct Params *params_array[] = {
  params_0,
  params_1,
  params_2,
  params_3,
  params_4,
};

struct Params *params;

struct SoundReg {
  struct {
    /* 0xFF10 */
    UBYTE sweepShifts     : 3;
    UBYTE sweepMode       : 1;
    UBYTE sweepTime       : 3;
    UBYTE unused_1        : 1;

    /* 0xFF11 */
    UBYTE soundLength     : 6;
    UBYTE patternDuty     : 2;

    /* 0xFF12 */
    UBYTE envNbSweep      : 3;
    UBYTE envMode         : 1;
    UBYTE envInitialValue : 4;

    /* 0xFF13 */
    UBYTE frequencyLow;

    /* 0xFF14 */
    UBYTE frequencyHigh   : 3;
    UBYTE unused_2        : 3;
    UBYTE counter_ConsSel : 1;
    UBYTE restart         : 1;
  } mode1;
  struct {
    /* 0xFF15 */
    UBYTE unused_1;

    /* 0xFF16 */
    UBYTE soundLength     : 6;
    UBYTE patternDuty     : 2;

    /* 0xFF17 */
    UBYTE envNbStep       : 3;
    UBYTE envMode         : 1;
    UBYTE envInitialValue : 4;

    /* 0xFF18 */
    UBYTE frequencyLow;

    /* 0xFF19 */
    UBYTE frequencyHigh   : 3;
    UBYTE unused_2        : 3;
    UBYTE counter_ConsSel : 1;
    UBYTE restart         : 1;
  } mode2;
  struct {
    /* 0xFF1A */
    UBYTE unused_1        : 7;
    UBYTE on_Off          : 1;

    /* 0xFF1B */
    UBYTE soundLength;

    /* 0xFF1C */
    UBYTE unused_2        : 5;
    UBYTE selOutputLevel  : 2;
    UBYTE unused_3        : 1;

    /* 0xFF1D */
    UBYTE frequencyLow;

    /* 0xFF1E */
    UBYTE frequencyHigh   : 3;
    UBYTE unused_4        : 3;
    UBYTE counter_ConsSel : 1;
    UBYTE restart         : 1;
  } mode3;
  struct {
    /* 0xFF1F */
    UBYTE unused_1;

    /* 0xFF20 */
    UBYTE soundLength     : 6;
    UBYTE unused_2        : 2;

    /* 0xFF21 */
    UBYTE envNbStep       : 3;
    UBYTE envMode         : 1;
    UBYTE envInitialValue : 4;

    /* 0xFF22 */
    UBYTE polyCounterDiv  : 3;
    UBYTE polyCounterStep : 1;
    UBYTE polyCounterFreq : 4;

    /* 0xFF23 */
    UBYTE unused_3        : 6;
    UBYTE counter_ConsSel : 1;
    UBYTE restart         : 1;
  } mode4;
  struct {
    /* 0xFF24 */
    UBYTE SO1_OutputLevel : 3;
    UBYTE Vin_SO1         : 1;
    UBYTE SO2_OutputLevel : 3;
    UBYTE Vin_SO2         : 1;

    /* 0xFF25 */
    UBYTE Sound1_To_SO1   : 1;
    UBYTE Sound2_To_SO1   : 1;
    UBYTE Sound3_To_SO1   : 1;
    UBYTE Sound4_To_SO1   : 1;
    UBYTE Sound1_To_SO2   : 1;
    UBYTE Sound2_To_SO2   : 1;
    UBYTE Sound3_To_SO2   : 1;
    UBYTE Sound4_To_SO2   : 1;

    /* 0xFF26 */
    UBYTE Sound1_On_Off   : 1;
    UBYTE Sound2_On_Off   : 1;
    UBYTE Sound3_On_Off   : 1;
    UBYTE Sound4_On_Off   : 1;
    UBYTE unused_1        : 3;
    UBYTE global_On_Off   : 1;
  } control;
};

struct SoundReg *soundReg;

UWORD current_value(UBYTE mode, UBYTE line)
{
  if(mode == 0) {
    switch(line)
      {
      case 0: /* global_On_Off */
	return soundReg->control.global_On_Off;
      case 1: /* Vin_SO1 */
	return soundReg->control.Vin_SO1;
      case 2: /* Vin_SO2 */
	return soundReg->control.Vin_SO2;
      case 3: /* SO1_OutputLevel */
	return soundReg->control.SO1_OutputLevel;
      case 4: /* SO2_OutputLevel */
	return soundReg->control.SO2_OutputLevel;
      }
  } else if(mode == 1) {
    switch(line)
      {
      case 0: /* sweepTime */
	return soundReg->mode1.sweepTime;
      case 1: /* sweepMode */
	return soundReg->mode1.sweepMode;
      case 2: /* sweepShifts */
	return soundReg->mode1.sweepShifts;
      case 3: /* patternDuty */
	return soundReg->mode1.patternDuty;
      case 4: /* soundLength */
	return soundReg->mode1.soundLength;
      case 5: /* envInitialValue */
	return soundReg->mode1.envInitialValue;
      case 6: /* envMode */
	return soundReg->mode1.envMode;
      case 7: /* envNbSweep */
	return soundReg->mode1.envNbSweep;
      case 8: /* frequency */
      case FREQUENCY:
	return ((UWORD)soundReg->mode1.frequencyHigh << 8) +
	  (UWORD)soundReg->mode1.frequencyLow;
      case 9: /* counter_ConsSel */
	return soundReg->mode1.counter_ConsSel;
      case 10: /* Sound1_To_SO1 */
	return soundReg->control.Sound1_To_SO1;
      case 11: /* Sound1_To_SO2 */
	return soundReg->control.Sound1_To_SO2;
      case 12: /* Sound1_On_Off */
	return soundReg->control.Sound1_On_Off;
      }
  } else if(mode == 2) {
    switch(line)
      {
      case 0: /* patternDuty */
	return soundReg->mode2.patternDuty;
      case 1: /* soundLength */
	return soundReg->mode2.soundLength;
      case 2: /* envInitialValue */
	return soundReg->mode2.envInitialValue;
      case 3: /* envMode */
	return soundReg->mode2.envMode;
      case 4: /* envNbStep */
	return soundReg->mode2.envNbStep;
      case 5: /* frequency */
      case FREQUENCY:
	return ((UWORD)soundReg->mode2.frequencyHigh << 8) +
	  (UWORD)soundReg->mode2.frequencyLow;
      case 6: /* counter_ConsSel */
	return soundReg->mode2.counter_ConsSel;
      case 7: /* Sound2_To_SO1 */
	return soundReg->control.Sound2_To_SO1;
      case 8: /* Sound2_To_SO2 */
	return soundReg->control.Sound2_To_SO2;
      case 9: /* Sound2_On_Off */
	return soundReg->control.Sound2_On_Off;
      }
  } else if(mode == 3) {
    switch(line)
      {
      case 0: /* on_Off */
	return soundReg->mode3.on_Off;
      case 1: /* soundLength */
	return soundReg->mode3.soundLength;
      case 2: /* selOutputLevel */
	return soundReg->mode3.selOutputLevel;
      case 3: /* frequency */
      case FREQUENCY:
	return ((UWORD)soundReg->mode3.frequencyHigh << 8) +
	  (UWORD)soundReg->mode3.frequencyLow;
      case 4: /* counter_ConsSel */
	return soundReg->mode3.counter_ConsSel;
      case 5: /* Sound3_To_SO1 */
	return soundReg->control.Sound3_To_SO1;
      case 6: /* Sound3_To_SO2 */
	return soundReg->control.Sound3_To_SO2;
      case 7: /* Sound3_On_Off */
	return soundReg->control.Sound3_On_Off;
      }
  } else if(mode == 4) {
    switch(line)
      {
      case 0: /* soundLength */
	return soundReg->mode4.soundLength;
      case 1: /* envInitialValue */
	return soundReg->mode4.envInitialValue;
      case 2: /* envMode */
	return soundReg->mode4.envMode;
      case 3: /* envNbStep */
	return soundReg->mode4.envNbStep;
      case 4: /* polyCounterFreq */
	return soundReg->mode4.polyCounterFreq;
      case 5: /* polyCounterStep */
	return soundReg->mode4.polyCounterStep;
      case 6: /* polyCounterDiv */
	return soundReg->mode4.polyCounterDiv;
      case 7: /* counter_ConsSel */
	return soundReg->mode4.counter_ConsSel;
      case 8: /* Sound4_To_SO1 */
	return soundReg->control.Sound4_To_SO1;
      case 9: /* Sound4_To_SO2 */
	return soundReg->control.Sound4_To_SO2;
      case 10: /* Sound4_On_Off */
	return soundReg->control.Sound4_On_Off;
      }
  }
  return 0;
}

void update_value(UBYTE mode, UBYTE line, UWORD value)
{
  if(mode == 0) {
    switch(line)
      {
      case 0: /* global_On_Off */
	soundReg->control.global_On_Off = value;
	NR52_REG = ((UBYTE *)soundReg)[0x16];
	break;
      case 1: /* Vin_SO1 */
	soundReg->control.Vin_SO1 = value;
	NR50_REG = ((UBYTE *)soundReg)[0x14];
	break;
      case 2: /* Vin_SO2 */
	soundReg->control.Vin_SO2 = value;
	NR50_REG = ((UBYTE *)soundReg)[0x14];
	break;
      case 3: /* SO1_OutputLevel */
	soundReg->control.SO1_OutputLevel = value;
	NR50_REG = ((UBYTE *)soundReg)[0x14];
	break;
      case 4: /* SO2_OutputLevel */
	soundReg->control.SO2_OutputLevel = value;
	NR50_REG = ((UBYTE *)soundReg)[0x14];
	break;
      case FREQUENCY:
	update_value(1, FREQUENCY, value);
	update_value(2, FREQUENCY, value);
	update_value(3, FREQUENCY, value);
	break;
      case PLAY: /* restart */
	update_value(1, FREQUENCY, current_value(1, FREQUENCY));
	update_value(2, FREQUENCY, current_value(2, FREQUENCY));
	update_value(3, FREQUENCY, current_value(3, FREQUENCY));
	soundReg->mode1.restart = value;
	soundReg->mode2.restart = value;
	soundReg->mode3.restart = value;
	soundReg->mode4.restart = value;
	NR14_REG = ((UBYTE *)soundReg)[0x04];
	NR24_REG = ((UBYTE *)soundReg)[0x09];
	NR34_REG = ((UBYTE *)soundReg)[0x0E];
	NR44_REG = ((UBYTE *)soundReg)[0x13];
	soundReg->mode1.restart = 0;
	soundReg->mode2.restart = 0;
	soundReg->mode3.restart = 0;
	soundReg->mode4.restart = 0;
	break;
      }
  } else if(mode == 1) {
    switch(line)
      {
      case 0: /* sweepTime */
	soundReg->mode1.sweepTime = value;
	NR10_REG = ((UBYTE *)soundReg)[0x00];
	break;
      case 1: /* sweepMode */
	soundReg->mode1.sweepMode = value;
	NR10_REG = ((UBYTE *)soundReg)[0x00];
	break;
      case 2: /* sweepShifts */
	soundReg->mode1.sweepShifts = value;
	NR10_REG = ((UBYTE *)soundReg)[0x00];
	break;
      case 3: /* patternDuty */
	soundReg->mode1.patternDuty = value;
	NR11_REG = ((UBYTE *)soundReg)[0x01];
	break;
      case 4: /* soundLength */
	soundReg->mode1.soundLength = value;
	NR11_REG = ((UBYTE *)soundReg)[0x01];
	break;
      case 5: /* envInitialValue */
	soundReg->mode1.envInitialValue = value;
	NR12_REG = ((UBYTE *)soundReg)[0x02];
	break;
      case 6: /* envMode */
	soundReg->mode1.envMode = value;
	NR12_REG = ((UBYTE *)soundReg)[0x02];
	break;
      case 7: /* envNbSweep */
	soundReg->mode1.envNbSweep = value;
	NR12_REG = ((UBYTE *)soundReg)[0x02];
	break;
      case 8: /* frequency */
      case FREQUENCY:
	soundReg->mode1.frequencyHigh = value >> 8;
	soundReg->mode1.frequencyLow  = value;
	NR13_REG = ((UBYTE *)soundReg)[0x03];
	NR14_REG = ((UBYTE *)soundReg)[0x04];
	break;
      case 9: /* counter_ConsSel */
	soundReg->mode1.counter_ConsSel = value;
	NR14_REG = ((UBYTE *)soundReg)[0x04];
	break;
      case 10: /* Sound1_To_SO1 */
	soundReg->control.Sound1_To_SO1 = value;
	NR51_REG = ((UBYTE *)soundReg)[0x15];
	break;
      case 11: /* Sound1_To_SO2 */
	soundReg->control.Sound1_To_SO2 = value;
	NR51_REG = ((UBYTE *)soundReg)[0x15];
	break;
      case 12: /* Sound1_On_Off */
	soundReg->control.Sound1_On_Off = value;
	NR52_REG = ((UBYTE *)soundReg)[0x16];
	break;
      case PLAY: /* restart */
	update_value(mode, FREQUENCY, current_value(mode, FREQUENCY));
	soundReg->mode1.restart = value;
	NR14_REG = ((UBYTE *)soundReg)[0x04];
	soundReg->mode1.restart = 0;
	break;
      }
  } else if(mode == 2) {
    switch(line)
      {
      case 0: /* patternDuty */
	soundReg->mode2.patternDuty = value;
	NR21_REG = ((UBYTE *)soundReg)[0x06];
	break;
      case 1: /* soundLength */
	soundReg->mode2.soundLength = value;
	NR21_REG = ((UBYTE *)soundReg)[0x06];
	break;
      case 2: /* envInitialValue */
	soundReg->mode2.envInitialValue = value;
	NR22_REG = ((UBYTE *)soundReg)[0x07];
	break;
      case 3: /* envMode */
	soundReg->mode2.envMode = value;
	NR22_REG = ((UBYTE *)soundReg)[0x07];
	break;
      case 4: /* envNbStep */
	soundReg->mode2.envNbStep = value;
	NR22_REG = ((UBYTE *)soundReg)[0x07];
	break;
      case 5: /* frequency */
      case FREQUENCY:
	soundReg->mode2.frequencyHigh = value >> 8;
	soundReg->mode2.frequencyLow  = value;
	NR23_REG = ((UBYTE *)soundReg)[0x08];
	NR24_REG = ((UBYTE *)soundReg)[0x09];
	break;
      case 6: /* counter_ConsSel */
	soundReg->mode2.counter_ConsSel = value;
	NR24_REG = ((UBYTE *)soundReg)[0x09];
	break;
      case 7: /* Sound2_To_SO1 */
	soundReg->control.Sound2_To_SO1 = value;
	NR51_REG = ((UBYTE *)soundReg)[0x15];
	break;
      case 8: /* Sound2_To_SO2 */
	soundReg->control.Sound2_To_SO2 = value;
	NR51_REG = ((UBYTE *)soundReg)[0x15];
	break;
      case 9: /* Sound2_On_Off */
	soundReg->control.Sound2_On_Off = value;
	NR52_REG = ((UBYTE *)soundReg)[0x16];
	break;
      case PLAY: /* restart */
	update_value(mode, FREQUENCY, current_value(mode, FREQUENCY));
	soundReg->mode2.restart = value;
	NR24_REG = ((UBYTE *)soundReg)[0x09];
	soundReg->mode2.restart = 0;
	break;
      }
  } else if(mode == 3) {
    switch(line)
      {
      case 0: /* on_Off */
	soundReg->mode3.on_Off = value;
	NR30_REG = ((UBYTE *)soundReg)[0x0A];
	break;
      case 1: /* soundLength */
	soundReg->mode3.soundLength = value;
	NR31_REG = ((UBYTE *)soundReg)[0x0B];
	break;
      case 2: /* selOutputLevel */
	soundReg->mode3.selOutputLevel = value;
	NR32_REG = ((UBYTE *)soundReg)[0x0C];
	break;
      case 3: /* frequency */
      case FREQUENCY:
	soundReg->mode3.frequencyHigh = value >> 8;
	soundReg->mode3.frequencyLow  = value;
	NR33_REG = ((UBYTE *)soundReg)[0x0D];
	NR34_REG = ((UBYTE *)soundReg)[0x0E];
	break;
      case 4: /* counter_ConsSel */
	soundReg->mode3.counter_ConsSel = value;
	NR34_REG = ((UBYTE *)soundReg)[0x0E];
	break;
      case 5: /* Sound3_To_SO1 */
	soundReg->control.Sound3_To_SO1 = value;
	NR51_REG = ((UBYTE *)soundReg)[0x15];
	break;
      case 6: /* Sound3_To_SO2 */
	soundReg->control.Sound3_To_SO2 = value;
	NR51_REG = ((UBYTE *)soundReg)[0x15];
	break;
      case 7: /* Sound3_On_Off */
	soundReg->control.Sound3_On_Off = value;
	NR52_REG = ((UBYTE *)soundReg)[0x16];
	break;
      case PLAY: /* restart */
	update_value(mode, FREQUENCY, current_value(mode, FREQUENCY));
	soundReg->mode3.restart = value;
	NR34_REG = ((UBYTE *)soundReg)[0x0E];
	soundReg->mode3.restart = 0;
	break;
      }
  } else if(mode == 4) {
    switch(line)
      {
      case 0: /* soundLength */
	soundReg->mode4.soundLength = value;
	NR41_REG = ((UBYTE *)soundReg)[0x10];
	break;
      case 1: /* envInitialValue */
	soundReg->mode4.envInitialValue = value;
	NR42_REG = ((UBYTE *)soundReg)[0x11];
	break;
      case 2: /* envMode */
	soundReg->mode4.envMode = value;
	NR42_REG = ((UBYTE *)soundReg)[0x11];
	break;
      case 3: /* envNbStep */
	soundReg->mode4.envNbStep = value;
	NR42_REG = ((UBYTE *)soundReg)[0x11];
	break;
      case 4: /* polyCounterFreq */
	soundReg->mode4.polyCounterFreq = value;
	NR43_REG = ((UBYTE *)soundReg)[0x12];
	break;
      case 5: /* polyCounterStep */
	soundReg->mode4.polyCounterStep = value;
	NR43_REG = ((UBYTE *)soundReg)[0x12];
	break;
      case 6: /* polyCounterDiv */
	soundReg->mode4.polyCounterDiv = value;
	NR43_REG = ((UBYTE *)soundReg)[0x12];
	break;
      case 7: /* counter_ConsSel */
	soundReg->mode4.counter_ConsSel = value;
	NR44_REG = ((UBYTE *)soundReg)[0x13];
	break;
      case 8: /* Sound4_To_SO1 */
	soundReg->control.Sound4_To_SO1 = value;
	NR51_REG = ((UBYTE *)soundReg)[0x15];
	break;
      case 9: /* Sound4_To_SO2 */
	soundReg->control.Sound4_To_SO2 = value;
	NR51_REG = ((UBYTE *)soundReg)[0x15];
	break;
      case 10: /* Sound4_On_Off */
	soundReg->control.Sound4_On_Off = value;
	NR52_REG = ((UBYTE *)soundReg)[0x16];
	break;
      case PLAY: /* restart */
	soundReg->mode4.restart = value;
	NR44_REG = ((UBYTE *)soundReg)[0x13];
	soundReg->mode4.restart = 0;
	break;
      }
  }
}

UBYTE draw_screen(UBYTE mode)
{
  UBYTE i;

  cls();
  gotoxy(FIRST_X, TITLE_Y);
  print(params[0].name);

  for(i = 0; params[i+1].name; i++) {
    gotoxy(FIRST_X, FIRST_Y+i);
    print(params[i+1].name);
    gotoxy(VAL_X, FIRST_Y+i);
    println(current_value(mode, i), 10, UNSIGNED);
  }
  return i-1;
}


void play_music(UBYTE mode)
{
  UBYTE i = 0;

  while(music[i] != END) {
    if(music[i] != SILENCE) {
      update_value(mode, FREQUENCY, frequencies[music[i]]);
      update_value(mode, PLAY, 1);
    }
    delay(500);
    i++;
  }
}

void dump_registers()
{
  UBYTE reg;
  UBYTE i, j;

  cls();
  gotoxy(FIRST_X, TITLE_Y);
  print("Register Dump");

  for(i = 0, j = 0; i <= 0x16; i++, j++) {
    if(i == 0x05 || i == 0x0F)
      i++;
    if(j%2 == 0) {
      gotoxy(FIRST_X, FIRST_Y+j/2);
      print("0xFF");
    } else {
      gotoxy(FIRST_X+6, FIRST_Y+j/2);
      putchar('-');
    }
    printn(i+0x10, 16, UNSIGNED);
    if(j%2 == 0) {
      gotoxy(VAL_X, FIRST_Y+j/2);
    } else {
      gotoxy(VAL_X+2, FIRST_Y+j/2);
      putchar('-');
    }
    reg = ((UBYTE *)soundReg)[i];
    if(!(reg & 0xF0U)) putchar('0');
    printn(reg, 16, UNSIGNED);
  }
}

void wait_event(UBYTE mode)
{
  UBYTE input, y, last_y;
  UWORD l;

  while(1) {
    params = params_array[mode];
    last_y = draw_screen(mode) + FIRST_Y;
    y = FIRST_Y;
    gotoxy(ARROW_X, y);
    setchar(ARROW_CHAR);

    while(1) {
      input = joypad();
      if(input & J_UP) {
	gotoxy(ARROW_X, y); setchar(SPACE_CHAR);
	if(--y < FIRST_Y)
	  y = last_y;
	gotoxy(ARROW_X, y); setchar(ARROW_CHAR);
      } else if(input & J_DOWN) {
	gotoxy(ARROW_X, y); setchar(SPACE_CHAR);
	if(++y > last_y)
	  y = FIRST_Y;
	gotoxy(ARROW_X, y); setchar(ARROW_CHAR);
      } else if(input & J_LEFT) {
	l = current_value(mode, y-FIRST_Y);
	if(l > 0) {
	  if(input & J_A)
	    l = MAX(l, 10) - 10;
	  else if(input & J_B)
	    l = 0;
	  else
	    l--;
	  update_value(mode, y-FIRST_Y, l);
	  gotoxy(VAL_X, y); print("    ");
	  gotoxy(VAL_X, y); println(l, 10, UNSIGNED);
	}
      } else if(input & J_RIGHT) {
	l = current_value(mode, y-FIRST_Y);
	if(l < params[y-(FIRST_Y-1)].max) {
	  if(input & J_A)
	    l = MIN(l + 10, params[y-(FIRST_Y-1)].max);
	  else if(input & J_B)
	    l = params[y-(FIRST_Y-1)].max;
	  else
	    l++;
	  update_value(mode, y-FIRST_Y, l);
	  gotoxy(VAL_X, y); print("    ");
	  gotoxy(VAL_X, y); println(l, 10, UNSIGNED);
	}
      } else if(input & J_START) {
	if(input & J_A)
	  play_music(mode);
	else
	  update_value(mode, PLAY, 1);
	waitpadup();
      } else if(input & J_SELECT) {
	if(input & J_A)
	  dump_registers();
	else
	  mode = (mode+1) % NB_MODES;
	waitpadup();
	break;
      }
      delay(250);
    }
  }
}

void main()
{
  struct SoundReg s = {
    { 0, 0, 0, 0,
      1, 2,
      3, 0, 4,
      0x73U,
      6, 0, 0, 0 },
    { 0,
      1, 2,
      4, 0, 8,
      0xD7U,
      6, 0, 0, 0 },
    { 0, 1,
      0,
      0, 1, 0,
      0xD6U,
      6, 0, 0, 0 },
    { 0,
      58, 0,
      1, 0, 10,
      0, 0, 0,
      0, 1, 0 },
    { 7, 0, 7, 0,
      1, 1, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 0, 0, 1 }
  };

  /*
   * Before modifying any sound register, sound must be turned on!
   * (it is turned off by default to save batteries)
   */
  NR52_REG = 0x80;

  soundReg = &s;
  NR10_REG = ((UBYTE *)soundReg)[0x00];
  NR11_REG = ((UBYTE *)soundReg)[0x01];
  NR12_REG = ((UBYTE *)soundReg)[0x02];
  NR13_REG = ((UBYTE *)soundReg)[0x03];
  NR14_REG = ((UBYTE *)soundReg)[0x04];

  NR21_REG = ((UBYTE *)soundReg)[0x06];
  NR22_REG = ((UBYTE *)soundReg)[0x07];
  NR23_REG = ((UBYTE *)soundReg)[0x08];
  NR24_REG = ((UBYTE *)soundReg)[0x09];

  NR30_REG = ((UBYTE *)soundReg)[0x0A];
  NR31_REG = ((UBYTE *)soundReg)[0x0B];
  NR32_REG = ((UBYTE *)soundReg)[0x0C];
  NR33_REG = ((UBYTE *)soundReg)[0x0D];
  NR34_REG = ((UBYTE *)soundReg)[0x0E];

  NR41_REG = ((UBYTE *)soundReg)[0x10];
  NR42_REG = ((UBYTE *)soundReg)[0x11];
  NR43_REG = ((UBYTE *)soundReg)[0x12];
  NR44_REG = ((UBYTE *)soundReg)[0x13];

  NR50_REG = ((UBYTE *)soundReg)[0x14];
  NR51_REG = ((UBYTE *)soundReg)[0x15];
  NR52_REG = ((UBYTE *)soundReg)[0x16];

  cls();

  wait_event(1);
}
