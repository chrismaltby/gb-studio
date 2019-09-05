/* lkihx.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 */

#include <stdio.h>
#include <string.h>
//#include <alloc.h>
#include "aslink.h"

/*)Module	lkihx.c
 *
 *	The module lkihx.c contains the function to
 *	output the relocated object code in the
 *	Intel Hex format.
 *
 *	lkihx.c contains the following function:
 *		VOID	ihx(i)
 *
 *	lkihx.c contains no local variables.
 */

/*Intel Hex Format
 *      Record Mark Field    -  This  field  signifies  the  start  of a
 *                              record, and consists of an  ascii  colon
 *                              (:).  
 *
 *      Record Length Field  -  This   field   consists   of  two  ascii
 *                              characters which indicate the number  of
 *                              data   bytes   in   this   record.   The
 *                              characters are the result of  converting
 *                              the  number  of  bytes  in binary to two
 *                              ascii characters, high digit first.   An
 *                              End  of  File  record contains two ascii
 *                              zeros in this field.  
 *
 *      Load Address Field   -  This  field  consists  of the four ascii
 *                              characters which result from  converting
 *                              the  the  binary value of the address in
 *                              which to begin loading this record.  The
 *                              order is as follows:  
 *
 *                                  High digit of high byte of address. 
 *                                  Low digit of high byte of address.  
 *                                  High digit of low byte of address.  
 *                                  Low digit of low byte of address.  
 *
 *                              In an End of File record this field con-
 *                              sists of either four ascii zeros or  the
 *                              program  entry  address.   Currently the
 *                              entry address option is not supported.  
 *
 *      Record Type Field    -  This  field  identifies the record type,
 *                              which is either 0 for data records or  1
 *                              for  an End of File record.  It consists
 *                              of two ascii characters, with  the  high
 *                              digit of the record type first, followed
 *                              by the low digit of the record type.  
 *
 *      Data Field           -  This  field consists of the actual data,
 *                              converted to two ascii characters,  high
 *                              digit first.  There are no data bytes in
 *                              the End of File record.  
 *
 *      Checksum Field       -  The  checksum  field is the 8 bit binary
 *                              sum of the record length field, the load
 *                              address  field,  the  record type field,
 *                              and the data field.  This  sum  is  then
 *                              negated  (2's  complement) and converted
 *                              to  two  ascii  characters,  high  digit
 *                              first.  
 */

/*)Function	ihx(i)
 *
 *		int	i		0 - process data
 *					1 - end of data
 *
 *	The function ihx() outputs the relocated data
 *	in the standard Intel Hex format.
 *
 *	local variables:
 *		Addr_T	chksum		byte checksum
 *
 *	global variables:
 *		int	hilo		byte order
 *		FILE *	ofp		output file handle
 *		int	rtcnt		count of data words
 *		int	rtflg[]		output the data flag
 *		Addr_T	rtval[]		relocated data
 *
 *	functions called:
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		The data is output to the file defined by ofp.
 */

VOID
ihx(i)
{
	register Addr_T chksum;

	if (i) {
		if (hilo == 0) {
			chksum = rtval[0];
			rtval[0] = rtval[1];
			rtval[1] = chksum;
		}
		for (i = 0, chksum = -2; i < rtcnt; i++) {
			if (rtflg[i])
				chksum++;
		}
		fprintf(ofp, ":%02X", chksum);
		for (i = 0; i < rtcnt ; i++) {
			if (rtflg[i]) {
				fprintf(ofp, "%02X", rtval[i]);
				chksum += rtval[i];
			}
			if (i == 1) {
				fprintf(ofp, "00");
			}
		}
		fprintf(ofp, "%02X\n", (-chksum) & 0xff);
	} else {
		fprintf(ofp, ":00000001FF\n");
	}
}
