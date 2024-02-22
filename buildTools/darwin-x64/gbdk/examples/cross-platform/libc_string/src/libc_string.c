//
// libc_string.c
// Simple test of string functions in C library string.h
//
#include <stdio.h>
#include <string.h>

#include <gbdk/platform.h>
#include <gbdk/font.h>
#include <gbdk/console.h>

void main(void)
{
    font_t ibm_font;

    // init the font system to use IBM font
    font_init();
    ibm_font = font_load(font_ibm);
    font_set(ibm_font);

    // Test strlen
    printf("strlen(gbdk) -> %d\n", strlen("gbdk"));
    // Test strcmp / strncmp
    printf("strcmp(gbdk,gbdk)\n-> %d\n", strcmp("gbdk", "gbdk"));
    printf("strcmp(gbdk,ggdk)\n-> %d\n", strcmp("gbdk", "ggdk"));
    printf("strcmp(ggdk,gbdk)\n-> %d\n", strcmp("ggdk", "gbdk"));
    printf("strncmp(gbdk,gbc,2)\n-> %d\n", strncmp("gbdk", "gbc", 2));
    // Test strcpy
    {
        char dst[4] = "dst";
        const char* src = "src";
        strcpy(dst, src);
        printf("strcpy(dst,src)\n-> %s\n", dst);
    }
    // Test strncpy
    {
        char dst[4] = "dst";
        const char* src = "src";
        strncpy(dst, src, 2);
        printf("strncpy(dst,src,2)\n-> %s\n", dst);
    }
    // Test strcat/strncat
    {
        char dst[9] = "gbdk";
        char dst2[9] = "gbdk";
        printf("strcat(gbdk,2020)\n-> %s\n", strcat(dst, "2020"));
        printf("strncat(gbdk,lib,2)\n-> %s\n", strncat(dst2, "lib",2));
    }
}
