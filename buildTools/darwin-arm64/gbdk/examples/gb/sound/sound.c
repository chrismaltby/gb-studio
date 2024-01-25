#include <gb/gb.h>
#include <gbdk/console.h>
#include <stdint.h>
#include <stdio.h>

#define ARROW_CHAR '>'
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

#define UNSIGNED 0

uint8_t previous_keys = 0;
int8_t keys = 0;
#define UPDATE_KEYS() previous_keys = keys; keys = joypad()
#define KEY_PRESSED(K) (keys & (K))
#define KEY_TICKED(K) ((keys & (K)) && !(previous_keys & (K)))

void show_register_channel(uint8_t mode);

void clss()  {
	uint8_t i = 0;
	for(i = 0; i < 18; ++i) {
		gotoxy(0, i);
		printf("                    ");
	}
}

void print(const char* str) {
	printf("%s", str);
}

const char hex[] = "0123456789ABCDEF";
void printn(uint16_t n, uint8_t base, uint8_t sign) {
	(void) sign;
	if(base == 16u) {
		printf("%c", hex[0x000Fu & (n >> 4u)]);
		printf("%c", hex[0x000Fu & (n)]);
	} else {
		printf("%d", n);
	}
}


void println(uint16_t n, uint8_t base, uint8_t sign) {
	printn(n, base, sign);
	printf("\n");
}

enum notes {
  C0, Cd0, D0, Dd0, E0, F0, Fd0, G0, Gd0, A0, Ad0, B0,
  C1, Cd1, D1, Dd1, E1, F1, Fd1, G1, Gd1, A1, Ad1, B1,
  C2, Cd2, D2, Dd2, E2, F2, Fd2, G2, Gd2, A2, Ad2, B2,
  C3, Cd3, D3, Dd3, E3, F3, Fd3, G3, Gd3, A3, Ad3, B3,
  C4, Cd4, D4, Dd4, E4, F4, Fd4, G4, Gd4, A4, Ad4, B4,
  C5, Cd5, D5, Dd5, E5, F5, Fd5, G5, Gd5, A5, Ad5, B5,
  SILENCE, END
};

const uint16_t frequencies[] = {
  44, 156, 262, 363, 457, 547, 631, 710, 786, 854, 923, 986,
  1046, 1102, 1155, 1205, 1253, 1297, 1339, 1379, 1417, 1452, 1486, 1517,
  1546, 1575, 1602, 1627, 1650, 1673, 1694, 1714, 1732, 1750, 1767, 1783,
  1798, 1812, 1825, 1837, 1849, 1860, 1871, 1881, 1890, 1899, 1907, 1915,
  1923, 1930, 1936, 1943, 1949, 1954, 1959, 1964, 1969, 1974, 1978, 1982,
  1985, 1988, 1992, 1995, 1998, 2001, 2004, 2006, 2009, 2011, 2013, 2015
};

const uint8_t music[] = {
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
  uint16_t max;
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

const struct Params *params;

struct SoundReg {
  struct {
    //NR10 0xFF10
    uint16_t sweepShifts     ;//: 3;
    uint16_t sweepMode       ;//: 1;
    uint16_t sweepTime       ;//: 3;
    uint16_t unused_1        ;//: 1;

    //NR11 0xFF11
    uint16_t soundLength     ;//: 6;
    uint16_t patternDuty     ;//: 2;

    //NR12 0xFF12
    uint16_t envNbSweep      ;//: 3;
    uint16_t envMode         ;//: 1;
    uint16_t envInitialValue ;//: 4;

    //NR13 0xFF13
    uint16_t frequencyLow;

    //NR14 0xFF14
    uint16_t frequencyHigh   ;//: 3;
    uint16_t unused_2        ;//: 3;
    uint16_t counter_ConsSel ;//: 1;
    uint16_t restart         ;//: 1;
  } mode1;
  struct {
    //NR20 0xFF15
    uint16_t unused_1;

    //NR21 0xFF16
    uint16_t soundLength     ;//: 6;
    uint16_t patternDuty     ;//: 2;

    //NR22 0xFF17
    uint16_t envNbStep       ;//: 3;
    uint16_t envMode         ;//: 1;
    uint16_t envInitialValue ;//: 4;

    //NR23 0xFF18
    uint16_t frequencyLow;

    //NR24 0xFF19
    uint16_t frequencyHigh   ;//: 3;
    uint16_t unused_2        ;//: 3;
    uint16_t counter_ConsSel ;//: 1;
    uint16_t restart         ;//: 1;
  } mode2;
  struct {
    //NR30 0xFF1A
    uint16_t unused_1        ;//: 7;
    uint16_t on_Off          ;//: 1;

    //NR31 0xFF1B
    uint16_t soundLength;

    //NR32 0xFF1C
    uint16_t unused_2        ;//: 5;
    uint16_t selOutputLevel  ;//: 2;
    uint16_t unused_3        ;//: 1;

    //NR33 0xFF1D
    uint16_t frequencyLow;

    //NR34 0xFF1E
    uint16_t frequencyHigh   ;//: 3;
    uint16_t unused_4        ;//: 3;
    uint16_t counter_ConsSel ;//: 1;
    uint16_t restart         ;//: 1;
  } mode3;
  struct {
    //NR40 0xFF1F
    uint16_t unused_1;

    //NR41 0xFF20
    uint16_t soundLength     ;//: 6;
    uint16_t unused_2        ;//: 2;

    //NR42 0xFF21
    uint16_t envNbStep       ;//: 3;
    uint16_t envMode         ;//: 1;
    uint16_t envInitialValue ;//: 4;

    //NR43 0xFF22
    uint16_t polyCounterDiv  ;//: 3;
    uint16_t polyCounterStep ;//: 1;
    uint16_t polyCounterFreq ;//: 4;

    //NR44 0xFF23
    uint16_t unused_3        ;//: 6;
    uint16_t counter_ConsSel ;//: 1;
    uint16_t restart         ;//: 1;
  } mode4;
  struct {
    // NR50 0xFF24
    uint16_t SO1_OutputLevel ;//: 3;
    uint16_t Vin_SO1         ;//: 1;
    uint16_t SO2_OutputLevel ;//: 3;
    uint16_t Vin_SO2         ;//: 1;

    // NR51 0xFF25
    uint16_t Sound1_To_SO1   ;//: 1;
    uint16_t Sound2_To_SO1   ;//: 1;
    uint16_t Sound3_To_SO1   ;//: 1;
    uint16_t Sound4_To_SO1   ;//: 1;
    uint16_t Sound1_To_SO2   ;//: 1;
    uint16_t Sound2_To_SO2   ;//: 1;
    uint16_t Sound3_To_SO2   ;//: 1;
    uint16_t Sound4_To_SO2   ;//: 1;

    // NR52 0xFF26
    uint16_t Sound1_On_Off   ;//: 1;
    uint16_t Sound2_On_Off   ;//: 1;
    uint16_t Sound3_On_Off   ;//: 1;
    uint16_t Sound4_On_Off   ;//: 1;
    uint16_t unused_1        ;//: 3;
    uint16_t global_On_Off   ;//: 1;
  } control;
};

struct SoundReg *soundReg;

struct SoundReg s = {
	{ 0u, 0u, 0u, 0u,
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
	  0, 3, 0,
	  0xD6U,
	  6, 0, 1, 0 },
	{ 0,
	  58, 0,
	  1, 0, 10,
	  0, 0, 0,
	  0, 1, 0 },
	{ 7, 0, 7, 0,
	  1, 1, 1, 1, 1, 1, 1, 1,
	  0, 0, 0, 0, 0, 1 }
};

uint8_t NR10() {
	return soundReg->mode1.sweepShifts | (soundReg->mode1.sweepMode << 3) | (soundReg->mode1.sweepTime << 4);
}

uint8_t NR11() {
	return soundReg->mode1.soundLength | (soundReg->mode1.patternDuty << 6);
}

uint8_t NR12() {
	return soundReg->mode1.envNbSweep | (soundReg->mode1.envMode << 3) | (soundReg->mode1.envInitialValue << 4);
}

uint8_t NR13() {
	return soundReg->mode1.frequencyLow;
}

uint8_t NR14() {
	return soundReg->mode1.frequencyHigh | (soundReg->mode1.counter_ConsSel << 6) | (soundReg->mode1.restart << 7);
}

//--------------------------
uint8_t NR21() {
	return soundReg->mode2.soundLength | (soundReg->mode2.patternDuty << 6);
}

uint8_t NR22() {
	return soundReg->mode2.envNbStep | (soundReg->mode2.envMode << 3) | (soundReg->mode2.envInitialValue << 4);
}

uint8_t NR23() {
	return soundReg->mode2.frequencyLow;
}

uint8_t NR24() {
	return soundReg->mode2.frequencyHigh | (soundReg->mode2.counter_ConsSel << 6) | (soundReg->mode2.restart << 7);
}

//-------------------------------
uint8_t NR30() {
	return soundReg->mode3.on_Off << 7;
}

uint8_t NR31() {
	return soundReg->mode3.soundLength;
}

uint8_t NR32() {
	return soundReg->mode3.selOutputLevel << 5;
}

uint8_t NR33() {
	return soundReg->mode3.frequencyLow;
}

uint8_t NR34() {
	return soundReg->mode3.frequencyHigh | (soundReg->mode3.counter_ConsSel << 6) | (soundReg->mode3.restart << 7);
}

//-------------------------------
uint8_t NR41() {
	return soundReg->mode4.soundLength;
}

uint8_t NR42() {
	return soundReg->mode4.envNbStep | (soundReg->mode4.envMode << 3) | (soundReg->mode4.envInitialValue << 4);
}

uint8_t NR43() {
	return soundReg->mode4.polyCounterDiv | (soundReg->mode4.polyCounterStep << 3) | (soundReg->mode4.polyCounterFreq << 4);
}

uint8_t NR44() {
	return (soundReg->mode4.counter_ConsSel << 6) | (soundReg->mode4.restart << 7);
}

//-------------------------------
uint8_t NR50() {
	return soundReg->control.SO1_OutputLevel | (soundReg->control.Vin_SO1 << 3u) | (soundReg->control.SO2_OutputLevel << 4u) |
	           (soundReg->control.Vin_SO2 << 7u);
}

uint8_t NR51() {
	return soundReg->control.Sound1_To_SO1 | (soundReg->control.Sound2_To_SO1 << 1) | (soundReg->control.Sound3_To_SO1 << 2) |
	          (soundReg->control.Sound4_To_SO1 << 3) | (soundReg->control.Sound1_To_SO2 << 4) | (soundReg->control.Sound2_To_SO2 << 5) |
			  (soundReg->control.Sound3_To_SO2 << 6)| (soundReg->control.Sound4_To_SO2 << 7);
}

uint8_t NR52() {
	return soundReg->control.global_On_Off << 7;
}

//---------------------------------------------------------------------------------
uint16_t current_value(uint8_t mode, uint8_t line)
{
  if(mode == 0) {
    switch(line)
      {
      case 0: // global_On_Off
	return soundReg->control.global_On_Off;
      case 1: // Vin_SO1
	return soundReg->control.Vin_SO1;
      case 2: // Vin_SO2
	return soundReg->control.Vin_SO2;
      case 3: // SO1_OutputLevel
	return soundReg->control.SO1_OutputLevel;
      case 4: // SO2_OutputLevel
	return soundReg->control.SO2_OutputLevel;
      }
  } else if(mode == 1) {
    switch(line)
      {
      case 0: // sweepTime
	return soundReg->mode1.sweepTime;
      case 1: // sweepMode
	return soundReg->mode1.sweepMode;
      case 2: // sweepShifts
	return soundReg->mode1.sweepShifts;
      case 3: // patternDuty
	return soundReg->mode1.patternDuty;
      case 4: // soundLength
	return soundReg->mode1.soundLength;
      case 5: // envInitialValue
	return soundReg->mode1.envInitialValue;
      case 6: // envMode
	return soundReg->mode1.envMode;
      case 7: // envNbSweep
	return soundReg->mode1.envNbSweep;
      case 8: // frequency
      case FREQUENCY:
	return (soundReg->mode1.frequencyHigh << 8) | soundReg->mode1.frequencyLow;
      case 9: // counter_ConsSel
	return soundReg->mode1.counter_ConsSel;
      case 10: // Sound1_To_SO1
	return soundReg->control.Sound1_To_SO1;
      case 11: // Sound1_To_SO2
	return soundReg->control.Sound1_To_SO2;
      case 12: // Sound1_On_Off
	return soundReg->control.Sound1_On_Off;
      }
  } else if(mode == 2) {
    switch(line)
      {
      case 0: // patternDuty
	return soundReg->mode2.patternDuty;
      case 1: // soundLength
	return soundReg->mode2.soundLength;
      case 2: // envInitialValue
	return soundReg->mode2.envInitialValue;
      case 3: // envMode
	return soundReg->mode2.envMode;
      case 4: // envNbStep
	return soundReg->mode2.envNbStep;
      case 5: // frequency
      case FREQUENCY:
	return (soundReg->mode2.frequencyHigh << 8) | soundReg->mode2.frequencyLow;
      case 6: // counter_ConsSel
	return soundReg->mode2.counter_ConsSel;
      case 7: // Sound2_To_SO1
	return soundReg->control.Sound2_To_SO1;
      case 8: // Sound2_To_SO2
	return soundReg->control.Sound2_To_SO2;
      case 9: // Sound2_On_Off
	return soundReg->control.Sound2_On_Off;
      }
  } else if(mode == 3) {
    switch(line)
      {
      case 0: // on_Off
	return soundReg->mode3.on_Off;
      case 1: // soundLength
	return soundReg->mode3.soundLength;
      case 2: // selOutputLevel
	return soundReg->mode3.selOutputLevel;
      case 3: // frequency
      case FREQUENCY:
	return (soundReg->mode3.frequencyHigh << 8) | soundReg->mode3.frequencyLow;
      case 4: // counter_ConsSel
	return soundReg->mode3.counter_ConsSel;
      case 5: // Sound3_To_SO1
	return soundReg->control.Sound3_To_SO1;
      case 6: // Sound3_To_SO2
	return soundReg->control.Sound3_To_SO2;
      case 7: // Sound3_On_Off
	return soundReg->control.Sound3_On_Off;
      }
  } else if(mode == 4) {
    switch(line)
      {
      case 0: // soundLength
	return soundReg->mode4.soundLength;
      case 1: // envInitialValue
	return soundReg->mode4.envInitialValue;
      case 2: // envMode
	return soundReg->mode4.envMode;
      case 3: // envNbStep
	return soundReg->mode4.envNbStep;
      case 4: // polyCounterFreq
	return soundReg->mode4.polyCounterFreq;
      case 5: // polyCounterStep
	return soundReg->mode4.polyCounterStep;
      case 6: // polyCounterDiv
	return soundReg->mode4.polyCounterDiv;
      case 7: // counter_ConsSel
	return soundReg->mode4.counter_ConsSel;
      case 8: // Sound4_To_SO1
	return soundReg->control.Sound4_To_SO1;
      case 9: // Sound4_To_SO2
	return soundReg->control.Sound4_To_SO2;
      case 10: // Sound4_On_Off
	return soundReg->control.Sound4_On_Off;
      }
  }
  return 0;
}

void update_value(uint8_t mode, uint8_t line, uint16_t value)
{
  if(mode == 0) {
    switch(line)
      {
      case 0: // global_On_Off
	soundReg->control.global_On_Off = value;
	NR52_REG = NR52();
	break;
      case 1: // Vin_SO1
	soundReg->control.Vin_SO1 = value;
	NR50_REG = NR50();
	break;
      case 2: // Vin_SO2
	soundReg->control.Vin_SO2 = value;
	NR50_REG = NR50();
	break;
      case 3: // SO1_OutputLevel
	soundReg->control.SO1_OutputLevel = value;
	NR50_REG = NR50();
	break;
      case 4: // SO2_OutputLevel
	soundReg->control.SO2_OutputLevel = value;
	NR50_REG = NR50();
	break;
      case FREQUENCY:
	update_value(1, FREQUENCY, value);
	update_value(2, FREQUENCY, value);
	update_value(3, FREQUENCY, value);
	break;
      case PLAY: // restart
	update_value(1, FREQUENCY, current_value(1, FREQUENCY));
	update_value(2, FREQUENCY, current_value(2, FREQUENCY));
	update_value(3, FREQUENCY, current_value(3, FREQUENCY));
	soundReg->mode1.restart = value;
	soundReg->mode2.restart = value;
	soundReg->mode3.restart = value;
	soundReg->mode4.restart = value;
	NR14_REG = NR14();
	NR24_REG = NR24();
	NR34_REG = NR34();
	NR44_REG = NR44();
	soundReg->mode1.restart = 0;
	soundReg->mode2.restart = 0;
	soundReg->mode3.restart = 0;
	soundReg->mode4.restart = 0;
	break;
      }
  } else if(mode == 1) {
    switch(line)
      {
      case 0: // sweepTime
	soundReg->mode1.sweepTime = value;
	NR10_REG = NR10();
	break;
      case 1: // sweepMode
	soundReg->mode1.sweepMode = value;
	NR10_REG = NR10();
	break;
      case 2: // sweepShifts
	soundReg->mode1.sweepShifts = value;
	NR10_REG = NR10();
	break;
      case 3: // patternDuty
	soundReg->mode1.patternDuty = value;
	NR11_REG = NR11();
	break;
      case 4: // soundLength
	soundReg->mode1.soundLength = value;
	NR11_REG = NR11();
	break;
      case 5: // envInitialValue
	soundReg->mode1.envInitialValue = value;
	NR12_REG = NR12();
	break;
      case 6: // envMode
	soundReg->mode1.envMode = value;
	NR12_REG = NR12();
	break;
      case 7: // envNbSweep
	soundReg->mode1.envNbSweep = value;
	NR12_REG = NR12();
	break;
      case 8: // frequency
      case FREQUENCY:
	soundReg->mode1.frequencyHigh = value >> 8;
	soundReg->mode1.frequencyLow  = 0xFF & value;
	NR13_REG = NR13();
	NR14_REG = NR14();
	break;
      case 9: // counter_ConsSel
	soundReg->mode1.counter_ConsSel = value;
	NR14_REG = NR14();
	break;
      case 10: // Sound1_To_SO1
	soundReg->control.Sound1_To_SO1 = value;
	NR51_REG = NR51();
	break;
      case 11: // Sound1_To_SO2
	soundReg->control.Sound1_To_SO2 = value;
	NR51_REG = NR51();
	break;
      case 12: // Sound1_On_Off
	soundReg->control.Sound1_On_Off = value;
	NR52_REG = NR52();
	break;
      case PLAY: // restart
	update_value(mode, FREQUENCY, current_value(mode, FREQUENCY));
	soundReg->mode1.restart = value;
	NR14_REG = NR14();
	soundReg->mode1.restart = 0;
	break;
      }
  } else if(mode == 2) {
    switch(line)
      {
      case 0: // patternDuty
	soundReg->mode2.patternDuty = value;
	NR21_REG = NR21();
	break;
      case 1: // soundLength
	soundReg->mode2.soundLength = value;
	NR21_REG = NR21();
	break;
      case 2: // envInitialValue
	soundReg->mode2.envInitialValue = value;
	NR22_REG = NR22();
	break;
      case 3: // envMode
	soundReg->mode2.envMode = value;
	NR22_REG = NR22();
	break;
      case 4: // envNbStep
	soundReg->mode2.envNbStep = value;
	NR22_REG = NR22();
	break;
      case 5: // frequency
      case FREQUENCY:
	soundReg->mode2.frequencyHigh = value >> 8;
	soundReg->mode2.frequencyLow  = 0xFF & value;
	NR23_REG = NR23();
	NR24_REG = NR24();
	break;
      case 6: // counter_ConsSel
	soundReg->mode2.counter_ConsSel = value;
	NR24_REG = NR24();
	break;
      case 7: // Sound2_To_SO1
	soundReg->control.Sound2_To_SO1 = value;
	NR51_REG = NR51();
	break;
      case 8: // Sound2_To_SO2
	soundReg->control.Sound2_To_SO2 = value;
	NR51_REG = NR51();
	break;
      case 9: // Sound2_On_Off
	soundReg->control.Sound2_On_Off = value;
	NR52_REG = NR52();
	break;
      case PLAY: // restart
	update_value(mode, FREQUENCY, current_value(mode, FREQUENCY));
	soundReg->mode2.restart = value;
	NR24_REG = NR24();
	soundReg->mode2.restart = 0;
	break;
      }
  } else if(mode == 3) {
    switch(line)
      {
      case 0: // on_Off
	soundReg->mode3.on_Off = value;
	NR30_REG = NR30();
	break;
      case 1: // soundLength
	soundReg->mode3.soundLength = value;
	NR31_REG = NR31();
	break;
      case 2: // selOutputLevel
	soundReg->mode3.selOutputLevel = value;
	NR32_REG = NR32();
	break;
      case 3: // frequency
      case FREQUENCY:
	soundReg->mode3.frequencyHigh = value >> 8;
	soundReg->mode3.frequencyLow  = 0xFF & value;
	NR33_REG = NR33();
	NR34_REG = NR34();
	break;
      case 4: // counter_ConsSel
	soundReg->mode3.counter_ConsSel = value;
	NR34_REG = NR34();
	break;
      case 5: // Sound3_To_SO1
	soundReg->control.Sound3_To_SO1 = value;
	NR51_REG = NR51();
	break;
      case 6: // Sound3_To_SO2
	soundReg->control.Sound3_To_SO2 = value;
	NR51_REG = NR51();
	break;
      case 7: // Sound3_On_Off
	soundReg->control.Sound3_On_Off = value;
	NR52_REG = NR52();
	break;
      case PLAY: // restart
	update_value(mode, FREQUENCY, current_value(mode, FREQUENCY));
	soundReg->mode3.restart = value;
	NR34_REG = NR34();
	soundReg->mode3.restart = 0;
	break;
      }
  } else if(mode == 4) {
    switch(line)
      {
      case 0: // soundLength
	soundReg->mode4.soundLength = value;
	NR41_REG = NR41();
	break;
      case 1: // envInitialValue
	soundReg->mode4.envInitialValue = value;
	NR42_REG = NR42();
	break;
      case 2: // envMode
	soundReg->mode4.envMode = value;
	NR42_REG = NR42();
	break;
      case 3: // envNbStep
	soundReg->mode4.envNbStep = value;
	NR42_REG = NR42();
	break;
      case 4: // polyCounterFreq
	soundReg->mode4.polyCounterFreq = value;
	NR43_REG = NR43();
	break;
      case 5: // polyCounterStep
	soundReg->mode4.polyCounterStep = value;
	NR43_REG = NR43();
	break;
      case 6: // polyCounterDiv
	soundReg->mode4.polyCounterDiv = value;
	NR43_REG = NR43();
	break;
      case 7: // counter_ConsSel
	soundReg->mode4.counter_ConsSel = value;
	NR44_REG = NR44();
	break;
      case 8: // Sound4_To_SO1
	soundReg->control.Sound4_To_SO1 = value;
	NR51_REG = NR51();
	break;
      case 9: // Sound4_To_SO2
	soundReg->control.Sound4_To_SO2 = value;
	NR51_REG = NR51();
	break;
      case 10: // Sound4_On_Off
	soundReg->control.Sound4_On_Off = value;
	NR52_REG = NR52();
	break;
      case PLAY: // restart
	soundReg->mode4.restart = value;
	NR44_REG = NR44();
	soundReg->mode4.restart = 0;
	break;
      }
  }
}

uint8_t draw_screen(uint8_t mode)
{
  uint8_t i;

  clss();
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


void play_music(uint8_t mode)
{
  uint8_t i = 0;

  while(music[i] != END) {
    if(music[i] != SILENCE) {
      update_value(mode, FREQUENCY, frequencies[music[i]]);
      update_value(mode, PLAY, 1);
    }
    delay(500);
    i++;
  }
}


void show_register_channel(uint8_t mode) {

    switch (mode) {
        case 1:
            gotoxy(0, 16);
            print("NR10-14:");

            gotoxy(1, 17); // Last line
            printn(NR10(), 16, UNSIGNED); print(", ");
            printn(NR11(), 16, UNSIGNED); print(", ");
            printn(NR12(), 16, UNSIGNED); print(", ");
            printn(NR13(), 16, UNSIGNED); print(", ");
            printn(0x80 | NR14(), 16, UNSIGNED);

            break;

        case 2:
            gotoxy(0, 16);
            print("NR21-24:");

            gotoxy(1, 17); // Last line
            printn(NR21(), 16, UNSIGNED); print(", ");
            printn(NR22(), 16, UNSIGNED); print(", ");
            printn(NR23(), 16, UNSIGNED); print(", ");
            printn(0x80 | NR24(), 16, UNSIGNED);

            break;

        case 3:
            gotoxy(0, 16);
            print("NR30-34:");

            gotoxy(1, 17); // Last line
            printn(NR30(), 16, UNSIGNED); print(", ");
            printn(NR31(), 16, UNSIGNED); print(", ");
            printn(NR32(), 16, UNSIGNED); print(", ");
            printn(NR33(), 16, UNSIGNED); print(", ");
            printn(0x80 | NR34(), 16, UNSIGNED);

            break;

        case 4:
            gotoxy(0, 16);
            print("NR41-44:");

            gotoxy(1, 17); // Last line
            printn(NR41(), 16, UNSIGNED); print(", ");
            printn(NR42(), 16, UNSIGNED); print(", ");
            printn(NR43(), 16, UNSIGNED); print(", ");
            printn(0x80 | NR44(), 16, UNSIGNED);

            break;

        case 0:
            gotoxy(0, 16);
            print("NR50-52:");

            gotoxy(1, 17); // Last line
            printn(NR50(), 16, UNSIGNED); print(", ");
            printn(NR51(), 16, UNSIGNED); print(", ");
            printn(NR52(), 16, UNSIGNED); print(", ");

            break;

    }
}


void dump_registers()
{
	clss();
	gotoxy(FIRST_X, TITLE_Y);
	print("Register Dump\n\n");

	print("NR10:");println(NR10(), 16, UNSIGNED);
	print("NR11:");printn(NR11(), 16, UNSIGNED);        print(" NR21:");println(NR21(), 16, UNSIGNED);
	print("NR12:");printn(NR12(), 16, UNSIGNED);        print(" NR22:");println(NR22(), 16, UNSIGNED);
	print("NR13:");printn(NR13(), 16, UNSIGNED);        print(" NR23:");println(NR23(), 16, UNSIGNED);
	print("NR14:");printn(0x80 | NR14(), 16, UNSIGNED); print(" NR24:");println(0x80 | NR24(), 16, UNSIGNED);
	printf("\n");

	print("NR30:");println(NR30(), 16, UNSIGNED);
	print("NR31:");printn(NR31(), 16, UNSIGNED);        print(" NR41:");println(NR41(), 16, UNSIGNED);
	print("NR32:");printn(NR32(), 16, UNSIGNED);        print(" NR42:");println(NR42(), 16, UNSIGNED);
	print("NR33:");printn(NR33(), 16, UNSIGNED);        print(" NR43:");println(NR43(), 16, UNSIGNED);
	print("NR34:");printn(0x80 | NR34(), 16, UNSIGNED); print(" NR44:");println(0x80 | NR44(), 16, UNSIGNED);
	printf("\n");

	print("NR50:");println(NR50(), 16, UNSIGNED);
	print("NR51:");println(NR51(), 16, UNSIGNED);
	print("NR52:");println(NR52(), 16, UNSIGNED);
}

void wait_event(uint8_t mode)
{
  uint8_t y, last_y;
  uint16_t l = 0;
  uint16_t m = 0;

  while(1) {
    params = params_array[mode];
    last_y = draw_screen(mode) + FIRST_Y;
    y = FIRST_Y;
    gotoxy(ARROW_X, y);
    setchar(ARROW_CHAR);

    show_register_channel(mode);

    while(1) {
		if(KEY_TICKED(J_UP)) {
			gotoxy(ARROW_X, y); setchar(SPACE_CHAR);
			if(--y < FIRST_Y)
			  y = last_y;
			gotoxy(ARROW_X, y); setchar(ARROW_CHAR);

		} else if(KEY_TICKED(J_DOWN)) {
			gotoxy(ARROW_X, y); setchar(SPACE_CHAR);
			if(++y > last_y)
			  y = FIRST_Y;
			gotoxy(ARROW_X, y); setchar(ARROW_CHAR);

		} else if(KEY_TICKED(J_LEFT)) {
			l = current_value(mode, y-FIRST_Y);
			if(l != 0) {
                if(KEY_PRESSED(J_A) && KEY_PRESSED(J_B))
                    l = 0;
				else if(KEY_PRESSED(J_A))
					l = (l > 10) ? (l - 10) : 0;
                else if(KEY_PRESSED(J_B))
                    l = (l > 100) ? (l - 100) : 0;
				else
					l--;
				update_value(mode, y-FIRST_Y, l);
			}
			gotoxy(VAL_X, y); print("    ");
			gotoxy(VAL_X, y); println(l, 10, UNSIGNED);

            show_register_channel(mode);

		} else if(KEY_TICKED(J_RIGHT)) {
			l = current_value(mode, y-FIRST_Y);
			m = params[y-(FIRST_Y-1)].max;
			if(l != m) {
                if(KEY_PRESSED(J_A) && KEY_PRESSED(J_B)) {
                    l = m;
                }
				else if(KEY_PRESSED(J_A)) {
					l += 10;
					if(l > m)
						l = m;
				} else if(KEY_PRESSED(J_B)) {
                    l += 100;
                    if(l > m)
                        l = m;
                }
				else
					l++;
				update_value(mode, y-FIRST_Y, l);
			}
			gotoxy(VAL_X, y); print("    ");
			gotoxy(VAL_X, y); println(l, 10, UNSIGNED);

            show_register_channel(mode);

		} else if(KEY_TICKED(J_START)) {
			if (KEY_PRESSED(J_A))
				play_music(mode);
			else
				update_value(mode, PLAY, 1);

		} else if(KEY_PRESSED(J_SELECT)) {
			if(KEY_PRESSED(J_A))
				dump_registers();
			else {
				mode = (mode+1) % NB_MODES;
            }
			waitpadup();
			keys = 0;
			break;
		}
		wait_vbl_done();
		UPDATE_KEYS();
    }
  }
}

void main()
{
  //
  // Before modifying any sound register, sound must be turned on!
  // (it is turned off by default to save batteries)
  //
  NR52_REG = 0x80;

  soundReg = &s;
  NR10_REG = NR10();
  NR11_REG = NR11();
  NR12_REG = NR12();
  NR13_REG = NR13();
  NR14_REG = NR14();

  NR21_REG = NR21();
  NR22_REG = NR22();
  NR23_REG = NR23();
  NR24_REG = NR24();

  NR30_REG = NR30();
  NR31_REG = NR31();
  NR32_REG = NR32();
  NR33_REG = NR33();
  NR34_REG = NR34();

  NR41_REG = NR41();
  NR42_REG = NR42();
  NR43_REG = NR43();
  NR44_REG = NR44();

  NR50_REG = NR50();
  NR51_REG = NR51();
  NR52_REG = NR52();

  clss();

  wait_event(1);
}

