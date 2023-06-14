#include <gbdk/platform.h>
#include <stdio.h>
#include <stdint.h>

int a = 100, b = 200;
void main(int argc, char * argv[]) {
  printf("Hello, world!\r\nargc: %d\r\n", argc);

  for (int i = 0; i != argc; i++) 
    printf("argv%d = '%s'\r\n", i, argv[i]);

  printf("a = %d b = %d\r\n&a == 0x%x", a, b, &a);
}
