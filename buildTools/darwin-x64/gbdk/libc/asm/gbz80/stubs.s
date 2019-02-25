        ;; Stubs to match between function names
        .area _CODE

        .globl  __mulslong
        .globl  __mululong
        .globl  __modslong
        .globl  __modulong
        .globl  __divslong
        .globl  __divulong
        .globl	__divschar_rrx_s
        .globl	__divsint_rrx_s
        .globl	__divuchar_rrx_s
        .globl	__divuint_rrx_s
        .globl	__mulschar_rrx_s
        .globl	__mulsint_rrx_s
        .globl	__muluchar_rrx_s
        .globl	__muluint_rrx_s
        .globl  __moduchar_rrx_s
        .globl  __modschar_rrx_s
        .globl  __moduint_rrx_s
        .globl  __modsint_rrx_s
        .globl	__rrulong_rrx_s
        .globl	__rrslong_rrx_s
        .globl	__rlulong_rrx_s
        .globl	__rlslong_rrx_s
        
__mulslong_rrx_s::        
__mulslong_rrf_s::        
        jp      __mulslong

__mululong_rrx_s::       
__mululong_rrf_s::       
        jp      __mululong
        
__modslong_rrx_s::
__modslong_rrf_s::
        jp      __modslong
        
__modulong_rrx_s::
__modulong_rrf_s::
        jp      __modulong
        
__divslong_rrx_s::
__divslong_rrf_s::
        jp      __divslong
        
__divulong_rrx_s::
__divulong_rrf_s::
        jp      __divulong

__mulsint_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__mulsint_rrx_s

__divsint_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__divsint_rrx_s

__muluint_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__muluint_rrx_s

__divuint_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__divuint_rrx_s

__mulschar_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__mulschar_rrx_s

__divschar_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__divschar_rrx_s

__muluchar_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__muluchar_rrx_s

__divuchar_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__divuchar_rrx_s

__modschar_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__modschar_rrx_s

__moduchar_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__moduchar_rrx_s

__modsint_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__modsint_rrx_s

__moduint_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__moduint_rrx_s

__rrulong_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__rrulong_rrx_s

__rrslong_rrf_s::
        ld      a,#5
        rst     0x08
        jp	__rrslong_rrx_s

__rlulong_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__rlulong_rrx_s

__rlslong_rrf_s::       
        ld      a,#5
        rst     0x08
        jp	__rlslong_rrx_s
