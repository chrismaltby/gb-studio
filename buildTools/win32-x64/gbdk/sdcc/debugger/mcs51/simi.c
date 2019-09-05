/*-------------------------------------------------------------------------
  simi.c - source file for simulator interaction

	      Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
   
   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!  
-------------------------------------------------------------------------*/
#include "sdcdb.h"
#include "simi.h"

#ifdef HAVE_SYS_SOCKET_H
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <signal.h>
#else
#error "Cannot build debugger without socket support"
#endif
FILE *simin ; /* stream for simulator input */
FILE *simout; /* stream for simulator output */

int sock ; /* socket descriptor to comm with simulator */
pid_t simPid;
static char simibuff[MAX_SIM_BUFF];    /* sim buffer       */
static char regBuff[MAX_SIM_BUFF];
static char *sbp = simibuff;           /* simulator buffer pointer */
extern char **environ;
char simactive = 0;
/*-----------------------------------------------------------------*/
/* readSim - reads one character into simulator buffer             */
/*-----------------------------------------------------------------*/
void readSim(int resetp)
{
    int ch ;
    /* if reset required then point to beginning of buffer */
    if (resetp)
	sbp = simibuff;
    
    Dprintf(D_simi, ("readSim: reading from sim["));

    while ((ch = fgetc(simin))) {

#ifdef SDCDB_DEBUG	
 if (D_simi) {
  	fputc(ch,stdout);
 }
#endif

	*sbp++ = ch;    
    }

    Dprintf(D_simi, ("] end readSim\n"));

    *sbp = '\0';
}

/*-----------------------------------------------------------------*/
/* waitForSim - wait till simulator is done its job                */
/*-----------------------------------------------------------------*/
void waitForSim()
{
    readSim(TRUE);
}

/*-----------------------------------------------------------------*/
/* openSimulator - create a pipe to talk to simulator              */
/*-----------------------------------------------------------------*/
void openSimulator (char **args, int nargs)
{
    struct sockaddr_in sin;     
    int retry = 0;
    int i ;
    char *simargs[32] = { "s51","-P","-r 9756", NULL };
    
    /* create the arguments */
    for ( i = 0 ; i < nargs ;i++) {
	simargs[i+3] = args[i];       
    }
    simargs[i+3]= NULL;

    /* fork and start the simulator as a subprocess */
    if ((simPid = fork())) {
      Dprintf(D_simi, ("simulator pid %d\n",(int) simPid));
    }
    else {
	
	/* we are in the child process : start the simulator */
	if (execvp("s51",simargs) < 0) {
	    perror("cannot exec simulator");
	    exit(1);
	}	
    }
    
 try_connect:
    sock = socket(AF_INET,SOCK_STREAM,0);
    
    memset(&sin,0,sizeof(sin));
    sin.sin_family = AF_INET;
    sin.sin_addr.s_addr = inet_addr("127.0.0.1");
    sin.sin_port = htons(9756);
    
    sleep(1);
    /* connect to the simulator */
    if (connect(sock,(struct sockaddr *) &sin, sizeof(sin)) < 0) {
	/* if failed then wait 1 second & try again
	   do this for 10 secs only */
	if (retry < 10) {
	    retry ++;
	    sleep (1);
	    goto try_connect;
	}
	perror("connect failed :");
	exit(1);
    }
    /* go the socket now turn it into a file handle */
    if (!(simin = fdopen(sock,"r"))) {
	fprintf(stderr,"cannot open socket for read\n");
	exit(1);
    }

    if (!(simout = fdopen(sock,"w"))) {
	fprintf(stderr,"cannot open socket for write\n");
	exit(1);
    }

    /* now that we have opend wait for the prompt */
    waitForSim();
    simactive = 1;
}
/*-----------------------------------------------------------------*/
/* simResponse - returns buffer to simulator's response            */
/*-----------------------------------------------------------------*/
char *simResponse()
{
    return simibuff;
}

/*-----------------------------------------------------------------*/
/* sendSim - sends a command to the simuator                 */
/*-----------------------------------------------------------------*/
void sendSim(char *s)
{
    Dprintf(D_simi, ("sendSim-->%s", s));  // s has LF at end already
    fputs(s,simout);
    fflush(simout);
}

/*-----------------------------------------------------------------*/
/* simGetValue - get value @ address for mem space                 */
/*-----------------------------------------------------------------*/
unsigned long simGetValue (unsigned int addr,char mem, int size)
{
    unsigned int b[4] = {0,0,0,0}; /* can be a max of four bytes long */
    char i;
    char *prefix;
    char buffer[20];
    char *resp;

    switch (mem) {
    case 'A':
      prefix = "dx";
      break;
    case 'B':       
      prefix = "di";
      break;
    case 'C':
    case 'D':
	prefix = "dch";
	break;
    case 'E':
    case 'G':
	prefix = "di";
	break;
    case 'F':
	prefix = "dx";
	break;
    case 'H':
    case 'J':
	prefix = "db" ;
	break;
    case 'I':
	prefix = "ds" ;
	break;	
    }
    
    /* create the simulator command */
    sprintf(buffer,"%s 0x%x \n",prefix,addr);
    sendSim(buffer);
    waitForSim();
    resp = simResponse();

    /* got the response we need to parse it the response
       is of the form 
       [address] [v] [v] [v] ... special case in
       case of bit variables which case it becomes
       [address] [assembler bit address] [v] */
    /* first skip thru white space */
    while (isspace(*resp)) resp++ ;

    /* then make the branch for bit variables */
    /* skip thru the address part */
    while (isxdigit(*resp)) resp++;
    
    if (!strcmp(prefix,"db")) {

	/* skip white space */
	while (isspace(*resp)) resp++ ;
    
	/* skip thru the assembler bit address */
	while (!isspace(*resp)) resp++;

	/* white space */
	while (isspace(*resp)) resp++ ;

	/* scan in the value */
	sscanf(resp,"%d",&b[0]);
    } else {
	
	for (i = 0 ; i < size ; i++ ) {
	    /* skip white space */
	    while (isspace(*resp)) resp++ ;
	    
	    sscanf(resp,"%x",&b[i]);
	    
	    /* skip */
	    while (isxdigit(*resp)) resp++;
	}
    }

    return b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24 ;
	
}

/*-----------------------------------------------------------------*/
/* simSetBP - set break point for a given address                  */
/*-----------------------------------------------------------------*/
void simSetBP (unsigned int addr)
{
    char buff[50];

    sprintf(buff,"break 0x%x\n",addr);
    sendSim(buff);
    waitForSim();
}

/*-----------------------------------------------------------------*/
/* simClearBP - clear a break point                                */
/*-----------------------------------------------------------------*/
void simClearBP (unsigned int addr)
{
    char buff[50];

    sprintf(buff,"clear 0x%x\n",addr);
    sendSim(buff);
    waitForSim();  
}

/*-----------------------------------------------------------------*/
/* simLoadFile - load the simulator file                           */
/*-----------------------------------------------------------------*/
void simLoadFile (char *s)
{
    char buff[128];

    sprintf(buff,"l \"%s\"\n",s);
    printf(buff);
    sendSim(buff);
    waitForSim();    
}

/*-----------------------------------------------------------------*/
/* simGoTillBp - send 'go' to simulator till a bp then return addr */
/*-----------------------------------------------------------------*/
unsigned int simGoTillBp ( unsigned int gaddr)
{
    char *sr, *svr;
    unsigned addr ; 
    char *sfmt;

    /* kpb: new code 8-03-01 */
    if (gaddr == 0) {
      /* initial start, start & stop from address 0 */
     	char buf[20];
         // this program is setting up a bunch of breakpoints automatically
         // at key places.  Like at startup & main() and other function
         // entry points.  So we don't need to setup one here..
      //sendSim("break 0x0\n");
      //sleep(1);
      //waitForSim();

     	sendSim("run 0x0\n");
      sleep(1);  /* do I need this? */
    } else	if (gaddr == -1) { /* resume */

      // try adding this(kpb)
      sendSim("step\n");
      usleep(100000);
      waitForSim();

     	sendSim ("run\n");
    }
    else {
      printf("Error, simGoTillBp > 0!\n");
      exit(1);
    }

#if 0
    if (gaddr != -1) {
	char buf[20];
	sprintf(buf,"g 0x%x\n",gaddr);
	sendSim(buf);
    } else	
	sendSim ("g\n");
#endif
    
    waitForSim();
    
    /* get the simulator response */
    svr  = sr = strdup(simResponse());

    /* figure out the address of the break point the simulators 
       response in a break point situation is of the form 
       [... F* <addr> <disassembled instruction> ] 
       we will ignore till we get F* then parse the address */
    while (*sr) {
	
	if (strncmp(sr,"Stop at",7) == 0) {
	    sr += 7;
	    sfmt = "%x";
	    break;
	} 
	    
	if (*sr == 'F' && ( *(sr+1) == '*' || *(sr+1) == ' ')) {
	    sr += 2;
	    sfmt = "%x";
	    break;
	}
	sr++;
    }

    if (!*sr) {
      fprintf(stderr, "Error?, simGoTillBp failed to Stop\n");
      return 0;
    }

    while (isspace(*sr)) sr++ ;

    if (sscanf(sr,sfmt,&addr) != 1) {
      fprintf(stderr, "Error?, simGoTillBp failed to get Addr\n");
      return 0;
    }
	return addr;

}

/*-----------------------------------------------------------------*/
/* simReset - reset the simulator                                  */
/*-----------------------------------------------------------------*/
void simReset ()
{
    sendSim("res\n");
    waitForSim();
}

/*-----------------------------------------------------------------*/
/* getValueStr - read a value followed by a string =               */
/*-----------------------------------------------------------------*/
static unsigned int getValueStr (char *src,char *cstr)
{
    int i = strlen(cstr);
    int rv;
    /* look for the string */
    if (! (src = strstr(src,cstr)))
	return 0;

    src += i;
    if (!*src) return 0;

    /* look for the digit */
    while (*src && !isxdigit(*src)) src++;
    sscanf(src,"%x",&rv);
    return rv;
}

/*-----------------------------------------------------------------*/
/* simRegs - returns value of registers                            */
/*-----------------------------------------------------------------*/
char  *simRegs()
{   
    char *resp ;
    unsigned int rv;
    char *rb = regBuff;
    int i;

    sendSim("info registers\n");
    //kpb(8-5-01) sendSim("dr\n");

    waitForSim();
    /* make it some more readable */
    resp  = simResponse();

    /* the response is of the form 
       XXXXXX R0 R1 R2 R3 R4 R5 R6 R7 ........
       XXXXXX XX . ACC=0xxx dd cc B=0xxx dd cc DPTR= 0xxxxx @DPTR= 0xxx dd cc
       XXXXXX XX . PSW= 0xxx CY=[1|0] AC=[0|1] OV=[0|1] P=[1|0]

Format as of 8-4-01:
       0x00 00 00 00 00 00 00 00 00 ........
       000000 00 .  ACC= 0x00   0 .  B= 0x00   DPTR= 0x0000 @DPTR= 0x00   0 .
       000000 00 .  PSW= 0x00 CY=0 AC=0 OV=0 P=0
F  0x006d 75 87 80 MOV   PCON,#80
*/

    memset(regBuff,0,sizeof(regBuff));
    /* skip the first numerics */
    while (*resp && !isxdigit(*resp)) resp++;

    if (strncmp(resp, "0x", 2)) {
      fprintf(stderr, "Error: Format1A\n");
      return regBuff;
    }
    resp += 2;
    while (*resp && isxdigit(*resp)) resp++;

    /* now get the eight registers */
    for (i = 0 ; i < 7 ; i++) {
        while (*resp && isspace(*resp)) resp++;
	if (!*resp)
	    break;
	rv = strtol(resp,&resp,16);
	sprintf(rb,"R%d  : 0x%02X %d %c\n",i,rv,rv,(isprint(rv) ? rv : '.'));
	rb += strlen(rb);
    }

    if (!*resp) return regBuff;

    /* skip till end of line */
    while (*resp && *resp != '\n') resp++;
    while (*resp && !isxdigit(*resp)) resp++;
    while (*resp && isxdigit(*resp)) resp++;
    
    /* accumulator value */
    rv = getValueStr(resp,"ACC");
    sprintf(rb,"ACC : 0x%02X %d %c\n",rv,rv,(isprint(rv) ? rv : '.'));
    rb += strlen(rb);
    
    /* value of B */
    rv = getValueStr(resp,"B=");
    sprintf(rb,"B   : 0x%02X %d %c\n",rv,rv,(isprint(rv) ? rv : '.'));
    rb += strlen(rb);

    rv = getValueStr(resp,"DPTR=");
    sprintf(rb,"DPTR: 0x%04X %d\n",rv,rv);
    rb += strlen(rb);

    rv = getValueStr(resp,"@DPTR=");
    sprintf(rb,"@DPTR: 0x%02X %d %c\n", rv,rv,(isprint(rv) ? rv : '.'));
    rb += strlen(rb);
    
    sprintf(rb,"PSW  : 0x%02X | CY : %d | AC : %d | OV : %d | P : %d\n",
	    getValueStr(resp,"PSW="),
	    getValueStr(resp,"CY="),
	    getValueStr(resp,"AC="),
	    getValueStr(resp,"OV="),
	    getValueStr(resp,"P="));

    return regBuff;
    
    

}

/*-----------------------------------------------------------------*/
/* closeSimulator - close connection to simulator                  */
/*-----------------------------------------------------------------*/
void closeSimulator ()
{

    sendSim("q\n");
    kill (simPid,SIGKILL);
    fclose (simin);
    fclose (simout);
    shutdown(sock,2);   
    close(sock);    
    
}
