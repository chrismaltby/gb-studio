#ifndef __FAR_PTR_H_INCLUDE
#define __FAR_PTR_H_INCLUDE

#define TO_FAR_PTR(ofs, seg) (((FAR_PTR)seg << 16) | (FAR_PTR)ofs)

#define FAR_SEG(ptr) (((union __far_ptr *)&ptr)->segofs.seg)
#define FAR_OFS(ptr) (((union __far_ptr *)&ptr)->segofs.ofs)
#define FAR_FUNC(ptr, typ) ((typ)(((union __far_ptr *)&ptr)->segfn.fn))

#define FAR_CALL(ptr, typ, ...) (__call_banked_ptr=ptr,((typ)(&__call__banked))(__VA_ARGS__))

typedef unsigned long FAR_PTR;

union __far_ptr {
    FAR_PTR ptr;
    struct {
        void * ofs;
        unsigned int seg;
    } segofs;
    struct {
        void (*fn)();
        unsigned int seg;
    } segfn;
};

extern volatile FAR_PTR __call_banked_ptr;
extern volatile void * __call_banked_addr;
extern volatile unsigned char __call_banked_bank;

void __call__banked();
long to_far_ptr(void* ofs, int seg);

#endif