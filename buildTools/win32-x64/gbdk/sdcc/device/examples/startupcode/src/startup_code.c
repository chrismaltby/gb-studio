// INCLUDES & DEFINES ===============================================

#define __FILE_STARTUP_CODE_C
// All that has to be included and / or defined is done here

#include "../inc/startup_code.h"

// END INCLUDES & DEFINES ===========================================

void main()
{
    // Init Hardware muss als erstes erfolgen
    InitHardware();

    printf( "\n\rSoftware vom : ");
    printf( __DATE__ );
    printf(" ");
    printf( __TIME__ );

    while( 1 );
}
