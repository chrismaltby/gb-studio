#include <stdint.h>
#include <stdio.h>
#include <ctype.h>

#define MAXOP     40
#define NUMBER    '0'
#define STACKSIZE 40

uint8_t sp;
float stack[STACKSIZE];

char s[MAXOP];
uint8_t pos;
float f;

void push(float f)
{
  if(sp < STACKSIZE)
    stack[sp++] = f;
  else
    puts("Stack full");
}

float pop()
{
  if(sp > 0)
    return stack[--sp];
  else
    puts("Stack empty");
  return 0.0;
}

float top()
{
  if(sp > 0)
    return stack[sp-1];
  else
    puts("Stack empty");
  return 0.0;
}

int8_t read_op()
{
  if(pos == 0) {
    gets(s);
  }

  while(s[pos] == ' ' || s[pos] == '\t')
    pos++;

  if(s[pos] == '\0') {
    pos = 0;
    return('\n');
  }

  if(!isdigit(s[pos]))
    return(s[pos++]);

  f = s[pos] - '0';
  while(isdigit(s[++pos])) {
    int8_t i = s[pos] - '0';
    f = 10.0 * f;
    f += (float)i;
  }
/*     f = 10.0 * f + (float)(int8_t)(s[pos] - '0'); */

  return NUMBER;
}

void main()
{
  int8_t type;
  float op2;

  puts("FP RPN Calculator");
  sp = 0;
  pos = 0;

  while((type = read_op(s)) != 0) {
    switch(type) {
    case NUMBER:
      push(f);
      break;
    case '+':
      push(pop() + pop());
      break;
    case '*':
      push(pop() * pop());
      break;
    case '-':
      op2 = pop();
      push(pop() - op2);
      break;
    case '/':
      op2 = pop();
      if(op2 != 0)
	push(pop() / op2);
      else
	puts("Divide by 0");
      break;
    case '\n':
      printf("==> %f\n", top());
      break;
    }
  }
}
