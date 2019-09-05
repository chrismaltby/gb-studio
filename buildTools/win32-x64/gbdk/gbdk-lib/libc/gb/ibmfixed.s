; font: font
	;; BANKED: checked
	.area	_BASE

	.globl	font_load
	;; Perform tricks with banking to shift this font out of
	;; bank 0.  Doesnt currently work as the encoding table
	;; must always be visible.
_font_load_ibm_fixed::		; Banked
	ld	hl,#_font_ibm_fixed
	call	font_load
	ret

_font_ibm_fixed::
	.db	0+4	; 256 char encoding, compressed
	.db	255	; Number of tiles

; Encoding table

	; Hack
	.db 0x00
	.db 0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08
	.db 0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F,0x10
	.db 0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18
	.db 0x19,0x1A,0x1B,0x1C,0x1D,0x1E,0x1F,0x20
	.db 0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28
	.db 0x29,0x2A,0x2B,0x2C,0x2D,0x2E,0x2F,0x30
	.db 0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38
	.db 0x39,0x3A,0x3B,0x3C,0x3D,0x3E,0x3F,0x40
	.db 0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48
	.db 0x49,0x4A,0x4B,0x4C,0x4D,0x4E,0x4F,0x50
	.db 0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58
	.db 0x59,0x5A,0x5B,0x5C,0x5D,0x5E,0x5F,0x60
	.db 0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68
	.db 0x69,0x6A,0x6B,0x6C,0x6D,0x6E,0x6F,0x70
	.db 0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78
	.db 0x79,0x7A,0x7B,0x7C,0x7D,0x7E,0x7F,0x80
	.db 0x81,0x82,0x83,0x84,0x85,0x86,0x87,0x88
	.db 0x89,0x8A,0x8B,0x8C,0x8D,0x8E,0x8F,0x90
	.db 0x91,0x92,0x93,0x94,0x95,0x96,0x97,0x98
	.db 0x99,0x9A,0x9B,0x9C,0x9D,0x9E,0x9F,0xA0
	.db 0xA1,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0xA8
	.db 0xA9,0xAA,0xAB,0xAC,0xAD,0xAE,0xAF,0xB0
	.db 0xB1,0xB2,0xB3,0xB4,0xB5,0xB6,0xB7,0xB8
	.db 0xB9,0xBA,0xBB,0xBC,0xBD,0xBE,0xBF,0xC0
	.db 0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8
	.db 0xC9,0xCA,0xCB,0xCC,0xCD,0xCE,0xCF,0xD0
	.db 0xD1,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8
	.db 0xD9,0xDA,0xDB,0xDC,0xDD,0xDE,0xDF,0xE0
	.db 0xE1,0xE2,0xE3,0xE4,0xE5,0xE6,0xE7,0xE8
	.db 0xE9,0xEA,0xEB,0xEC,0xED,0xEE,0xEF,0xF0
	.db 0xF1,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF8
	.db 0xF9,0xFA,0xFB,0xFC,0xFD,0xFE,0xFF
	; Tile data
	;; Hook for the graphics routines
_font_ibm_fixed_tiles::	
; Default character (space)
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000

; Character: ? (01)
	.db	0b00011000	;    oo   
	.db	0b00100100	;   o  o  
	.db	0b01000010	;  o    o 
	.db	0b10000001	; o      o
	.db	0b11100111	; ooo  ooo
	.db	0b00100100	;   o  o  
	.db	0b00100100	;   o  o  
	.db	0b00111100	;   oooo  

; Character: ? (02)
	.db	0b00111100	;   oooo  
	.db	0b00100100	;   o  o  
	.db	0b00100100	;   o  o  
	.db	0b11100111	; ooo  ooo
	.db	0b10000001	; o      o
	.db	0b01000010	;  o    o 
	.db	0b00100100	;   o  o  
	.db	0b00011000	;    oo   

; Character: ? (03)
	.db	0b00011000	;    oo   
	.db	0b00010100	;    o o  
	.db	0b11110010	; oooo  o 
	.db	0b10000001	; o      o
	.db	0b10000001	; o      o
	.db	0b11110010	; oooo  o 
	.db	0b00010100	;    o o  
	.db	0b00011000	;    oo   

; Character: ? (04)
	.db	0b00011000	;    oo   
	.db	0b00101000	;   o o   
	.db	0b01001111	;  o  oooo
	.db	0b10000001	; o      o
	.db	0b10000001	; o      o
	.db	0b01001111	;  o  oooo
	.db	0b00101000	;   o o   
	.db	0b00011000	;    oo   

; Character: ? (05)
	.db	0b11111111	; oooooooo
	.db	0b10000001	; o      o
	.db	0b10000001	; o      o
	.db	0b10000001	; o      o
	.db	0b10000001	; o      o
	.db	0b10000001	; o      o
	.db	0b10000001	; o      o
	.db	0b11111111	; oooooooo

; Character: ? (06)
	.db	0b11111000	; ooooo   
	.db	0b10001000	; o   o   
	.db	0b10001111	; o   oooo
	.db	0b10001001	; o   o  o
	.db	0b11111001	; ooooo  o
	.db	0b01000001	;  o     o
	.db	0b01000001	;  o     o
	.db	0b01111111	;  ooooooo

; Character: ? (07)
	.db	0b11111111	; oooooooo
	.db	0b10001001	; o   o  o
	.db	0b10001001	; o   o  o
	.db	0b10001001	; o   o  o
	.db	0b11111001	; ooooo  o
	.db	0b10000001	; o      o
	.db	0b10000001	; o      o
	.db	0b11111111	; oooooooo

; Character: ? (08)
	.db	0b00000001	;        o
	.db	0b00000011	;       oo
	.db	0b00000110	;      oo 
	.db	0b10001100	; o   oo  
	.db	0b11011000	; oo oo   
	.db	0b01110000	;  ooo    
	.db	0b00100000	;   o     
	.db	0b00000000	;         

; Character: ? (09)
	.db	0b01111110	;  oooooo 
	.db	0b11000011	; oo    oo
	.db	0b11010011	; oo o  oo
	.db	0b11010011	; oo o  oo
	.db	0b11011011	; oo oo oo
	.db	0b11000011	; oo    oo
	.db	0b11000011	; oo    oo
	.db	0b01111110	;  oooooo 

; Character: ? (0A)
	.db	0b00011000	;    oo   
	.db	0b00111100	;   oooo  
	.db	0b00101100	;   o oo  
	.db	0b00101100	;   o oo  
	.db	0b01111110	;  oooooo 
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ? (0B)
	.db	0b00010000	;    o    
	.db	0b00011100	;    ooo  
	.db	0b00010010	;    o  o 
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b01110000	;  ooo    
	.db	0b11110000	; oooo    
	.db	0b01100000	;  oo     

; Character: ? (0C)
	.db	0b11110000	; oooo    
	.db	0b11000000	; oo      
	.db	0b11111110	; ooooooo 
	.db	0b11011000	; oo oo   
	.db	0b11011110	; oo oooo 
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ? (0D)
	.db	0b01110000	;  ooo    
	.db	0b11001000	; oo  o   
	.db	0b11011110	; oo oooo 
	.db	0b11011011	; oo oo oo
	.db	0b11011011	; oo oo oo
	.db	0b01111110	;  oooooo 
	.db	0b00011011	;    oo oo
	.db	0b00011011	;    oo oo

; Character: ? (0E)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b11111111	; oooooooo
	.db	0b11111111	; oooooooo
	.db	0b11111111	; oooooooo
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (0F)
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  

; Character: ? (10)
	.db	0b01111100	;  ooooo  
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b00000000	;         
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: ? (11)
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000000	;         
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000000	;         

; Character: ? (12)
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b01111100	;  ooooo  
	.db	0b11000000	; oo      
	.db	0b11000000	; oo      
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: ? (13)
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: ? (14)
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000000	;         

; Character: ? (15)
	.db	0b01111100	;  ooooo  
	.db	0b11000000	; oo      
	.db	0b11000000	; oo      
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: ? (16)
	.db	0b01111100	;  ooooo  
	.db	0b11000000	; oo      
	.db	0b11000000	; oo      
	.db	0b01111100	;  ooooo  
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: ? (17)
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000000	;         
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000000	;         

; Character: ? (18)
	.db	0b01111100	;  ooooo  
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b01111100	;  ooooo  
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: ? (19)
	.db	0b01111100	;  ooooo  
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: ? (1A)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000110	;  o   oo 
	.db	0b00000110	;      oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (1B)
	.db	0b01111000	;  oooo   
	.db	0b01100110	;  oo  oo 
	.db	0b01111101	;  ooooo o
	.db	0b01100100	;  oo  o  
	.db	0b01111110	;  oooooo 
	.db	0b00000011	;       oo
	.db	0b00001011	;     o oo
	.db	0b00000110	;      oo 

; Character: ? (1C)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011111	;    ooooo
	.db	0b00011111	;    ooooo
	.db	0b00011111	;    ooooo
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  

; Character: ? (1D)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b11111100	; oooooo  
	.db	0b11111100	; oooooo  
	.db	0b11111100	; oooooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  

; Character: ? (1E)
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011111	;    ooooo
	.db	0b00011111	;    ooooo
	.db	0b00011111	;    ooooo
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (1F)
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b00011100	;    ooo  
	.db	0b11111100	; oooooo  
	.db	0b11111100	; oooooo  
	.db	0b11111100	; oooooo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character:   (20)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ! (21)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: " (22)
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01000100	;  o   o  
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: # (23)
	.db	0b00000000	;         
	.db	0b00100100	;   o  o  
	.db	0b01111110	;  oooooo 
	.db	0b00100100	;   o  o  
	.db	0b00100100	;   o  o  
	.db	0b01111110	;  oooooo 
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         

; Character: $ (24)
	.db	0b00010100	;    o o  
	.db	0b00111110	;   ooooo 
	.db	0b01010101	;  o o o o
	.db	0b00111100	;   oooo  
	.db	0b00011110	;    oooo 
	.db	0b01010101	;  o o o o
	.db	0b00111110	;   ooooo 
	.db	0b00010100	;    o o  

; Character: % (25)
	.db	0b01100010	;  oo   o 
	.db	0b01100110	;  oo  oo 
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b01100110	;  oo  oo 
	.db	0b01000110	;  o   oo 
	.db	0b00000000	;         

; Character: & (26)
	.db	0b01111000	;  oooo   
	.db	0b11001100	; oo  oo  
	.db	0b01100001	;  oo    o
	.db	0b11001110	; oo  ooo 
	.db	0b11001100	; oo  oo  
	.db	0b11001100	; oo  oo  
	.db	0b01111000	;  oooo   
	.db	0b00000000	;         

; Character: ' (27)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00010000	;    o    
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ( (28)
	.db	0b00000100	;      o  
	.db	0b00001000	;     o   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00001000	;     o   
	.db	0b00000100	;      o  

; Character: ) (29)
	.db	0b00100000	;   o     
	.db	0b00010000	;    o    
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     

; Character: * (2A)
	.db	0b00000000	;         
	.db	0b01010100	;  o o o  
	.db	0b00111000	;   ooo   
	.db	0b11111110	; ooooooo 
	.db	0b00111000	;   ooo   
	.db	0b01010100	;  o o o  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: + (2B)
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b01111110	;  oooooo 
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: , (2C)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00110000	;   oo    
	.db	0b00110000	;   oo    
	.db	0b00100000	;   o     

; Character: - (2D)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: . (2E)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: / (2F)
	.db	0b00000011	;       oo
	.db	0b00000110	;      oo 
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b01100000	;  oo     
	.db	0b11000000	; oo      
	.db	0b00000000	;         

; Character: 0 (30)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01101110	;  oo ooo 
	.db	0b01110110	;  ooo oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: 1 (31)
	.db	0b00011000	;    oo   
	.db	0b00111000	;   ooo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: 2 (32)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b00001110	;     ooo 
	.db	0b00011100	;    ooo  
	.db	0b00111000	;   ooo   
	.db	0b01110000	;  ooo    
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: 3 (33)
	.db	0b01111110	;  oooooo 
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00111100	;   oooo  
	.db	0b00000110	;      oo 
	.db	0b01000110	;  o   oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: 4 (34)
	.db	0b00001100	;     oo  
	.db	0b00011100	;    ooo  
	.db	0b00101100	;   o oo  
	.db	0b01001100	;  o  oo  
	.db	0b01111110	;  oooooo 
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00000000	;         

; Character: 5 (35)
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b01000110	;  o   oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: 6 (36)
	.db	0b00011100	;    ooo  
	.db	0b00100000	;   o     
	.db	0b01100000	;  oo     
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: 7 (37)
	.db	0b01111110	;  oooooo 
	.db	0b00000110	;      oo 
	.db	0b00001110	;     ooo 
	.db	0b00011100	;    ooo  
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: 8 (38)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: 9 (39)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000110	;      oo 
	.db	0b00001100	;     oo  
	.db	0b00111000	;   ooo   
	.db	0b00000000	;         

; Character: : (3A)
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ; (3B)
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00010000	;    o    
	.db	0b00000000	;         

; Character: < (3C)
	.db	0b00000110	;      oo 
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00001100	;     oo  
	.db	0b00000110	;      oo 
	.db	0b00000000	;         

; Character: = (3D)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: > (3E)
	.db	0b01100000	;  oo     
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b01100000	;  oo     
	.db	0b00000000	;         

; Character: ? (3F)
	.db	0b00111100	;   oooo  
	.db	0b01000110	;  o   oo 
	.db	0b00000110	;      oo 
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   

; Character: @ (40)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01101110	;  oo ooo 
	.db	0b01101010	;  oo o o 
	.db	0b01101110	;  oo ooo 
	.db	0b01100000	;  oo     
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: A (41)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: B (42)
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: C (43)
	.db	0b00111100	;   oooo  
	.db	0b01100010	;  oo   o 
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100010	;  oo   o 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: D (44)
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: E (45)
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01111100	;  ooooo  
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: F (46)
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01111100	;  ooooo  
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b00000000	;         

; Character: G (47)
	.db	0b00111100	;   oooo  
	.db	0b01100010	;  oo   o 
	.db	0b01100000	;  oo     
	.db	0b01101110	;  oo ooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: H (48)
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: I (49)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: J (4A)
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b01000110	;  o   oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: K (4B)
	.db	0b01100110	;  oo  oo 
	.db	0b01101100	;  oo oo  
	.db	0b01111000	;  oooo   
	.db	0b01110000	;  ooo    
	.db	0b01111000	;  oooo   
	.db	0b01101100	;  oo oo  
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: L (4C)
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: M (4D)
	.db	0b11111100	; oooooo  
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b00000000	;         

; Character: N (4E)
	.db	0b01100010	;  oo   o 
	.db	0b01110010	;  ooo  o 
	.db	0b01111010	;  oooo o 
	.db	0b01011110	;  o oooo 
	.db	0b01001110	;  o  ooo 
	.db	0b01000110	;  o   oo 
	.db	0b01000010	;  o    o 
	.db	0b00000000	;         

; Character: O (4F)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: P (50)
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b00000000	;         

; Character: Q (51)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000110	;      oo 

; Character: R (52)
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: S (53)
	.db	0b00111100	;   oooo  
	.db	0b01100010	;  oo   o 
	.db	0b01110000	;  ooo    
	.db	0b00111100	;   oooo  
	.db	0b00001110	;     ooo 
	.db	0b01000110	;  o   oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: T (54)
	.db	0b01111110	;  oooooo 
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: U (55)
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: V (56)
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100100	;  oo  o  
	.db	0b01111000	;  oooo   
	.db	0b00000000	;         

; Character: W (57)
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11111100	; oooooo  
	.db	0b00000000	;         

; Character: X (58)
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: Y (59)
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: Z (5A)
	.db	0b01111110	;  oooooo 
	.db	0b00001110	;     ooo 
	.db	0b00011100	;    ooo  
	.db	0b00111000	;   ooo   
	.db	0b01110000	;  ooo    
	.db	0b01100000	;  oo     
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: [ (5B)
	.db	0b00011110	;    oooo 
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011110	;    oooo 
	.db	0b00000000	;         

; Character: \ (5C)
	.db	0b01000000	;  o      
	.db	0b01100000	;  oo     
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00001100	;     oo  
	.db	0b00000110	;      oo 
	.db	0b00000010	;       o 
	.db	0b00000000	;         

; Character: ] (5D)
	.db	0b01111000	;  oooo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b01111000	;  oooo   
	.db	0b00000000	;         

; Character: ^ (5E)
	.db	0b00010000	;    o    
	.db	0b00111000	;   ooo   
	.db	0b01101100	;  oo oo  
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: _ (5F)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: ` (60)
	.db	0b00000000	;         
	.db	0b11000000	; oo      
	.db	0b11000000	; oo      
	.db	0b01100000	;  oo     
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: a (61)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000110	;  o   oo 
	.db	0b00111110	;   ooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: b (62)
	.db	0b01100000	;  oo     
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         

; Character: c (63)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100010	;  oo   o 
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100010	;  oo   o 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: d (64)
	.db	0b00000110	;      oo 
	.db	0b00111110	;   ooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: e (65)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b01100010	;  oo   o 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: f (66)
	.db	0b00011110	;    oooo 
	.db	0b00110000	;   oo    
	.db	0b01111100	;  ooooo  
	.db	0b00110000	;   oo    
	.db	0b00110000	;   oo    
	.db	0b00110000	;   oo    
	.db	0b00110000	;   oo    
	.db	0b00000000	;         

; Character: g (67)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b01000110	;  o   oo 
	.db	0b00111100	;   oooo  

; Character: h (68)
	.db	0b01100000	;  oo     
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: i (69)
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: j (6A)
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b01011000	;  o oo   
	.db	0b00110000	;   oo    

; Character: k (6B)
	.db	0b01100000	;  oo     
	.db	0b01100100	;  oo  o  
	.db	0b01101000	;  oo o   
	.db	0b01110000	;  ooo    
	.db	0b01111000	;  oooo   
	.db	0b01101100	;  oo oo  
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: l (6C)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00001100	;     oo  
	.db	0b00000000	;         

; Character: m (6D)
	.db	0b00000000	;         
	.db	0b11111100	; oooooo  
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11000110	; oo   oo 
	.db	0b00000000	;         

; Character: n (6E)
	.db	0b00000000	;         
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: o (6F)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: p (70)
	.db	0b00000000	;         
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     

; Character: q (71)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000110	;      oo 

; Character: r (72)
	.db	0b00000000	;         
	.db	0b01101100	;  oo oo  
	.db	0b01110000	;  ooo    
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b00000000	;         

; Character: s (73)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01110010	;  ooo  o 
	.db	0b00111000	;   ooo   
	.db	0b00011100	;    ooo  
	.db	0b01001110	;  o  ooo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: t (74)
	.db	0b00011000	;    oo   
	.db	0b00111100	;   oooo  
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00001100	;     oo  
	.db	0b00000000	;         

; Character: u (75)
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: v (76)
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100100	;  oo  o  
	.db	0b01111000	;  oooo   
	.db	0b00000000	;         

; Character: w (77)
	.db	0b00000000	;         
	.db	0b11000110	; oo   oo 
	.db	0b11000110	; oo   oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11111100	; oooooo  
	.db	0b00000000	;         

; Character: x (78)
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: y (79)
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00100110	;   o  oo 
	.db	0b00011110	;    oooo 
	.db	0b01000110	;  o   oo 
	.db	0b00111100	;   oooo  

; Character: z (7A)
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00001110	;     ooo 
	.db	0b00011100	;    ooo  
	.db	0b00111000	;   ooo   
	.db	0b01110000	;  ooo    
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: { (7B)
	.db	0b00001110	;     ooo 
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00001110	;     ooo 
	.db	0b00000000	;         

; Character: | (7C)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   

; Character: } (7D)
	.db	0b01110000	;  ooo    
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b01110000	;  ooo    
	.db	0b00000000	;         

; Character: ~ (7E)
	.db	0b00000000	;         
	.db	0b01100000	;  oo     
	.db	0b11110010	; oooo  o 
	.db	0b10011110	; o  oooo 
	.db	0b00001100	;     oo  
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (7F)
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00101000	;   o o   
	.db	0b00101000	;   o o   
	.db	0b01000100	;  o   o  
	.db	0b01000100	;  o   o  
	.db	0b10000010	; o     o 
	.db	0b11111110	; ooooooo 

; Character: ? (80)
	.db	0b00111100	;   oooo  
	.db	0b01100010	;  oo   o 
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100010	;  oo   o 
	.db	0b00011100	;    ooo  
	.db	0b00110000	;   oo    

; Character: ? (81)
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (82)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (83)
	.db	0b00011000	;    oo   
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00000110	;      oo 
	.db	0b01111110	;  oooooo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (84)
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000110	;  o   oo 
	.db	0b00111110	;   ooooo 
	.db	0b01000110	;  o   oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (85)
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00000110	;      oo 
	.db	0b01111110	;  oooooo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (86)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00000110	;      oo 
	.db	0b01111110	;  oooooo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (87)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100010	;  oo   o 
	.db	0b01100000	;  oo     
	.db	0b01100010	;  oo   o 
	.db	0b00111100	;   oooo  
	.db	0b00001000	;     o   
	.db	0b00011000	;    oo   

; Character: ? (88)
	.db	0b00011000	;    oo   
	.db	0b00110100	;   oo o  
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (89)
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (8A)
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (8B)
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ? (8C)
	.db	0b00011000	;    oo   
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ? (8D)
	.db	0b00010000	;    o    
	.db	0b00001000	;     o   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ? (8E)
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: ? (8F)
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: ? (90)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b01111100	;  ooooo  
	.db	0b01100000	;  oo     
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: ? (91)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00011011	;    oo oo
	.db	0b01111111	;  ooooooo
	.db	0b11011000	; oo oo   
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: ? (92)
	.db	0b00111111	;   oooooo
	.db	0b01111000	;  oooo   
	.db	0b11011000	; oo oo   
	.db	0b11011110	; oo oooo 
	.db	0b11111000	; ooooo   
	.db	0b11011000	; oo oo   
	.db	0b11011111	; oo ooooo
	.db	0b00000000	;         

; Character: ? (93)
	.db	0b00011000	;    oo   
	.db	0b00110100	;   oo o  
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (94)
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (95)
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (96)
	.db	0b00011000	;    oo   
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (97)
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (98)
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b01000110	;  o   oo 
	.db	0b00111100	;   oooo  

; Character: ? (99)
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (9A)
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (9B)
	.db	0b00011000	;    oo   
	.db	0b00111100	;   oooo  
	.db	0b01100010	;  oo   o 
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100010	;  oo   o 
	.db	0b00111100	;   oooo  
	.db	0b00011000	;    oo   

; Character: ? (9C)
	.db	0b00011100	;    ooo  
	.db	0b00111010	;   ooo o 
	.db	0b00110000	;   oo    
	.db	0b01111100	;  ooooo  
	.db	0b00110000	;   oo    
	.db	0b00110000	;   oo    
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: ? (9D)
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00011000	;    oo   
	.db	0b00111100	;   oooo  
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ? (9E)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01101100	;  oo oo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b11101100	; ooo oo  
	.db	0b00000000	;         

; Character: ? (9F)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   

; Character: ? (A0)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00000110	;      oo 
	.db	0b01111110	;  oooooo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (A1)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ? (A2)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (A3)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (A4)
	.db	0b00110100	;   oo o  
	.db	0b01011000	;  o oo   
	.db	0b00000000	;         
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: ? (A5)
	.db	0b00011010	;    oo o 
	.db	0b00101100	;   o oo  
	.db	0b01100010	;  oo   o 
	.db	0b01110010	;  ooo  o 
	.db	0b01011010	;  o oo o 
	.db	0b01001110	;  o  ooo 
	.db	0b01000110	;  o   oo 
	.db	0b00000000	;         

; Character: ? (A6)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000110	;  o   oo 
	.db	0b00111110	;   ooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 

; Character: ? (A7)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 

; Character: ? (A8)
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b01100000	;  oo     
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  

; Character: ? (A9)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00110000	;   oo    
	.db	0b00110000	;   oo    
	.db	0b00110000	;   oo    
	.db	0b00000000	;         

; Character: ? (AA)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b01111100	;  ooooo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00000000	;         

; Character: ? (AB)
	.db	0b01100010	;  oo   o 
	.db	0b11100100	; ooo  o  
	.db	0b01101000	;  oo o   
	.db	0b01110110	;  ooo oo 
	.db	0b00101011	;   o o oo
	.db	0b01000011	;  o    oo
	.db	0b10000110	; o    oo 
	.db	0b00001111	;     oooo

; Character: ? (AC)
	.db	0b01100010	;  oo   o 
	.db	0b11100100	; ooo  o  
	.db	0b01101000	;  oo o   
	.db	0b01110110	;  ooo oo 
	.db	0b00101110	;   o ooo 
	.db	0b01010110	;  o o oo 
	.db	0b10011111	; o  ooooo
	.db	0b00000110	;      oo 

; Character: ? (AD)
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   

; Character: ? (AE)
	.db	0b00011011	;    oo oo
	.db	0b00110110	;   oo oo 
	.db	0b01101100	;  oo oo  
	.db	0b11011000	; oo oo   
	.db	0b01101100	;  oo oo  
	.db	0b00110110	;   oo oo 
	.db	0b00011011	;    oo oo
	.db	0b00000000	;         

; Character: ? (AF)
	.db	0b11011000	; oo oo   
	.db	0b01101100	;  oo oo  
	.db	0b00110110	;   oo oo 
	.db	0b00011011	;    oo oo
	.db	0b00110110	;   oo oo 
	.db	0b01101100	;  oo oo  
	.db	0b11011000	; oo oo   
	.db	0b00000000	;         

; Character: ? (B0)
	.db	0b00110100	;   oo o  
	.db	0b01011000	;  o oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00000110	;      oo 
	.db	0b01111110	;  oooooo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (B1)
	.db	0b00110100	;   oo o  
	.db	0b01011000	;  o oo   
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (B2)
	.db	0b00000010	;       o 
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01101110	;  oo ooo 
	.db	0b01110110	;  ooo oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b01000000	;  o      

; Character: ? (B3)
	.db	0b00000000	;         
	.db	0b00000010	;       o 
	.db	0b00111100	;   oooo  
	.db	0b01101110	;  oo ooo 
	.db	0b01110110	;  ooo oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b01000000	;  o      

; Character: ? (B4)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b11011011	; oo oo oo
	.db	0b11011110	; oo oooo 
	.db	0b11011000	; oo oo   
	.db	0b01111111	;  ooooooo
	.db	0b00000000	;         

; Character: ? (B5)
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b11011000	; oo oo   
	.db	0b11011000	; oo oo   
	.db	0b11111100	; oooooo  
	.db	0b11011000	; oo oo   
	.db	0b11011000	; oo oo   
	.db	0b11011110	; oo oooo 

; Character: ? (B6)
	.db	0b00100000	;   o     
	.db	0b00010000	;    o    
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 

; Character: ? (B7)
	.db	0b00110100	;   oo o  
	.db	0b01011000	;  o oo   
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 

; Character: ? (B8)
	.db	0b00110100	;   oo o  
	.db	0b01011000	;  o oo   
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  

; Character: ? (B9)
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (BA)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (BB)
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00111000	;   ooo   
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (BC)
	.db	0b01111010	;  oooo o 
	.db	0b11001010	; oo  o o 
	.db	0b11001010	; oo  o o 
	.db	0b11001010	; oo  o o 
	.db	0b01111010	;  oooo o 
	.db	0b00001010	;     o o 
	.db	0b00001010	;     o o 
	.db	0b00001010	;     o o 

; Character: ? (BD)
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b10011001	; o  oo  o
	.db	0b10110101	; o oo o o
	.db	0b10110001	; o oo   o
	.db	0b10011101	; o  ooo o
	.db	0b01000010	;  o    o 
	.db	0b00111100	;   oooo  

; Character: ? (BE)
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b10111001	; o ooo  o
	.db	0b10110101	; o oo o o
	.db	0b10111001	; o ooo  o
	.db	0b10110101	; o oo o o
	.db	0b01000010	;  o    o 
	.db	0b00111100	;   oooo  

; Character: ? (BF)
	.db	0b11110001	; oooo   o
	.db	0b01011011	;  o oo oo
	.db	0b01010101	;  o o o o
	.db	0b01010001	;  o o   o
	.db	0b01010001	;  o o   o
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (C0)
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b11100110	; ooo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b11110110	; oooo oo 
	.db	0b00000110	;      oo 
	.db	0b00011100	;    ooo  

; Character: ? (C1)
	.db	0b11110110	; oooo oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b11110110	; oooo oo 
	.db	0b00000110	;      oo 
	.db	0b00011100	;    ooo  

; Character: ? (C2)
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01110110	;  ooo oo 
	.db	0b00111100	;   oooo  
	.db	0b01101110	;  oo ooo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (C3)
	.db	0b00000000	;         
	.db	0b01111100	;  ooooo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (C4)
	.db	0b00000000	;         
	.db	0b00011110	;    oooo 
	.db	0b00000110	;      oo 
	.db	0b00001110	;     ooo 
	.db	0b00011110	;    oooo 
	.db	0b00110110	;   oo oo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (C5)
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (C6)
	.db	0b00000000	;         
	.db	0b01111100	;  ooooo  
	.db	0b00000110	;      oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (C7)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (C8)
	.db	0b00000000	;         
	.db	0b00011110	;    oooo 
	.db	0b00001100	;     oo  
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (C9)
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (CA)
	.db	0b01100000	;  oo     
	.db	0b01101110	;  oo ooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (CB)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (CC)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (CD)
	.db	0b01100000	;  oo     
	.db	0b01111110	;  oooooo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00001110	;     ooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (CE)
	.db	0b00000000	;         
	.db	0b01101100	;  oo oo  
	.db	0b00111110	;   ooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01101110	;  oo ooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (CF)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (D0)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00011100	;    ooo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (D1)
	.db	0b00000000	;         
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (D2)
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01110110	;  ooo oo 
	.db	0b00000110	;      oo 
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (D3)
	.db	0b00000000	;         
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00001110	;     ooo 
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (D4)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00000110	;      oo 
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00110100	;   oo o  
	.db	0b00110000	;   oo    
	.db	0b00000000	;         

; Character: ? (D5)
	.db	0b00000000	;         
	.db	0b01111000	;  oooo   
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (D6)
	.db	0b00000000	;         
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11111110	; ooooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (D7)
	.db	0b00000000	;         
	.db	0b01111100	;  ooooo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b11101100	; ooo oo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (D8)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00000000	;         

; Character: ? (D9)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000000	;         

; Character: ? (DA)
	.db	0b00000000	;         
	.db	0b11111110	; ooooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (DB)
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01110110	;  ooo oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000110	;      oo 
	.db	0b00000000	;         

; Character: ? (DC)
	.db	0b00000000	;         
	.db	0b00110110	;   oo oo 
	.db	0b00110110	;   oo oo 
	.db	0b00011100	;    ooo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00001100	;     oo  
	.db	0b00000000	;         

; Character: ? (DD)
	.db	0b00011100	;    ooo  
	.db	0b00110010	;   oo  o 
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b01001100	;  o  oo  
	.db	0b00111000	;   ooo   

; Character: ? (DE)
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00111000	;   ooo   
	.db	0b01101100	;  oo oo  
	.db	0b11000110	; oo   oo 
	.db	0b10000010	; o     o 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (DF)
	.db	0b01100110	;  oo  oo 
	.db	0b11110111	; oooo ooo
	.db	0b10011001	; o  oo  o
	.db	0b10011001	; o  oo  o
	.db	0b11101111	; ooo oooo
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (E0)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b01110110	;  ooo oo 
	.db	0b11011100	; oo ooo  
	.db	0b11001000	; oo  o   
	.db	0b11011100	; oo ooo  
	.db	0b01110110	;  ooo oo 
	.db	0b00000000	;         

; Character: ? (E1)
	.db	0b00011100	;    ooo  
	.db	0b00110110	;   oo oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01111100	;  ooooo  
	.db	0b01100000	;  oo     

; Character: ? (E2)
	.db	0b00000000	;         
	.db	0b11111110	; ooooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100010	;  oo   o 
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b01100000	;  oo     
	.db	0b11111000	; ooooo   

; Character: ? (E3)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b11111110	; ooooooo 
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01001000	;  o  o   

; Character: ? (E4)
	.db	0b11111110	; ooooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b01100110	;  oo  oo 
	.db	0b11111110	; ooooooo 
	.db	0b00000000	;         

; Character: ? (E5)
	.db	0b00000000	;         
	.db	0b00011110	;    oooo 
	.db	0b00111000	;   ooo   
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b00111000	;   ooo   
	.db	0b00000000	;         

; Character: ? (E6)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01111111	;  ooooooo
	.db	0b11000000	; oo      

; Character: ? (E7)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00010000	;    o    

; Character: ? (E8)
	.db	0b00111100	;   oooo  
	.db	0b00011000	;    oo   
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00011000	;    oo   
	.db	0b00111100	;   oooo  

; Character: ? (E9)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01111110	;  oooooo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: ? (EA)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00100100	;   o  o  
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: ? (EB)
	.db	0b00011100	;    ooo  
	.db	0b00110110	;   oo oo 
	.db	0b01111000	;  oooo   
	.db	0b11011100	; oo ooo  
	.db	0b11001100	; oo  oo  
	.db	0b11101100	; ooo oo  
	.db	0b01111000	;  oooo   
	.db	0b00000000	;         

; Character: ? (EC)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00111000	;   ooo   
	.db	0b01010100	;  o o o  
	.db	0b01010100	;  o o o  
	.db	0b00111000	;   ooo   
	.db	0b00110000	;   oo    
	.db	0b01100000	;  oo     

; Character: ? (ED)
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b01111100	;  ooooo  
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b11010110	; oo o oo 
	.db	0b01111100	;  ooooo  
	.db	0b00010000	;    o    

; Character: ? (EE)
	.db	0b00111110	;   ooooo 
	.db	0b01110000	;  ooo    
	.db	0b01100000	;  oo     
	.db	0b01111110	;  oooooo 
	.db	0b01100000	;  oo     
	.db	0b01110000	;  ooo    
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         

; Character: ? (EF)
	.db	0b00111100	;   oooo  
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b01100110	;  oo  oo 
	.db	0b00000000	;         

; Character: ? (F0)
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (F1)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b01111110	;  oooooo 
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: ? (F2)
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: ? (F3)
	.db	0b00001100	;     oo  
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b00011000	;    oo   
	.db	0b00001100	;     oo  
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         

; Character: ? (F4)
	.db	0b00000000	;         
	.db	0b00001110	;     ooo 
	.db	0b00011011	;    oo oo
	.db	0b00011011	;    oo oo
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   

; Character: ? (F5)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b11011000	; oo oo   
	.db	0b11011000	; oo oo   
	.db	0b01110000	;  ooo    
	.db	0b00000000	;         

; Character: ? (F6)
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         

; Character: ? (F7)
	.db	0b00000000	;         
	.db	0b00110010	;   oo  o 
	.db	0b01001100	;  o  oo  
	.db	0b00000000	;         
	.db	0b00110010	;   oo  o 
	.db	0b01001100	;  o  oo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (F8)
	.db	0b00111000	;   ooo   
	.db	0b01101100	;  oo oo  
	.db	0b00111000	;   ooo   
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (F9)
	.db	0b00111000	;   ooo   
	.db	0b01111100	;  ooooo  
	.db	0b00111000	;   ooo   
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (FA)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00011000	;    oo   
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (FB)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00001111	;     oooo
	.db	0b00011000	;    oo   
	.db	0b11011000	; oo oo   
	.db	0b01110000	;  ooo    
	.db	0b00110000	;   oo    
	.db	0b00000000	;         

; Character: ? (FC)
	.db	0b00111000	;   ooo   
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b01101100	;  oo oo  
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (FD)
	.db	0b00111000	;   ooo   
	.db	0b01101100	;  oo oo  
	.db	0b00011000	;    oo   
	.db	0b00110000	;   oo    
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (FE)
	.db	0b01111000	;  oooo   
	.db	0b00001100	;     oo  
	.db	0b00111000	;   ooo   
	.db	0b00001100	;     oo  
	.db	0b01111000	;  oooo   
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ? (FF)
	.db	0b00000000	;         
	.db	0b11111110	; ooooooo 
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

