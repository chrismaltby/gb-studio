#ifndef HUGEDRIVER_H_INCLUDE
#define HUGEDRIVER_H_INCLUDE

#include <gbdk/platform.h>

#define DN(A, B, C) (unsigned char)(A),(unsigned char)((B << 4) | (C >> 8)),(unsigned char)(C & 0xFF)

#define C_3 0
#define Cs3 1
#define D_3 2
#define Ds3 3
#define E_3 4
#define F_3 5
#define Fs3 6
#define G_3 7
#define Gs3 8
#define A_3 9
#define As3 10
#define B_3 11
#define C_4 12
#define Cs4 13
#define D_4 14
#define Ds4 15
#define E_4 16
#define F_4 17
#define Fs4 18
#define G_4 19
#define Gs4 20
#define A_4 21
#define As4 22
#define B_4 23
#define C_5 24
#define Cs5 25
#define D_5 26
#define Ds5 27
#define E_5 28
#define F_5 29
#define Fs5 30
#define G_5 31
#define Gs5 32
#define A_5 33
#define As5 34
#define B_5 35
#define C_6 36
#define Cs6 37
#define D_6 38
#define Ds6 39
#define E_6 40
#define F_6 41
#define Fs6 42
#define G_6 43
#define Gs6 44
#define A_6 45
#define As6 46
#define B_6 47
#define C_7 48
#define Cs7 49
#define D_7 50
#define Ds7 51
#define E_7 52
#define F_7 53
#define Fs7 54
#define G_7 55
#define Gs7 56
#define A_7 57
#define As7 58
#define B_7 59
#define C_8 60
#define Cs8 61
#define D_8 62
#define Ds8 63
#define E_8 64
#define F_8 65
#define Fs8 66
#define G_8 67
#define Gs8 68
#define A_8 69
#define As8 70
#define B_8 71
#define LAST_NOTE 72
#define ___ 90

typedef void (*hUGERoutine_t)(unsigned char param, unsigned char ch, unsigned char tick) OLDCALL;

typedef struct hUGESong_t {
  unsigned char tempo;
  const unsigned char * order_cnt;
  const unsigned char ** order1, ** order2, ** order3, ** order4;
  const unsigned char * duty_instruments, * wave_instruments, * noise_instruments;
  const hUGERoutine_t ** routines;
  const unsigned char * waves;
} hUGESong_t;

// initialize the driver with song data
void hUGE_init(const hUGESong_t * song) OLDCALL;
void hUGE_init_banked(const hUGESong_t * song) BANKED OLDCALL;

// driver routine
void hUGE_dosound() OLDCALL;
void hUGE_dosound_banked() BANKED OLDCALL;

enum hUGE_channel_t {HT_CH1 = 0, HT_CH2, HT_CH3, HT_CH4};
enum hUGE_mute_t    {HT_CH_PLAY = 0, HT_CH_MUTE};

void hUGE_mute_channel(enum hUGE_channel_t ch, enum hUGE_mute_t mute) OLDCALL;
void hUGE_mute_channel_banked(enum hUGE_channel_t ch, enum hUGE_mute_t mute) BANKED OLDCALL;

void hUGE_set_position(unsigned char pattern) OLDCALL;
void hUGE_set_position_banked(unsigned char pattern) BANKED OLDCALL;

extern volatile unsigned char hUGE_current_wave;

extern volatile unsigned char hUGE_mute_mask;

inline void hUGE_reset_wave() {
	hUGE_current_wave = 100;
}
inline void hUGE_reset_wave_banked() {
	hUGE_current_wave = 100;
}

#endif