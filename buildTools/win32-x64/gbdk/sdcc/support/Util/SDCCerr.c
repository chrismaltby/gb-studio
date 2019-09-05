/*
 * SDCCerr - Standard error handler
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Library General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
 */

#include <stdio.h>

#include "SDCCerr.h"


#define USE_STDOUT_FOR_ERRORS		0

#if USE_STDOUT_FOR_ERRORS
#define DEFAULT_ERROR_OUT	stdout
#else
#define DEFAULT_ERROR_OUT	stderr
#endif

static struct {
    ERROR_LOG_LEVEL logLevel;
    FILE *out;
} _SDCCERRG;

extern char *filename ;
extern int lineno ;
extern int fatalError ;

/* Currently the errIndex field must match the position of the 
 * entry in the array. It is only included in order to make 
 * human error lookup easier.
 */
struct  
{
    int			errIndex;
    ERROR_LOG_LEVEL	errType;
    const char		*errText;
} ErrTab [] =
{
{ E_DUPLICATE, ERROR_LEVEL_ERROR,
   "Duplicate symbol '%s', symbol IGNORED" },
{ E_SYNTAX_ERROR, ERROR_LEVEL_ERROR,
   "Syntax error, declaration ignored at '%s'" },
{ E_CONST_EXPECTED, ERROR_LEVEL_ERROR,
   "Constant Expected Found Variable" },
{ E_OUT_OF_MEM, ERROR_LEVEL_ERROR,
   "'malloc' failed file '%s' for size %ld" },
{ E_FILE_OPEN_ERR, ERROR_LEVEL_ERROR,
   "'fopen' failed on file '%s'" },
{ E_INVALID_OCLASS, ERROR_LEVEL_ERROR,
   "Internal Error Oclass invalid '%s'" },
{ E_CANNOT_ALLOC, ERROR_LEVEL_ERROR,
   "Cannot allocate variable '%s'." },
{ E_OLD_STYLE, ERROR_LEVEL_ERROR,
   "Old style C declaration. IGNORED '%s'" },
{ E_STACK_OUT, ERROR_LEVEL_ERROR,
   "Out of stack Space. '%s' not allocated" },
{ E_INTERNAL_ERROR, ERROR_LEVEL_ERROR,
   "FATAL Compiler Internal Error in file '%s' line number '%d' : %s \n"
   "Contact Author with source code" },
{ E_LVALUE_REQUIRED, ERROR_LEVEL_ERROR,
   "'lvalue' required for '%s' operation ." },
{ E_TMPFILE_FAILED, ERROR_LEVEL_ERROR,
   "Creation of temp file failed" },
{ E_FUNCTION_EXPECTED, ERROR_LEVEL_ERROR,
   "called object is not a function" },
{ E_USING_ERROR, ERROR_LEVEL_ERROR,
   "'using', 'interrupt' or 'reentrant' must follow a function definiton .'%s'" },
{ E_SFR_INIT, ERROR_LEVEL_ERROR,
   "Absolute address & initial value both cannot be specified for\n"
   " a 'sfr','sbit' storage class, initial value ignored '%s'" },
{ W_INIT_IGNORED, ERROR_LEVEL_WARNING,
   "Variable in the storage class cannot be initialized.'%s'" },
{ E_AUTO_ASSUMED, ERROR_LEVEL_ERROR,
   "storage class not allowed for automatic variable '%s' in reentrant function unless static" },
{ E_AUTO_ABSA, ERROR_LEVEL_ERROR,
   "absolute address not allowed for automatic var '%s' in reentrant function " },
{ W_INIT_WRONG, ERROR_LEVEL_WARNING,
   "Initializer different levels of indirections" },
{ E_FUNC_REDEF, ERROR_LEVEL_ERROR,
   "Function name '%s' redefined " },
{ E_ID_UNDEF, ERROR_LEVEL_ERROR,
   "Undefined identifier '%s'" },
{ W_STACK_OVERFLOW, ERROR_LEVEL_WARNING,
   "stack exceeds 256 bytes for function '%s'" },
{ E_NEED_ARRAY_PTR, ERROR_LEVEL_ERROR,
   "Array or pointer required for '%s' operation " },
{ E_IDX_NOT_INT, ERROR_LEVEL_ERROR,
   "Array index not an integer" },
{ E_ARRAY_BOUND, ERROR_LEVEL_ERROR,
   "Array bound Exceeded, assuming zero" },
{ E_STRUCT_UNION, ERROR_LEVEL_ERROR,
   "Structure/Union expected left of '.%s'" },
{ E_NOT_MEMBER, ERROR_LEVEL_ERROR,
   "'%s' not a structure/union member" },
{ E_PTR_REQD, ERROR_LEVEL_ERROR,
   "Pointer required" },
{ E_UNARY_OP, ERROR_LEVEL_ERROR,
   "'unary %c': illegal operand" },
{ E_CONV_ERR, ERROR_LEVEL_ERROR,
   "convertion error: integral promotion failed" },
{ E_INT_REQD, ERROR_LEVEL_ERROR,
   "type must be INT for bit field definition" },
{ E_BITFLD_SIZE, ERROR_LEVEL_ERROR,
   "bit field size greater than 16 . assuming 16" },
{ W_TRUNCATION, ERROR_LEVEL_WARNING,
   "high order truncation might occur" },
{ E_CODE_WRITE, ERROR_LEVEL_ERROR,
   "Attempt to assign value to a constant variable %s" },
{ E_LVALUE_CONST, ERROR_LEVEL_ERROR,
   "Lvalue specifies constant object" },
{ E_ILLEGAL_ADDR, ERROR_LEVEL_ERROR,
   "'&' illegal operand , %s" },
{ E_CAST_ILLEGAL, ERROR_LEVEL_ERROR,
   "illegal cast (cast cannot be aggregate)" },
{ E_MULT_INTEGRAL, ERROR_LEVEL_ERROR,
   "'*' bad operand" },
{ E_ARG_ERROR, ERROR_LEVEL_ERROR,
   "Argument count error, argument ignored" },
{ E_ARG_COUNT, ERROR_LEVEL_ERROR,
   "Function was expecting more arguments" },
{ E_FUNC_EXPECTED, ERROR_LEVEL_ERROR,
   "Function name expected '%s'.ANSI style declaration REQUIRED" },
{ E_PLUS_INVALID, ERROR_LEVEL_ERROR,
   "invalid operand '%s'" },
{ E_PTR_PLUS_PTR, ERROR_LEVEL_ERROR,
   "pointer + pointer invalid" },
{ E_SHIFT_OP_INVALID, ERROR_LEVEL_ERROR,
   "invalid operand for shift operator" },
{ E_COMPARE_OP, ERROR_LEVEL_ERROR,
   "compare operand cannot be struct/union" },
{ E_BITWISE_OP, ERROR_LEVEL_ERROR,
   "operand invalid for bitwise operation" },
{ E_ANDOR_OP, ERROR_LEVEL_ERROR,
   "Invalid operand for '&&' or '||'" },
{ E_TYPE_MISMATCH, ERROR_LEVEL_ERROR,
   "indirections to different types %s %s " },
{ E_AGGR_ASSIGN, ERROR_LEVEL_ERROR,
   "cannot assign values to aggregates" },
{ E_ARRAY_DIRECT, ERROR_LEVEL_ERROR,
   "bit Arrays can be accessed by literal index only" },
{ E_BIT_ARRAY, ERROR_LEVEL_ERROR,
   "Array or Pointer to bit|sbit|sfr not allowed.'%s'" },
{ E_DUPLICATE_TYPEDEF, ERROR_LEVEL_ERROR,
   "typedef/enum '%s' duplicate.Previous definiton Ignored" },
{ E_ARG_TYPE, ERROR_LEVEL_ERROR,
   "Actual Argument type different from declaration %d" },
{ E_RET_VALUE, ERROR_LEVEL_ERROR,
   "Function return value mismatch" },
{ E_FUNC_AGGR, ERROR_LEVEL_ERROR,
   "Function cannot return aggregate. Func body ignored" },
{ E_FUNC_DEF, ERROR_LEVEL_ERROR,
   "ANSI Style declaration needed" },
{ E_DUPLICATE_LABEL, ERROR_LEVEL_ERROR,
   "Label name redefined '%s'" },
{ E_LABEL_UNDEF, ERROR_LEVEL_ERROR,
   "Label undefined '%s'" },
{ E_FUNC_VOID, ERROR_LEVEL_ERROR,
   "void function returning value" },
{ E_VOID_FUNC, ERROR_LEVEL_ERROR,
   "function '%s' must return value" },
{ W_RETURN_MISMATCH, ERROR_LEVEL_WARNING,
   "function return value mismatch" },
{ E_CASE_CONTEXT, ERROR_LEVEL_ERROR,
   "'case/default' found without 'switch'.statement ignored" },
{ E_CASE_CONSTANT, ERROR_LEVEL_ERROR,
   "'case' expression not constant. statement ignored" },
{ E_BREAK_CONTEXT, ERROR_LEVEL_ERROR,
   "'break/continue' statement out of context" },
{ E_SWITCH_AGGR, ERROR_LEVEL_ERROR,
   "nonintegral used in switch expression" },
{ E_FUNC_BODY, ERROR_LEVEL_ERROR,
   "function '%s' already has body" },
{ E_UNKNOWN_SIZE, ERROR_LEVEL_ERROR,
   "attempt to allocate variable of unknown size '%s'" },
{ E_AUTO_AGGR_INIT, ERROR_LEVEL_ERROR,
   "aggregate 'auto' variable '%s' cannot be initialized" },
{ E_INIT_COUNT, ERROR_LEVEL_ERROR,
   "too many initializers" },
{ E_INIT_STRUCT, ERROR_LEVEL_ERROR,
   "struct/union/array '%s' :initialization needs curly braces" },
{ E_INIT_NON_ADDR, ERROR_LEVEL_ERROR,
   "non-address initialization expression" },
{ E_INT_DEFINED, ERROR_LEVEL_ERROR,
   "interrupt no '%d' already has a service routine '%s'" },
{ E_INT_ARGS, ERROR_LEVEL_ERROR,
   "interrupt routine cannot have arguments, arguments ingored" },
{ E_INCLUDE_MISSING, ERROR_LEVEL_ERROR,
   "critical compiler #include file missing.		" },
{ E_NO_MAIN, ERROR_LEVEL_ERROR,
   "function 'main' undefined" },
{ E_EXTERN_INIT, ERROR_LEVEL_ERROR,
   "'extern' variable '%s' cannot be initialised	" },
{ E_PRE_PROC_FAILED, ERROR_LEVEL_ERROR,
   "Pre-Processor %s" },
{ E_DUP_FAILED, ERROR_LEVEL_ERROR,
   "_dup call failed" },
{ E_INCOMPAT_TYPES, ERROR_LEVEL_ERROR,
   "incompatible types" },
{ W_LOOP_ELIMINATE, ERROR_LEVEL_WARNING,
   "'while' loop with 'zero' constant.loop eliminated" },
{ W_NO_SIDE_EFFECTS, ERROR_LEVEL_WARNING,
   "%s expression has NO side effects.expr eliminated" },
{ W_CONST_TOO_LARGE, ERROR_LEVEL_PEDANTIC,
   "constant value '%s', out of range." },
{ W_BAD_COMPARE, ERROR_LEVEL_WARNING,
   "comparison will either, ALWAYs succeed or ALWAYs fail" },
{ E_TERMINATING, ERROR_LEVEL_ERROR,
   "Compiler Terminating , contact author with source" },
{ W_LOCAL_NOINIT, ERROR_LEVEL_WARNING,
   "'auto' variable '%s' may be used before initialization at %s(%d)" },
{ W_NO_REFERENCE, ERROR_LEVEL_WARNING,
   "in function %s unreferenced %s : '%s'" },
{ E_OP_UNKNOWN_SIZE, ERROR_LEVEL_ERROR,
   "unknown size for operand" },
{ W_LONG_UNSUPPORTED, ERROR_LEVEL_WARNING,
   "'%s' 'long' not supported , declared as 'int' ." },
{ E_LITERAL_GENERIC, ERROR_LEVEL_ERROR,
    //"illegal cast of LITERAL value to 'generic' pointer: assuming 'xdata' pointer" },
    "illegal cast of LITERAL value to 'generic' pointer" },
{ E_SFR_ADDR_RANGE, ERROR_LEVEL_ERROR,
   "%s '%s' address out of range" },
{ E_BITVAR_STORAGE, ERROR_LEVEL_ERROR,
   "storage class CANNOT be specified for bit variable '%s'" },
{ E_EXTERN_MISMATCH, ERROR_LEVEL_ERROR,
   "extern definition for '%s' mismatches with declaration." },
{ W_NONRENT_ARGS, ERROR_LEVEL_WARNING,
   "Functions called via pointers must be 'reentrant' to take arguments" },
{ W_DOUBLE_UNSUPPORTED, ERROR_LEVEL_WARNING,
   "type 'double' not supported assuming 'float'" },
{ W_IF_NEVER_TRUE, ERROR_LEVEL_WARNING,
   "if-statement condition always false.if-statement not generated" },
{ W_FUNC_NO_RETURN, ERROR_LEVEL_WARNING,
   "no 'return' statement found for function '%s'" },
{ W_PRE_PROC_WARNING, ERROR_LEVEL_WARNING,
   "Pre-Processor %s" },
{ W_STRUCT_AS_ARG, ERROR_LEVEL_WARNING,
   "structure '%s' passed as function argument changed to pointer" },
{ E_PREV_DEF_CONFLICT, ERROR_LEVEL_ERROR,
   "conflict with previous definition of '%s' for attribute '%s'" },
{ E_CODE_NO_INIT, ERROR_LEVEL_ERROR,
   "variable '%s' declared in code space must have initialiser" },
{ E_OPS_INTEGRAL, ERROR_LEVEL_ERROR,
   "operands not integral for assignment operation" },
{ E_TOO_MANY_PARMS, ERROR_LEVEL_ERROR,
   "too many parameters " },
{ E_TOO_FEW_PARMS, ERROR_LEVEL_ERROR,
   "too few parameters" },
{ E_FUNC_NO_CODE, ERROR_LEVEL_ERROR,
   "code not generated for '%s' due to previous errors" },
{ E_TYPE_MISMATCH_PARM, ERROR_LEVEL_ERROR,
   "type mismatch for parameter number %d" },
{ E_INVALID_FLOAT_CONST, ERROR_LEVEL_ERROR,
   "invalid float constant '%s'" },
{ E_INVALID_OP, ERROR_LEVEL_ERROR,
   "invalid operand for '%s' operation" },
{ E_SWITCH_NON_INTEGER, ERROR_LEVEL_ERROR,
   "switch value not an integer" },
{ E_CASE_NON_INTEGER, ERROR_LEVEL_ERROR,
   "case label not an integer" },
{ W_FUNC_TOO_LARGE, ERROR_LEVEL_WARNING,
   "function '%s' too large for global optimization" },
{ W_CONTROL_FLOW, ERROR_LEVEL_PEDANTIC,
   "conditional flow changed by optimizer '%s(%d)':so said EVELYN the modified DOG" },
{ W_PTR_TYPE_INVALID, ERROR_LEVEL_WARNING,
   "invalid type specifier for pointer type specifier ignored" },
{ W_IMPLICIT_FUNC, ERROR_LEVEL_WARNING,
   "function '%s' implicit declaration" },
{ W_CONTINUE, ERROR_LEVEL_WARNING,
   "%s" },
{ I_TOOMANY_SPILS, ERROR_LEVEL_INFO,
   "extended by %d bytes for compiler temp(s) :in function  '%s': %s " },
{ W_UNKNOWN_PRAGMA, ERROR_LEVEL_WARNING,
   "unknown or unsupported #pragma directive '%s'" },
{ W_SHIFT_CHANGED, ERROR_LEVEL_PEDANTIC,
   "%s shifting more than size of object changed to zero" },
{ W_UNKNOWN_OPTION, ERROR_LEVEL_WARNING,
   "unknown compiler option '%s' ignored" },
{ W_UNSUPP_OPTION, ERROR_LEVEL_WARNING,
   "option '%s' no longer supported  '%s' " },
{ W_UNKNOWN_FEXT, ERROR_LEVEL_WARNING,
   "don't know what to do with file '%s'. file extension unsupported" },
{ W_TOO_MANY_SRC, ERROR_LEVEL_WARNING,
   "cannot compile more than one source file . file '%s' ignored" },
{ I_CYCLOMATIC, ERROR_LEVEL_INFO,
   "function '%s', # edges %d , # nodes %d , cyclomatic complexity %d" },
{ E_DIVIDE_BY_ZERO, ERROR_LEVEL_ERROR,
   "dividing by ZERO" },
{ E_FUNC_BIT, ERROR_LEVEL_ERROR,
   "function cannot return 'bit'" },
{ E_CAST_ZERO, ERROR_LEVEL_ERROR,
   "casting from to type 'void' is illegal" },
{ W_CONST_RANGE, ERROR_LEVEL_WARNING,
   "constant is out of range %s" },
{ W_CODE_UNREACH, ERROR_LEVEL_PEDANTIC,
   "unreachable code %s(%d)" },
{ E_NONPTR2_GENPTR, ERROR_LEVEL_ERROR,
   "non-pointer type cast to generic pointer" },
{ W_POSSBUG, ERROR_LEVEL_WARNING,
   "possible code generation error at line %d,\n"
   " send source to sandeep.dutta@usa.net" },
{ E_INCOMPAT_PTYPES, ERROR_LEVEL_WARNING,
   "pointer types incompatible " },
{ W_UNKNOWN_MODEL, ERROR_LEVEL_WARNING,
   "unknown memory model at %s : %d" },
{ E_UNKNOWN_TARGET, ERROR_LEVEL_ERROR,
   "cannot generate code for target '%s'" },
{ W_INDIR_BANKED, ERROR_LEVEL_WARNING,
   "Indirect call to a banked function not implemented." },
{ W_UNSUPPORTED_MODEL, ERROR_LEVEL_WARNING,
   "Model '%s' not supported for %s, ignored." },
{ W_BANKED_WITH_NONBANKED, ERROR_LEVEL_WARNING,
   "Both banked and nonbanked attributes used.  nonbanked wins." },
{ W_BANKED_WITH_STATIC, ERROR_LEVEL_WARNING,
   "Both banked and static used.  static wins." },
{ W_INT_TO_GEN_PTR_CAST, ERROR_LEVEL_WARNING,
   "converting integer type to generic pointer: assuming XDATA" },
{ W_ESC_SEQ_OOR_FOR_CHAR, ERROR_LEVEL_WARNING,
   "escape sequence out of range for char." },
{ E_INVALID_HEX, ERROR_LEVEL_ERROR,
   "\\x used with no following hex digits." },
{ W_FUNCPTR_IN_USING_ISR, ERROR_LEVEL_WARNING,
   "call via function pointer in ISR using non-zero register bank.\n"
   "            Cannot determine which register bank to save." },
{ E_NO_SUCH_BANK, ERROR_LEVEL_ERROR,
   "called function uses unknown register bank %d." },
{ E_TWO_OR_MORE_DATA_TYPES, ERROR_LEVEL_ERROR,
    "two or more data types in declaration for '%s'" },
{ E_LONG_OR_SHORT_INVALID, ERROR_LEVEL_ERROR,
    "long or short specified for %s '%s'" },
{ E_SIGNED_OR_UNSIGNED_INVALID, ERROR_LEVEL_ERROR,
    "signed or unsigned specified for %s '%s'" },
{ E_LONG_AND_SHORT_INVALID, ERROR_LEVEL_ERROR,
    "both long and short specified for %s '%s'" },
{ E_SIGNED_AND_UNSIGNED_INVALID, ERROR_LEVEL_ERROR,
    "both signed and unsigned specified for %s '%s'" },
{ E_TWO_OR_MORE_STORAGE_CLASSES, ERROR_LEVEL_ERROR,
    "two or more storage classes in declaration for '%s'" },
{ W_EXESS_ARRAY_INITIALIZERS, ERROR_LEVEL_WARNING,
    "excess elements in array initializer after `%s' at line %d" },
{ E_ARGUMENT_MISSING, ERROR_LEVEL_ERROR,
   "Option %s requires an argument." },
{ W_STRAY_BACKSLASH, ERROR_LEVEL_WARNING,
    "stray '\\' at column %d" },
{ W_NEWLINE_IN_STRING, ERROR_LEVEL_WARNING,
    "newline in string constant" },
{ E_CANNOT_USE_GENERIC_POINTER, ERROR_LEVEL_ERROR,
    "cannot use generic pointer %s to initialize %s" },
{ W_EXCESS_SHORT_OPTIONS, ERROR_LEVEL_WARNING,
    "Only one short option can be specified at a time.  Rest of %s ignored." },
{ E_VOID_VALUE_USED, ERROR_LEVEL_ERROR,
    "void value not ignored as it ought to be" },
{ W_INTEGRAL2PTR_NOCAST, ERROR_LEVEL_WARNING,
    "converting integral to pointer without a cast" },
{ W_PTR2INTEGRAL_NOCAST, ERROR_LEVEL_WARNING,
    "converting pointer to integral without a cast" },
{ W_SYMBOL_NAME_TOO_LONG, ERROR_LEVEL_WARNING,
    "symbol name too long, truncated to %d chars" },
{ W_CAST_STRUCT_PTR,ERROR_LEVEL_WARNING,
	  "cast of struct %s * to struct %s * " }
};

/*
-------------------------------------------------------------------------------
SetErrorOut - Set the error output file

-------------------------------------------------------------------------------
*/

FILE *SetErrorOut(FILE *NewErrorOut)

{
    _SDCCERRG.out = NewErrorOut ;

return NewErrorOut ;
}

void
setErrorLogLevel (ERROR_LOG_LEVEL level)
{
    _SDCCERRG.logLevel = level;
}

/*
-------------------------------------------------------------------------------
vwerror - Output a standard eror message with variable number of arguements

-------------------------------------------------------------------------------
*/

void vwerror (int errNum, va_list marker)
{
    if (_SDCCERRG.out == NULL) {
        _SDCCERRG.out = DEFAULT_ERROR_OUT;
    }

    if (ErrTab[errNum].errIndex != errNum)
    {
        fprintf(_SDCCERRG.out, 
        	"*** Internal error: error table entry for %d inconsistent.", errNum);
    }


    if (ErrTab[errNum].errType >= _SDCCERRG.logLevel) {
        if ( ErrTab[errNum].errType == ERROR_LEVEL_ERROR )
            fatalError++ ;
  
        if ( filename && lineno ) {
            fprintf(_SDCCERRG.out, "%s(%d):",filename,lineno);
        } else if (lineno) {
            fprintf(_SDCCERRG.out, "at %d:", lineno);
        }
    
        switch(ErrTab[errNum].errType)
        {
            case ERROR_LEVEL_ERROR:
            	fprintf(_SDCCERRG.out, "error   *** ");
            	break;
            case ERROR_LEVEL_WARNING:
            case ERROR_LEVEL_PEDANTIC:
            	fprintf(_SDCCERRG.out, "warning *** ");
            	break;
            case ERROR_LEVEL_INFO:
            	fprintf(_SDCCERRG.out, "info    *** ");
            	break;
	    default:
	    	break;            	
        }
    
        vfprintf(_SDCCERRG.out, ErrTab[errNum].errText,marker);
        fprintf(_SDCCERRG.out, "\n");
    }
    else {
        // Below the logging level, drop.
    }
}
/*
-------------------------------------------------------------------------------
werror - Output a standard eror message with variable number of arguements

-------------------------------------------------------------------------------
*/

void werror (int errNum, ... )
{
    va_list	marker;
    va_start(marker,errNum);
    vwerror(errNum, marker);
    va_end( marker );
}

