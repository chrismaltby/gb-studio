/* ---------------------------------------- */
/*             GB-DTMF Ver1.0               */
/*                  by                      */
/*              Osamu Ohashi                */
/* ---------------------------------------- */

#include <gb/gb.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

/* BG data */
#include "frm_lcd.c"	/* Back ground pattern */
#include "brk_btn.c"	/* button image when broken */
#include "prs_btn.c"	/* button image when pressed */

#include "dtmf_lcd.c"	/* LCD characters */

/* Sprite data */
#include "key_num.c"	/* Sprite pattern for each key pad */
#include "cursor.c"		/* cursor pattern */

/* 
	usage of BG data
	file name	number of BG	type of matrix	aount
	-------------------------------------------------
	frame_lcd.c 9				8 x 8			9
	break_btn.c	9				8 x 8			9
	press_btn.c 9				8 x 8			9
	dtmf_lcd.c  25				8 x 16			50
	------------------------------------------------
	total										77


	usage of OBJ data
	file name	number of obj	type of matrix	amount
	--------------------------------------------------
	key_num.c	23				8 x 8			23
	cursor.c	2				16 x 16			8
	--------------------------------------------------
	total										31
*/


/* display */
#define TITLE " GB-DTMF BY 05AMU "

#define OFFSET 			27
#define KEY_STEP 		24	/* Key matrix size as 24 x 24	*/
#define START_CURSOR_X	24	/* CURSOR position	*/
#define START_CURSOR_Y	72

#define LCD_X 			1	/* start position of X		*/
#define LCD_Y			2	/* start position of Y		*/
#define LCD_WIDTH		18	/* Horizontal size of LCD	*/
#define LCD_HIGHT		2	/* Vertical Size of LCD		*/


#define ON	1
#define OFF	0

/* DTMF */
#define DTMF_ON		100UL	/* Tone on time		*/
#define DTMF_OFF	100UL	/* Tone off time	*/

#define MAX_DTMF	30		/* Maximum length of DTMF strings	*/

/*
	Frequency setting
*/
/*
	We have to calculate the frequency as followin formula
	
	DTMF has two set frequency, we have to decide Row & Column
	with each digit('0','1','2'...)
*/

#define C1 0x94U /* 1209Hz, 1213Hz */
#define C2 0x9EU /* 1336Hz, 1337Hz */
#define C3 0xA7U /* 1477Hz, 1472Hz */
#define C4 0xB0U /* 1633Hz, 1638Hz */

#define R1 0x44U /*  697Hz,  697Hz */
#define R2 0x56U /*  770Hz,  770Hz */
#define R3 0x66U /*  852Hz,  851Hz */
#define R4 0x75U /*  941Hz,  942Hz */ 

const unsigned char row[4] = {R1,R2,R3,R4};	/* DTMF frequency strage of Row */	
const unsigned char col[4] = {C1,C2,C3,C4};	/* DTMF frequency strage of Col */

/* It is possible to set up initial screen by each BG data. */
const unsigned char dtmf_tile[] = {
	 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,

	 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2,
	 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5,
	 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5,
	 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8,

	 4, 9,10,11, 9,10,11, 9,10,11, 9,10,11, 4, 9,10,11, 9,10,11,
	 4,12,13,14,12,13,14,12,13,14,12,13,14, 4,12,13,14,12,13,14,
	 4,15,16,17,15,16,17,15,16,17,15,16,17, 4,15,16,17,15,16,17,

	 4, 9,10,11, 9,10,11, 9,10,11, 9,10,11, 4, 9,10,11, 9,10,11,
	 4,12,13,14,12,13,14,12,13,14,12,13,14, 4,12,13,14,12,13,14,
	 4,15,16,17,15,16,17,15,16,17,15,16,17, 4,15,16,17,15,16,17,

	 4, 9,10,11, 9,10,11, 9,10,11, 9,10,11, 4, 9,10,11, 9,10,11,
	 4,12,13,14,12,13,14,12,13,14,12,13,14, 4,12,13,14,12,13,14,
	 4,15,16,17,15,16,17,15,16,17,15,16,17, 4,15,16,17,15,16,17,

	 4, 9,10,11, 9,10,11, 9,10,11, 9,10,11, 4, 9,10,10,10,10,11,
	 4,12,13,14,12,13,14,12,13,14,12,13,14, 4,12,13,13,13,13,14,
	 4,15,16,17,15,16,17,15,16,17,15,16,17, 4,15,16,16,16,16,17,

	 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4
};

/*
	Button image 
	Normal buttons are created by 3tiles x 3tiles(24pixels x 24pixels)
	Dialing button is created by 6tiles x 3tiles(48pixels x 24pixels)
*/
const unsigned char break_tile[] = {
	 9,10,11,
	12,13,14,
	15,16,17
};

const unsigned char dialing_break[] = {
	 9,10,10,10,10,11,
	12,13,13,13,13,14,
	15,16,16,16,16,17
};

const unsigned char press_tile[] = {
	18,19,20,
	21,22,23,
	24,25,26
};


const unsigned char dialing_press[] = {
	18,19,19,19,19,20,
	21,22,22,22,22,23,
	24,25,25,25,25,26
};

/*
	LCD image at initial & AC
*/
const unsigned char init_disp[] = {
	59,59,59,59,59,59,59,59,59,59,59,59,59,59,59,59,59,59,
	60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60
};

const char	pad[4][6] = {		/* DTMF Pad assign */
	{'1','2','3','A','%','P'},
	{'4','5','6','B','-','F'},
	{'7','8','9','C',',','?'},
	{'*','0','#','D','s','s'}
};

unsigned char disp_tile[MAX_DTMF];

/*
	Initialize for sound registers
	ch1, ch2 are used for this routine.
*/
void init_dial()
{

	NR52_REG = 0x83U;
	NR51_REG = 0x00U;
	NR50_REG = 0x77U;

	NR24_REG = 0x87U;
	NR22_REG = 0xffU;
	NR21_REG = 0xbfU;

	NR14_REG = 0x87U;
	NR12_REG = 0xffU;
	NR11_REG = 0xbfU;
	NR10_REG = 0x04U;
}

/* sound engine for DTMF */
void dialtone(UWORD dtmf_on, UWORD dtmf_off, char str[20])
{
	UBYTE i = 0;
	
	while(str[i]){
		switch(str[i]){
		    case '1':
			  NR13_REG = R1;
			  NR23_REG = C1; 
			  break;
		    case '2':
			  NR13_REG = R1;
			  NR23_REG = C2;
			  break;
		    case '3':
			  NR13_REG = R1;
			  NR23_REG = C3;	
			  break;
		    case 'A':
		    case 'a':
			  NR13_REG = R1;
			  NR23_REG = C4;  
			  break;
		    case '4':
			  NR13_REG = R2;
			  NR23_REG = C1;	
			  break;
		    case '5':
			  NR13_REG = R2;
			  NR23_REG = C2;	
			  break;
		    case '6':
			  NR13_REG = R2;
			  NR23_REG = C3;	
			  break;
			case 'B':
			case 'b':
			  NR13_REG = R2;
			  NR23_REG = C4;	
			  break;
			case '7':
			  NR13_REG = R3;
			  NR23_REG = C1;	
			  break;
			case '8':
			  NR13_REG = R3;
			  NR23_REG = C2;	
			  break;
			case '9':
			  NR13_REG = R3;
			  NR23_REG = C3;	
			  break;
			case 'C':
			case 'c':
			  NR13_REG = R3;
			  NR23_REG = C4;	
			  break;
			case '*':
			  NR13_REG = R4;
			  NR23_REG = C1;	
			  break;
			case '0':
			  NR13_REG = R4;
			  NR23_REG = C2;	
			  break;
			case '#':
			  NR13_REG = R4;
			  NR23_REG = C3;	
			  break;
			case 'D':
			case 'd':
			  NR13_REG = R4;
			  NR23_REG = C4;	
			  break;
			case ',':
			  delay(dtmf_on);	/* keep on */
			  delay(dtmf_off);	/* keep off */
			 
			default:
			  NR51_REG = 0x00U;	/* sound off */
			  goto skip;
			  
		  }
		NR24_REG = 0x87U;	/* ch2 tips */
		NR51_REG = 0x33U;	/* sound on */
		delay(dtmf_on);		/* keep on */

		NR51_REG = 0x00U;	/* sound off */
		delay(dtmf_off);	/* keep off */

	  skip:
		i++;
	}
}


/* Display looks like 7-SEGMENT LED */
void disp_lcd(UBYTE len, char str[MAX_DTMF])
{
	UBYTE i,j;

	j = len;

	i=0;
	while(str[i]){
		if(str[i] >= '0'||'9' <= str[i]){
			disp_tile[i] = OFFSET + (str[i] - '0') * 2;
			disp_tile[i+j] = OFFSET + (str[i] - '0') * 2 + 1;
		}
		switch(str[i]){
			case 'A':
				disp_tile[i] = OFFSET + 10 * 2;
				disp_tile[i+j] = OFFSET + 10 * 2 + 1;
			break;
			case 'B':
				disp_tile[i] = OFFSET + 11 * 2;
				disp_tile[i+j] = OFFSET + 11 * 2 + 1;
			break;
			case 'C':
				disp_tile[i] = OFFSET + 12 * 2;
				disp_tile[i+j] = OFFSET + 12 * 2 + 1;
			break;
			case 'D':
				disp_tile[i] = OFFSET + 13 * 2;
				disp_tile[i+j] = OFFSET + 13 * 2 + 1;
			break;
			case '#':
				disp_tile[i] = OFFSET + 14 * 2;
				disp_tile[i+j] = OFFSET + 14 * 2 + 1;
			break;
			case '*':
				disp_tile[i] = OFFSET + 15 * 2;
				disp_tile[i+j] = OFFSET + 15 * 2 + 1;
			break;
			case ' ':
				disp_tile[i] = OFFSET + 16 * 2;
				disp_tile[i+j] = OFFSET + 16 * 2 + 1;
			break;
			case 'Y':
				disp_tile[i] = OFFSET + 17 * 2;
				disp_tile[i+j] = OFFSET + 17 * 2 + 1;
			break;
			case 'M':
				disp_tile[i] = OFFSET + 18 * 2;
				disp_tile[i+j] = OFFSET + 18 * 2 + 1;
			break;
			case 'U':
				disp_tile[i] = OFFSET + 19 * 2;
				disp_tile[i+j] = OFFSET + 19 * 2 + 1;
			break;
			case 'G':
				disp_tile[i] = OFFSET + 20 * 2;
				disp_tile[i+j] = OFFSET + 20 * 2 + 1;
			break;
			case '-':
				disp_tile[i] = OFFSET + 21 * 2;
				disp_tile[i+j] = OFFSET + 21 * 2 + 1;
			break;
			case 'T':
				disp_tile[i] = OFFSET + 22 * 2;
				disp_tile[i+j] = OFFSET + 22 * 2 + 1;
			break;
			case ',':
				disp_tile[i] = OFFSET + 23 * 2;
				disp_tile[i+j] = OFFSET + 23 * 2 + 1;
			break;
			case 'F':
				disp_tile[i] = OFFSET + 24 * 2;
				disp_tile[i+j] = OFFSET + 24 * 2 + 1;
			break;
			case 'S':
				disp_tile[i] = OFFSET + ('5' - '0') * 2;
				disp_tile[i+j] = OFFSET + ('5' - '0') * 2 + 1;
			break;
		}
		i++;
	}
}

/* clear display */
void clr_disp()
{
	set_bkg_data(OFFSET, 50, dtmf_lcd);
	set_bkg_tiles(LCD_X, LCD_Y, LCD_WIDTH, LCD_HIGHT, init_disp);
}

/*
	CAUTION: Don't display the NULL code
*/
void disp(char str[MAX_DTMF])
{
	UBYTE no, left_pos;
	UBYTE i, start_ch, end_ch;
	char work[MAX_DTMF];

	clr_disp();

	no = 0;
	while(str[no]){
		no++;
	}

	if(no >= LCD_WIDTH){
		start_ch = no - LCD_WIDTH;
		end_ch = LCD_WIDTH;
	}
	else{
		start_ch = 0;
		end_ch = no;
	}
	for(i = 0;i < end_ch;i++){
		work[i] = str[i+start_ch];
	}
	work[end_ch] = 0x00;

	disp_lcd(end_ch, work);

	left_pos = 19 - end_ch;
	set_bkg_tiles(left_pos, 2, end_ch, LCD_HIGHT, disp_tile);
}

void press_button(UBYTE x, UBYTE y)
{
	if(x <= 3 && y <= 3){
		set_bkg_tiles(x * 3 + 1, y * 3 + 5, 3, 3, press_tile);
	}
	if((x == 4 || x == 5) && (y <= 2)){
		set_bkg_tiles(x * 3 + 2, y * 3 + 5, 3, 3, press_tile);
	}
	if((x == 4 || x == 5) && (y == 3)){
		set_bkg_tiles(14, 14, 6, 3, dialing_press);
	}
}

void break_button(UBYTE x, UBYTE y)
{
	if(x <= 3 && y <= 3){
		set_bkg_tiles(x * 3 + 1, y * 3 + 5, 3, 3, break_tile);
	}
	if((x == 4 || x == 5) && (y <= 2)){
		set_bkg_tiles(x * 3 + 2, y * 3 + 5, 3, 3, break_tile);
	}
	if((x == 4 || x == 5) && (y == 3)){
		set_bkg_tiles(14, 14, 6, 3, dialing_break);
	}
}


void init_key()
{
	UBYTE key_x, key_y, i, j;

	/* To make numeric KeyPad */
	set_sprite_data(0, 24, key_num);

	/* key pad 1 - 3 */
	key_y = KEY_STEP + 40;
	for(i = 1;i <= 3;i++){
		key_x = i * KEY_STEP;
		set_sprite_tile(i, i);
		move_sprite(i, key_x, key_y);
	}

	/* key pad 4 - 6 */
	key_y = KEY_STEP * 2 + 40;
	for(i = 4;i <= 6;i++){
		key_x = (i - 3) * KEY_STEP;
		set_sprite_tile(i, i);
		move_sprite(i, key_x, key_y);
	}

	/* key pad 7 - 9 */
	key_y = KEY_STEP * 3 + 40;
		for(i = 7;i <= 9;i++){
			key_x = (i - 6) * KEY_STEP;
			set_sprite_tile(i, i);
			move_sprite(i, key_x, key_y);
		}

	/* key pad 'A' - 'D' */
	key_x = KEY_STEP * 4;
	for(i = 0;i <= 3;i++){
		key_y = (i+1) * KEY_STEP + 40;
		set_sprite_tile(i+10, i+10);
		move_sprite(i+10, key_x, key_y);
	}

	/* key pad '*', '0', '#' */
	set_sprite_tile(15, 15);
	move_sprite(15, KEY_STEP * 1, KEY_STEP * 4 + 40);
	set_sprite_tile(0, 0);
	move_sprite(0, KEY_STEP * 2, KEY_STEP * 4 + 40);
	set_sprite_tile(14, 14);
	move_sprite(14, KEY_STEP * 3, KEY_STEP * 4 + 40);

	/* func left */
	key_x = KEY_STEP * 5 + 8;
	for(i = 0;i <= 2;i++){
		key_y = (i+1) * KEY_STEP + 40;
		set_sprite_tile(i+16, i+16);
		move_sprite(i+16, key_x, key_y);
	}

	/* func right */
	key_x = KEY_STEP * 6 + 8;
	for(i = 0;i <= 2;i++){
		key_y = (i+1) * KEY_STEP + 40;
		set_sprite_tile(i+19, i+19);
		move_sprite(i+19, key_x, key_y);
	}

	/* dialing button */
	key_x = KEY_STEP * 5 + 20;
	key_y = KEY_STEP * 4 + 40;
	set_sprite_tile(22, 22);
	move_sprite(22, key_x, key_y);
}

void init_bkg()
{
	/* Initialize the background */
	set_bkg_data( 0, 9, frame_lcd);
	set_bkg_data( 9, 9, break_btn);
	set_bkg_data(18, 9, press_btn);
	
	set_bkg_tiles(0, 0, 20, 18, dtmf_tile);
}

void init_cursor()
{
	UBYTE i;

	/* Setup the cursor data*/
	set_sprite_data(23, 8, cursor_data);

	for(i = 23;i <= 30;i++){
		set_sprite_tile(i, i);
	}
}

void move_cursor(UBYTE x, UBYTE y)
{
	move_sprite(23, x, y);
	move_sprite(24, x, y+8);
	move_sprite(25, x+8, y);
	move_sprite(26, x+8, y+8);
}

void main()
{
	UBYTE key1, key2, i, j, pos_x, pos_y, ch_pos;
	UBYTE non_flick = OFF;
	UWORD on_time, off_time;

	char str[MAX_DTMF];
	char str_ms[10];

        /* PENDING: sdcc is broken and needs this to be initalised. */
	key2 = 0;

	/* default dialling time setting */
	on_time = DTMF_ON;
	off_time = DTMF_OFF;

	disable_interrupts();
	
	SPRITES_8x8;   /* sprites are 8x8 */

	init_dial();
	
	init_bkg();
	
	init_key();

	init_cursor();

	disp(TITLE);

	SHOW_BKG;
	SHOW_SPRITES;
	DISPLAY_ON;

	enable_interrupts();
	
	i = j = 0;

	ch_pos = 0;

	while(1) {
		wait_vbl_done();
		key1 = joypad();

		if(key1 != key2){
			pos_x = i * KEY_STEP + START_CURSOR_X;
			pos_y = j * KEY_STEP + START_CURSOR_Y;
			move_cursor(pos_x, pos_y);
		}

		if(key2 & J_A){
			if(key1 & J_A){
				/* value set for each sound reg only numeric key pad*/
				if(i <= 3 && j <= 3){
					/* frequncy register set up for DTMF */
					NR13_REG = row[i];
					NR23_REG = col[j];
					NR24_REG = 0x87U;

					/* sound output on */
					NR51_REG = 0x33U;
				}
				
				/* '?' button */
				/* appear the title during press A button */
				if(i == 5 && j == 0 && !non_flick){
					disp(TITLE);
					non_flick = ON;
				}

				/* incremental button */
				/* decremental button */
				/* appear the delay during press A button */
				if(i == 5 && (j == 1 || j == 2) && !non_flick){
					sprintf(str_ms, "%lu MS", on_time);
					disp(str_ms);
					non_flick = ON;
				}
			}
			else{
				/* sound output off */
				NR51_REG = 0x00U;

				break_button(i, j);

				/* '?' button */
				/* incremental button */
				/* decremental button */
				/* return to normal display at release the A button */
				if(i == 5 && (j == 0 || j == 1 || j == 2)){
					non_flick = OFF;
					if(ch_pos == 0)
						clr_disp();
					else
						disp(str);
				}
			}
		}
		else{
			if(key1 & J_A){
				/* button display handle */
				press_button(i, j);

				/* numeric key pad handling */
				if(i <= 3 && j <= 3){
					/* string length check */
					if(ch_pos < MAX_DTMF-1){
						str[ch_pos] = pad[j][i];
						ch_pos++;
						str[ch_pos] = 0x00;
						disp(str);
					}
				}

				/* ',' button */
				if(i == 4 && j == 2){
					/* string length check */
					if(ch_pos < MAX_DTMF-1){
						str[ch_pos] = pad[j][i];
						ch_pos++;
						str[ch_pos] = 0x00;
						disp(str);
					}
				}

				/* all clear button */
				if(i == 4 && j == 0){
					ch_pos = 0x00;
					strcpy(str,"");
					clr_disp();
				}

				/* delete button */
				if(i == 4 && j == 1){
					if(ch_pos > 0){
						ch_pos--;
						str[ch_pos] = 0x00;
						if(ch_pos == 0)
							clr_disp();
						else
							disp(str);
					}
				}

				/* incremental button */
				if(i == 5 && j == 1){
					if(on_time >= DTMF_ON / 2){
						on_time = on_time - 10;
						off_time = off_time - 10;
					}
				}

				/* decremental button */
				if(i == 5 && j == 2){
					if(on_time <= DTMF_ON * 2){
						on_time = on_time + 10;
						off_time = off_time + 10;
					}
				}

				/* dialing button */
				if((i==4 || i==5) && j==3){
					dialtone(on_time, off_time, str);
				}
			}
		}
		if(!(key1 & J_A)){
			if((key1 & J_UP) && !(key2 & J_UP) && j > 0)
				j--;
			else if((key1 & J_DOWN) && !(key2 & J_DOWN) && j < 3)
				j++;

			if((key1 & J_LEFT) && !(key2 & J_LEFT) && i > 0)
				i--;
			else if((key1 & J_RIGHT) && !(key2 & J_RIGHT) && i < 5)
				i++;
		}
		key2 = key1;
	}
}
