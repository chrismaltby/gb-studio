.include "vm.i"
.include "macro.i"
        
.area _CODE_255

___bank_bootstrap_script = 255
.globl ___bank_bootstrap_script

.globl ___bank_script_engine_init, _script_engine_init

_bootstrap_script::
        VM_LOCK
        VM_CALL_FAR             ___bank_script_engine_init, _script_engine_init
        VM_MUSIC_STOP
        VM_FADE_OUT             .UI_MODAL
        VM_RAISE                EXCEPTION_RESET, 0
