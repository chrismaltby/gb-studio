#include <stdint.h>
#include <stdio.h>
#include <ctype.h>

#define MAXOP     40
#define NUMBER    '0'
#define STACKSIZE 40

uint8_t sp;
int16_t stack[STACKSIZE];

char s[MAXOP];
uint8_t pos;
int16_t n;

void push(int16_t l)
{
  if(sp < STACKSIZE)
    stack[sp++] = l;
  else
    puts("Stack full");
}

int16_t pop(void)
{
  if(sp > 0)
    return stack[--sp];
  else
    puts("Stack empty");
  return 0;
}

int16_t top(void)
{
  if(sp > 0)
    return stack[sp-1];
  else
    puts("Stack empty");
  return 0;
}

int8_t read_op(void)
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

    n = s[pos] - '0';
    while(isdigit(s[++pos]))
	n = 10 * n + s[pos] - '0';

    return NUMBER;
}

void main(void)
{
  int8_t type;
  int16_t op2;

  puts("RPN Calculator");
  sp = 0;
  pos = 0;

  while((type = read_op()) != 0) {
    switch(type) {
    case NUMBER:
      push(n);
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
      printf("==> %d\n", top());
      break;
    }
  }
}
