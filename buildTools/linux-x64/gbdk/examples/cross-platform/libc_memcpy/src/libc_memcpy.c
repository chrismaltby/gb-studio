//
// libc_memcpy.c
// Simple test of memcpy/memset/memmove functions in C library string.h
//

#include <stdio.h>
#include <string.h>

#include <gbdk/platform.h>
#include <gbdk/font.h>
#include <gbdk/console.h>

uint8_t memcpy_dst[300];
const uint8_t memcpy_src[300];

int benchmark_memcpy(int num, int size)
{
    int i;
    uint16_t start_time = sys_time;
    for(i = 0; i < num; i++)
        memcpy(memcpy_dst, memcpy_src, size);
    return (int)(sys_time - start_time);
}

void main(void)
{
    font_t ibm_font;

    // init the font system to use IBM font
    font_init();
    ibm_font = font_load(font_ibm);
    font_set(ibm_font);

    // Test memcpy
    {
        char dst[4] = "dst";
        const char* src = "src";
        printf("memcpy(dst,src,2)\n-> %s\n", memcpy(dst, src, 2));
    }
    // Test memmove
    {
        char dst[4] = "dst";
        const char* src = "src";
        printf("memmove(dst,src,2)\n-> %s\n", memmove(dst, src, 2));
    }
    // Test memset
    {
        char dst[4] = "dst";
        printf("memset(dst,x,2)\n-> %s\n", memset(dst, 'x', 2));
    }
    // Benchmark memcpy
    printf("\nBenchmark memcpy:\n");
    {
        printf("800*memcpy(d,s,150)\n-> %d frames\n", benchmark_memcpy(800, 150));
        printf("400*memcpy(d,s,300)\n-> %d frames\n", benchmark_memcpy(400, 300));
    }
}
