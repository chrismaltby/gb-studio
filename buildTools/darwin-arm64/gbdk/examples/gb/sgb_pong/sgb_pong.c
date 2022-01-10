#include <gb/gb.h>
#include <gb/sgb.h>
#include <gbdk/console.h>

#include <stdint.h>
#include <stdio.h>

uint8_t sprite_data[] = {
    0x3C,0x3C,0x42,0x7E,0x99,0xFF,0xA9,0xFF,0x89,0xFF,0x89,0xFF,0x42,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0xB9,0xFF,0x89,0xFF,0x91,0xFF,0xB9,0xFF,0x42,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0x99,0xFF,0x89,0xFF,0x99,0xFF,0x89,0xFF,0x5A,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0xA9,0xFF,0xA9,0xFF,0xB9,0xFF,0x89,0xFF,0x42,0x7E,0x3C,0x3C

};

// initializes sprites for pad. every pad uses 3 sprites which id's are aligned by 4
void init_pad(uint8_t n) {
    set_sprite_tile(n << 2, n);
    set_sprite_tile((n << 2) + 1, n);
    set_sprite_tile((n << 2) + 2, n);
}

// inline function for moving pads; code of this function will be inlined with the code of main()
inline void draw_pad(uint8_t n, uint8_t x, uint8_t y) {
    move_sprite(n << 2, x, y);
    move_sprite((n << 2) + 1, x, y + 8);
    move_sprite((n << 2) + 2, x, y + 16);
}

joypads_t joypads;

// absolute Y coordinates of player 1 & 2
uint8_t player1, player2;
uint16_t player1_score, player2_score;

// player constraints
#define YMIN 28
#define YMAX 100
#define PLAYER1_X 16
#define PLAYER2_X (uint8_t)((20 * 8) - 8)

// coordinates and speeds of ball
uint8_t ballX, ballY;
int8_t spd_ballX, spd_ballY;

#define INITBALLX 80 + 4 
#define INITBALLY 64 + 8

const unsigned char HUD[] = " p1: %d   p2: %d";

// main funxction
void main(void) {
    // init palettes
    BGP_REG = OBP0_REG = OBP1_REG = 0xE4;

    // load tile data into VRAM
    set_sprite_data(0, 4, sprite_data);
    
    // init pad sprites
    init_pad(0);
    init_pad(1);
    
    // init ball sprite
    set_sprite_tile(3, 2);

    // show bkg and sprites
    SHOW_BKG; SHOW_SPRITES;

    // init 2 joypads
    if (joypad_init(2, &joypads) != 2) {
        printf(" This program must\n  be executed  on\n   Super GameBoy");
        return;
    }
 
    // init players
    player1 = 64, player2 = 64;
    player1_score = player2_score = 0;
    
    // draw score
    printf(HUD, player1_score, player2_score);
    
    // init ball
    ballX = INITBALLX, ballY = INITBALLY;
    spd_ballX = 1, spd_ballY = 1;
    
    while(1) {
        // poll joypads
        joypad_ex(&joypads);
        
        // player 1
        if (joypads.joy0 & J_UP) {
            player1 -= 2;
            if (player1 < YMIN) player1 = YMIN;
        } else if (joypads.joy0 & J_DOWN) {
            player1 += 2;
            if (player1 > YMAX) player1 = YMAX;            
        }
        draw_pad(0, PLAYER1_X, player1);
        
        // player 2
        if (joypads.joy1 & J_UP) {
            player2 -= 2;
            if (player2 < YMIN) player2 = YMIN;
        } else if (joypads.joy1 & J_DOWN) {
            player2 += 2;
            if (player2 > YMAX) player2 = YMAX;            
        }
        draw_pad(1, PLAYER2_X, player2);

        // move ball
        ballX += spd_ballX, ballY += spd_ballY;
        // check bounce from limits
        if ((ballY < YMIN) || (ballY > (YMAX + 24))) {
            spd_ballY = -spd_ballY; 
        }
        // check bounce from bats
        if (ballX < (PLAYER1_X + 8)) {
            if ((ballY > player1) && (ballY < (player1 + 24)) && (spd_ballX < 0)) 
                spd_ballX = -spd_ballX;
        } else if (ballX > (PLAYER2_X - 8)) {
            if ((ballY > player2) && (ballY < (player2 + 24)) && (spd_ballX > 0)) 
                spd_ballX = -spd_ballX;
        }
        // check player1 or 2 wins, update scores, start from center
        if (ballX < PLAYER1_X) {
            // player2 wins
            ballX = INITBALLX, ballY = INITBALLY;
            spd_ballX = -spd_ballX;
            player2_score++;
            gotoxy(0, 0); printf(HUD, player1_score, player2_score);
        } else if (ballX > PLAYER2_X) {
            // player1 wins
            ballX = INITBALLX, ballY = INITBALLY;
            spd_ballX = -spd_ballX;
            player1_score++;
            gotoxy(0, 0); printf(HUD, player1_score, player2_score);
        }
        // move ball sprite
        move_sprite(3, ballX, ballY);

        // wait for VBlank to slow down everything
        wait_vbl_done();
    }
}