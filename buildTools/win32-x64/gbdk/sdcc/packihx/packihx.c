/*-----------------------------------------------------------------------
 * packihx.c:
 *
 * utility to pack an Intel HEX format file by removing redundant 
 * extended offset records and accumulating data records up to
 * OUTPUT_CHUNK (currently 16) bytes.
 *
 * Released to the public domain 10/16/2000 Kevin Vigor.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <assert.h>

#if defined(_MSC_VER)

typedef unsigned char Uint8 ;
typedef unsigned Uint16 ;

#else

#include "config.h"
#endif

/* A cooked line of input. */
typedef struct _Line
{
    Uint8 		len;		/* length of data portion of record. */
    Uint16      offset;
    Uint8		type;
    Uint8		*data;		
    Uint8		checksum;
} Line;

/* Largest expected line of raw input. */
#define MAX_INPUT_RAW	128
/* Largest expected cooked data portion of an input line. */
#define MAX_INPUT_COOKED (MAX_INPUT_RAW / 2)

/* Globals: current input & output line numbers. */
int lineno = 0;
int outlineno = 0;

/* Convert hex digit to numeric value 0 - 15; assumes input is a 
 * valid digit (i.e. passes isxdigit()).
 */
static Uint8 hexDigit(const char c)
{
    if (isdigit(c))
    {
        return (Uint8)(c - '0');
    }
    else
    {
    	return (Uint8)((islower(c) ? toupper(c) : c)  - 'A' + 10);
    }
}

/* Convert two hex digits from cp to a byte value. */
static int getHexByte(const char *cp, Uint8 *byte)
{
    if (cp && cp[0] && isxdigit(cp[0]) && cp[1] && isxdigit(cp[1]))
    {
 	*byte = (hexDigit(cp[0]) << 4) + hexDigit(cp[1]);
    }
    else
    {
    	return -1;
    }
    return 0;
}

/* Convert four hex digits from cp to a 2 byte value. */
static int getHexWord(const char *cp, Uint16 *word)
{
    Uint8 byte1, byte2;
    
    if (getHexByte(cp, &byte1) || getHexByte(cp + 2, &byte2))
    {
    	return -1;
    }
    *word = (byte1 << 8) + byte2;
    return 0;
}

/* Return a single cooked line of input from the passed file handle. */
Line *readLine(FILE *inFile)
{
    static char buffer[MAX_INPUT_RAW];
    const char  *bp;
    Line 	*line;
    unsigned 	i;

    line = (Line *)malloc(sizeof(Line));
    if (!line)
    {
        fprintf(stderr, "packihx: no memory!\n");
        return NULL;
    }

    do
    {
    	if (!fgets(buffer, MAX_INPUT_RAW, inFile))
    	{
    	    return NULL;
    	}
        ++lineno;
    
    	if (!buffer[0] || buffer[0] == '\r' || buffer[0] == '\n')
    	{
    	    /* Empty input line. */
            return NULL;
        }
    } while (buffer[0] != ':');

    bp = buffer;
    bp++;	/* Skip leading : */
     
    if (getHexByte(bp, &line->len))
    {
        fprintf(stderr, "packihx: can't read line length @ line %d\n", 
        	lineno);
    	free(line);
    	return NULL;
    }
    bp += 2;	/* Two digits consumed. */

    if (line->len > MAX_INPUT_COOKED)
    {
        fprintf(stderr, "packihx: line length %X too long @ line %d\n",
                (int)line->len, lineno);
        free(line);
        return NULL;
    }
    
    if (getHexWord(bp, &line->offset))
    {
	fprintf(stderr, "packihx: can't read line offset @ line %d\n",
                lineno);
        free(line);
        return NULL;        
    }
    bp += 4; /* Four digits consumed. */
    
    if (getHexByte(bp, &line->type))
    {
        fprintf(stderr, "packihx: can't read record type @ line %d\n", 
        	lineno);
    	free(line);
    	return NULL;
    }
    bp += 2;	/* Two digits consumed. */    
   
    /* Hack - always allocate something, even if len is zero.
     * Avoids special case for len == 0. */
    line->data = (Uint8 *)malloc(line->len ? line->len : 1);
    if (!line->data)
    {
    	free(line);
        fprintf(stderr, "packihx: no memory!\n");
        return NULL;
    }
    
    for (i = 0; i < (unsigned)line->len; i++)
    {
        if (getHexByte(bp, &(line->data[i])))
        {
            fprintf(stderr, 
            	    "packihx: can't read data byte %u of %u @ line %d\n", 
            	    i, (unsigned) line->len, lineno);
            free(line->data);
            free(line);
            return NULL; 
        }
        bp += 2; /* Two digits consumed. */
    }
    
    if (getHexByte(bp, &line->checksum))
    {
        fprintf(stderr, "packihx: can't read checksum @ line %d\n", 
        	lineno);
        free(line->data);
    	free(line);
    	return NULL;
    }
    /* bp += 2; */    /* Two digits consumed. */
        
    return line;
}

/* Compute the checksum of a line. */
Uint16 lineChecksum(unsigned len, unsigned offset, unsigned type, 
		    const Uint8 *data)
{
    Uint16  checksum;
    unsigned 	i;
     
    checksum = len + type + (offset >> 8) + 
     	       (offset & 0xff);
     	        
    for (i = 0; i < len; i++)
    {
    	checksum += data[i];	   
    }
    
    checksum &= 0xff;
    if (checksum)
    {
       checksum = 0x100 - checksum;
    }
    return checksum;
}

/* Ensure that the checksum of a line matches the expected value. */
int validateChecksum(Line *line)
{
    Uint16 checksum;
    
    checksum = lineChecksum(line->len, line->offset, line->type, line->data);
    
    if (checksum != line->checksum)
    {
        fprintf(stderr, "packihx: invalid checksum %X (want %X) @ line %d\n", 
        	(unsigned)checksum, (unsigned)(line->checksum),
        	lineno);
        return -1;	
    }
    
    return 0;
}

/* Write a single record line. */
int writeRecord(unsigned len, unsigned offset, unsigned type,
		const Uint8 *data)
{
    unsigned i;
    
    if (printf(":%02X%04X%02X", len, offset, type) == EOF)
    {
        return -1;
    }
    
    for (i = 0; i < len; i++)
    {
        if (printf("%02X", data[i]) == EOF)
        {
            return -1;
        }
    }
    
    if (printf("%02X\n", lineChecksum(len, offset, type, data)) == EOF)
    {
    	return -1;
    }
    outlineno++;
    return 0;
}

#define OUTPUT_CHUNK 16		
static unsigned pendingLen = 0;
static unsigned pendingOffset = 0;
static char 	pending[MAX_INPUT_COOKED + OUTPUT_CHUNK];

/* Buffer up a data record. */
int bufferOutput(Line *line)
{
   unsigned offset = 0;
   int	    rc = 0;
   
   /* Stick the data onto any pending data. */
   assert(pendingLen < OUTPUT_CHUNK);
   memcpy(&pending[pendingLen], line->data, line->len);
   pendingLen += line->len;
   
   /* Write it out untill we have less than an OUTPUT_CHUNK left. */
   while (!rc && pendingLen >= OUTPUT_CHUNK)
   {
       rc = writeRecord(OUTPUT_CHUNK, pendingOffset, 0, &pending[offset]);
       offset += OUTPUT_CHUNK;
       pendingOffset += OUTPUT_CHUNK;
       pendingLen -= OUTPUT_CHUNK;
   }
   
   /* Copy any remaining bits back to the beginning of the buffer. */
   if (pendingLen)
   {
   	memmove(pending, &pending[offset], pendingLen);
   }
   return rc;
}

/* Write out any pending data. */
int flushPendingData(void)
{
    int rc = 0;
    
    assert(pendingLen < OUTPUT_CHUNK);
    
    if (pendingLen)
    {
        rc =  writeRecord(pendingLen, pendingOffset, 0, pending);
        pendingLen = pendingOffset = 0;
    }
    return rc;
}

/* Write an arbitrary line of output (buffering if possible) */
int writeLine(Line *line)
{
    static Uint16 lastExtendedOffset = 0;
    int       rc;
    
    if (line->type)
    {
        /* Not a data record. */
        if (line->type == 4)
        {
            Uint16 offset;
            
            /* Extended offset record. */
            if (line->len != 2)
            {
            	fprintf(stderr, 
                 	"packihx: invalid extended offset record @ line %d\n",
                 	lineno);
                return -1;
            }
            
            offset = (line->data[0] << 8) + line->data[1];
            
            if (offset == lastExtendedOffset)
            {
                /* We can simply skip this line. */
                return 0;
            }
            else
            {
            	lastExtendedOffset = offset;
            }
        }
        
     	if (flushPendingData())
     	{
     	    return -1;
     	}
     	
     	/* Write the line as is. */
     	rc = writeRecord(line->len, line->offset, line->type, line->data);
    }
    else
    {
        if (pendingOffset + pendingLen != (unsigned)line->offset)
        {
            /* This line is not contigous with the last one. Dump pending. */
            if (flushPendingData())
            {
            	return -1;
            }
            pendingOffset = line->offset;
        }
        rc = bufferOutput(line);
    }
    return rc;
}

int main(int argc, char *argv[])
{
    FILE *inFile;
    Line *line;
    int  closeFile;
    int  rc = 0;
    
    if (argc > 1)
    {
        inFile = fopen(argv[1], "rt");
        if (!inFile)
        {
            fprintf(stderr, "packihx: cannot open %s\n", 
            	     argv[1]);
            return 1;
        }
        closeFile = 1;
    }
    else
    {
    	inFile = stdin;
    	closeFile = 0;
    }
    
    while (!rc && ((line = readLine(inFile)) != NULL))
    {
        rc = validateChecksum(line);
        
        if (!rc)
        {
            rc = writeLine(line);
        }
        
        free(line->data);
        free(line);
    }
    
    if (!rc && !feof(inFile))
    {
        /* readLine must have failed for some reason. */
        fprintf(stderr, "packihx: aborting after %d lines.\n", lineno);
        rc = 1;
    }
    
    if (!rc)
    {
    	/* Just in case there's something still pending. */
        rc = flushPendingData();
    }
    
    if (!rc)
    {
        fprintf(stderr, "packihx: read %d lines, wrote %d: OK.\n", lineno, outlineno);
    }

    if (closeFile)
    {
        fclose(inFile);
    }    
    return rc;
}
