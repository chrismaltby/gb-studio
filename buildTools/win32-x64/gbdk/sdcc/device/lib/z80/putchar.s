	.area _CODE
_putchar::       
_putchar_rr_s:: 
        ld      hl,#2
        add     hl,sp
        
        ld      l,(hl)
        ld      a,#1
        rst     0x08
        
        ret
           
_putchar_rr_dbs::
        ld      l,e
	ld	a,#1
        rst     0x08

        ret
			
