/*
	this program the flow of air through a rotary flowmeter
	and displays the calculated cfm. the output of the meter
	is a small duty cycle pulse, the period of repatition of
	which if proportional to the flow. the flow is compensated
	for changes in pressure and temperature to maintain
	calibration. if the flow exceeds an adjustable setpoint
	it energizes a 2 form c relay for user application use.
*/

#include <reg552.h>
			     
#define	ZERO_K		2730	/* 0 degress centigrade in kelvin       */
#define	ONE_TENTH_CFM	4444444L /* 1/10 cfm in microseconds		*/
#define	STD_TEMP	2980	/* 25 degrees centigrade in kelvin      */
#define	STD_ATM		147	/* one atmosphere in tenths psi         */
#define	LOWEST_CFM	0x40	/* maximun period from meter 0x400000   */
#define	START_ADC0	0x28	/* commands to start appropriate        */
#define	START_ADC1	0x29	/* a/d conversion cycle                 */
#define	START_ADC2	0x2a	/*                                      */
#define	START_ADC3	0x2b	/*                                      */
#define	START_ADC4	0x2c	/*                                      */
#define	ADCI		0x10	/* a/d converter status flags           */
#define	ADCS		0x08	/*                                      */
#define	FREERUN_I	0x10	/*                                      */
#define	SEG_A		0x01	/* P3 position for display segment 'a'  */
#define	CFM		0x01	/* P3 position for 'cfm' led            */
#define	SEG_B		0x02	/* P3 position for display segment 'b'  */
#define	DEGREES		0x02	/* P3 position for 'degrees' led        */
#define	SEG_C		0x04	/* P3 position for display segment 'c'  */
#define	PSI		0x04	/* P3 position for 'psi' led            */
#define	SEG_D		0x08	/* P3 position for display segment 'd'  */
#define	SETPOINT	0x08	/* P3 position for 'setpoint' led       */
#define	SEG_E		0x10	/* P3 position for display segment 'e'  */
#define	SEG_F		0x20	/* P3 position for display segment 'f'  */
#define	SEG_G		0x40	/* P3 position for display segment 'g'  */
#define	SEG_DP		0x80	/* P3 position for display decimal pt.  */

typedef	unsigned char byte;	/* type define objects with             */
typedef unsigned int word;	/* more classical microprocessor        */
typedef unsigned long l_word;	/* meaning                              */

#define TRUE 1			/* define logical true / false          */
#define FALSE 0			/* values for bit variables             */


/*
	define look-up table of possible seven segment display
	characters possible to display.	table contents need to 
	be inverted before use to be compatible with  U2 (udn2585a)
*/

code byte segments[] =
{
    SEG_A | SEG_B | SEG_C | SEG_D | SEG_E | SEG_F        ,	/* 0 */
    SEG_B | SEG_C                                ,	/* 1 */
    SEG_A | SEG_B |         SEG_D | SEG_E |         SEG_G,	/* 2 */
    SEG_A | SEG_B | SEG_C | SEG_D |                 SEG_G,	/* 3 */
    SEG_B | SEG_C |                 SEG_F | SEG_G,	/* 4 */
    SEG_A |         SEG_C | SEG_D         | SEG_F | SEG_G,	/* 5 */
    SEG_A |         SEG_C | SEG_D | SEG_E | SEG_F | SEG_G,	/* 6 */
    SEG_A | SEG_B | SEG_C                                ,	/* 7 */
    SEG_A | SEG_B | SEG_C | SEG_D | SEG_E | SEG_F | SEG_G,	/* 8 */
    SEG_A | SEG_B | SEG_C | SEG_D |         SEG_F | SEG_G,	/* 9 */
    SEG_A |                 SEG_D | SEG_E | SEG_F | SEG_G	/* error */
};

sbit	RELAY		= 0x96;	/* active hi to turn on setpoint relay  */
sbit	STROBE_0	= 0x80;	/* active hi to enable status led's     */
sbit	STROBE_1	= 0x81;	/* active hi to enable display cr15     */
sbit	STROBE_2	= 0x82;	/* active hi to enable display cr14     */
sbit	NO_FLOW		= 0x83;	/* flag set when no flow detected       */
sbit	STROBE_3	= 0x84;	/* active hi to enable display cr13     */
sbit	SEL_0		= 0x93;	/* active low inputs used to select     */
sbit	SEL_1		= 0x94;	/* mode being displayed                 */
sbit	INTR		= 0x95;	/*                                      */
sbit	UPDATE		= 0x97;	/* flag set when time to update display */
data	word	cfm;		/* gas flow in tenths of a cfm          */
data	word	setpoint;	/* relay setpoint in tenths of a cfm    */
data	word	degree_c;	/* temperature in tenths centagrade     */
data	l_word	corr;		/* intermediate calculation value       */
data	word	psi;		/* pressupe in tenths of a psi          */
data	byte	display0;	/* variables to hold values for the     */
data	byte	display1;	/* displays during refresh              */
data	byte	display2;	/*                                      */
data	byte	display3;	/*                                      */
data	byte	disp_pntr;	/* pointer to next display to enable    */
data	byte	refresh;	/* counter determines display updates   */
data	byte	high;		/* bits 16 - 23 of flow period          */
data	byte	middle;		/* bits 8 - 15 of flow period           */
data	byte	low;		/* bits 0 - 7  of flow period           */
data	byte	ticks;		/* incremented by timer overflow        */

/*
	use the free-running I timer to multiplex the led displays
	at approx. 1000 hz.
*/

void multiplex() interrupt 3
{
	switch(disp_pntr)
	{
	case 0x00:
	    STROBE_3 = FALSE;	/* turn off display cr13        */
	    P3 = 0xff;		/* turn off all segments        */
	    P3 = display0;	/* load segments for led's      */
	    STROBE_0 = TRUE;	/* turn on status led's         */
	    disp_pntr = 1;	/* increment pointer to dsiplay */
	    break;
	case 0x01:
	    STROBE_0 = FALSE;	/* turn off status led's        */
	    P3 = 0xff;		/* turn off all segments        */
	    P3 = display1;	/* load segments for tenths     */
	    STROBE_1 = TRUE;	/* turn on display cr15         */
	    disp_pntr = 2;	/* increment pointer to dsiplay */
	    break;
	case 0x02:
	    STROBE_1 = FALSE;	/* turn off display cr15        */
	    P3 = 0xff;		/* turn off all segments        */
	    P3 = display2;	/* load segments for units      */
	    STROBE_2 = TRUE;	/* turn on display cr14         */
	    disp_pntr = 3;	/* increment pointer to dsiplay */
	    break;
	case 0x03:
	    STROBE_2 = FALSE;	/* turn off display cr14        */
	    P3 = 0xff;		/* turn off all segments        */
	    P3 = display3;	/* load segments for tens       */
	    STROBE_3 = TRUE;	/* turn on display cr13         */
	    disp_pntr = 0;	/* increment pointer to dsiplay */
	    break;
	}
}

/*
	use the free running pwm prescaler to generate
	interrupts every 92 hz. every 32nd interrupt
	set the UPDATE flag to enable the reading of
	the command switches, and updating of the led
	display contents.
*/
void read_switch() interrupt 6
{
	if(refresh++ == 32)
	{	UPDATE = TRUE;
		refresh = 0;
	}
}

/*
	whenever the timer overflows from 0xffff to 0x0000
	increment the variable 'ticks' which represent the
	highest order (16 - 23) bits of the gas flow period
	in microseconds. if the variable 'ticks' is greater
	than the period representing a flow of < 0.1 cfm
	then set the NO_FLOW flag to enable display of 00.0
*/

void overflow() interrupt 1
{
	if(++ticks > LOWEST_CFM)
	{
		cfm = 0;
		ticks = 0;
		NO_FLOW = TRUE;
	}
}

/*
	an external interrupt generated by a tach pulse
	from the flowmeter reads the current value of the
	timer into variables 'low' and 'middle', and then
	resets the timers. the 'ticks' variable described
	above is also copied to variable 'high', and then
	reset to zero. the NO_FLOW flag is cleared to 
	enable display of the calculated cfm.
*/

void calc_cfm() interrupt 0
{
	low = TL0;
	TL0 = 0;
	middle = TH0;
	TH0 = 0;
	high = ticks;
	ticks = 0;
	NO_FLOW = FALSE; 
}

void main()
{
	RELAY		= 0;    /* initialize output pins		*/
	INTR		= 1;
	UPDATE		= 1;
	STROBE_0	= 0;
	STROBE_1	= 0;
	STROBE_2	= 0;
	STROBE_3	= 0;
	NO_FLOW		= 0;
	TL0	= 0;		/* timer 0 period 0x10000 u_seconds	*/
	TH0	= 0;
	PWMP	= 255;		/* pwm timer interrupt at 92 hz		*/
	TR0	= 1;		/* enable timer 0			*/
	IT0	= 1;		/* INT0 is edge active			*/
	ticks	= 0;		/* initialize variables			*/
	cfm	= 0;
	low	= 0;
	middle	= 0;
	high	= 0;
	degree_c = 250;
	psi	= 147;
	corr	= 0;
	refresh = 0;
	disp_pntr = 0;
	IEN0	= 0xab;		/* enable intrrupts			*/
#ifdef MY
/*
	main execution loop, executes forever.
*/

	while(1)
	{

/*
 	calculate base cfm rate - first create long word representing
	flow rate period in microseconds. then subtract out the time
	overhead in servicing the routine 'calc_cfm'. then divide the
	period into the period for 1/10 cfm, to get flow rate in 1/10
	cfm resolution.
*/ 

       		corr = high * 0x10000L;
       		corr += (middle * 0x100L);
		corr += low;
       		corr = ONE_TENTH_CFM / corr;

/*
	read temperature - measure output from the LM35 sensor,
	scaled by the AMP-02. the scaling results in a range
	of 0 to 51.0 degrees centigrade, in 0.2 degree steps.
*/

		ADCON = START_ADC1;
		while(ADCON & ADCS) ;
		degree_c = ((word)ADDATH) << 8 | ADDATL;
		degree_c *= 2;

/*
	compensate cfm rate for temperature - convert temperature
	into degrees kelvin, then divide it into the measured flow
	rate multiplied by the calibration temperature of the flow-
	meter in degrees kelvin. (nominal 25 degrees centigrade)
*/

    		corr *= STD_TEMP;
    		corr /= (ZERO_K + degree_c);   

/*
	read pressure - measure output of the KP100A pressure trans-
	ducer, scaled by the AMP_02. the scaling results in a range
	of 0 to 25.5 psi, in 1/10 psi steps.
*/

    		ADCON = START_ADC0;
     		while(ADCON & ADCS) ;
     		psi = ((word) ADDATH << 8) | ADDATL;

/*
	compensate cfm rate for pressure - multiply measured pres-
	sure and the calculated flow rate, and then divide it by
	the standard atmospheric pressure at sea-level. (nominal
	14.7 psi)

*/

    		corr *= psi;
    		corr /= STD_ATM;   
    		cfm = corr;

/*
	read setpoint pot to obtain setpoint in the range of
	0 - 25.5 cfm in 1/10 cfm steps.
*/

      		ADCON = START_ADC2;
     		while(ADCON & ADCS) ;
      		setpoint = ADAT;

/*
	test if cfm rate greater or equal to the
	setpoint, and if so then energize relay
*/

      		if(setpoint > cfm)
			RELAY = 0;
	       	else
	       	       	RELAY = 1;

/*
	test if update flag has been set, and if so reset flag.
*/

		if(UPDATE)
		{
			UPDATE = 0;

/*
	then test if the no flow flag has been set. if so then
	display 00.0 cfm
*/

			if(NO_FLOW)
			{
 				display0 = ~CFM;
 				display1 = ~segments[0];
 				display2 = ~(segments[0] | SEG_DP);
 				display3 = ~segments[0];
 			}

/*
	if the no flow flag was not set then read the display
	select switches, and display the appropriate data.
*/

 			else if(SEL_0)
 			{
 				if(SEL_1)
 				{

/*
	if no swich is depressed then the default display is
	the flow rate in cfm. test the flowrate is greater than
	or equal to 30 cfm then display the overrange message
	EEE else the flow in XX.X format.
*/

					if(cfm <= 300)
					{
 			        	  	display0 = ~CFM;
 						display1 = ~segments[cfm % 10];
 						cfm /= 10;
 						display2 = ~(segments[cfm % 10]);
 						cfm /= 10;
 						display3 = ~segments[cfm % 10];
					}
					else		    
					{		    
					 	display0 = ~CFM;
 						display1 = ~segments[10];
 						display2 = ~segments[10];
 						display3 = ~segments[10];
					}
 				}

/*
	if switch 1 is depressed then display temperature.
*/

 				else
 				{	
 					display0 = ~DEGREES;
 					display1 = ~segments[degree_c % 10];
 					degree_c /= 10;
 					display2 = ~(segments[degree_c % 10] | SEG_DP);
 					degree_c /= 10;
 					display3 = ~segments[degree_c % 10];
 				}
 			}
 			else
 			{

/*
	if switch 2 depressed then display the pressure.
*/

 				if(SEL_1)
 				{
 					display0 = ~PSI;
 					display1 = ~segments[psi % 10];
 					psi /= 10;
 					display2 = ~(segments[psi % 10] | SEG_DP);
 					psi /= 10;
 					display3 = ~segments[psi % 10];
 				}

/*
	if switch 3 depressed then display the setpoint.
*/

 				else
 				{
 					display0 = ~SETPOINT;
 					display1 = ~segments[setpoint % 10];
 					setpoint /= 10;
					display2 = ~(segments[setpoint % 10] | SEG_DP);
					setpoint /= 10;
					display3 = ~segments[setpoint % 10];
				}
			}
		}
	}
#endif
}
