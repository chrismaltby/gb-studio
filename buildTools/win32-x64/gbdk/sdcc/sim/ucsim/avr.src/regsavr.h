/*
 * Simulator of microcontrollers (regsavr.h)
 *
 * Copyright (C) 1999,99 Drotos Daniel, Talker Bt.
 * 
 * To contact author send email to drdani@mazsola.iit.uni-miskolc.hu
 *
 */

/* This file is part of microcontroller simulator: ucsim.

UCSIM is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

UCSIM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with UCSIM; see the file COPYING.  If not, write to the Free
Software Foundation, 59 Temple Place - Suite 330, Boston, MA
02111-1307, USA. */
/*@1@*/

#ifndef REGSAVR_HEADER
#define REGSAVR_HEADER

/*
 * Registers, absolute data space addresses
 */

#define X	0x001a
#define XL	0x001a
#define XH	0x001b
#define Y	0x001c
#define YL	0x001c
#define YH	0x001d
#define Z	0x001e
#define ZL	0x001e
#define ZH	0x001f

#define ADCL	0x0024
#define ADCH	0x0025
#define ADCSR	0x0026
#define ADMUX	0x0027
#define ACSR	0x0028
#define UBRR	0x0029
#define UCR	0x002A
#define USR	0x002B
#define UDR	0x002C
#define SPCR	0x002D
#define SPSR	0x002E
#define SPDR	0x002F
#define PIND	0x0030
#define DDRD	0x0031
#define PORTD	0x0032
#define PINC	0x0033
#define DDRC	0x0034
#define PORTC	0x0035
#define PINB	0x0036
#define DDRB	0x0037
#define PORTB	0x0038
#define PINA	0x0039
#define DDRA	0x003A
#define PORTA	0x003B
#define EECR	0x003C
#define EEDR	0x003D
#define EEARL	0x003E
#define EEARH	0x003E
#define WDTCR	0x0041
#define ASSR	0x0042
#define OCR2	0x0043
#define TCNT2	0x0044
#define TCCR2	0x0045
#define ICR1L	0x0046
#define ICR1H	0x0047
#define OCR1BL	0x0048
#define OCR1BH	0x0049
#define OCR1AL	0x004A
#define OCR1AH	0x004B
#define TCNT1L	0x004C
#define TCNT1H	0x004D
#define TCCR1B	0x004E
#define TCCR1A	0x004F
#define TCNT0	0x0052
#define TCCR0	0x0053
#define MCUSR	0x0054
#define MCUCR	0x0055
#define TIFR	0x0058
#define TIMSK	0x0059
#define GIFR	0x005A
#define GIMSK	0x005B
#define SPL	0x005D
#define SPH	0x005E
#define SREG	0x005F

/* Bits of SREG */
#define BIT_I	0x80
#define BIT_T	0x40
#define BIT_H	0x20
#define BIT_S	0x10
#define BIT_V	0x08
#define BIT_N	0x04
#define BIT_Z	0x02
#define BIT_C	0x01


#endif

/* End of avr.src/regsavr.h */
