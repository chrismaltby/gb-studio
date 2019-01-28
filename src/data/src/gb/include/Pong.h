#ifndef PONG_H
#define PONG_H

#include <gb/gb.h>

extern UINT8 pong_bank;

void PongInit();
void PongUpdate();

#define PONG_PADDLE_SPEED 2
#define PONG_PADDLE_LEFT_X 24
#define PONG_PADDLE_RIGHT_X 144
#define PONG_BALL_SPEED 1

#endif
