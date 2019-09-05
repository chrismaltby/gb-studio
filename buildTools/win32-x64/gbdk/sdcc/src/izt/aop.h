/** @file izt/aop.h
 */
#ifndef IZT_AOP_INCLUDE
#define IZT_AOP_INCLUDE

typedef enum {
    AOP_TYPE_REG,
    AOP_TYPE_CARRY,
    AOP_TYPE_LITERAL,
    AOP_TYPE_STACK,
    AOP_TYPE_SCRATCH_PTR,
    AOP_TYPE_IMMEDIATE
} AOP_TYPE;

typedef struct asmop {
    AOP_TYPE type;
    int size;
    union {
	value *literal;
	REG *reg;
	int stack;
	const char *immediate;
	const char *scratch;
    } u;
} asmop;

#define AOP(op) op->aop
#define AOP_TYPE(op) AOP(op)->type
#define AOP_SIZE(op) AOP(op)->size

/** Bind a new AOP to the given operand.
 */
void izt_bindAop(operand *op, iCode *ic);

/** Creates a new asmop that wraps the return value registers.
 */
asmop *izt_getAopForReturn(int size);

#endif
