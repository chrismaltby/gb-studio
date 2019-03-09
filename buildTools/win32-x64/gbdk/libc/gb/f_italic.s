; font: italic
	;; BANKED:	checked,imperfect
	.area	_BASE
_font_italic::
	.db	1+4	; 128 char encoding, compressed
	.db	93	; Number of tiles

; Encoding table

	.db 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
	.db 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
	.db 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
	.db 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
	.db 0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07
	.db 0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F
	.db 0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17
	.db 0x18,0x19,0x1A,0x1B,0x1C,0x1D,0x1E,0x1F
	.db 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27
	.db 0x28,0x29,0x2A,0x2B,0x2C,0x2D,0x2E,0x2F
	.db 0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37
	.db 0x38,0x39,0x3A,0x3B,0x3C,0x3D,0x3E,0x00
	.db 0x00,0x3F,0x40,0x41,0x42,0x43,0x44,0x45
	.db 0x46,0x47,0x48,0x49,0x4A,0x4B,0x4C,0x4D
	.db 0x4E,0x4F,0x50,0x51,0x52,0x53,0x54,0x55
	.db 0x56,0x57,0x58,0x59,0x5A,0x5B,0x5C,0x00
; Tile data
; Default character (space)
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000
	.db	0b00000000

; Character: ! (21)
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00000000	;         
	.db	0b00100000	;   o     

; Character: " (22)
	.db	0b00000000	;         
	.db	0b00100100	;   o  o  
	.db	0b00100100	;   o  o  
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
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00111110	;   ooooo 
	.db	0b00101000	;   o o   
	.db	0b00111110	;   ooooo 
	.db	0b00001010	;     o o 
	.db	0b00111110	;   ooooo 
	.db	0b00001000	;     o   

; Character: % (25)
	.db	0b00000000	;         
	.db	0b01100010	;  oo   o 
	.db	0b01100100	;  oo  o  
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00100110	;   o  oo 
	.db	0b01000110	;  o   oo 
	.db	0b00000000	;         

; Character: & (26)
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00101000	;   o o   
	.db	0b00010000	;    o    
	.db	0b00101010	;   o o o 
	.db	0b01000100	;  o   o  
	.db	0b00111010	;   ooo o 
	.db	0b00000000	;         

; Character: ' (27)
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: ( (28)
	.db	0b00000000	;         
	.db	0b00000100	;      o  
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00000100	;      o  
	.db	0b00000000	;         

; Character: ) (29)
	.db	0b00000000	;         
	.db	0b00100000	;   o     
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00000000	;         

; Character: * (2A)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00100100	;   o  o  
	.db	0b00011000	;    oo   
	.db	0b01111110	;  oooooo 
	.db	0b00011000	;    oo   
	.db	0b00100100	;   o  o  
	.db	0b00000000	;         

; Character: + (2B)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00111110	;   ooooo 
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00000000	;         

; Character: , (2C)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    

; Character: - (2D)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
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
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000010	;       o 
	.db	0b00000100	;      o  
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00000000	;         

; Character: 0 (30)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100110	;   o  oo 
	.db	0b01001010	;  o  o o 
	.db	0b01010100	;  o o o  
	.db	0b10100100	; o o  o  
	.db	0b11001000	; oo  o   
	.db	0b01110000	;  ooo    

; Character: 1 (31)
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00101000	;   o o   
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     
	.db	0b11111000	; ooooo   

; Character: 2 (32)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b00000100	;      o  
	.db	0b00011000	;    oo   
	.db	0b01100000	;  oo     
	.db	0b10000000	; o       
	.db	0b11111100	; oooooo  

; Character: 3 (33)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b00000010	;       o 
	.db	0b00001100	;     oo  
	.db	0b00000010	;       o 
	.db	0b10000100	; o    o  
	.db	0b01111000	;  oooo   

; Character: 4 (34)
	.db	0b00000000	;         
	.db	0b00001100	;     oo  
	.db	0b00110100	;   oo o  
	.db	0b01000100	;  o   o  
	.db	0b10001000	; o   o   
	.db	0b11111110	; ooooooo 
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    

; Character: 5 (35)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00100000	;   o     
	.db	0b01000000	;  o      
	.db	0b01111000	;  oooo   
	.db	0b00000100	;      o  
	.db	0b10000100	; o    o  
	.db	0b01111000	;  oooo   

; Character: 6 (36)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100010	;   o   o 
	.db	0b01000000	;  o      
	.db	0b01111000	;  oooo   
	.db	0b10000100	; o    o  
	.db	0b10000100	; o    o  
	.db	0b01111000	;  oooo   

; Character: 7 (37)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00000010	;       o 
	.db	0b00000100	;      o  
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     

; Character: 8 (38)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b10000100	; o    o  
	.db	0b10000100	; o    o  
	.db	0b01111000	;  oooo   

; Character: 9 (39)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b01000010	;  o    o 
	.db	0b00111100	;   oooo  
	.db	0b00000100	;      o  
	.db	0b00001000	;     o   
	.db	0b11110000	; oooo    

; Character: : (3A)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00000000	;         

; Character: ; (3B)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     

; Character: < (3C)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000100	;      o  
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00001000	;     o   
	.db	0b00000100	;      o  
	.db	0b00000000	;         

; Character: = (3D)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00000000	;         
	.db	0b01111100	;  ooooo  
	.db	0b00000000	;         
	.db	0b00000000	;         

; Character: > (3E)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00001000	;     o   
	.db	0b00000100	;      o  
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00000000	;         

; Character: ? (3F)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b00000010	;       o 
	.db	0b00001100	;     oo  
	.db	0b00010000	;    o    
	.db	0b00000000	;         
	.db	0b00110000	;   oo    

; Character: @ (40)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b01001010	;  o  o o 
	.db	0b01010110	;  o o oo 
	.db	0b01011110	;  o oooo 
	.db	0b01000000	;  o      
	.db	0b00111100	;   oooo  
	.db	0b00000000	;         

; Character: A (41)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b01111100	;  ooooo  
	.db	0b01000100	;  o   o  
	.db	0b10001000	; o   o   
	.db	0b10001000	; o   o   

; Character: B (42)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00100010	;   o   o 
	.db	0b00111100	;   oooo  
	.db	0b01000010	;  o    o 
	.db	0b01000010	;  o    o 
	.db	0b10000100	; o    o  
	.db	0b11111000	; ooooo   

; Character: C (43)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100010	;   o   o 
	.db	0b01000000	;  o      
	.db	0b01000000	;  o      
	.db	0b10000000	; o       
	.db	0b10000100	; o    o  
	.db	0b01111000	;  oooo   

; Character: D (44)
	.db	0b00000000	;         
	.db	0b00111000	;   ooo   
	.db	0b00100100	;   o  o  
	.db	0b00100010	;   o   o 
	.db	0b01000010	;  o    o 
	.db	0b01000100	;  o   o  
	.db	0b10001000	; o   o   
	.db	0b11110000	; oooo    

; Character: E (45)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00100000	;   o     
	.db	0b01000000	;  o      
	.db	0b01111000	;  oooo   
	.db	0b01000000	;  o      
	.db	0b10000000	; o       
	.db	0b11111000	; ooooo   

; Character: F (46)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00100000	;   o     
	.db	0b01000000	;  o      
	.db	0b01111000	;  oooo   
	.db	0b01000000	;  o      
	.db	0b10000000	; o       
	.db	0b10000000	; o       

; Character: G (47)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100010	;   o   o 
	.db	0b01000000	;  o      
	.db	0b01000000	;  o      
	.db	0b10001110	; o   ooo 
	.db	0b10000100	; o    o  
	.db	0b01111000	;  oooo   

; Character: H (48)
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01111100	;  ooooo  
	.db	0b01000100	;  o   o  
	.db	0b10001000	; o   o   
	.db	0b10001000	; o   o   

; Character: I (49)
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     
	.db	0b11111000	; ooooo   

; Character: J (4A)
	.db	0b00000000	;         
	.db	0b00000010	;       o 
	.db	0b00000010	;       o 
	.db	0b00000100	;      o  
	.db	0b00000100	;      o  
	.db	0b10001000	; o   o   
	.db	0b10001000	; o   o   
	.db	0b01110000	;  ooo    

; Character: K (4B)
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00100100	;   o  o  
	.db	0b01001000	;  o  o   
	.db	0b01110000	;  ooo    
	.db	0b01001000	;  o  o   
	.db	0b10001000	; o   o   
	.db	0b10000100	; o    o  

; Character: L (4C)
	.db	0b00000000	;         
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     
	.db	0b01000000	;  o      
	.db	0b01000000	;  o      
	.db	0b01000000	;  o      
	.db	0b10000000	; o       
	.db	0b11111100	; oooooo  

; Character: M (4D)
	.db	0b00000000	;         
	.db	0b00110110	;   oo oo 
	.db	0b00101010	;   o o o 
	.db	0b01010100	;  o o o  
	.db	0b01010100	;  o o o  
	.db	0b01000100	;  o   o  
	.db	0b10001000	; o   o   
	.db	0b10001000	; o   o   

; Character: N (4E)
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00110010	;   oo  o 
	.db	0b01010100	;  o o o  
	.db	0b01010100	;  o o o  
	.db	0b01010100	;  o o o  
	.db	0b10011000	; o  oo   
	.db	0b10001000	; o   o   

; Character: O (4F)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100010	;   o   o 
	.db	0b01000010	;  o    o 
	.db	0b01000100	;  o   o  
	.db	0b10000100	; o    o  
	.db	0b10001000	; o   o   
	.db	0b01110000	;  ooo    

; Character: P (50)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00100010	;   o   o 
	.db	0b01000010	;  o    o 
	.db	0b01111100	;  ooooo  
	.db	0b01000000	;  o      
	.db	0b10000000	; o       
	.db	0b10000000	; o       

; Character: Q (51)
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100010	;   o   o 
	.db	0b01000010	;  o    o 
	.db	0b01000100	;  o   o  
	.db	0b10010100	; o  o o  
	.db	0b10001000	; o   o   
	.db	0b01110100	;  ooo o  

; Character: R (52)
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00100010	;   o   o 
	.db	0b01000010	;  o    o 
	.db	0b01111100	;  ooooo  
	.db	0b01001000	;  o  o   
	.db	0b10000100	; o    o  
	.db	0b10000100	; o    o  

; Character: S (53)
	.db	0b00000000	;         
	.db	0b00011110	;    oooo 
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     
	.db	0b00011000	;    oo   
	.db	0b00000100	;      o  
	.db	0b10000100	; o    o  
	.db	0b01111000	;  oooo   

; Character: T (54)
	.db	0b00000000	;         
	.db	0b11111110	; ooooooo 
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     
	.db	0b01000000	;  o      
	.db	0b01000000	;  o      

; Character: U (55)
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01000100	;  o   o  
	.db	0b10001000	; o   o   
	.db	0b10001000	; o   o   
	.db	0b01110000	;  ooo    

; Character: V (56)
	.db	0b00000000	;         
	.db	0b01000010	;  o    o 
	.db	0b01000010	;  o    o 
	.db	0b01000100	;  o   o  
	.db	0b01000100	;  o   o  
	.db	0b10001000	; o   o   
	.db	0b10010000	; o  o    
	.db	0b11100000	; ooo     

; Character: W (57)
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01010100	;  o o o  
	.db	0b10101000	; o o o   
	.db	0b10101000	; o o o   
	.db	0b01010000	;  o o    

; Character: X (58)
	.db	0b00000000	;         
	.db	0b01000010	;  o    o 
	.db	0b00100100	;   o  o  
	.db	0b00101000	;   o o   
	.db	0b00010000	;    o    
	.db	0b00101000	;   o o   
	.db	0b01001000	;  o  o   
	.db	0b10000100	; o    o  

; Character: Y (59)
	.db	0b00000000	;         
	.db	0b01000010	;  o    o 
	.db	0b00100100	;   o  o  
	.db	0b00101000	;   o o   
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     

; Character: Z (5A)
	.db	0b00000000	;         
	.db	0b01111110	;  oooooo 
	.db	0b00000100	;      o  
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b01000000	;  o      
	.db	0b11111100	; oooooo  

; Character: [ (5B)
	.db	0b00000000	;         
	.db	0b00001110	;     ooo 
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001110	;     ooo 
	.db	0b00000000	;         

; Character: \ (5C)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b01000000	;  o      
	.db	0b00100000	;   o     
	.db	0b00010000	;    o    
	.db	0b00001000	;     o   
	.db	0b00000100	;      o  
	.db	0b00000000	;         

; Character: ] (5D)
	.db	0b00000000	;         
	.db	0b01110000	;  ooo    
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b01110000	;  ooo    
	.db	0b00000000	;         

; Character: ^ (5E)
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00111000	;   ooo   
	.db	0b01010100	;  o o o  
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00000000	;         

; Character: a (61)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00000010	;       o 
	.db	0b00111110	;   ooooo 
	.db	0b01000100	;  o   o  
	.db	0b00111100	;   oooo  

; Character: b (62)
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00111100	;   oooo  
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01111000	;  oooo   

; Character: c (63)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011110	;    oooo 
	.db	0b00100000	;   o     
	.db	0b01000000	;  o      
	.db	0b01000000	;  o      
	.db	0b00111100	;   oooo  

; Character: d (64)
	.db	0b00000000	;         
	.db	0b00000010	;       o 
	.db	0b00000010	;       o 
	.db	0b00000100	;      o  
	.db	0b00111100	;   oooo  
	.db	0b01000100	;  o   o  
	.db	0b01001000	;  o  o   
	.db	0b00111000	;   ooo   

; Character: e (65)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100010	;   o   o 
	.db	0b01111100	;  ooooo  
	.db	0b01000000	;  o      
	.db	0b00111000	;   ooo   

; Character: f (66)
	.db	0b00000000	;         
	.db	0b00001110	;     ooo 
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00111000	;   ooo   
	.db	0b00100000	;   o     
	.db	0b01000000	;  o      
	.db	0b01000000	;  o      

; Character: g (67)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011110	;    oooo 
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b00111100	;   oooo  
	.db	0b00000100	;      o  
	.db	0b01111000	;  oooo   

; Character: h (68)
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00111100	;   oooo  
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01000100	;  o   o  

; Character: i (69)
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00000000	;         
	.db	0b00011000	;    oo   
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b01110000	;  ooo    

; Character: j (6A)
	.db	0b00000000	;         
	.db	0b00000100	;      o  
	.db	0b00000000	;         
	.db	0b00000100	;      o  
	.db	0b00000100	;      o  
	.db	0b01001000	;  o  o   
	.db	0b01001000	;  o  o   
	.db	0b00110000	;   oo    

; Character: k (6B)
	.db	0b00000000	;         
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00100100	;   o  o  
	.db	0b00111000	;   ooo   
	.db	0b01000100	;  o   o  
	.db	0b01000100	;  o   o  

; Character: l (6C)
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     
	.db	0b00011000	;    oo   

; Character: m (6D)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00110100	;   oo o  
	.db	0b00101010	;   o o o 
	.db	0b00101010	;   o o o 
	.db	0b01010100	;  o o o  
	.db	0b01010100	;  o o o  

; Character: n (6E)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00111100	;   oooo  
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01000100	;  o   o  

; Character: o (6F)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01000100	;  o   o  
	.db	0b00111000	;   ooo   

; Character: p (70)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011100	;    ooo  
	.db	0b00010010	;    o  o 
	.db	0b00100010	;   o   o 
	.db	0b00111100	;   oooo  
	.db	0b01000000	;  o      
	.db	0b01000000	;  o      

; Character: q (71)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011110	;    oooo 
	.db	0b00100010	;   o   o 
	.db	0b00100100	;   o  o  
	.db	0b00011100	;    ooo  
	.db	0b00001000	;     o   
	.db	0b00001100	;     oo  

; Character: r (72)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00001110	;     ooo 
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     
	.db	0b00100000	;   o     

; Character: s (73)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00011110	;    oooo 
	.db	0b00100000	;   o     
	.db	0b00011000	;    oo   
	.db	0b00000100	;      o  
	.db	0b01111000	;  oooo   

; Character: t (74)
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00011100	;    ooo  
	.db	0b00001000	;     o   
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b00100000	;   o     

; Character: u (75)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01000100	;  o   o  
	.db	0b00111000	;   ooo   

; Character: v (76)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b01000100	;  o   o  
	.db	0b01001000	;  o  o   
	.db	0b00110000	;   oo    

; Character: w (77)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00101010	;   o o o 
	.db	0b01010100	;  o o o  
	.db	0b01010100	;  o o o  
	.db	0b00101000	;   o o   

; Character: x (78)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00100100	;   o  o  
	.db	0b00101000	;   o o   
	.db	0b00011000	;    oo   
	.db	0b00100100	;   o  o  
	.db	0b01000100	;  o   o  

; Character: y (79)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00100010	;   o   o 
	.db	0b00100010	;   o   o 
	.db	0b00011100	;    ooo  
	.db	0b00000100	;      o  
	.db	0b01111000	;  oooo   

; Character: z (7A)
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00111110	;   ooooo 
	.db	0b00000100	;      o  
	.db	0b00011000	;    oo   
	.db	0b00100000	;   o     
	.db	0b01111100	;  ooooo  

; Character: { (7B)
	.db	0b00000000	;         
	.db	0b00001110	;     ooo 
	.db	0b00001000	;     o   
	.db	0b00110000	;   oo    
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001110	;     ooo 
	.db	0b00000000	;         

; Character: | (7C)
	.db	0b00000000	;         
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00001000	;     o   
	.db	0b00000000	;         

; Character: } (7D)
	.db	0b00000000	;         
	.db	0b01110000	;  ooo    
	.db	0b00010000	;    o    
	.db	0b00001100	;     oo  
	.db	0b00010000	;    o    
	.db	0b00010000	;    o    
	.db	0b01110000	;  ooo    
	.db	0b00000000	;         

; Character: ~ (7E)
	.db	0b00000000	;         
	.db	0b00010100	;    o o  
	.db	0b00101000	;   o o   
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         
	.db	0b00000000	;         

