.include "vm.i"
.include "macro.i"
        
.area _CODE_255

___bank_bootstrap_script = 255
.globl ___bank_bootstrap_script

_bootstrap_script::
        VM_MUSIC_STOP
        VM_FADE_OUT             .UI_MODAL
        VM_RAISE                EXCEPTION_RESET, 0
