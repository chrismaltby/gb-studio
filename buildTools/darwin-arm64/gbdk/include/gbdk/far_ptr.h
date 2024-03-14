/** @file gbdk/far_ptr.h

    Far pointers include a segment (bank) selector so they are
    able to point to addresses (functions or data) outside
    of the current bank (unlike normal pointers which are not
    bank-aware).

    See the `banks_farptr` example project included with gbdk.

    @todo Add link to a discussion about banking (such as, how to assign code and variables to banks)
*/

#ifndef __FAR_PTR_H_INCLUDE
#define __FAR_PTR_H_INCLUDE

#include <types.h>
#include <stdint.h>

/** Macro to obtain a far pointer at compile-time
    @param ofs    Memory address within the given Segment (Bank)
    @param seg    Segment (Bank) number

    @returns A far pointer (type @ref FAR_PTR)
*/
#define TO_FAR_PTR(ofs, seg) (((FAR_PTR)seg << 16) | (FAR_PTR)ofs)

/** Macro to get the Segment (Bank) number of a far pointer
    @param ptr    A far pointer (type @ref  FAR_PTR)

    @returns Segment (Bank) of the far pointer (type uint16_t)
*/
#define FAR_SEG(ptr) (((union __far_ptr *)&ptr)->segofs.seg)

/** Macro to get the Offset (address) of a far pointer
    @param ptr    A far pointer (type @ref FAR_PTR)

    @returns Offset (address) of the far pointer (type void *)
*/
#define FAR_OFS(ptr) (((union __far_ptr *)&ptr)->segofs.ofs)

#define FAR_FUNC(ptr, typ) ((typ)(((union __far_ptr *)&ptr)->segfn.fn))

/** Macro to call a function at far pointer __ptr__ of type __typ__
    @param ptr    Far pointer of a function to call (type @ref FAR_PTR)
    @param typ    Type to cast the function far pointer to.
    @param ...    VA Args list of parameters for the function

    __type__ should match the definition of the function being called. For example:
    \code{.c}
    // A function in bank 2
    #pragma bank 2
    uint16_t some_function(uint16_t param1, uint16_t param2) __banked {  return 1; };

    ...
    // Code elsewhere, such as unbanked main()
    // This type declaration should match the above function
    typedef uint16_t (*some_function_t)(uint16_t, uint16_t) __banked;

    // Using FAR_CALL() with the above as *ptr*, *typ*, and two parameters.
    result = FAR_CALL(some_function, some_function_t, 100, 50);
    \endcode

    @returns Value returned by the function (if present)
*/
#define FAR_CALL(ptr, typ, ...) (__call_banked_ptr=ptr,((typ)(&__call__banked))(__VA_ARGS__))

/** Type for storing a FAR_PTR
*/
typedef uint32_t FAR_PTR;

/** Union for working with members of a FAR_PTR
*/
union __far_ptr {
    FAR_PTR ptr;
    struct {
        void * ofs;
        uint16_t seg;
    } segofs;
    struct {
        void (*fn)(void);
        uint16_t seg;
    } segfn;
};

extern volatile FAR_PTR __call_banked_ptr;
extern volatile void * __call_banked_addr;
extern volatile uint8_t __call_banked_bank;

void __call__banked(void);

/** Obtain a far pointer at runtime
    @param ofs    Memory address within the given Segment (Bank)
    @param seg    Segment (Bank) number

    @returns A far pointer (type @ref FAR_PTR)
*/
uint32_t to_far_ptr(void* ofs, uint16_t seg);

#endif