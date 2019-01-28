// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// {{PRE_JSES}}

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

Module['arguments'] = [];
Module['thisProgram'] = './this.program';
Module['quit'] = function(status, toThrow) {
  throw toThrow;
};
Module['preRun'] = [];
Module['postRun'] = [];

// The environment setup code below is customized to use Module.
// *** Environment setup code ***

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
}

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  } else {
    return scriptDirectory + path;
  }
}

if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + '/';

  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  var nodeFS;
  var nodePath;

  Module['read'] = function shell_read(filename, binary) {
    var ret;
      if (!nodeFS) nodeFS = require('fs');
      if (!nodePath) nodePath = require('path');
      filename = nodePath['normalize'](filename);
      ret = nodeFS['readFileSync'](filename);
    return binary ? ret : ret.toString();
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  if (process['argv'].length > 1) {
    Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  // Currently node will swallow unhandled rejections, but this behavior is
  // deprecated, and in the future it will exit with error status.
  process['on']('unhandledRejection', function(reason, p) {
    err('node.js exiting due to unhandled promise rejection');
    process['exit'](1);
  });

  Module['quit'] = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    Module['read'] = function shell_read(f) {
      return read(f);
    };
  }

  Module['readBinary'] = function readBinary(f) {
    var data;
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof quit === 'function') {
    Module['quit'] = function(status) {
      quit(status);
    }
  }
} else
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WEB) {
    if (document.currentScript) {
      scriptDirectory = document.currentScript.src;
    }
  } else { // worker
    scriptDirectory = self.location.href;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.split('/').slice(0, -1).join('/') + '/';
  } else {
    scriptDirectory = '';
  }


  Module['read'] = function shell_read(url) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
  };

  if (ENVIRONMENT_IS_WORKER) {
    Module['readBinary'] = function readBinary(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(xhr.response);
    };
  }

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  Module['setWindowTitle'] = function(title) { document.title = title };
} else
{
  throw new Error('environment detection error');
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
// If the user provided Module.print or printErr, use that. Otherwise,
// console.log is checked first, as 'print' on the web will open a print dialogue
// printErr is preferable to console.warn (works better in shells)
// bind(console) is necessary to fix IE/Edge closed dev tools panel behavior.
var out = Module['print'] || (typeof console !== 'undefined' ? console.log.bind(console) : (typeof print !== 'undefined' ? print : null));
var err = Module['printErr'] || (typeof printErr !== 'undefined' ? printErr : ((typeof console !== 'undefined' && console.warn.bind(console)) || out));

// *** Environment setup code ***

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;



// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;

// stack management, and other functionality that is provided by the compiled code,
// should not be used before it is ready
stackSave = stackRestore = stackAlloc = setTempRet0 = getTempRet0 = function() {
  abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
};

function staticAlloc(size) {
  assert(!staticSealed);
  var ret = STATICTOP;
  STATICTOP = (STATICTOP + size + 15) & -16;
  assert(STATICTOP < TOTAL_MEMORY, 'not enough memory for static allocation - increase TOTAL_MEMORY');
  return ret;
}

function dynamicAlloc(size) {
  assert(DYNAMICTOP_PTR);
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  if (end >= TOTAL_MEMORY) {
    var success = enlargeMemory();
    if (!success) {
      HEAP32[DYNAMICTOP_PTR>>2] = ret;
      return 0;
    }
  }
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  var ret = size = Math.ceil(size / factor) * factor;
  return ret;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

var asm2wasmImports = { // special asm2wasm imports
    "f64-rem": function(x, y) {
        return x % y;
    },
    "debugger": function() {
        debugger;
    }
};



var jsCallStartIndex = 1;
var functionPointers = new Array(0);

// 'sig' parameter is only used on LLVM wasm backend
function addFunction(func, sig) {
  if (typeof sig === 'undefined') {
    err('warning: addFunction(): You should provide a wasm function signature string as a second argument. This is not necessary for asm.js and asm2wasm, but is required for the LLVM wasm backend, so it is recommended for full portability.');
  }
  var base = 0;
  for (var i = base; i < base + 0; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return jsCallStartIndex + i;
    }
  }
  throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
}

function removeFunction(index) {
  functionPointers[index-jsCallStartIndex] = null;
}

var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    assert(args.length == sig.length-1);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    assert(sig.length == 1);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].call(null, ptr);
  }
}


function getCompilerSetting(name) {
  throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
}

var Runtime = {
  // FIXME backwards compatibility layer for ports. Support some Runtime.*
  //       for now, fix it there, then remove it from here. That way we
  //       can minimize any period of breakage.
  dynCall: dynCall, // for SDL2 port
  // helpful errors
  getTempRet0: function() { abort('getTempRet0() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  staticAlloc: function() { abort('staticAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  stackAlloc: function() { abort('stackAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 8;


// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


function getSafeHeapType(bytes, isFloat) {
  switch (bytes) {
    case 1: return 'i8';
    case 2: return 'i16';
    case 4: return isFloat ? 'float' : 'i32';
    case 8: return 'double';
    default: assert(0);
  }
}


function SAFE_HEAP_STORE(dest, value, bytes, isFloat) {
  if (dest <= 0) abort('segmentation fault storing ' + bytes + ' bytes to address ' + dest);
  if (dest % bytes !== 0) abort('alignment error storing to address ' + dest + ', which was expected to be aligned to a multiple of ' + bytes);
  if (staticSealed) {
    if (dest + bytes > HEAP32[DYNAMICTOP_PTR>>2]) abort('segmentation fault, exceeded the top of the available dynamic heap when storing ' + bytes + ' bytes to address ' + dest + '. STATICTOP=' + STATICTOP + ', DYNAMICTOP=' + HEAP32[DYNAMICTOP_PTR>>2]);
    assert(DYNAMICTOP_PTR);
    assert(HEAP32[DYNAMICTOP_PTR>>2] <= TOTAL_MEMORY);
  } else {
    if (dest + bytes > STATICTOP) abort('segmentation fault, exceeded the top of the available static heap when storing ' + bytes + ' bytes to address ' + dest + '. STATICTOP=' + STATICTOP);
  }
  setValue(dest, value, getSafeHeapType(bytes, isFloat), 1);
}
function SAFE_HEAP_STORE_D(dest, value, bytes) {
  SAFE_HEAP_STORE(dest, value, bytes, true);
}

function SAFE_HEAP_LOAD(dest, bytes, unsigned, isFloat) {
  if (dest <= 0) abort('segmentation fault loading ' + bytes + ' bytes from address ' + dest);
  if (dest % bytes !== 0) abort('alignment error loading from address ' + dest + ', which was expected to be aligned to a multiple of ' + bytes);
  if (staticSealed) {
    if (dest + bytes > HEAP32[DYNAMICTOP_PTR>>2]) abort('segmentation fault, exceeded the top of the available dynamic heap when loading ' + bytes + ' bytes from address ' + dest + '. STATICTOP=' + STATICTOP + ', DYNAMICTOP=' + HEAP32[DYNAMICTOP_PTR>>2]);
    assert(DYNAMICTOP_PTR);
    assert(HEAP32[DYNAMICTOP_PTR>>2] <= TOTAL_MEMORY);
  } else {
    if (dest + bytes > STATICTOP) abort('segmentation fault, exceeded the top of the available static heap when loading ' + bytes + ' bytes from address ' + dest + '. STATICTOP=' + STATICTOP);
  }
  var type = getSafeHeapType(bytes, isFloat);
  var ret = getValue(dest, type, 1);
  if (unsigned) ret = unSign(ret, parseInt(type.substr(1)), 1);
  return ret;
}
function SAFE_HEAP_LOAD_D(dest, bytes, unsigned) {
  return SAFE_HEAP_LOAD(dest, bytes, unsigned, true);
}

function SAFE_FT_MASK(value, mask) {
  var ret = value & mask;
  if (ret !== value) {
    abort('Function table mask error: function pointer is ' + value + ' which is masked by ' + mask + ', the likely cause of this is that the function pointer is being called by the wrong type.');
  }
  return ret;
}

function segfault() {
  abort('segmentation fault');
}
function alignfault() {
  abort('alignment fault');
}
function ftfault() {
  abort('Function table mask error');
}

//========================================
// Runtime essentials
//========================================

var ABORT = 0; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

var JSfuncs = {
  // Helpers for cwrap -- it can't refer to Runtime directly because it might
  // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
  // out what the minified function name is.
  'stackSave': function() {
    stackSave()
  },
  'stackRestore': function() {
    stackRestore()
  },
  // type conversion from js to c
  'arrayToC' : function(arr) {
    var ret = stackAlloc(arr.length);
    writeArrayToMemory(arr, ret);
    return ret;
  },
  'stringToC' : function(str) {
    var ret = 0;
    if (str !== null && str !== undefined && str !== 0) { // null string
      // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
      var len = (str.length << 2) + 1;
      ret = stackAlloc(len);
      stringToUTF8(str, ret, len);
    }
    return ret;
  }
};

// For fast lookup of conversion functions
var toC = {
  'string': JSfuncs['stringToC'], 'array': JSfuncs['arrayToC']
};


// C calling interface.
function ccall(ident, returnType, argTypes, args, opts) {
  function convertReturnValue(ret) {
    if (returnType === 'string') return Pointer_stringify(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== 'array', 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
  if (noSafe) {
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
  } else {
    switch(type) {
      case 'i1': SAFE_HEAP_STORE(((ptr)|0), ((value)|0), 1); break;
      case 'i8': SAFE_HEAP_STORE(((ptr)|0), ((value)|0), 1); break;
      case 'i16': SAFE_HEAP_STORE(((ptr)|0), ((value)|0), 2); break;
      case 'i32': SAFE_HEAP_STORE(((ptr)|0), ((value)|0), 4); break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],SAFE_HEAP_STORE(((ptr)|0), ((tempI64[0])|0), 4),SAFE_HEAP_STORE((((ptr)+(4))|0), ((tempI64[1])|0), 4)); break;
      case 'float': SAFE_HEAP_STORE_D(((ptr)|0), (+(value)), 4); break;
      case 'double': SAFE_HEAP_STORE_D(((ptr)|0), (+(value)), 8); break;
      default: abort('invalid type for setValue: ' + type);
    }
  }
}

/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
  if (noSafe) {
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  } else {
    switch(type) {
      case 'i1': return ((SAFE_HEAP_LOAD(((ptr)|0), 1, 0))|0);
      case 'i8': return ((SAFE_HEAP_LOAD(((ptr)|0), 1, 0))|0);
      case 'i16': return ((SAFE_HEAP_LOAD(((ptr)|0), 2, 0))|0);
      case 'i32': return ((SAFE_HEAP_LOAD(((ptr)|0), 4, 0))|0);
      case 'i64': return ((SAFE_HEAP_LOAD(((ptr)|0), 8, 0))|0);
      case 'float': return (+(SAFE_HEAP_LOAD_D(((ptr)|0), 4, 0)));
      case 'double': return (+(SAFE_HEAP_LOAD_D(((ptr)|0), 8, 0)));
      default: abort('invalid type for getValue: ' + type);
    }
  }
  return null;
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [typeof _malloc === 'function' ? _malloc : staticAlloc, stackAlloc, staticAlloc, dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return staticAlloc(size);
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}

/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return '';
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = ((SAFE_HEAP_LOAD((((ptr)+(i))|0), 1, 1))|0);
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return UTF8ToString(ptr);
}

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = ((SAFE_HEAP_LOAD(((ptr++)|0), 1, 0))|0);
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  while (u8Array[endPtr]) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;

    var str = '';
    while (1) {
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 0xF8) == 0xF0) {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 0xFC) == 0xF8) {
            u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
          } else {
            u5 = u8Array[idx++] & 63;
            u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
          }
        }
      }
      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = ((SAFE_HEAP_LOAD((((ptr)+(i*2))|0), 2, 0))|0);
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    SAFE_HEAP_STORE(((outPtr)|0), ((codeUnit)|0), 2);
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  SAFE_HEAP_STORE(((outPtr)|0), ((0)|0), 2);
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = ((SAFE_HEAP_LOAD((((ptr)+(i*4))|0), 4, 0))|0);
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    SAFE_HEAP_STORE(((outPtr)|0), ((codeUnit)|0), 4);
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  SAFE_HEAP_STORE(((outPtr)|0), ((0)|0), 4);
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

function demangle(func) {
  warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  return func;
}

function demangleAll(text) {
  var regex =
    /__Z[\w\d_]+/g;
  return text.replace(regex,
    function(x) {
      var y = demangle(x);
      return x === y ? x : (x + ' [' + y + ']');
    });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}

// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
var MIN_TOTAL_MEMORY = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE, STATICTOP, staticSealed; // static area
var STACK_BASE, STACKTOP, STACK_MAX; // stack area
var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

  STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
  staticSealed = false;


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  HEAPU32[(STACK_MAX >> 2)-1] = 0x02135467;
  HEAPU32[(STACK_MAX >> 2)-2] = 0x89BACDFE;
}

function checkStackCookie() {
  if (HEAPU32[(STACK_MAX >> 2)-1] != 0x02135467 || HEAPU32[(STACK_MAX >> 2)-2] != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' + HEAPU32[(STACK_MAX >> 2)-2].toString(16) + ' ' + HEAPU32[(STACK_MAX >> 2)-1].toString(16));
  }
  // Also test the global address 0 for integrity. This check is not compatible with SAFE_SPLIT_MEMORY though, since that mode already tests all address 0 accesses on its own.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) throw 'Runtime error: The application has corrupted its heap memory area (address zero)!';
}

function abortStackOverflow(allocSize) {
  abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - stackSave() + allocSize) + ' bytes available!');
}


function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}


function enlargeMemory() {
  abortOnCannotGrowMemory();
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) err('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
       'JS engine does not provide full typed array support');



// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
  assert(buffer.byteLength === TOTAL_MEMORY, 'provided buffer should be ' + TOTAL_MEMORY + ' bytes, but it is ' + buffer.byteLength);
} else {
  // Use a WebAssembly memory where available
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  assert(buffer.byteLength === TOTAL_MEMORY);
  Module['buffer'] = buffer;
}
updateGlobalBufferViews();


function getTotalMemory() {
  return TOTAL_MEMORY;
}

// Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 0x63736d65; /* 'emsc' */
HEAP16[1] = 0x6373;
if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  checkStackCookie();
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    SAFE_HEAP_STORE(((buffer++)|0), ((str.charCodeAt(i))|0), 1);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) SAFE_HEAP_STORE(((buffer)|0), ((0)|0), 1);
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

assert(Math['imul'] && Math['fround'] && Math['clz32'] && Math['trunc'], 'this is a legacy browser, build with LEGACY_VM_SUPPORT');

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;



var /* show errors on likely calls to FS when it was not included */ FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },
  loadFilesFromDB: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;



// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}





// === Body ===

var ASM_CONSTS = [];





STATIC_BASE = GLOBAL_BASE;

STATICTOP = STATIC_BASE + 101184;
/* global initializers */  __ATINIT__.push();


memoryInitializer = "game.html.mem";





/* no memory initializer */
var tempDoublePtr = STATICTOP; STATICTOP += 16;

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


  function ___lock() {}

  
    

  
  var SYSCALLS={varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = ((SAFE_HEAP_LOAD((((SYSCALLS.varargs)-(4))|0), 4, 0))|0);
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
      var offset = offset_low;
      FS.llseek(stream, offset, whence);
      SAFE_HEAP_STORE(((result)|0), ((stream.position)|0), 4);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  function flush_NO_FILESYSTEM() {
      // flush anything remaining in the buffers during shutdown
      var fflush = Module["_fflush"];
      if (fflush) fflush(0);
      var printChar = ___syscall146.printChar;
      if (!printChar) return;
      var buffers = ___syscall146.buffers;
      if (buffers[1].length) printChar(1, 10);
      if (buffers[2].length) printChar(2, 10);
    }function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      // hack to support printf in NO_FILESYSTEM
      var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      var ret = 0;
      if (!___syscall146.buffers) {
        ___syscall146.buffers = [null, [], []]; // 1 => stdout, 2 => stderr
        ___syscall146.printChar = function(stream, curr) {
          var buffer = ___syscall146.buffers[stream];
          assert(buffer);
          if (curr === 0 || curr === 10) {
            (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        };
      }
      for (var i = 0; i < iovcnt; i++) {
        var ptr = ((SAFE_HEAP_LOAD((((iov)+(i*8))|0), 4, 0))|0);
        var len = ((SAFE_HEAP_LOAD((((iov)+(i*8 + 4))|0), 4, 0))|0);
        for (var j = 0; j < len; j++) {
          ___syscall146.printChar(stream, HEAPU8[ptr+j]);
        }
        ret += len;
      }
      return ret;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  
   
  
   
  
     

  function ___unlock() {}

  function _abort() {
      Module['abort']();
    }

   

   

  function _disable_interrupts() {
      // console.log("disable_interrupts");
      // @todo
    }

  function _display_off() {
      // console.log("display_off");
      // @todo
    }

  
  
  var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) err('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullscreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
  
        // Canvas event setup
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === Module['canvas'] ||
                                document['mozPointerLockElement'] === Module['canvas'] ||
                                document['webkitPointerLockElement'] === Module['canvas'] ||
                                document['msPointerLockElement'] === Module['canvas'];
        }
        var canvas = Module['canvas'];
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
  
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && Module['canvas'].requestPointerLock) {
                Module['canvas'].requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullscreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullscreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullscreenChange() {
          Browser.isFullscreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['fullscreenElement'] || document['mozFullScreenElement'] ||
               document['msFullscreenElement'] || document['webkitFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.exitFullscreen = document['exitFullscreen'] ||
                                    document['cancelFullScreen'] ||
                                    document['mozCancelFullScreen'] ||
                                    document['msExitFullscreen'] ||
                                    document['webkitCancelFullScreen'] ||
                                    function() {};
            canvas.exitFullscreen = canvas.exitFullscreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullscreen = true;
            if (Browser.resizeCanvas) {
              Browser.setFullscreenCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          } else {
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
  
            if (Browser.resizeCanvas) {
              Browser.setWindowedCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullscreen);
          if (Module['onFullscreen']) Module['onFullscreen'](Browser.isFullscreen);
        }
  
        if (!Browser.fullscreenHandlersInstalled) {
          Browser.fullscreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullscreenChange, false);
          document.addEventListener('mozfullscreenchange', fullscreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullscreenChange, false);
          document.addEventListener('MSFullscreenChange', fullscreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullscreen = canvasContainer['requestFullscreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullscreen'] ? function() { canvasContainer['webkitRequestFullscreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null) ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullscreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullscreen();
        }
      },requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
          err('Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead.');
          Browser.requestFullScreen = function(lockPointer, resizeCanvas, vrDevice) {
            return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
          }
          return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll':
            delta = event.detail;
            break;
          case 'mousewheel':
            delta = event.wheelDelta;
            break;
          case 'wheel':
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
  
          // check if SDL is available
          if (typeof SDL != "undefined") {
            Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
            Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
            // just add the mouse delta to the current absolut mouse position
            // FIXME: ideally this should be clamped against the canvas size and zero
            Browser.mouseX += Browser.mouseMovementX;
            Browser.mouseY += Browser.mouseMovementY;
          }
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
  
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            }
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency('al ' + url) : '';
        Module['readAsync'](url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (dep) removeRunDependency(dep);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (dep) addRunDependency(dep);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullscreenCanvasSize:function () {
        // check if SDL is available
        if (typeof SDL != "undefined") {
          var flags = ((SAFE_HEAP_LOAD(((SDL.screen)|0), 4, 1))|0);
          flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
          SAFE_HEAP_STORE(((SDL.screen)|0), ((flags)|0), 4)
        }
        Browser.updateCanvasDimensions(Module['canvas']);
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available
        if (typeof SDL != "undefined") {
          var flags = ((SAFE_HEAP_LOAD(((SDL.screen)|0), 4, 1))|0);
          flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
          SAFE_HEAP_STORE(((SDL.screen)|0), ((flags)|0), 4)
        }
        Browser.updateCanvasDimensions(Module['canvas']);
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['fullscreenElement'] || document['mozFullScreenElement'] ||
             document['msFullscreenElement'] || document['webkitFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        console.error('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now())|0;
          setTimeout(Browser.mainLoop.runner, timeUntilNextTick); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      } else if (mode == 2 /*EM_TIMING_SETIMMEDIATE*/) {
        if (typeof setImmediate === 'undefined') {
          // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
          var setImmediates = [];
          var emscriptenMainLoopMessageId = 'setimmediate';
          function Browser_setImmediate_messageHandler(event) {
            // When called in current thread or Worker, the main loop ID is structured slightly different to accommodate for --proxy-to-worker runtime listening to Worker events,
            // so check for both cases.
            if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          }
          addEventListener("message", Browser_setImmediate_messageHandler, true);
          setImmediate = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);
            if (ENVIRONMENT_IS_WORKER) {
              if (Module['setImmediates'] === undefined) Module['setImmediates'] = [];
              Module['setImmediates'].push(func);
              postMessage({target: emscriptenMainLoopMessageId}); // In --proxy-to-worker, route the message via proxyClient.js
            } else postMessage(emscriptenMainLoopMessageId, "*"); // On the main thread, can just send the message to itself.
          }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          setImmediate(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'immediate';
      }
      return 0;
    }
  
  function _emscripten_get_now() { abort() }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var browserIterationFunc;
      if (typeof arg !== 'undefined') {
        browserIterationFunc = function() {
          Module['dynCall_vi'](func, arg);
        };
      } else {
        browserIterationFunc = function() {
          Module['dynCall_v'](func);
        };
      }
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
  
          // catches pause/resume main loop from blocker execution
          if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        } else if (Browser.mainLoop.timingMode == 0/*EM_TIMING_SETTIMEOUT*/) {
          Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          err('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(browserIterationFunc);
  
        checkStackCookie();
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }

  function _emscripten_update_registers(
      SCX_REG,
      SCY_REG,
      WX_REG,
      WY_REG,
      LYC_REG,
      LCDC_REG,
      BGP_REG,
      OBP0_REG,
      OBP1_REG
    ) {
      if (SCX_REG !== g.SCX_REG) {
        g.SCX_REG = uint(SCX_REG);
      }
      if (SCY_REG !== g.SCY_REG) {
        g.SCY_REG = uint(SCY_REG);
      }
      if (WX_REG !== g.WX_REG) {
        g.WX_REG = uint(WX_REG);
      }
      if (WY_REG !== g.WY_REG) {
        g.WY_REG = uint(WY_REG);
      }
      if (LYC_REG !== g.LYC_REG) {
        g.LYC_REG = uint(LYC_REG);
      }
      if (LCDC_REG !== g.LCDC_REG) {
        g.LCDC_REG = uint(LCDC_REG);
      }
      if (BGP_REG !== g.BGP_REG) {
        g.BGP_REG = uint(BGP_REG);
      }
      if (OBP0_REG !== g.OBP0_REG) {
        g.OBP0_REG = uint(OBP0_REG);
      }
      if (OBP1_REG !== g.OBP1_REG) {
        g.OBP1_REG = uint(OBP1_REG);
      }
    }



  function _joypad() {
      return g.joypad();
    }

   

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 

   

  function _move_sprite(nb, x, y) {
      g.move_sprite(uint(nb), uint(x), uint(y));
    }

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) SAFE_HEAP_STORE(((Module['___errno_location']())|0), ((value)|0), 4);
      else err('failed to set errno from JS');
      return value;
    } 

  function _set_bkg_data(first_tile, nb_tiles, data) {
      var size = uint(nb_tiles) * 16;
      var arr = [];
      for (var i = 0; i < size; i++) {
        arr[i] = (getValue(data + i, "i8") + 256) & 255;
      }
      g.set_bkg_data(uint(first_tile), uint(nb_tiles), arr);
    }

  function _set_bkg_tiles(x, y, w, h, tiles) {
      var size = uint(w) * uint(h);
      var arr = [];
      for (var i = 0; i < size; i++) {
        arr[i] = uint(getValue(tiles + i, "i8"));
      }
      g.set_bkg_tiles(uint(x), uint(y), uint(w), uint(h), arr);
    }

  function _set_interrupts(a) {
      a;
      // console.log("set_interrupts", a);/
      // @todo
    }

  function _set_sprite_data(first_tile, nb_tiles, data) {
      var size = uint(nb_tiles) * 16;
      var arr = [];
      for (var i = 0; i < size; i++) {
        arr[i] = uint(getValue(data + i, "i8"));
      }
      g.set_sprite_data(uint(first_tile), uint(nb_tiles), arr);
    }

  function _set_sprite_prop(nb, prop) {
      g.set_sprite_prop(uint(nb), uint(prop));
    }

  function _set_sprite_tile(nb, tile) {
      g.set_sprite_tile(uint(nb), uint(tile));
    }

  function _set_win_tiles(x, y, w, h, tiles) {
      var size = uint(w) * uint(h);
      var arr = [];
      for (var i = 0; i < size; i++) {
        arr[i] = uint(getValue(tiles + i, "i8"));
      }
      g.set_win_tiles(uint(x), uint(y), uint(w), uint(h), arr);
    }

  function _wait_vbl_done() {
      g.wait_vbl_done();
    }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { err("Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead."); Module["requestFullScreen"] = Module["requestFullscreen"]; Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
  Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) { return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes) };
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function _emscripten_get_now_actual() {
      var t = process['hrtime']();
      return t[0] * 1e3 + t[1] / 1e6;
    };
  } else if (typeof dateNow !== 'undefined') {
    _emscripten_get_now = dateNow;
  } else if (typeof self === 'object' && self['performance'] && typeof self['performance']['now'] === 'function') {
    _emscripten_get_now = function() { return self['performance']['now'](); };
  } else if (typeof performance === 'object' && typeof performance['now'] === 'function') {
    _emscripten_get_now = function() { return performance['now'](); };
  } else {
    _emscripten_get_now = Date.now;
  };
DYNAMICTOP_PTR = staticAlloc(4);

STACK_BASE = STACKTOP = alignMemory(STATICTOP);

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = alignMemory(STACK_MAX);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;

staticSealed = true; // seal the static portion of memory

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

var ASSERTIONS = true;

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}



function nullFunc_ii(x) { err("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iiii(x) { err("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_v(x) { err("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };

Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "abortStackOverflow": abortStackOverflow, "segfault": segfault, "alignfault": alignfault, "ftfault": ftfault, "nullFunc_ii": nullFunc_ii, "nullFunc_iiii": nullFunc_iiii, "nullFunc_v": nullFunc_v, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_v": invoke_v, "___lock": ___lock, "___setErrNo": ___setErrNo, "___syscall140": ___syscall140, "___syscall146": ___syscall146, "___syscall54": ___syscall54, "___syscall6": ___syscall6, "___unlock": ___unlock, "_abort": _abort, "_disable_interrupts": _disable_interrupts, "_display_off": _display_off, "_emscripten_get_now": _emscripten_get_now, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_emscripten_update_registers": _emscripten_update_registers, "_joypad": _joypad, "_move_sprite": _move_sprite, "_set_bkg_data": _set_bkg_data, "_set_bkg_tiles": _set_bkg_tiles, "_set_interrupts": _set_interrupts, "_set_sprite_data": _set_sprite_data, "_set_sprite_prop": _set_sprite_prop, "_set_sprite_tile": _set_sprite_tile, "_set_win_tiles": _set_win_tiles, "_wait_vbl_done": _wait_vbl_done, "flush_NO_FILESYSTEM": flush_NO_FILESYSTEM, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX };
// EMSCRIPTEN_START_ASM
var asm = (/** @suppress {uselessCode} */ function(global, env, buffer) {
'use asm';


  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);

  var DYNAMICTOP_PTR=env.DYNAMICTOP_PTR|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntS = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;

  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_max=global.Math.max;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var enlargeMemory=env.enlargeMemory;
  var getTotalMemory=env.getTotalMemory;
  var abortOnCannotGrowMemory=env.abortOnCannotGrowMemory;
  var abortStackOverflow=env.abortStackOverflow;
  var segfault=env.segfault;
  var alignfault=env.alignfault;
  var ftfault=env.ftfault;
  var nullFunc_ii=env.nullFunc_ii;
  var nullFunc_iiii=env.nullFunc_iiii;
  var nullFunc_v=env.nullFunc_v;
  var invoke_ii=env.invoke_ii;
  var invoke_iiii=env.invoke_iiii;
  var invoke_v=env.invoke_v;
  var ___lock=env.___lock;
  var ___setErrNo=env.___setErrNo;
  var ___syscall140=env.___syscall140;
  var ___syscall146=env.___syscall146;
  var ___syscall54=env.___syscall54;
  var ___syscall6=env.___syscall6;
  var ___unlock=env.___unlock;
  var _abort=env._abort;
  var _disable_interrupts=env._disable_interrupts;
  var _display_off=env._display_off;
  var _emscripten_get_now=env._emscripten_get_now;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _emscripten_update_registers=env._emscripten_update_registers;
  var _joypad=env._joypad;
  var _move_sprite=env._move_sprite;
  var _set_bkg_data=env._set_bkg_data;
  var _set_bkg_tiles=env._set_bkg_tiles;
  var _set_interrupts=env._set_interrupts;
  var _set_sprite_data=env._set_sprite_data;
  var _set_sprite_prop=env._set_sprite_prop;
  var _set_sprite_tile=env._set_sprite_tile;
  var _set_win_tiles=env._set_win_tiles;
  var _wait_vbl_done=env._wait_vbl_done;
  var flush_NO_FILESYSTEM=env.flush_NO_FILESYSTEM;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS

function _malloc($0) {
 $0 = $0 | 0;
 var $$0 = 0, $$0$i$i = 0, $$0$i$i$i = 0, $$0$i16$i = 0, $$0187$i = 0, $$0189$i = 0, $$0190$i = 0, $$0191$i = 0, $$0197 = 0, $$0199 = 0, $$02065$i$i = 0, $$0207$lcssa$i$i = 0, $$02074$i$i = 0, $$0211$i$i = 0, $$0212$i$i = 0, $$024372$i = 0, $$0286$i$i = 0, $$028711$i$i = 0, $$0288$lcssa$i$i = 0, $$028810$i$i = 0, $$0294$i$i = 0, $$0295$i$i = 0, $$0340$i = 0, $$034217$i = 0, $$0343$lcssa$i = 0, $$034316$i = 0, $$0345$i = 0, $$0351$i = 0, $$0357$i = 0, $$0358$i = 0, $$0360$i = 0, $$0361$i = 0, $$0367$i = 0, $$1194$i = 0, $$1194$i$be = 0, $$1194$i$ph = 0, $$1196$i = 0, $$1196$i$be = 0, $$1196$i$ph = 0, $$124471$i = 0, $$1290$i$i = 0, $$1290$i$i$be = 0, $$1290$i$i$ph = 0, $$1292$i$i = 0, $$1292$i$i$be = 0, $$1292$i$i$ph = 0, $$1341$i = 0, $$1346$i = 0, $$1362$i = 0, $$1369$i = 0, $$1369$i$be = 0, $$1369$i$ph = 0, $$1373$i = 0, $$1373$i$be = 0, $$1373$i$ph = 0, $$2234243136$i = 0, $$2247$ph$i = 0, $$2253$ph$i = 0, $$2353$i = 0, $$3$i = 0, $$3$i$i = 0, $$3$i203 = 0, $$3$i203218 = 0, $$3348$i = 0, $$3371$i = 0, $$4$lcssa$i = 0, $$420$i = 0, $$420$i$ph = 0, $$4236$i = 0, $$4349$lcssa$i = 0, $$434919$i = 0, $$434919$i$ph = 0, $$4355$i = 0, $$535618$i = 0, $$535618$i$ph = 0, $$723947$i = 0, $$748$i = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i18$iZ2D = 0, $$pre$phi$i209Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi17$i$iZ2D = 0, $$pre$phiZ2D = 0, $1 = 0, $1000 = 0, $1003 = 0, $1008 = 0, $101 = 0, $1014 = 0, $1017 = 0, $1018 = 0, $102 = 0, $1025 = 0, $1037 = 0, $1042 = 0, $1049 = 0, $1050 = 0, $1051 = 0, $1060 = 0, $1062 = 0, $1063 = 0, $1064 = 0, $108 = 0, $112 = 0, $114 = 0, $115 = 0, $117 = 0, $119 = 0, $121 = 0, $123 = 0, $125 = 0, $127 = 0, $129 = 0, $134 = 0, $14 = 0, $140 = 0, $143 = 0, $146 = 0, $149 = 0, $150 = 0, $151 = 0, $153 = 0, $156 = 0, $158 = 0, $16 = 0, $161 = 0, $163 = 0, $166 = 0, $169 = 0, $17 = 0, $170 = 0, $172 = 0, $173 = 0, $175 = 0, $176 = 0, $178 = 0, $179 = 0, $18 = 0, $184 = 0, $185 = 0, $19 = 0, $193 = 0, $198 = 0, $20 = 0, $202 = 0, $208 = 0, $215 = 0, $219 = 0, $228 = 0, $229 = 0, $231 = 0, $232 = 0, $236 = 0, $237 = 0, $245 = 0, $246 = 0, $247 = 0, $249 = 0, $250 = 0, $255 = 0, $256 = 0, $259 = 0, $261 = 0, $264 = 0, $269 = 0, $27 = 0, $276 = 0, $286 = 0, $290 = 0, $299 = 0, $30 = 0, $302 = 0, $306 = 0, $308 = 0, $309 = 0, $311 = 0, $313 = 0, $315 = 0, $317 = 0, $319 = 0, $321 = 0, $323 = 0, $333 = 0, $334 = 0, $336 = 0, $34 = 0, $341 = 0, $346 = 0, $348 = 0, $351 = 0, $353 = 0, $356 = 0, $358 = 0, $361 = 0, $364 = 0, $365 = 0, $367 = 0, $368 = 0, $37 = 0, $370 = 0, $371 = 0, $373 = 0, $374 = 0, $379 = 0, $380 = 0, $385 = 0, $388 = 0, $393 = 0, $397 = 0, $403 = 0, $41 = 0, $410 = 0, $414 = 0, $422 = 0, $425 = 0, $426 = 0, $427 = 0, $431 = 0, $432 = 0, $438 = 0, $44 = 0, $443 = 0, $444 = 0, $447 = 0, $449 = 0, $452 = 0, $457 = 0, $463 = 0, $465 = 0, $467 = 0, $469 = 0, $47 = 0, $475 = 0, $487 = 0, $49 = 0, $492 = 0, $499 = 0, $50 = 0, $500 = 0, $501 = 0, $510 = 0, $512 = 0, $513 = 0, $515 = 0, $52 = 0, $524 = 0, $528 = 0, $530 = 0, $531 = 0, $532 = 0, $54 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $550 = 0, $552 = 0, $553 = 0, $559 = 0, $56 = 0, $561 = 0, $568 = 0, $570 = 0, $572 = 0, $573 = 0, $574 = 0, $58 = 0, $582 = 0, $583 = 0, $586 = 0, $590 = 0, $593 = 0, $596 = 0, $6 = 0, $60 = 0, $602 = 0, $606 = 0, $610 = 0, $619 = 0, $62 = 0, $620 = 0, $626 = 0, $628 = 0, $632 = 0, $635 = 0, $637 = 0, $64 = 0, $641 = 0, $643 = 0, $648 = 0, $649 = 0, $650 = 0, $656 = 0, $658 = 0, $662 = 0, $664 = 0, $67 = 0, $673 = 0, $675 = 0, $680 = 0, $681 = 0, $682 = 0, $688 = 0, $69 = 0, $690 = 0, $694 = 0, $7 = 0, $70 = 0, $700 = 0, $704 = 0, $71 = 0, $710 = 0, $712 = 0, $718 = 0, $72 = 0, $722 = 0, $723 = 0, $728 = 0, $73 = 0, $734 = 0, $739 = 0, $742 = 0, $743 = 0, $746 = 0, $748 = 0, $750 = 0, $753 = 0, $764 = 0, $769 = 0, $77 = 0, $771 = 0, $774 = 0, $776 = 0, $779 = 0, $782 = 0, $783 = 0, $784 = 0, $786 = 0, $788 = 0, $789 = 0, $791 = 0, $792 = 0, $797 = 0, $798 = 0, $8 = 0, $80 = 0, $807 = 0, $812 = 0, $815 = 0, $816 = 0, $822 = 0, $83 = 0, $830 = 0, $836 = 0, $839 = 0, $84 = 0, $840 = 0, $841 = 0, $845 = 0, $846 = 0, $852 = 0, $857 = 0, $858 = 0, $861 = 0, $863 = 0, $866 = 0, $87 = 0, $871 = 0, $877 = 0, $879 = 0, $881 = 0, $882 = 0, $889 = 0, $9 = 0, $901 = 0, $906 = 0, $913 = 0, $914 = 0, $915 = 0, $92 = 0, $923 = 0, $927 = 0, $93 = 0, $931 = 0, $933 = 0, $939 = 0, $940 = 0, $942 = 0, $943 = 0, $945 = 0, $947 = 0, $95 = 0, $952 = 0, $953 = 0, $954 = 0, $96 = 0, $960 = 0, $962 = 0, $968 = 0, $973 = 0, $976 = 0, $977 = 0, $978 = 0, $98 = 0, $982 = 0, $983 = 0, $989 = 0, $994 = 0, $995 = 0, $998 = 0, $spec$select$i205 = 0, $spec$select3$i = 0, $spec$select49$i = 0, label = 0, sp = 0, $962$looptemp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16);
 $1 = sp;
 do if ($0 >>> 0 < 245) {
  $6 = $0 >>> 0 < 11 ? 16 : $0 + 11 & -8;
  $7 = $6 >>> 3;
  $8 = SAFE_HEAP_LOAD(25117 * 4 | 0, 4, 0) | 0 | 0;
  $9 = $8 >>> $7;
  if ($9 & 3 | 0) {
   $14 = ($9 & 1 ^ 1) + $7 | 0;
   $16 = 100508 + ($14 << 1 << 2) | 0;
   $17 = $16 + 8 | 0;
   $18 = SAFE_HEAP_LOAD($17 | 0, 4, 0) | 0 | 0;
   $19 = $18 + 8 | 0;
   $20 = SAFE_HEAP_LOAD($19 | 0, 4, 0) | 0 | 0;
   do if (($20 | 0) == ($16 | 0)) SAFE_HEAP_STORE(25117 * 4 | 0, $8 & ~(1 << $14) | 0, 4); else {
    if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $20 >>> 0) _abort();
    $27 = $20 + 12 | 0;
    if ((SAFE_HEAP_LOAD($27 | 0, 4, 0) | 0 | 0) == ($18 | 0)) {
     SAFE_HEAP_STORE($27 | 0, $16 | 0, 4);
     SAFE_HEAP_STORE($17 | 0, $20 | 0, 4);
     break;
    } else _abort();
   } while (0);
   $30 = $14 << 3;
   SAFE_HEAP_STORE($18 + 4 | 0, $30 | 3 | 0, 4);
   $34 = $18 + $30 + 4 | 0;
   SAFE_HEAP_STORE($34 | 0, SAFE_HEAP_LOAD($34 | 0, 4, 0) | 0 | 1 | 0, 4);
   $$0 = $19;
   STACKTOP = sp;
   return $$0 | 0;
  }
  $37 = SAFE_HEAP_LOAD(25119 * 4 | 0, 4, 0) | 0 | 0;
  if ($6 >>> 0 > $37 >>> 0) {
   if ($9 | 0) {
    $41 = 2 << $7;
    $44 = $9 << $7 & ($41 | 0 - $41);
    $47 = ($44 & 0 - $44) + -1 | 0;
    $49 = $47 >>> 12 & 16;
    $50 = $47 >>> $49;
    $52 = $50 >>> 5 & 8;
    $54 = $50 >>> $52;
    $56 = $54 >>> 2 & 4;
    $58 = $54 >>> $56;
    $60 = $58 >>> 1 & 2;
    $62 = $58 >>> $60;
    $64 = $62 >>> 1 & 1;
    $67 = ($52 | $49 | $56 | $60 | $64) + ($62 >>> $64) | 0;
    $69 = 100508 + ($67 << 1 << 2) | 0;
    $70 = $69 + 8 | 0;
    $71 = SAFE_HEAP_LOAD($70 | 0, 4, 0) | 0 | 0;
    $72 = $71 + 8 | 0;
    $73 = SAFE_HEAP_LOAD($72 | 0, 4, 0) | 0 | 0;
    do if (($73 | 0) == ($69 | 0)) {
     $77 = $8 & ~(1 << $67);
     SAFE_HEAP_STORE(25117 * 4 | 0, $77 | 0, 4);
     $98 = $77;
    } else {
     if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $73 >>> 0) _abort();
     $80 = $73 + 12 | 0;
     if ((SAFE_HEAP_LOAD($80 | 0, 4, 0) | 0 | 0) == ($71 | 0)) {
      SAFE_HEAP_STORE($80 | 0, $69 | 0, 4);
      SAFE_HEAP_STORE($70 | 0, $73 | 0, 4);
      $98 = $8;
      break;
     } else _abort();
    } while (0);
    $83 = $67 << 3;
    $84 = $83 - $6 | 0;
    SAFE_HEAP_STORE($71 + 4 | 0, $6 | 3 | 0, 4);
    $87 = $71 + $6 | 0;
    SAFE_HEAP_STORE($87 + 4 | 0, $84 | 1 | 0, 4);
    SAFE_HEAP_STORE($71 + $83 | 0, $84 | 0, 4);
    if ($37 | 0) {
     $92 = SAFE_HEAP_LOAD(25122 * 4 | 0, 4, 0) | 0 | 0;
     $93 = $37 >>> 3;
     $95 = 100508 + ($93 << 1 << 2) | 0;
     $96 = 1 << $93;
     if (!($98 & $96)) {
      SAFE_HEAP_STORE(25117 * 4 | 0, $98 | $96 | 0, 4);
      $$0199 = $95;
      $$pre$phiZ2D = $95 + 8 | 0;
     } else {
      $101 = $95 + 8 | 0;
      $102 = SAFE_HEAP_LOAD($101 | 0, 4, 0) | 0 | 0;
      if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $102 >>> 0) _abort(); else {
       $$0199 = $102;
       $$pre$phiZ2D = $101;
      }
     }
     SAFE_HEAP_STORE($$pre$phiZ2D | 0, $92 | 0, 4);
     SAFE_HEAP_STORE($$0199 + 12 | 0, $92 | 0, 4);
     SAFE_HEAP_STORE($92 + 8 | 0, $$0199 | 0, 4);
     SAFE_HEAP_STORE($92 + 12 | 0, $95 | 0, 4);
    }
    SAFE_HEAP_STORE(25119 * 4 | 0, $84 | 0, 4);
    SAFE_HEAP_STORE(25122 * 4 | 0, $87 | 0, 4);
    $$0 = $72;
    STACKTOP = sp;
    return $$0 | 0;
   }
   $108 = SAFE_HEAP_LOAD(25118 * 4 | 0, 4, 0) | 0 | 0;
   if (!$108) $$0197 = $6; else {
    $112 = ($108 & 0 - $108) + -1 | 0;
    $114 = $112 >>> 12 & 16;
    $115 = $112 >>> $114;
    $117 = $115 >>> 5 & 8;
    $119 = $115 >>> $117;
    $121 = $119 >>> 2 & 4;
    $123 = $119 >>> $121;
    $125 = $123 >>> 1 & 2;
    $127 = $123 >>> $125;
    $129 = $127 >>> 1 & 1;
    $134 = SAFE_HEAP_LOAD(100772 + (($117 | $114 | $121 | $125 | $129) + ($127 >>> $129) << 2) | 0, 4, 0) | 0 | 0;
    $$0189$i = $134;
    $$0190$i = $134;
    $$0191$i = ((SAFE_HEAP_LOAD($134 + 4 | 0, 4, 0) | 0) & -8) - $6 | 0;
    while (1) {
     $140 = SAFE_HEAP_LOAD($$0189$i + 16 | 0, 4, 0) | 0 | 0;
     if (!$140) {
      $143 = SAFE_HEAP_LOAD($$0189$i + 20 | 0, 4, 0) | 0 | 0;
      if (!$143) break; else $146 = $143;
     } else $146 = $140;
     $149 = ((SAFE_HEAP_LOAD($146 + 4 | 0, 4, 0) | 0) & -8) - $6 | 0;
     $150 = $149 >>> 0 < $$0191$i >>> 0;
     $$0189$i = $146;
     $$0190$i = $150 ? $146 : $$0190$i;
     $$0191$i = $150 ? $149 : $$0191$i;
    }
    $151 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
    if ($151 >>> 0 > $$0190$i >>> 0) _abort();
    $153 = $$0190$i + $6 | 0;
    if ($153 >>> 0 <= $$0190$i >>> 0) _abort();
    $156 = SAFE_HEAP_LOAD($$0190$i + 24 | 0, 4, 0) | 0 | 0;
    $158 = SAFE_HEAP_LOAD($$0190$i + 12 | 0, 4, 0) | 0 | 0;
    do if (($158 | 0) == ($$0190$i | 0)) {
     $169 = $$0190$i + 20 | 0;
     $170 = SAFE_HEAP_LOAD($169 | 0, 4, 0) | 0 | 0;
     if (!$170) {
      $172 = $$0190$i + 16 | 0;
      $173 = SAFE_HEAP_LOAD($172 | 0, 4, 0) | 0 | 0;
      if (!$173) {
       $$3$i = 0;
       break;
      } else {
       $$1194$i$ph = $173;
       $$1196$i$ph = $172;
      }
     } else {
      $$1194$i$ph = $170;
      $$1196$i$ph = $169;
     }
     $$1194$i = $$1194$i$ph;
     $$1196$i = $$1196$i$ph;
     while (1) {
      $175 = $$1194$i + 20 | 0;
      $176 = SAFE_HEAP_LOAD($175 | 0, 4, 0) | 0 | 0;
      if (!$176) {
       $178 = $$1194$i + 16 | 0;
       $179 = SAFE_HEAP_LOAD($178 | 0, 4, 0) | 0 | 0;
       if (!$179) break; else {
        $$1194$i$be = $179;
        $$1196$i$be = $178;
       }
      } else {
       $$1194$i$be = $176;
       $$1196$i$be = $175;
      }
      $$1194$i = $$1194$i$be;
      $$1196$i = $$1196$i$be;
     }
     if ($151 >>> 0 > $$1196$i >>> 0) _abort(); else {
      SAFE_HEAP_STORE($$1196$i | 0, 0 | 0, 4);
      $$3$i = $$1194$i;
      break;
     }
    } else {
     $161 = SAFE_HEAP_LOAD($$0190$i + 8 | 0, 4, 0) | 0 | 0;
     if ($151 >>> 0 > $161 >>> 0) _abort();
     $163 = $161 + 12 | 0;
     if ((SAFE_HEAP_LOAD($163 | 0, 4, 0) | 0 | 0) != ($$0190$i | 0)) _abort();
     $166 = $158 + 8 | 0;
     if ((SAFE_HEAP_LOAD($166 | 0, 4, 0) | 0 | 0) == ($$0190$i | 0)) {
      SAFE_HEAP_STORE($163 | 0, $158 | 0, 4);
      SAFE_HEAP_STORE($166 | 0, $161 | 0, 4);
      $$3$i = $158;
      break;
     } else _abort();
    } while (0);
    L78 : do if ($156 | 0) {
     $184 = SAFE_HEAP_LOAD($$0190$i + 28 | 0, 4, 0) | 0 | 0;
     $185 = 100772 + ($184 << 2) | 0;
     do if (($$0190$i | 0) == (SAFE_HEAP_LOAD($185 | 0, 4, 0) | 0 | 0)) {
      SAFE_HEAP_STORE($185 | 0, $$3$i | 0, 4);
      if (!$$3$i) {
       SAFE_HEAP_STORE(25118 * 4 | 0, $108 & ~(1 << $184) | 0, 4);
       break L78;
      }
     } else if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $156 >>> 0) _abort(); else {
      $193 = $156 + 16 | 0;
      SAFE_HEAP_STORE(((SAFE_HEAP_LOAD($193 | 0, 4, 0) | 0 | 0) == ($$0190$i | 0) ? $193 : $156 + 20 | 0) | 0, $$3$i | 0, 4);
      if (!$$3$i) break L78; else break;
     } while (0);
     $198 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
     if ($198 >>> 0 > $$3$i >>> 0) _abort();
     SAFE_HEAP_STORE($$3$i + 24 | 0, $156 | 0, 4);
     $202 = SAFE_HEAP_LOAD($$0190$i + 16 | 0, 4, 0) | 0 | 0;
     do if ($202 | 0) if ($198 >>> 0 > $202 >>> 0) _abort(); else {
      SAFE_HEAP_STORE($$3$i + 16 | 0, $202 | 0, 4);
      SAFE_HEAP_STORE($202 + 24 | 0, $$3$i | 0, 4);
      break;
     } while (0);
     $208 = SAFE_HEAP_LOAD($$0190$i + 20 | 0, 4, 0) | 0 | 0;
     if ($208 | 0) if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $208 >>> 0) _abort(); else {
      SAFE_HEAP_STORE($$3$i + 20 | 0, $208 | 0, 4);
      SAFE_HEAP_STORE($208 + 24 | 0, $$3$i | 0, 4);
      break;
     }
    } while (0);
    if ($$0191$i >>> 0 < 16) {
     $215 = $$0191$i + $6 | 0;
     SAFE_HEAP_STORE($$0190$i + 4 | 0, $215 | 3 | 0, 4);
     $219 = $$0190$i + $215 + 4 | 0;
     SAFE_HEAP_STORE($219 | 0, SAFE_HEAP_LOAD($219 | 0, 4, 0) | 0 | 1 | 0, 4);
    } else {
     SAFE_HEAP_STORE($$0190$i + 4 | 0, $6 | 3 | 0, 4);
     SAFE_HEAP_STORE($153 + 4 | 0, $$0191$i | 1 | 0, 4);
     SAFE_HEAP_STORE($153 + $$0191$i | 0, $$0191$i | 0, 4);
     if ($37 | 0) {
      $228 = SAFE_HEAP_LOAD(25122 * 4 | 0, 4, 0) | 0 | 0;
      $229 = $37 >>> 3;
      $231 = 100508 + ($229 << 1 << 2) | 0;
      $232 = 1 << $229;
      if (!($232 & $8)) {
       SAFE_HEAP_STORE(25117 * 4 | 0, $232 | $8 | 0, 4);
       $$0187$i = $231;
       $$pre$phi$iZ2D = $231 + 8 | 0;
      } else {
       $236 = $231 + 8 | 0;
       $237 = SAFE_HEAP_LOAD($236 | 0, 4, 0) | 0 | 0;
       if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $237 >>> 0) _abort(); else {
        $$0187$i = $237;
        $$pre$phi$iZ2D = $236;
       }
      }
      SAFE_HEAP_STORE($$pre$phi$iZ2D | 0, $228 | 0, 4);
      SAFE_HEAP_STORE($$0187$i + 12 | 0, $228 | 0, 4);
      SAFE_HEAP_STORE($228 + 8 | 0, $$0187$i | 0, 4);
      SAFE_HEAP_STORE($228 + 12 | 0, $231 | 0, 4);
     }
     SAFE_HEAP_STORE(25119 * 4 | 0, $$0191$i | 0, 4);
     SAFE_HEAP_STORE(25122 * 4 | 0, $153 | 0, 4);
    }
    $$0 = $$0190$i + 8 | 0;
    STACKTOP = sp;
    return $$0 | 0;
   }
  } else $$0197 = $6;
 } else if ($0 >>> 0 > 4294967231) $$0197 = -1; else {
  $245 = $0 + 11 | 0;
  $246 = $245 & -8;
  $247 = SAFE_HEAP_LOAD(25118 * 4 | 0, 4, 0) | 0 | 0;
  if (!$247) $$0197 = $246; else {
   $249 = 0 - $246 | 0;
   $250 = $245 >>> 8;
   if (!$250) $$0357$i = 0; else if ($246 >>> 0 > 16777215) $$0357$i = 31; else {
    $255 = ($250 + 1048320 | 0) >>> 16 & 8;
    $256 = $250 << $255;
    $259 = ($256 + 520192 | 0) >>> 16 & 4;
    $261 = $256 << $259;
    $264 = ($261 + 245760 | 0) >>> 16 & 2;
    $269 = 14 - ($259 | $255 | $264) + ($261 << $264 >>> 15) | 0;
    $$0357$i = $246 >>> ($269 + 7 | 0) & 1 | $269 << 1;
   }
   $276 = SAFE_HEAP_LOAD(100772 + ($$0357$i << 2) | 0, 4, 0) | 0 | 0;
   L122 : do if (!$276) {
    $$2353$i = 0;
    $$3$i203 = 0;
    $$3348$i = $249;
    label = 85;
   } else {
    $$0340$i = 0;
    $$0345$i = $249;
    $$0351$i = $276;
    $$0358$i = $246 << (($$0357$i | 0) == 31 ? 0 : 25 - ($$0357$i >>> 1) | 0);
    $$0361$i = 0;
    while (1) {
     $286 = ((SAFE_HEAP_LOAD($$0351$i + 4 | 0, 4, 0) | 0) & -8) - $246 | 0;
     if ($286 >>> 0 < $$0345$i >>> 0) if (!$286) {
      $$420$i$ph = $$0351$i;
      $$434919$i$ph = 0;
      $$535618$i$ph = $$0351$i;
      label = 89;
      break L122;
     } else {
      $$1341$i = $$0351$i;
      $$1346$i = $286;
     } else {
      $$1341$i = $$0340$i;
      $$1346$i = $$0345$i;
     }
     $290 = SAFE_HEAP_LOAD($$0351$i + 20 | 0, 4, 0) | 0 | 0;
     $$0351$i = SAFE_HEAP_LOAD($$0351$i + 16 + ($$0358$i >>> 31 << 2) | 0, 4, 0) | 0 | 0;
     $$1362$i = ($290 | 0) == 0 | ($290 | 0) == ($$0351$i | 0) ? $$0361$i : $290;
     if (!$$0351$i) {
      $$2353$i = $$1362$i;
      $$3$i203 = $$1341$i;
      $$3348$i = $$1346$i;
      label = 85;
      break;
     } else {
      $$0340$i = $$1341$i;
      $$0345$i = $$1346$i;
      $$0358$i = $$0358$i << 1;
      $$0361$i = $$1362$i;
     }
    }
   } while (0);
   if ((label | 0) == 85) {
    if (($$2353$i | 0) == 0 & ($$3$i203 | 0) == 0) {
     $299 = 2 << $$0357$i;
     $302 = ($299 | 0 - $299) & $247;
     if (!$302) {
      $$0197 = $246;
      break;
     }
     $306 = ($302 & 0 - $302) + -1 | 0;
     $308 = $306 >>> 12 & 16;
     $309 = $306 >>> $308;
     $311 = $309 >>> 5 & 8;
     $313 = $309 >>> $311;
     $315 = $313 >>> 2 & 4;
     $317 = $313 >>> $315;
     $319 = $317 >>> 1 & 2;
     $321 = $317 >>> $319;
     $323 = $321 >>> 1 & 1;
     $$3$i203218 = 0;
     $$4355$i = SAFE_HEAP_LOAD(100772 + (($311 | $308 | $315 | $319 | $323) + ($321 >>> $323) << 2) | 0, 4, 0) | 0 | 0;
    } else {
     $$3$i203218 = $$3$i203;
     $$4355$i = $$2353$i;
    }
    if (!$$4355$i) {
     $$4$lcssa$i = $$3$i203218;
     $$4349$lcssa$i = $$3348$i;
    } else {
     $$420$i$ph = $$3$i203218;
     $$434919$i$ph = $$3348$i;
     $$535618$i$ph = $$4355$i;
     label = 89;
    }
   }
   if ((label | 0) == 89) {
    $$420$i = $$420$i$ph;
    $$434919$i = $$434919$i$ph;
    $$535618$i = $$535618$i$ph;
    while (1) {
     $333 = ((SAFE_HEAP_LOAD($$535618$i + 4 | 0, 4, 0) | 0) & -8) - $246 | 0;
     $334 = $333 >>> 0 < $$434919$i >>> 0;
     $spec$select$i205 = $334 ? $333 : $$434919$i;
     $spec$select3$i = $334 ? $$535618$i : $$420$i;
     $336 = SAFE_HEAP_LOAD($$535618$i + 16 | 0, 4, 0) | 0 | 0;
     if (!$336) $341 = SAFE_HEAP_LOAD($$535618$i + 20 | 0, 4, 0) | 0 | 0; else $341 = $336;
     if (!$341) {
      $$4$lcssa$i = $spec$select3$i;
      $$4349$lcssa$i = $spec$select$i205;
      break;
     } else {
      $$420$i = $spec$select3$i;
      $$434919$i = $spec$select$i205;
      $$535618$i = $341;
     }
    }
   }
   if (!$$4$lcssa$i) $$0197 = $246; else if ($$4349$lcssa$i >>> 0 < ((SAFE_HEAP_LOAD(25119 * 4 | 0, 4, 0) | 0 | 0) - $246 | 0) >>> 0) {
    $346 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
    if ($346 >>> 0 > $$4$lcssa$i >>> 0) _abort();
    $348 = $$4$lcssa$i + $246 | 0;
    if ($348 >>> 0 <= $$4$lcssa$i >>> 0) _abort();
    $351 = SAFE_HEAP_LOAD($$4$lcssa$i + 24 | 0, 4, 0) | 0 | 0;
    $353 = SAFE_HEAP_LOAD($$4$lcssa$i + 12 | 0, 4, 0) | 0 | 0;
    do if (($353 | 0) == ($$4$lcssa$i | 0)) {
     $364 = $$4$lcssa$i + 20 | 0;
     $365 = SAFE_HEAP_LOAD($364 | 0, 4, 0) | 0 | 0;
     if (!$365) {
      $367 = $$4$lcssa$i + 16 | 0;
      $368 = SAFE_HEAP_LOAD($367 | 0, 4, 0) | 0 | 0;
      if (!$368) {
       $$3371$i = 0;
       break;
      } else {
       $$1369$i$ph = $368;
       $$1373$i$ph = $367;
      }
     } else {
      $$1369$i$ph = $365;
      $$1373$i$ph = $364;
     }
     $$1369$i = $$1369$i$ph;
     $$1373$i = $$1373$i$ph;
     while (1) {
      $370 = $$1369$i + 20 | 0;
      $371 = SAFE_HEAP_LOAD($370 | 0, 4, 0) | 0 | 0;
      if (!$371) {
       $373 = $$1369$i + 16 | 0;
       $374 = SAFE_HEAP_LOAD($373 | 0, 4, 0) | 0 | 0;
       if (!$374) break; else {
        $$1369$i$be = $374;
        $$1373$i$be = $373;
       }
      } else {
       $$1369$i$be = $371;
       $$1373$i$be = $370;
      }
      $$1369$i = $$1369$i$be;
      $$1373$i = $$1373$i$be;
     }
     if ($346 >>> 0 > $$1373$i >>> 0) _abort(); else {
      SAFE_HEAP_STORE($$1373$i | 0, 0 | 0, 4);
      $$3371$i = $$1369$i;
      break;
     }
    } else {
     $356 = SAFE_HEAP_LOAD($$4$lcssa$i + 8 | 0, 4, 0) | 0 | 0;
     if ($346 >>> 0 > $356 >>> 0) _abort();
     $358 = $356 + 12 | 0;
     if ((SAFE_HEAP_LOAD($358 | 0, 4, 0) | 0 | 0) != ($$4$lcssa$i | 0)) _abort();
     $361 = $353 + 8 | 0;
     if ((SAFE_HEAP_LOAD($361 | 0, 4, 0) | 0 | 0) == ($$4$lcssa$i | 0)) {
      SAFE_HEAP_STORE($358 | 0, $353 | 0, 4);
      SAFE_HEAP_STORE($361 | 0, $356 | 0, 4);
      $$3371$i = $353;
      break;
     } else _abort();
    } while (0);
    L176 : do if (!$351) $469 = $247; else {
     $379 = SAFE_HEAP_LOAD($$4$lcssa$i + 28 | 0, 4, 0) | 0 | 0;
     $380 = 100772 + ($379 << 2) | 0;
     do if (($$4$lcssa$i | 0) == (SAFE_HEAP_LOAD($380 | 0, 4, 0) | 0 | 0)) {
      SAFE_HEAP_STORE($380 | 0, $$3371$i | 0, 4);
      if (!$$3371$i) {
       $385 = $247 & ~(1 << $379);
       SAFE_HEAP_STORE(25118 * 4 | 0, $385 | 0, 4);
       $469 = $385;
       break L176;
      }
     } else if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $351 >>> 0) _abort(); else {
      $388 = $351 + 16 | 0;
      SAFE_HEAP_STORE(((SAFE_HEAP_LOAD($388 | 0, 4, 0) | 0 | 0) == ($$4$lcssa$i | 0) ? $388 : $351 + 20 | 0) | 0, $$3371$i | 0, 4);
      if (!$$3371$i) {
       $469 = $247;
       break L176;
      } else break;
     } while (0);
     $393 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
     if ($393 >>> 0 > $$3371$i >>> 0) _abort();
     SAFE_HEAP_STORE($$3371$i + 24 | 0, $351 | 0, 4);
     $397 = SAFE_HEAP_LOAD($$4$lcssa$i + 16 | 0, 4, 0) | 0 | 0;
     do if ($397 | 0) if ($393 >>> 0 > $397 >>> 0) _abort(); else {
      SAFE_HEAP_STORE($$3371$i + 16 | 0, $397 | 0, 4);
      SAFE_HEAP_STORE($397 + 24 | 0, $$3371$i | 0, 4);
      break;
     } while (0);
     $403 = SAFE_HEAP_LOAD($$4$lcssa$i + 20 | 0, 4, 0) | 0 | 0;
     if (!$403) $469 = $247; else if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $403 >>> 0) _abort(); else {
      SAFE_HEAP_STORE($$3371$i + 20 | 0, $403 | 0, 4);
      SAFE_HEAP_STORE($403 + 24 | 0, $$3371$i | 0, 4);
      $469 = $247;
      break;
     }
    } while (0);
    L200 : do if ($$4349$lcssa$i >>> 0 < 16) {
     $410 = $$4349$lcssa$i + $246 | 0;
     SAFE_HEAP_STORE($$4$lcssa$i + 4 | 0, $410 | 3 | 0, 4);
     $414 = $$4$lcssa$i + $410 + 4 | 0;
     SAFE_HEAP_STORE($414 | 0, SAFE_HEAP_LOAD($414 | 0, 4, 0) | 0 | 1 | 0, 4);
    } else {
     SAFE_HEAP_STORE($$4$lcssa$i + 4 | 0, $246 | 3 | 0, 4);
     SAFE_HEAP_STORE($348 + 4 | 0, $$4349$lcssa$i | 1 | 0, 4);
     SAFE_HEAP_STORE($348 + $$4349$lcssa$i | 0, $$4349$lcssa$i | 0, 4);
     $422 = $$4349$lcssa$i >>> 3;
     if ($$4349$lcssa$i >>> 0 < 256) {
      $425 = 100508 + ($422 << 1 << 2) | 0;
      $426 = SAFE_HEAP_LOAD(25117 * 4 | 0, 4, 0) | 0 | 0;
      $427 = 1 << $422;
      if (!($426 & $427)) {
       SAFE_HEAP_STORE(25117 * 4 | 0, $426 | $427 | 0, 4);
       $$0367$i = $425;
       $$pre$phi$i209Z2D = $425 + 8 | 0;
      } else {
       $431 = $425 + 8 | 0;
       $432 = SAFE_HEAP_LOAD($431 | 0, 4, 0) | 0 | 0;
       if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $432 >>> 0) _abort(); else {
        $$0367$i = $432;
        $$pre$phi$i209Z2D = $431;
       }
      }
      SAFE_HEAP_STORE($$pre$phi$i209Z2D | 0, $348 | 0, 4);
      SAFE_HEAP_STORE($$0367$i + 12 | 0, $348 | 0, 4);
      SAFE_HEAP_STORE($348 + 8 | 0, $$0367$i | 0, 4);
      SAFE_HEAP_STORE($348 + 12 | 0, $425 | 0, 4);
      break;
     }
     $438 = $$4349$lcssa$i >>> 8;
     if (!$438) $$0360$i = 0; else if ($$4349$lcssa$i >>> 0 > 16777215) $$0360$i = 31; else {
      $443 = ($438 + 1048320 | 0) >>> 16 & 8;
      $444 = $438 << $443;
      $447 = ($444 + 520192 | 0) >>> 16 & 4;
      $449 = $444 << $447;
      $452 = ($449 + 245760 | 0) >>> 16 & 2;
      $457 = 14 - ($447 | $443 | $452) + ($449 << $452 >>> 15) | 0;
      $$0360$i = $$4349$lcssa$i >>> ($457 + 7 | 0) & 1 | $457 << 1;
     }
     $463 = 100772 + ($$0360$i << 2) | 0;
     SAFE_HEAP_STORE($348 + 28 | 0, $$0360$i | 0, 4);
     $465 = $348 + 16 | 0;
     SAFE_HEAP_STORE($465 + 4 | 0, 0 | 0, 4);
     SAFE_HEAP_STORE($465 | 0, 0 | 0, 4);
     $467 = 1 << $$0360$i;
     if (!($469 & $467)) {
      SAFE_HEAP_STORE(25118 * 4 | 0, $469 | $467 | 0, 4);
      SAFE_HEAP_STORE($463 | 0, $348 | 0, 4);
      SAFE_HEAP_STORE($348 + 24 | 0, $463 | 0, 4);
      SAFE_HEAP_STORE($348 + 12 | 0, $348 | 0, 4);
      SAFE_HEAP_STORE($348 + 8 | 0, $348 | 0, 4);
      break;
     }
     $475 = SAFE_HEAP_LOAD($463 | 0, 4, 0) | 0 | 0;
     L218 : do if (((SAFE_HEAP_LOAD($475 + 4 | 0, 4, 0) | 0) & -8 | 0) == ($$4349$lcssa$i | 0)) $$0343$lcssa$i = $475; else {
      $$034217$i = $$4349$lcssa$i << (($$0360$i | 0) == 31 ? 0 : 25 - ($$0360$i >>> 1) | 0);
      $$034316$i = $475;
      while (1) {
       $492 = $$034316$i + 16 + ($$034217$i >>> 31 << 2) | 0;
       $487 = SAFE_HEAP_LOAD($492 | 0, 4, 0) | 0 | 0;
       if (!$487) break;
       if (((SAFE_HEAP_LOAD($487 + 4 | 0, 4, 0) | 0) & -8 | 0) == ($$4349$lcssa$i | 0)) {
        $$0343$lcssa$i = $487;
        break L218;
       } else {
        $$034217$i = $$034217$i << 1;
        $$034316$i = $487;
       }
      }
      if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $492 >>> 0) _abort(); else {
       SAFE_HEAP_STORE($492 | 0, $348 | 0, 4);
       SAFE_HEAP_STORE($348 + 24 | 0, $$034316$i | 0, 4);
       SAFE_HEAP_STORE($348 + 12 | 0, $348 | 0, 4);
       SAFE_HEAP_STORE($348 + 8 | 0, $348 | 0, 4);
       break L200;
      }
     } while (0);
     $499 = $$0343$lcssa$i + 8 | 0;
     $500 = SAFE_HEAP_LOAD($499 | 0, 4, 0) | 0 | 0;
     $501 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
     if ($501 >>> 0 <= $500 >>> 0 & $501 >>> 0 <= $$0343$lcssa$i >>> 0) {
      SAFE_HEAP_STORE($500 + 12 | 0, $348 | 0, 4);
      SAFE_HEAP_STORE($499 | 0, $348 | 0, 4);
      SAFE_HEAP_STORE($348 + 8 | 0, $500 | 0, 4);
      SAFE_HEAP_STORE($348 + 12 | 0, $$0343$lcssa$i | 0, 4);
      SAFE_HEAP_STORE($348 + 24 | 0, 0 | 0, 4);
      break;
     } else _abort();
    } while (0);
    $$0 = $$4$lcssa$i + 8 | 0;
    STACKTOP = sp;
    return $$0 | 0;
   } else $$0197 = $246;
  }
 } while (0);
 $510 = SAFE_HEAP_LOAD(25119 * 4 | 0, 4, 0) | 0 | 0;
 if ($510 >>> 0 >= $$0197 >>> 0) {
  $512 = $510 - $$0197 | 0;
  $513 = SAFE_HEAP_LOAD(25122 * 4 | 0, 4, 0) | 0 | 0;
  if ($512 >>> 0 > 15) {
   $515 = $513 + $$0197 | 0;
   SAFE_HEAP_STORE(25122 * 4 | 0, $515 | 0, 4);
   SAFE_HEAP_STORE(25119 * 4 | 0, $512 | 0, 4);
   SAFE_HEAP_STORE($515 + 4 | 0, $512 | 1 | 0, 4);
   SAFE_HEAP_STORE($513 + $510 | 0, $512 | 0, 4);
   SAFE_HEAP_STORE($513 + 4 | 0, $$0197 | 3 | 0, 4);
  } else {
   SAFE_HEAP_STORE(25119 * 4 | 0, 0 | 0, 4);
   SAFE_HEAP_STORE(25122 * 4 | 0, 0 | 0, 4);
   SAFE_HEAP_STORE($513 + 4 | 0, $510 | 3 | 0, 4);
   $524 = $513 + $510 + 4 | 0;
   SAFE_HEAP_STORE($524 | 0, SAFE_HEAP_LOAD($524 | 0, 4, 0) | 0 | 1 | 0, 4);
  }
  $$0 = $513 + 8 | 0;
  STACKTOP = sp;
  return $$0 | 0;
 }
 $528 = SAFE_HEAP_LOAD(25120 * 4 | 0, 4, 0) | 0 | 0;
 if ($528 >>> 0 > $$0197 >>> 0) {
  $530 = $528 - $$0197 | 0;
  SAFE_HEAP_STORE(25120 * 4 | 0, $530 | 0, 4);
  $531 = SAFE_HEAP_LOAD(25123 * 4 | 0, 4, 0) | 0 | 0;
  $532 = $531 + $$0197 | 0;
  SAFE_HEAP_STORE(25123 * 4 | 0, $532 | 0, 4);
  SAFE_HEAP_STORE($532 + 4 | 0, $530 | 1 | 0, 4);
  SAFE_HEAP_STORE($531 + 4 | 0, $$0197 | 3 | 0, 4);
  $$0 = $531 + 8 | 0;
  STACKTOP = sp;
  return $$0 | 0;
 }
 if (!(SAFE_HEAP_LOAD(25235 * 4 | 0, 4, 0) | 0)) {
  SAFE_HEAP_STORE(25237 * 4 | 0, 4096 | 0, 4);
  SAFE_HEAP_STORE(25236 * 4 | 0, 4096 | 0, 4);
  SAFE_HEAP_STORE(25238 * 4 | 0, -1 | 0, 4);
  SAFE_HEAP_STORE(25239 * 4 | 0, -1 | 0, 4);
  SAFE_HEAP_STORE(25240 * 4 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE(25228 * 4 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE(25235 * 4 | 0, $1 & -16 ^ 1431655768 | 0, 4);
  $546 = 4096;
 } else $546 = SAFE_HEAP_LOAD(25237 * 4 | 0, 4, 0) | 0 | 0;
 $543 = $$0197 + 48 | 0;
 $544 = $$0197 + 47 | 0;
 $545 = $546 + $544 | 0;
 $547 = 0 - $546 | 0;
 $548 = $545 & $547;
 if ($548 >>> 0 <= $$0197 >>> 0) {
  $$0 = 0;
  STACKTOP = sp;
  return $$0 | 0;
 }
 $550 = SAFE_HEAP_LOAD(25227 * 4 | 0, 4, 0) | 0 | 0;
 if ($550 | 0) {
  $552 = SAFE_HEAP_LOAD(25225 * 4 | 0, 4, 0) | 0 | 0;
  $553 = $552 + $548 | 0;
  if ($553 >>> 0 <= $552 >>> 0 | $553 >>> 0 > $550 >>> 0) {
   $$0 = 0;
   STACKTOP = sp;
   return $$0 | 0;
  }
 }
 L257 : do if (!((SAFE_HEAP_LOAD(25228 * 4 | 0, 4, 0) | 0) & 4)) {
  $559 = SAFE_HEAP_LOAD(25123 * 4 | 0, 4, 0) | 0 | 0;
  L259 : do if (!$559) label = 173; else {
   $$0$i$i = 100916;
   while (1) {
    $561 = SAFE_HEAP_LOAD($$0$i$i | 0, 4, 0) | 0 | 0;
    if ($561 >>> 0 <= $559 >>> 0) if (($561 + (SAFE_HEAP_LOAD($$0$i$i + 4 | 0, 4, 0) | 0 | 0) | 0) >>> 0 > $559 >>> 0) break;
    $568 = SAFE_HEAP_LOAD($$0$i$i + 8 | 0, 4, 0) | 0 | 0;
    if (!$568) {
     label = 173;
     break L259;
    } else $$0$i$i = $568;
   }
   $593 = $545 - $528 & $547;
   if ($593 >>> 0 < 2147483647) {
    $596 = _sbrk($593 | 0) | 0;
    if (($596 | 0) == ((SAFE_HEAP_LOAD($$0$i$i | 0, 4, 0) | 0 | 0) + (SAFE_HEAP_LOAD($$0$i$i + 4 | 0, 4, 0) | 0 | 0) | 0)) if (($596 | 0) == (-1 | 0)) $$2234243136$i = $593; else {
     $$723947$i = $593;
     $$748$i = $596;
     label = 190;
     break L257;
    } else {
     $$2247$ph$i = $596;
     $$2253$ph$i = $593;
     label = 181;
    }
   } else $$2234243136$i = 0;
  } while (0);
  do if ((label | 0) == 173) {
   $570 = _sbrk(0) | 0;
   if (($570 | 0) == (-1 | 0)) $$2234243136$i = 0; else {
    $572 = $570;
    $573 = SAFE_HEAP_LOAD(25236 * 4 | 0, 4, 0) | 0 | 0;
    $574 = $573 + -1 | 0;
    $spec$select49$i = (($574 & $572 | 0) == 0 ? 0 : ($574 + $572 & 0 - $573) - $572 | 0) + $548 | 0;
    $582 = SAFE_HEAP_LOAD(25225 * 4 | 0, 4, 0) | 0 | 0;
    $583 = $spec$select49$i + $582 | 0;
    if ($spec$select49$i >>> 0 > $$0197 >>> 0 & $spec$select49$i >>> 0 < 2147483647) {
     $586 = SAFE_HEAP_LOAD(25227 * 4 | 0, 4, 0) | 0 | 0;
     if ($586 | 0) if ($583 >>> 0 <= $582 >>> 0 | $583 >>> 0 > $586 >>> 0) {
      $$2234243136$i = 0;
      break;
     }
     $590 = _sbrk($spec$select49$i | 0) | 0;
     if (($590 | 0) == ($570 | 0)) {
      $$723947$i = $spec$select49$i;
      $$748$i = $570;
      label = 190;
      break L257;
     } else {
      $$2247$ph$i = $590;
      $$2253$ph$i = $spec$select49$i;
      label = 181;
     }
    } else $$2234243136$i = 0;
   }
  } while (0);
  do if ((label | 0) == 181) {
   $602 = 0 - $$2253$ph$i | 0;
   if (!($543 >>> 0 > $$2253$ph$i >>> 0 & ($$2253$ph$i >>> 0 < 2147483647 & ($$2247$ph$i | 0) != (-1 | 0)))) if (($$2247$ph$i | 0) == (-1 | 0)) {
    $$2234243136$i = 0;
    break;
   } else {
    $$723947$i = $$2253$ph$i;
    $$748$i = $$2247$ph$i;
    label = 190;
    break L257;
   }
   $606 = SAFE_HEAP_LOAD(25237 * 4 | 0, 4, 0) | 0 | 0;
   $610 = $544 - $$2253$ph$i + $606 & 0 - $606;
   if ($610 >>> 0 >= 2147483647) {
    $$723947$i = $$2253$ph$i;
    $$748$i = $$2247$ph$i;
    label = 190;
    break L257;
   }
   if ((_sbrk($610 | 0) | 0) == (-1 | 0)) {
    _sbrk($602 | 0) | 0;
    $$2234243136$i = 0;
    break;
   } else {
    $$723947$i = $610 + $$2253$ph$i | 0;
    $$748$i = $$2247$ph$i;
    label = 190;
    break L257;
   }
  } while (0);
  SAFE_HEAP_STORE(25228 * 4 | 0, SAFE_HEAP_LOAD(25228 * 4 | 0, 4, 0) | 0 | 4 | 0, 4);
  $$4236$i = $$2234243136$i;
  label = 188;
 } else {
  $$4236$i = 0;
  label = 188;
 } while (0);
 if ((label | 0) == 188) if ($548 >>> 0 < 2147483647) {
  $619 = _sbrk($548 | 0) | 0;
  $620 = _sbrk(0) | 0;
  $626 = $620 - $619 | 0;
  $628 = $626 >>> 0 > ($$0197 + 40 | 0) >>> 0;
  if (!(($619 | 0) == (-1 | 0) | $628 ^ 1 | $619 >>> 0 < $620 >>> 0 & (($619 | 0) != (-1 | 0) & ($620 | 0) != (-1 | 0)) ^ 1)) {
   $$723947$i = $628 ? $626 : $$4236$i;
   $$748$i = $619;
   label = 190;
  }
 }
 if ((label | 0) == 190) {
  $632 = (SAFE_HEAP_LOAD(25225 * 4 | 0, 4, 0) | 0 | 0) + $$723947$i | 0;
  SAFE_HEAP_STORE(25225 * 4 | 0, $632 | 0, 4);
  if ($632 >>> 0 > (SAFE_HEAP_LOAD(25226 * 4 | 0, 4, 0) | 0 | 0) >>> 0) SAFE_HEAP_STORE(25226 * 4 | 0, $632 | 0, 4);
  $635 = SAFE_HEAP_LOAD(25123 * 4 | 0, 4, 0) | 0 | 0;
  L294 : do if (!$635) {
   $637 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
   if (($637 | 0) == 0 | $$748$i >>> 0 < $637 >>> 0) SAFE_HEAP_STORE(25121 * 4 | 0, $$748$i | 0, 4);
   SAFE_HEAP_STORE(25229 * 4 | 0, $$748$i | 0, 4);
   SAFE_HEAP_STORE(25230 * 4 | 0, $$723947$i | 0, 4);
   SAFE_HEAP_STORE(25232 * 4 | 0, 0 | 0, 4);
   SAFE_HEAP_STORE(25126 * 4 | 0, SAFE_HEAP_LOAD(25235 * 4 | 0, 4, 0) | 0 | 0, 4);
   SAFE_HEAP_STORE(25125 * 4 | 0, -1 | 0, 4);
   SAFE_HEAP_STORE(25130 * 4 | 0, 100508 | 0, 4);
   SAFE_HEAP_STORE(25129 * 4 | 0, 100508 | 0, 4);
   SAFE_HEAP_STORE(25132 * 4 | 0, 100516 | 0, 4);
   SAFE_HEAP_STORE(25131 * 4 | 0, 100516 | 0, 4);
   SAFE_HEAP_STORE(25134 * 4 | 0, 100524 | 0, 4);
   SAFE_HEAP_STORE(25133 * 4 | 0, 100524 | 0, 4);
   SAFE_HEAP_STORE(25136 * 4 | 0, 100532 | 0, 4);
   SAFE_HEAP_STORE(25135 * 4 | 0, 100532 | 0, 4);
   SAFE_HEAP_STORE(25138 * 4 | 0, 100540 | 0, 4);
   SAFE_HEAP_STORE(25137 * 4 | 0, 100540 | 0, 4);
   SAFE_HEAP_STORE(25140 * 4 | 0, 100548 | 0, 4);
   SAFE_HEAP_STORE(25139 * 4 | 0, 100548 | 0, 4);
   SAFE_HEAP_STORE(25142 * 4 | 0, 100556 | 0, 4);
   SAFE_HEAP_STORE(25141 * 4 | 0, 100556 | 0, 4);
   SAFE_HEAP_STORE(25144 * 4 | 0, 100564 | 0, 4);
   SAFE_HEAP_STORE(25143 * 4 | 0, 100564 | 0, 4);
   SAFE_HEAP_STORE(25146 * 4 | 0, 100572 | 0, 4);
   SAFE_HEAP_STORE(25145 * 4 | 0, 100572 | 0, 4);
   SAFE_HEAP_STORE(25148 * 4 | 0, 100580 | 0, 4);
   SAFE_HEAP_STORE(25147 * 4 | 0, 100580 | 0, 4);
   SAFE_HEAP_STORE(25150 * 4 | 0, 100588 | 0, 4);
   SAFE_HEAP_STORE(25149 * 4 | 0, 100588 | 0, 4);
   SAFE_HEAP_STORE(25152 * 4 | 0, 100596 | 0, 4);
   SAFE_HEAP_STORE(25151 * 4 | 0, 100596 | 0, 4);
   SAFE_HEAP_STORE(25154 * 4 | 0, 100604 | 0, 4);
   SAFE_HEAP_STORE(25153 * 4 | 0, 100604 | 0, 4);
   SAFE_HEAP_STORE(25156 * 4 | 0, 100612 | 0, 4);
   SAFE_HEAP_STORE(25155 * 4 | 0, 100612 | 0, 4);
   SAFE_HEAP_STORE(25158 * 4 | 0, 100620 | 0, 4);
   SAFE_HEAP_STORE(25157 * 4 | 0, 100620 | 0, 4);
   SAFE_HEAP_STORE(25160 * 4 | 0, 100628 | 0, 4);
   SAFE_HEAP_STORE(25159 * 4 | 0, 100628 | 0, 4);
   SAFE_HEAP_STORE(25162 * 4 | 0, 100636 | 0, 4);
   SAFE_HEAP_STORE(25161 * 4 | 0, 100636 | 0, 4);
   SAFE_HEAP_STORE(25164 * 4 | 0, 100644 | 0, 4);
   SAFE_HEAP_STORE(25163 * 4 | 0, 100644 | 0, 4);
   SAFE_HEAP_STORE(25166 * 4 | 0, 100652 | 0, 4);
   SAFE_HEAP_STORE(25165 * 4 | 0, 100652 | 0, 4);
   SAFE_HEAP_STORE(25168 * 4 | 0, 100660 | 0, 4);
   SAFE_HEAP_STORE(25167 * 4 | 0, 100660 | 0, 4);
   SAFE_HEAP_STORE(25170 * 4 | 0, 100668 | 0, 4);
   SAFE_HEAP_STORE(25169 * 4 | 0, 100668 | 0, 4);
   SAFE_HEAP_STORE(25172 * 4 | 0, 100676 | 0, 4);
   SAFE_HEAP_STORE(25171 * 4 | 0, 100676 | 0, 4);
   SAFE_HEAP_STORE(25174 * 4 | 0, 100684 | 0, 4);
   SAFE_HEAP_STORE(25173 * 4 | 0, 100684 | 0, 4);
   SAFE_HEAP_STORE(25176 * 4 | 0, 100692 | 0, 4);
   SAFE_HEAP_STORE(25175 * 4 | 0, 100692 | 0, 4);
   SAFE_HEAP_STORE(25178 * 4 | 0, 100700 | 0, 4);
   SAFE_HEAP_STORE(25177 * 4 | 0, 100700 | 0, 4);
   SAFE_HEAP_STORE(25180 * 4 | 0, 100708 | 0, 4);
   SAFE_HEAP_STORE(25179 * 4 | 0, 100708 | 0, 4);
   SAFE_HEAP_STORE(25182 * 4 | 0, 100716 | 0, 4);
   SAFE_HEAP_STORE(25181 * 4 | 0, 100716 | 0, 4);
   SAFE_HEAP_STORE(25184 * 4 | 0, 100724 | 0, 4);
   SAFE_HEAP_STORE(25183 * 4 | 0, 100724 | 0, 4);
   SAFE_HEAP_STORE(25186 * 4 | 0, 100732 | 0, 4);
   SAFE_HEAP_STORE(25185 * 4 | 0, 100732 | 0, 4);
   SAFE_HEAP_STORE(25188 * 4 | 0, 100740 | 0, 4);
   SAFE_HEAP_STORE(25187 * 4 | 0, 100740 | 0, 4);
   SAFE_HEAP_STORE(25190 * 4 | 0, 100748 | 0, 4);
   SAFE_HEAP_STORE(25189 * 4 | 0, 100748 | 0, 4);
   SAFE_HEAP_STORE(25192 * 4 | 0, 100756 | 0, 4);
   SAFE_HEAP_STORE(25191 * 4 | 0, 100756 | 0, 4);
   $641 = $$723947$i + -40 | 0;
   $643 = $$748$i + 8 | 0;
   $648 = ($643 & 7 | 0) == 0 ? 0 : 0 - $643 & 7;
   $649 = $$748$i + $648 | 0;
   $650 = $641 - $648 | 0;
   SAFE_HEAP_STORE(25123 * 4 | 0, $649 | 0, 4);
   SAFE_HEAP_STORE(25120 * 4 | 0, $650 | 0, 4);
   SAFE_HEAP_STORE($649 + 4 | 0, $650 | 1 | 0, 4);
   SAFE_HEAP_STORE($$748$i + $641 + 4 | 0, 40 | 0, 4);
   SAFE_HEAP_STORE(25124 * 4 | 0, SAFE_HEAP_LOAD(25239 * 4 | 0, 4, 0) | 0 | 0, 4);
  } else {
   $$024372$i = 100916;
   while (1) {
    $656 = SAFE_HEAP_LOAD($$024372$i | 0, 4, 0) | 0 | 0;
    $658 = SAFE_HEAP_LOAD($$024372$i + 4 | 0, 4, 0) | 0 | 0;
    if (($$748$i | 0) == ($656 + $658 | 0)) {
     label = 199;
     break;
    }
    $662 = SAFE_HEAP_LOAD($$024372$i + 8 | 0, 4, 0) | 0 | 0;
    if (!$662) break; else $$024372$i = $662;
   }
   if ((label | 0) == 199) {
    $664 = $$024372$i + 4 | 0;
    if (!((SAFE_HEAP_LOAD($$024372$i + 12 | 0, 4, 0) | 0) & 8)) if ($$748$i >>> 0 > $635 >>> 0 & $656 >>> 0 <= $635 >>> 0) {
     SAFE_HEAP_STORE($664 | 0, $658 + $$723947$i | 0, 4);
     $673 = (SAFE_HEAP_LOAD(25120 * 4 | 0, 4, 0) | 0 | 0) + $$723947$i | 0;
     $675 = $635 + 8 | 0;
     $680 = ($675 & 7 | 0) == 0 ? 0 : 0 - $675 & 7;
     $681 = $635 + $680 | 0;
     $682 = $673 - $680 | 0;
     SAFE_HEAP_STORE(25123 * 4 | 0, $681 | 0, 4);
     SAFE_HEAP_STORE(25120 * 4 | 0, $682 | 0, 4);
     SAFE_HEAP_STORE($681 + 4 | 0, $682 | 1 | 0, 4);
     SAFE_HEAP_STORE($635 + $673 + 4 | 0, 40 | 0, 4);
     SAFE_HEAP_STORE(25124 * 4 | 0, SAFE_HEAP_LOAD(25239 * 4 | 0, 4, 0) | 0 | 0, 4);
     break;
    }
   }
   $688 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
   if ($$748$i >>> 0 < $688 >>> 0) {
    SAFE_HEAP_STORE(25121 * 4 | 0, $$748$i | 0, 4);
    $753 = $$748$i;
   } else $753 = $688;
   $690 = $$748$i + $$723947$i | 0;
   $$124471$i = 100916;
   while (1) {
    if ((SAFE_HEAP_LOAD($$124471$i | 0, 4, 0) | 0 | 0) == ($690 | 0)) {
     label = 207;
     break;
    }
    $694 = SAFE_HEAP_LOAD($$124471$i + 8 | 0, 4, 0) | 0 | 0;
    if (!$694) break; else $$124471$i = $694;
   }
   if ((label | 0) == 207) if (!((SAFE_HEAP_LOAD($$124471$i + 12 | 0, 4, 0) | 0) & 8)) {
    SAFE_HEAP_STORE($$124471$i | 0, $$748$i | 0, 4);
    $700 = $$124471$i + 4 | 0;
    SAFE_HEAP_STORE($700 | 0, (SAFE_HEAP_LOAD($700 | 0, 4, 0) | 0 | 0) + $$723947$i | 0, 4);
    $704 = $$748$i + 8 | 0;
    $710 = $$748$i + (($704 & 7 | 0) == 0 ? 0 : 0 - $704 & 7) | 0;
    $712 = $690 + 8 | 0;
    $718 = $690 + (($712 & 7 | 0) == 0 ? 0 : 0 - $712 & 7) | 0;
    $722 = $710 + $$0197 | 0;
    $723 = $718 - $710 - $$0197 | 0;
    SAFE_HEAP_STORE($710 + 4 | 0, $$0197 | 3 | 0, 4);
    L317 : do if (($635 | 0) == ($718 | 0)) {
     $728 = (SAFE_HEAP_LOAD(25120 * 4 | 0, 4, 0) | 0 | 0) + $723 | 0;
     SAFE_HEAP_STORE(25120 * 4 | 0, $728 | 0, 4);
     SAFE_HEAP_STORE(25123 * 4 | 0, $722 | 0, 4);
     SAFE_HEAP_STORE($722 + 4 | 0, $728 | 1 | 0, 4);
    } else {
     if ((SAFE_HEAP_LOAD(25122 * 4 | 0, 4, 0) | 0 | 0) == ($718 | 0)) {
      $734 = (SAFE_HEAP_LOAD(25119 * 4 | 0, 4, 0) | 0 | 0) + $723 | 0;
      SAFE_HEAP_STORE(25119 * 4 | 0, $734 | 0, 4);
      SAFE_HEAP_STORE(25122 * 4 | 0, $722 | 0, 4);
      SAFE_HEAP_STORE($722 + 4 | 0, $734 | 1 | 0, 4);
      SAFE_HEAP_STORE($722 + $734 | 0, $734 | 0, 4);
      break;
     }
     $739 = SAFE_HEAP_LOAD($718 + 4 | 0, 4, 0) | 0 | 0;
     if (($739 & 3 | 0) == 1) {
      $742 = $739 & -8;
      $743 = $739 >>> 3;
      L325 : do if ($739 >>> 0 < 256) {
       $746 = SAFE_HEAP_LOAD($718 + 8 | 0, 4, 0) | 0 | 0;
       $748 = SAFE_HEAP_LOAD($718 + 12 | 0, 4, 0) | 0 | 0;
       $750 = 100508 + ($743 << 1 << 2) | 0;
       do if (($746 | 0) != ($750 | 0)) {
        if ($753 >>> 0 > $746 >>> 0) _abort();
        if ((SAFE_HEAP_LOAD($746 + 12 | 0, 4, 0) | 0 | 0) == ($718 | 0)) break;
        _abort();
       } while (0);
       if (($748 | 0) == ($746 | 0)) {
        SAFE_HEAP_STORE(25117 * 4 | 0, (SAFE_HEAP_LOAD(25117 * 4 | 0, 4, 0) | 0) & ~(1 << $743) | 0, 4);
        break;
       }
       do if (($748 | 0) == ($750 | 0)) $$pre$phi17$i$iZ2D = $748 + 8 | 0; else {
        if ($753 >>> 0 > $748 >>> 0) _abort();
        $764 = $748 + 8 | 0;
        if ((SAFE_HEAP_LOAD($764 | 0, 4, 0) | 0 | 0) == ($718 | 0)) {
         $$pre$phi17$i$iZ2D = $764;
         break;
        }
        _abort();
       } while (0);
       SAFE_HEAP_STORE($746 + 12 | 0, $748 | 0, 4);
       SAFE_HEAP_STORE($$pre$phi17$i$iZ2D | 0, $746 | 0, 4);
      } else {
       $769 = SAFE_HEAP_LOAD($718 + 24 | 0, 4, 0) | 0 | 0;
       $771 = SAFE_HEAP_LOAD($718 + 12 | 0, 4, 0) | 0 | 0;
       do if (($771 | 0) == ($718 | 0)) {
        $782 = $718 + 16 | 0;
        $783 = $782 + 4 | 0;
        $784 = SAFE_HEAP_LOAD($783 | 0, 4, 0) | 0 | 0;
        if (!$784) {
         $786 = SAFE_HEAP_LOAD($782 | 0, 4, 0) | 0 | 0;
         if (!$786) {
          $$3$i$i = 0;
          break;
         } else {
          $$1290$i$i$ph = $786;
          $$1292$i$i$ph = $782;
         }
        } else {
         $$1290$i$i$ph = $784;
         $$1292$i$i$ph = $783;
        }
        $$1290$i$i = $$1290$i$i$ph;
        $$1292$i$i = $$1292$i$i$ph;
        while (1) {
         $788 = $$1290$i$i + 20 | 0;
         $789 = SAFE_HEAP_LOAD($788 | 0, 4, 0) | 0 | 0;
         if (!$789) {
          $791 = $$1290$i$i + 16 | 0;
          $792 = SAFE_HEAP_LOAD($791 | 0, 4, 0) | 0 | 0;
          if (!$792) break; else {
           $$1290$i$i$be = $792;
           $$1292$i$i$be = $791;
          }
         } else {
          $$1290$i$i$be = $789;
          $$1292$i$i$be = $788;
         }
         $$1290$i$i = $$1290$i$i$be;
         $$1292$i$i = $$1292$i$i$be;
        }
        if ($753 >>> 0 > $$1292$i$i >>> 0) _abort(); else {
         SAFE_HEAP_STORE($$1292$i$i | 0, 0 | 0, 4);
         $$3$i$i = $$1290$i$i;
         break;
        }
       } else {
        $774 = SAFE_HEAP_LOAD($718 + 8 | 0, 4, 0) | 0 | 0;
        if ($753 >>> 0 > $774 >>> 0) _abort();
        $776 = $774 + 12 | 0;
        if ((SAFE_HEAP_LOAD($776 | 0, 4, 0) | 0 | 0) != ($718 | 0)) _abort();
        $779 = $771 + 8 | 0;
        if ((SAFE_HEAP_LOAD($779 | 0, 4, 0) | 0 | 0) == ($718 | 0)) {
         SAFE_HEAP_STORE($776 | 0, $771 | 0, 4);
         SAFE_HEAP_STORE($779 | 0, $774 | 0, 4);
         $$3$i$i = $771;
         break;
        } else _abort();
       } while (0);
       if (!$769) break;
       $797 = SAFE_HEAP_LOAD($718 + 28 | 0, 4, 0) | 0 | 0;
       $798 = 100772 + ($797 << 2) | 0;
       do if ((SAFE_HEAP_LOAD($798 | 0, 4, 0) | 0 | 0) == ($718 | 0)) {
        SAFE_HEAP_STORE($798 | 0, $$3$i$i | 0, 4);
        if ($$3$i$i | 0) break;
        SAFE_HEAP_STORE(25118 * 4 | 0, (SAFE_HEAP_LOAD(25118 * 4 | 0, 4, 0) | 0) & ~(1 << $797) | 0, 4);
        break L325;
       } else if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $769 >>> 0) _abort(); else {
        $807 = $769 + 16 | 0;
        SAFE_HEAP_STORE(((SAFE_HEAP_LOAD($807 | 0, 4, 0) | 0 | 0) == ($718 | 0) ? $807 : $769 + 20 | 0) | 0, $$3$i$i | 0, 4);
        if (!$$3$i$i) break L325; else break;
       } while (0);
       $812 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
       if ($812 >>> 0 > $$3$i$i >>> 0) _abort();
       SAFE_HEAP_STORE($$3$i$i + 24 | 0, $769 | 0, 4);
       $815 = $718 + 16 | 0;
       $816 = SAFE_HEAP_LOAD($815 | 0, 4, 0) | 0 | 0;
       do if ($816 | 0) if ($812 >>> 0 > $816 >>> 0) _abort(); else {
        SAFE_HEAP_STORE($$3$i$i + 16 | 0, $816 | 0, 4);
        SAFE_HEAP_STORE($816 + 24 | 0, $$3$i$i | 0, 4);
        break;
       } while (0);
       $822 = SAFE_HEAP_LOAD($815 + 4 | 0, 4, 0) | 0 | 0;
       if (!$822) break;
       if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $822 >>> 0) _abort(); else {
        SAFE_HEAP_STORE($$3$i$i + 20 | 0, $822 | 0, 4);
        SAFE_HEAP_STORE($822 + 24 | 0, $$3$i$i | 0, 4);
        break;
       }
      } while (0);
      $$0$i16$i = $718 + $742 | 0;
      $$0286$i$i = $742 + $723 | 0;
     } else {
      $$0$i16$i = $718;
      $$0286$i$i = $723;
     }
     $830 = $$0$i16$i + 4 | 0;
     SAFE_HEAP_STORE($830 | 0, (SAFE_HEAP_LOAD($830 | 0, 4, 0) | 0) & -2 | 0, 4);
     SAFE_HEAP_STORE($722 + 4 | 0, $$0286$i$i | 1 | 0, 4);
     SAFE_HEAP_STORE($722 + $$0286$i$i | 0, $$0286$i$i | 0, 4);
     $836 = $$0286$i$i >>> 3;
     if ($$0286$i$i >>> 0 < 256) {
      $839 = 100508 + ($836 << 1 << 2) | 0;
      $840 = SAFE_HEAP_LOAD(25117 * 4 | 0, 4, 0) | 0 | 0;
      $841 = 1 << $836;
      do if (!($840 & $841)) {
       SAFE_HEAP_STORE(25117 * 4 | 0, $840 | $841 | 0, 4);
       $$0294$i$i = $839;
       $$pre$phi$i18$iZ2D = $839 + 8 | 0;
      } else {
       $845 = $839 + 8 | 0;
       $846 = SAFE_HEAP_LOAD($845 | 0, 4, 0) | 0 | 0;
       if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 <= $846 >>> 0) {
        $$0294$i$i = $846;
        $$pre$phi$i18$iZ2D = $845;
        break;
       }
       _abort();
      } while (0);
      SAFE_HEAP_STORE($$pre$phi$i18$iZ2D | 0, $722 | 0, 4);
      SAFE_HEAP_STORE($$0294$i$i + 12 | 0, $722 | 0, 4);
      SAFE_HEAP_STORE($722 + 8 | 0, $$0294$i$i | 0, 4);
      SAFE_HEAP_STORE($722 + 12 | 0, $839 | 0, 4);
      break;
     }
     $852 = $$0286$i$i >>> 8;
     do if (!$852) $$0295$i$i = 0; else {
      if ($$0286$i$i >>> 0 > 16777215) {
       $$0295$i$i = 31;
       break;
      }
      $857 = ($852 + 1048320 | 0) >>> 16 & 8;
      $858 = $852 << $857;
      $861 = ($858 + 520192 | 0) >>> 16 & 4;
      $863 = $858 << $861;
      $866 = ($863 + 245760 | 0) >>> 16 & 2;
      $871 = 14 - ($861 | $857 | $866) + ($863 << $866 >>> 15) | 0;
      $$0295$i$i = $$0286$i$i >>> ($871 + 7 | 0) & 1 | $871 << 1;
     } while (0);
     $877 = 100772 + ($$0295$i$i << 2) | 0;
     SAFE_HEAP_STORE($722 + 28 | 0, $$0295$i$i | 0, 4);
     $879 = $722 + 16 | 0;
     SAFE_HEAP_STORE($879 + 4 | 0, 0 | 0, 4);
     SAFE_HEAP_STORE($879 | 0, 0 | 0, 4);
     $881 = SAFE_HEAP_LOAD(25118 * 4 | 0, 4, 0) | 0 | 0;
     $882 = 1 << $$0295$i$i;
     if (!($881 & $882)) {
      SAFE_HEAP_STORE(25118 * 4 | 0, $881 | $882 | 0, 4);
      SAFE_HEAP_STORE($877 | 0, $722 | 0, 4);
      SAFE_HEAP_STORE($722 + 24 | 0, $877 | 0, 4);
      SAFE_HEAP_STORE($722 + 12 | 0, $722 | 0, 4);
      SAFE_HEAP_STORE($722 + 8 | 0, $722 | 0, 4);
      break;
     }
     $889 = SAFE_HEAP_LOAD($877 | 0, 4, 0) | 0 | 0;
     L410 : do if (((SAFE_HEAP_LOAD($889 + 4 | 0, 4, 0) | 0) & -8 | 0) == ($$0286$i$i | 0)) $$0288$lcssa$i$i = $889; else {
      $$028711$i$i = $$0286$i$i << (($$0295$i$i | 0) == 31 ? 0 : 25 - ($$0295$i$i >>> 1) | 0);
      $$028810$i$i = $889;
      while (1) {
       $906 = $$028810$i$i + 16 + ($$028711$i$i >>> 31 << 2) | 0;
       $901 = SAFE_HEAP_LOAD($906 | 0, 4, 0) | 0 | 0;
       if (!$901) break;
       if (((SAFE_HEAP_LOAD($901 + 4 | 0, 4, 0) | 0) & -8 | 0) == ($$0286$i$i | 0)) {
        $$0288$lcssa$i$i = $901;
        break L410;
       } else {
        $$028711$i$i = $$028711$i$i << 1;
        $$028810$i$i = $901;
       }
      }
      if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $906 >>> 0) _abort(); else {
       SAFE_HEAP_STORE($906 | 0, $722 | 0, 4);
       SAFE_HEAP_STORE($722 + 24 | 0, $$028810$i$i | 0, 4);
       SAFE_HEAP_STORE($722 + 12 | 0, $722 | 0, 4);
       SAFE_HEAP_STORE($722 + 8 | 0, $722 | 0, 4);
       break L317;
      }
     } while (0);
     $913 = $$0288$lcssa$i$i + 8 | 0;
     $914 = SAFE_HEAP_LOAD($913 | 0, 4, 0) | 0 | 0;
     $915 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
     if ($915 >>> 0 <= $914 >>> 0 & $915 >>> 0 <= $$0288$lcssa$i$i >>> 0) {
      SAFE_HEAP_STORE($914 + 12 | 0, $722 | 0, 4);
      SAFE_HEAP_STORE($913 | 0, $722 | 0, 4);
      SAFE_HEAP_STORE($722 + 8 | 0, $914 | 0, 4);
      SAFE_HEAP_STORE($722 + 12 | 0, $$0288$lcssa$i$i | 0, 4);
      SAFE_HEAP_STORE($722 + 24 | 0, 0 | 0, 4);
      break;
     } else _abort();
    } while (0);
    $$0 = $710 + 8 | 0;
    STACKTOP = sp;
    return $$0 | 0;
   }
   $$0$i$i$i = 100916;
   while (1) {
    $923 = SAFE_HEAP_LOAD($$0$i$i$i | 0, 4, 0) | 0 | 0;
    if ($923 >>> 0 <= $635 >>> 0) {
     $927 = $923 + (SAFE_HEAP_LOAD($$0$i$i$i + 4 | 0, 4, 0) | 0 | 0) | 0;
     if ($927 >>> 0 > $635 >>> 0) break;
    }
    $$0$i$i$i = SAFE_HEAP_LOAD($$0$i$i$i + 8 | 0, 4, 0) | 0 | 0;
   }
   $931 = $927 + -47 | 0;
   $933 = $931 + 8 | 0;
   $939 = $931 + (($933 & 7 | 0) == 0 ? 0 : 0 - $933 & 7) | 0;
   $940 = $635 + 16 | 0;
   $942 = $939 >>> 0 < $940 >>> 0 ? $635 : $939;
   $943 = $942 + 8 | 0;
   $945 = $$723947$i + -40 | 0;
   $947 = $$748$i + 8 | 0;
   $952 = ($947 & 7 | 0) == 0 ? 0 : 0 - $947 & 7;
   $953 = $$748$i + $952 | 0;
   $954 = $945 - $952 | 0;
   SAFE_HEAP_STORE(25123 * 4 | 0, $953 | 0, 4);
   SAFE_HEAP_STORE(25120 * 4 | 0, $954 | 0, 4);
   SAFE_HEAP_STORE($953 + 4 | 0, $954 | 1 | 0, 4);
   SAFE_HEAP_STORE($$748$i + $945 + 4 | 0, 40 | 0, 4);
   SAFE_HEAP_STORE(25124 * 4 | 0, SAFE_HEAP_LOAD(25239 * 4 | 0, 4, 0) | 0 | 0, 4);
   $960 = $942 + 4 | 0;
   SAFE_HEAP_STORE($960 | 0, 27 | 0, 4);
   SAFE_HEAP_STORE($943 | 0, SAFE_HEAP_LOAD(25229 * 4 | 0, 4, 0) | 0 | 0, 4);
   SAFE_HEAP_STORE($943 + 4 | 0, SAFE_HEAP_LOAD(25230 * 4 | 0, 4, 0) | 0 | 0, 4);
   SAFE_HEAP_STORE($943 + 8 | 0, SAFE_HEAP_LOAD(25231 * 4 | 0, 4, 0) | 0 | 0, 4);
   SAFE_HEAP_STORE($943 + 12 | 0, SAFE_HEAP_LOAD(25232 * 4 | 0, 4, 0) | 0 | 0, 4);
   SAFE_HEAP_STORE(25229 * 4 | 0, $$748$i | 0, 4);
   SAFE_HEAP_STORE(25230 * 4 | 0, $$723947$i | 0, 4);
   SAFE_HEAP_STORE(25232 * 4 | 0, 0 | 0, 4);
   SAFE_HEAP_STORE(25231 * 4 | 0, $943 | 0, 4);
   $962 = $942 + 24 | 0;
   do {
    $962$looptemp = $962;
    $962 = $962 + 4 | 0;
    SAFE_HEAP_STORE($962 | 0, 7 | 0, 4);
   } while (($962$looptemp + 8 | 0) >>> 0 < $927 >>> 0);
   if (($942 | 0) != ($635 | 0)) {
    $968 = $942 - $635 | 0;
    SAFE_HEAP_STORE($960 | 0, (SAFE_HEAP_LOAD($960 | 0, 4, 0) | 0) & -2 | 0, 4);
    SAFE_HEAP_STORE($635 + 4 | 0, $968 | 1 | 0, 4);
    SAFE_HEAP_STORE($942 | 0, $968 | 0, 4);
    $973 = $968 >>> 3;
    if ($968 >>> 0 < 256) {
     $976 = 100508 + ($973 << 1 << 2) | 0;
     $977 = SAFE_HEAP_LOAD(25117 * 4 | 0, 4, 0) | 0 | 0;
     $978 = 1 << $973;
     if (!($977 & $978)) {
      SAFE_HEAP_STORE(25117 * 4 | 0, $977 | $978 | 0, 4);
      $$0211$i$i = $976;
      $$pre$phi$i$iZ2D = $976 + 8 | 0;
     } else {
      $982 = $976 + 8 | 0;
      $983 = SAFE_HEAP_LOAD($982 | 0, 4, 0) | 0 | 0;
      if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $983 >>> 0) _abort(); else {
       $$0211$i$i = $983;
       $$pre$phi$i$iZ2D = $982;
      }
     }
     SAFE_HEAP_STORE($$pre$phi$i$iZ2D | 0, $635 | 0, 4);
     SAFE_HEAP_STORE($$0211$i$i + 12 | 0, $635 | 0, 4);
     SAFE_HEAP_STORE($635 + 8 | 0, $$0211$i$i | 0, 4);
     SAFE_HEAP_STORE($635 + 12 | 0, $976 | 0, 4);
     break;
    }
    $989 = $968 >>> 8;
    if (!$989) $$0212$i$i = 0; else if ($968 >>> 0 > 16777215) $$0212$i$i = 31; else {
     $994 = ($989 + 1048320 | 0) >>> 16 & 8;
     $995 = $989 << $994;
     $998 = ($995 + 520192 | 0) >>> 16 & 4;
     $1000 = $995 << $998;
     $1003 = ($1000 + 245760 | 0) >>> 16 & 2;
     $1008 = 14 - ($998 | $994 | $1003) + ($1000 << $1003 >>> 15) | 0;
     $$0212$i$i = $968 >>> ($1008 + 7 | 0) & 1 | $1008 << 1;
    }
    $1014 = 100772 + ($$0212$i$i << 2) | 0;
    SAFE_HEAP_STORE($635 + 28 | 0, $$0212$i$i | 0, 4);
    SAFE_HEAP_STORE($635 + 20 | 0, 0 | 0, 4);
    SAFE_HEAP_STORE($940 | 0, 0 | 0, 4);
    $1017 = SAFE_HEAP_LOAD(25118 * 4 | 0, 4, 0) | 0 | 0;
    $1018 = 1 << $$0212$i$i;
    if (!($1017 & $1018)) {
     SAFE_HEAP_STORE(25118 * 4 | 0, $1017 | $1018 | 0, 4);
     SAFE_HEAP_STORE($1014 | 0, $635 | 0, 4);
     SAFE_HEAP_STORE($635 + 24 | 0, $1014 | 0, 4);
     SAFE_HEAP_STORE($635 + 12 | 0, $635 | 0, 4);
     SAFE_HEAP_STORE($635 + 8 | 0, $635 | 0, 4);
     break;
    }
    $1025 = SAFE_HEAP_LOAD($1014 | 0, 4, 0) | 0 | 0;
    L451 : do if (((SAFE_HEAP_LOAD($1025 + 4 | 0, 4, 0) | 0) & -8 | 0) == ($968 | 0)) $$0207$lcssa$i$i = $1025; else {
     $$02065$i$i = $968 << (($$0212$i$i | 0) == 31 ? 0 : 25 - ($$0212$i$i >>> 1) | 0);
     $$02074$i$i = $1025;
     while (1) {
      $1042 = $$02074$i$i + 16 + ($$02065$i$i >>> 31 << 2) | 0;
      $1037 = SAFE_HEAP_LOAD($1042 | 0, 4, 0) | 0 | 0;
      if (!$1037) break;
      if (((SAFE_HEAP_LOAD($1037 + 4 | 0, 4, 0) | 0) & -8 | 0) == ($968 | 0)) {
       $$0207$lcssa$i$i = $1037;
       break L451;
      } else {
       $$02065$i$i = $$02065$i$i << 1;
       $$02074$i$i = $1037;
      }
     }
     if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $1042 >>> 0) _abort(); else {
      SAFE_HEAP_STORE($1042 | 0, $635 | 0, 4);
      SAFE_HEAP_STORE($635 + 24 | 0, $$02074$i$i | 0, 4);
      SAFE_HEAP_STORE($635 + 12 | 0, $635 | 0, 4);
      SAFE_HEAP_STORE($635 + 8 | 0, $635 | 0, 4);
      break L294;
     }
    } while (0);
    $1049 = $$0207$lcssa$i$i + 8 | 0;
    $1050 = SAFE_HEAP_LOAD($1049 | 0, 4, 0) | 0 | 0;
    $1051 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
    if ($1051 >>> 0 <= $1050 >>> 0 & $1051 >>> 0 <= $$0207$lcssa$i$i >>> 0) {
     SAFE_HEAP_STORE($1050 + 12 | 0, $635 | 0, 4);
     SAFE_HEAP_STORE($1049 | 0, $635 | 0, 4);
     SAFE_HEAP_STORE($635 + 8 | 0, $1050 | 0, 4);
     SAFE_HEAP_STORE($635 + 12 | 0, $$0207$lcssa$i$i | 0, 4);
     SAFE_HEAP_STORE($635 + 24 | 0, 0 | 0, 4);
     break;
    } else _abort();
   }
  } while (0);
  $1060 = SAFE_HEAP_LOAD(25120 * 4 | 0, 4, 0) | 0 | 0;
  if ($1060 >>> 0 > $$0197 >>> 0) {
   $1062 = $1060 - $$0197 | 0;
   SAFE_HEAP_STORE(25120 * 4 | 0, $1062 | 0, 4);
   $1063 = SAFE_HEAP_LOAD(25123 * 4 | 0, 4, 0) | 0 | 0;
   $1064 = $1063 + $$0197 | 0;
   SAFE_HEAP_STORE(25123 * 4 | 0, $1064 | 0, 4);
   SAFE_HEAP_STORE($1064 + 4 | 0, $1062 | 1 | 0, 4);
   SAFE_HEAP_STORE($1063 + 4 | 0, $$0197 | 3 | 0, 4);
   $$0 = $1063 + 8 | 0;
   STACKTOP = sp;
   return $$0 | 0;
  }
 }
 SAFE_HEAP_STORE(___errno_location() | 0 | 0, 12 | 0, 4);
 $$0 = 0;
 STACKTOP = sp;
 return $$0 | 0;
}

function _fmt_fp($0, $1, $2, $3, $4, $5) {
 $0 = $0 | 0;
 $1 = +$1;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 $5 = $5 | 0;
 var $$0 = 0, $$0463$lcssa = 0, $$0463588 = 0, $$0464599 = 0, $$0471 = 0.0, $$0479 = 0, $$0487657 = 0, $$0488669 = 0, $$0488671 = 0, $$0497670 = 0, $$0498 = 0, $$0511586 = 0.0, $$0513 = 0, $$0516652 = 0, $$0522 = 0, $$0523 = 0, $$0525 = 0, $$0527 = 0, $$0529$in646 = 0, $$0532651 = 0, $$1465 = 0, $$1467 = 0.0, $$1469 = 0.0, $$1472 = 0.0, $$1480 = 0, $$1482$lcssa = 0, $$1482683 = 0, $$1489656 = 0, $$1499 = 0, $$1510587 = 0, $$1514$lcssa = 0, $$1514614 = 0, $$1517 = 0, $$1526 = 0, $$1530621 = 0, $$1533$lcssa = 0, $$1533645 = 0, $$1604 = 0, $$2 = 0, $$2473 = 0.0, $$2476 = 0, $$2483 = 0, $$2490$lcssa = 0, $$2490638 = 0, $$2500$lcssa = 0, $$2500682 = 0, $$2515 = 0, $$2518634 = 0, $$2531 = 0, $$2534633 = 0, $$3 = 0.0, $$3477 = 0, $$3484$lcssa = 0, $$3484663 = 0, $$3501$lcssa = 0, $$3501676 = 0, $$3535620 = 0, $$4 = 0.0, $$4478$lcssa = 0, $$4478594 = 0, $$4492 = 0, $$4502$lcssa = 0, $$4502662 = 0, $$4520 = 0, $$5$lcssa = 0, $$5486$lcssa = 0, $$5486639 = 0, $$5493603 = 0, $$5503 = 0, $$5521 = 0, $$5609 = 0, $$6 = 0, $$6494593 = 0, $$7495608 = 0, $$8 = 0, $$8506 = 0, $$9 = 0, $$9507$lcssa = 0, $$9507625 = 0, $$lcssa583 = 0, $$pn = 0, $$pr = 0, $$pr564 = 0, $$pre$phi717Z2D = 0, $$pre$phi718Z2D = 0, $$pre720 = 0, $$sink757 = 0, $10 = 0, $103 = 0, $104 = 0, $108 = 0, $109 = 0, $11 = 0, $113 = 0, $115 = 0, $116 = 0, $12 = 0, $123 = 0, $126 = 0, $13 = 0, $132 = 0, $135 = 0, $136 = 0, $139 = 0, $141 = 0, $142 = 0, $145 = 0, $147 = 0, $15 = 0.0, $151 = 0, $154 = 0, $158 = 0, $16 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $168 = 0, $174 = 0, $175 = 0, $176 = 0, $188 = 0, $202 = 0, $203 = 0, $206 = 0, $211 = 0, $212 = 0, $214 = 0, $222 = 0, $223 = 0, $225 = 0, $227 = 0, $229 = 0, $231 = 0, $232 = 0, $234 = 0, $237 = 0, $240 = 0, $245 = 0, $248 = 0, $25 = 0, $251 = 0, $253 = 0, $255 = 0, $257 = 0, $262 = 0, $263 = 0, $266 = 0, $268 = 0, $270 = 0, $273 = 0, $286 = 0, $291 = 0, $30 = 0, $300 = 0, $301 = 0, $305 = 0, $308 = 0, $310 = 0, $312 = 0, $316 = 0, $319 = 0, $320 = 0, $324 = 0, $334 = 0, $339 = 0, $34 = 0, $342 = 0, $343 = 0, $344 = 0, $346 = 0, $351 = 0, $364 = 0, $368 = 0, $373 = 0, $38 = 0.0, $382 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $389 = 0, $39 = 0, $393 = 0, $395 = 0, $398 = 0, $401 = 0, $412 = 0, $42 = 0, $44 = 0, $47 = 0, $49 = 0, $6 = 0, $63 = 0, $66 = 0, $69 = 0, $7 = 0, $71 = 0, $79 = 0, $8 = 0, $80 = 0, $82 = 0, $83 = 0, $89 = 0, $9 = 0, $spec$select = 0, $spec$select539 = 0, $spec$select540 = 0, $spec$select540723 = 0, $spec$select541 = 0, $spec$select544 = 0.0, $spec$select548 = 0, $spec$select549 = 0, $spec$select551 = 0, $spec$select554 = 0, $spec$select557 = 0, $spec$select567 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 560 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(560);
 $6 = sp + 32 | 0;
 $7 = sp + 536 | 0;
 $8 = sp;
 $9 = $8;
 $10 = sp + 540 | 0;
 SAFE_HEAP_STORE($7 | 0, 0 | 0, 4);
 $11 = $10 + 12 | 0;
 $12 = ___DOUBLE_BITS_677($1) | 0;
 $13 = tempRet0;
 if (($13 | 0) < 0) {
  $15 = -$1;
  $16 = ___DOUBLE_BITS_677($15) | 0;
  $$0471 = $15;
  $$0522 = 1;
  $$0523 = 98918;
  $25 = tempRet0;
  $412 = $16;
 } else {
  $$0471 = $1;
  $$0522 = ($4 & 2049 | 0) != 0 & 1;
  $$0523 = ($4 & 2048 | 0) == 0 ? (($4 & 1 | 0) == 0 ? 98919 : 98924) : 98921;
  $25 = $13;
  $412 = $12;
 }
 do if (0 == 0 & ($25 & 2146435072 | 0) == 2146435072) {
  $30 = ($5 & 32 | 0) != 0;
  $34 = $$0522 + 3 | 0;
  _pad_676($0, 32, $2, $34, $4 & -65537);
  _out_670($0, $$0523, $$0522);
  _out_670($0, $$0471 != $$0471 | 0.0 != 0.0 ? ($30 ? 98945 : 98949) : $30 ? 98937 : 98941, 3);
  _pad_676($0, 32, $2, $34, $4 ^ 8192);
  $$sink757 = $34;
 } else {
  $38 = +_frexpl($$0471, $7) * 2.0;
  $39 = $38 != 0.0;
  if ($39) SAFE_HEAP_STORE($7 | 0, (SAFE_HEAP_LOAD($7 | 0, 4, 0) | 0 | 0) + -1 | 0, 4);
  $42 = $5 | 32;
  if (($42 | 0) == 97) {
   $44 = $5 & 32;
   $spec$select = ($44 | 0) == 0 ? $$0523 : $$0523 + 9 | 0;
   $47 = $$0522 | 2;
   $49 = 12 - $3 | 0;
   do if ($3 >>> 0 > 11 | ($49 | 0) == 0) $$1472 = $38; else {
    $$0511586 = 8.0;
    $$1510587 = $49;
    do {
     $$1510587 = $$1510587 + -1 | 0;
     $$0511586 = $$0511586 * 16.0;
    } while (($$1510587 | 0) != 0);
    if ((SAFE_HEAP_LOAD($spec$select >> 0 | 0, 1, 0) | 0 | 0) == 45) {
     $$1472 = -($$0511586 + (-$38 - $$0511586));
     break;
    } else {
     $$1472 = $38 + $$0511586 - $$0511586;
     break;
    }
   } while (0);
   $63 = SAFE_HEAP_LOAD($7 | 0, 4, 0) | 0 | 0;
   $66 = ($63 | 0) < 0 ? 0 - $63 | 0 : $63;
   $69 = _fmt_u($66, (($66 | 0) < 0) << 31 >> 31, $11) | 0;
   if (($69 | 0) == ($11 | 0)) {
    $71 = $10 + 11 | 0;
    SAFE_HEAP_STORE($71 >> 0 | 0, 48 | 0, 1);
    $$0513 = $71;
   } else $$0513 = $69;
   SAFE_HEAP_STORE($$0513 + -1 >> 0 | 0, ($63 >> 31 & 2) + 43 | 0, 1);
   $79 = $$0513 + -2 | 0;
   SAFE_HEAP_STORE($79 >> 0 | 0, $5 + 15 | 0, 1);
   $80 = ($3 | 0) < 1;
   $82 = ($4 & 8 | 0) == 0;
   $$0525 = $8;
   $$2473 = $$1472;
   while (1) {
    $83 = ~~$$2473;
    $89 = $$0525 + 1 | 0;
    SAFE_HEAP_STORE($$0525 >> 0 | 0, $44 | (SAFE_HEAP_LOAD(95632 + $83 >> 0 | 0, 1, 1) | 0) | 0, 1);
    $$2473 = ($$2473 - +($83 | 0)) * 16.0;
    if (($89 - $9 | 0) == 1) if ($82 & ($80 & $$2473 == 0.0)) $$1526 = $89; else {
     SAFE_HEAP_STORE($89 >> 0 | 0, 46 | 0, 1);
     $$1526 = $$0525 + 2 | 0;
    } else $$1526 = $89;
    if (!($$2473 != 0.0)) break; else $$0525 = $$1526;
   }
   $$pre720 = $$1526;
   if (!$3) label = 25; else if ((-2 - $9 + $$pre720 | 0) < ($3 | 0)) {
    $103 = $11;
    $104 = $79;
    $$0527 = $3 + 2 + $103 - $104 | 0;
    $$pre$phi717Z2D = $103;
    $$pre$phi718Z2D = $104;
   } else label = 25;
   if ((label | 0) == 25) {
    $108 = $11;
    $109 = $79;
    $$0527 = $108 - $9 - $109 + $$pre720 | 0;
    $$pre$phi717Z2D = $108;
    $$pre$phi718Z2D = $109;
   }
   $113 = $$0527 + $47 | 0;
   _pad_676($0, 32, $2, $113, $4);
   _out_670($0, $spec$select, $47);
   _pad_676($0, 48, $2, $113, $4 ^ 65536);
   $115 = $$pre720 - $9 | 0;
   _out_670($0, $8, $115);
   $116 = $$pre$phi717Z2D - $$pre$phi718Z2D | 0;
   _pad_676($0, 48, $$0527 - ($115 + $116) | 0, 0, 0);
   _out_670($0, $79, $116);
   _pad_676($0, 32, $2, $113, $4 ^ 8192);
   $$sink757 = $113;
   break;
  }
  $spec$select539 = ($3 | 0) < 0 ? 6 : $3;
  if ($39) {
   $123 = (SAFE_HEAP_LOAD($7 | 0, 4, 0) | 0 | 0) + -28 | 0;
   SAFE_HEAP_STORE($7 | 0, $123 | 0, 4);
   $$3 = $38 * 268435456.0;
   $$pr = $123;
  } else {
   $$3 = $38;
   $$pr = SAFE_HEAP_LOAD($7 | 0, 4, 0) | 0 | 0;
  }
  $$0498 = ($$pr | 0) < 0 ? $6 : $6 + 288 | 0;
  $$1499 = $$0498;
  $$4 = $$3;
  do {
   $126 = ~~$$4 >>> 0;
   SAFE_HEAP_STORE($$1499 | 0, $126 | 0, 4);
   $$1499 = $$1499 + 4 | 0;
   $$4 = ($$4 - +($126 >>> 0)) * 1.0e9;
  } while ($$4 != 0.0);
  $132 = $$0498;
  if (($$pr | 0) > 0) {
   $$1482683 = $$0498;
   $$2500682 = $$1499;
   $135 = $$pr;
   while (1) {
    $136 = ($135 | 0) < 29 ? $135 : 29;
    $$0488669 = $$2500682 + -4 | 0;
    if ($$0488669 >>> 0 < $$1482683 >>> 0) $$2483 = $$1482683; else {
     $$0488671 = $$0488669;
     $$0497670 = 0;
     do {
      $139 = _bitshift64Shl(SAFE_HEAP_LOAD($$0488671 | 0, 4, 0) | 0 | 0, 0, $136 | 0) | 0;
      $141 = _i64Add($139 | 0, tempRet0 | 0, $$0497670 | 0, 0) | 0;
      $142 = tempRet0;
      $$0497670 = ___udivdi3($141 | 0, $142 | 0, 1e9, 0) | 0;
      $145 = ___muldi3($$0497670 | 0, tempRet0 | 0, 1e9, 0) | 0;
      $147 = _i64Subtract($141 | 0, $142 | 0, $145 | 0, tempRet0 | 0) | 0;
      SAFE_HEAP_STORE($$0488671 | 0, $147 | 0, 4);
      $$0488671 = $$0488671 + -4 | 0;
     } while ($$0488671 >>> 0 >= $$1482683 >>> 0);
     if (!$$0497670) $$2483 = $$1482683; else {
      $151 = $$1482683 + -4 | 0;
      SAFE_HEAP_STORE($151 | 0, $$0497670 | 0, 4);
      $$2483 = $151;
     }
    }
    L57 : do if ($$2500682 >>> 0 > $$2483 >>> 0) {
     $$3501676 = $$2500682;
     while (1) {
      $154 = $$3501676 + -4 | 0;
      if (SAFE_HEAP_LOAD($154 | 0, 4, 0) | 0 | 0) {
       $$3501$lcssa = $$3501676;
       break L57;
      }
      if ($154 >>> 0 > $$2483 >>> 0) $$3501676 = $154; else {
       $$3501$lcssa = $154;
       break;
      }
     }
    } else $$3501$lcssa = $$2500682; while (0);
    $158 = (SAFE_HEAP_LOAD($7 | 0, 4, 0) | 0 | 0) - $136 | 0;
    SAFE_HEAP_STORE($7 | 0, $158 | 0, 4);
    if (($158 | 0) > 0) {
     $$1482683 = $$2483;
     $$2500682 = $$3501$lcssa;
     $135 = $158;
    } else {
     $$1482$lcssa = $$2483;
     $$2500$lcssa = $$3501$lcssa;
     $$pr564 = $158;
     break;
    }
   }
  } else {
   $$1482$lcssa = $$0498;
   $$2500$lcssa = $$1499;
   $$pr564 = $$pr;
  }
  if (($$pr564 | 0) < 0) {
   $163 = (($spec$select539 + 25 | 0) / 9 | 0) + 1 | 0;
   $164 = ($42 | 0) == 102;
   $$3484663 = $$1482$lcssa;
   $$4502662 = $$2500$lcssa;
   $166 = $$pr564;
   while (1) {
    $165 = 0 - $166 | 0;
    $168 = ($165 | 0) < 9 ? $165 : 9;
    if ($$3484663 >>> 0 < $$4502662 >>> 0) {
     $174 = (1 << $168) + -1 | 0;
     $175 = 1e9 >>> $168;
     $$0487657 = 0;
     $$1489656 = $$3484663;
     do {
      $176 = SAFE_HEAP_LOAD($$1489656 | 0, 4, 0) | 0 | 0;
      SAFE_HEAP_STORE($$1489656 | 0, ($176 >>> $168) + $$0487657 | 0, 4);
      $$0487657 = Math_imul($176 & $174, $175) | 0;
      $$1489656 = $$1489656 + 4 | 0;
     } while ($$1489656 >>> 0 < $$4502662 >>> 0);
     $spec$select540 = (SAFE_HEAP_LOAD($$3484663 | 0, 4, 0) | 0 | 0) == 0 ? $$3484663 + 4 | 0 : $$3484663;
     if (!$$0487657) {
      $$5503 = $$4502662;
      $spec$select540723 = $spec$select540;
     } else {
      SAFE_HEAP_STORE($$4502662 | 0, $$0487657 | 0, 4);
      $$5503 = $$4502662 + 4 | 0;
      $spec$select540723 = $spec$select540;
     }
    } else {
     $$5503 = $$4502662;
     $spec$select540723 = (SAFE_HEAP_LOAD($$3484663 | 0, 4, 0) | 0 | 0) == 0 ? $$3484663 + 4 | 0 : $$3484663;
    }
    $188 = $164 ? $$0498 : $spec$select540723;
    $spec$select541 = ($$5503 - $188 >> 2 | 0) > ($163 | 0) ? $188 + ($163 << 2) | 0 : $$5503;
    $166 = (SAFE_HEAP_LOAD($7 | 0, 4, 0) | 0 | 0) + $168 | 0;
    SAFE_HEAP_STORE($7 | 0, $166 | 0, 4);
    if (($166 | 0) >= 0) {
     $$3484$lcssa = $spec$select540723;
     $$4502$lcssa = $spec$select541;
     break;
    } else {
     $$3484663 = $spec$select540723;
     $$4502662 = $spec$select541;
    }
   }
  } else {
   $$3484$lcssa = $$1482$lcssa;
   $$4502$lcssa = $$2500$lcssa;
  }
  if ($$3484$lcssa >>> 0 < $$4502$lcssa >>> 0) {
   $202 = ($132 - $$3484$lcssa >> 2) * 9 | 0;
   $203 = SAFE_HEAP_LOAD($$3484$lcssa | 0, 4, 0) | 0 | 0;
   if ($203 >>> 0 < 10) $$1517 = $202; else {
    $$0516652 = $202;
    $$0532651 = 10;
    while (1) {
     $$0532651 = $$0532651 * 10 | 0;
     $206 = $$0516652 + 1 | 0;
     if ($203 >>> 0 < $$0532651 >>> 0) {
      $$1517 = $206;
      break;
     } else $$0516652 = $206;
    }
   }
  } else $$1517 = 0;
  $211 = ($42 | 0) == 103;
  $212 = ($spec$select539 | 0) != 0;
  $214 = $spec$select539 - (($42 | 0) == 102 ? 0 : $$1517) + (($212 & $211) << 31 >> 31) | 0;
  if (($214 | 0) < ((($$4502$lcssa - $132 >> 2) * 9 | 0) + -9 | 0)) {
   $222 = $214 + 9216 | 0;
   $223 = ($222 | 0) / 9 | 0;
   $225 = $$0498 + 4 + ($223 + -1024 << 2) | 0;
   $227 = $222 - ($223 * 9 | 0) | 0;
   if (($227 | 0) < 8) {
    $$0529$in646 = $227;
    $$1533645 = 10;
    while (1) {
     $229 = $$1533645 * 10 | 0;
     if (($$0529$in646 | 0) < 7) {
      $$0529$in646 = $$0529$in646 + 1 | 0;
      $$1533645 = $229;
     } else {
      $$1533$lcssa = $229;
      break;
     }
    }
   } else $$1533$lcssa = 10;
   $231 = SAFE_HEAP_LOAD($225 | 0, 4, 0) | 0 | 0;
   $232 = ($231 >>> 0) / ($$1533$lcssa >>> 0) | 0;
   $234 = $231 - (Math_imul($232, $$1533$lcssa) | 0) | 0;
   $237 = ($225 + 4 | 0) == ($$4502$lcssa | 0);
   if ($237 & ($234 | 0) == 0) {
    $$4492 = $225;
    $$4520 = $$1517;
    $$8 = $$3484$lcssa;
   } else {
    $spec$select544 = ($232 & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
    $240 = $$1533$lcssa >>> 1;
    $spec$select567 = $234 >>> 0 < $240 >>> 0 ? .5 : $237 & ($234 | 0) == ($240 | 0) ? 1.0 : 1.5;
    if (!$$0522) {
     $$1467 = $spec$select567;
     $$1469 = $spec$select544;
    } else {
     $245 = (SAFE_HEAP_LOAD($$0523 >> 0 | 0, 1, 0) | 0 | 0) == 45;
     $$1467 = $245 ? -$spec$select567 : $spec$select567;
     $$1469 = $245 ? -$spec$select544 : $spec$select544;
    }
    $248 = $231 - $234 | 0;
    SAFE_HEAP_STORE($225 | 0, $248 | 0, 4);
    if ($$1469 + $$1467 != $$1469) {
     $251 = $248 + $$1533$lcssa | 0;
     SAFE_HEAP_STORE($225 | 0, $251 | 0, 4);
     if ($251 >>> 0 > 999999999) {
      $$2490638 = $225;
      $$5486639 = $$3484$lcssa;
      while (1) {
       $253 = $$2490638 + -4 | 0;
       SAFE_HEAP_STORE($$2490638 | 0, 0 | 0, 4);
       if ($253 >>> 0 < $$5486639 >>> 0) {
        $255 = $$5486639 + -4 | 0;
        SAFE_HEAP_STORE($255 | 0, 0 | 0, 4);
        $$6 = $255;
       } else $$6 = $$5486639;
       $257 = (SAFE_HEAP_LOAD($253 | 0, 4, 0) | 0 | 0) + 1 | 0;
       SAFE_HEAP_STORE($253 | 0, $257 | 0, 4);
       if ($257 >>> 0 > 999999999) {
        $$2490638 = $253;
        $$5486639 = $$6;
       } else {
        $$2490$lcssa = $253;
        $$5486$lcssa = $$6;
        break;
       }
      }
     } else {
      $$2490$lcssa = $225;
      $$5486$lcssa = $$3484$lcssa;
     }
     $262 = ($132 - $$5486$lcssa >> 2) * 9 | 0;
     $263 = SAFE_HEAP_LOAD($$5486$lcssa | 0, 4, 0) | 0 | 0;
     if ($263 >>> 0 < 10) {
      $$4492 = $$2490$lcssa;
      $$4520 = $262;
      $$8 = $$5486$lcssa;
     } else {
      $$2518634 = $262;
      $$2534633 = 10;
      while (1) {
       $$2534633 = $$2534633 * 10 | 0;
       $266 = $$2518634 + 1 | 0;
       if ($263 >>> 0 < $$2534633 >>> 0) {
        $$4492 = $$2490$lcssa;
        $$4520 = $266;
        $$8 = $$5486$lcssa;
        break;
       } else $$2518634 = $266;
      }
     }
    } else {
     $$4492 = $225;
     $$4520 = $$1517;
     $$8 = $$3484$lcssa;
    }
   }
   $268 = $$4492 + 4 | 0;
   $$5521 = $$4520;
   $$8506 = $$4502$lcssa >>> 0 > $268 >>> 0 ? $268 : $$4502$lcssa;
   $$9 = $$8;
  } else {
   $$5521 = $$1517;
   $$8506 = $$4502$lcssa;
   $$9 = $$3484$lcssa;
  }
  $270 = 0 - $$5521 | 0;
  L109 : do if ($$8506 >>> 0 > $$9 >>> 0) {
   $$9507625 = $$8506;
   while (1) {
    $273 = $$9507625 + -4 | 0;
    if (SAFE_HEAP_LOAD($273 | 0, 4, 0) | 0 | 0) {
     $$9507$lcssa = $$9507625;
     $$lcssa583 = 1;
     break L109;
    }
    if ($273 >>> 0 > $$9 >>> 0) $$9507625 = $273; else {
     $$9507$lcssa = $273;
     $$lcssa583 = 0;
     break;
    }
   }
  } else {
   $$9507$lcssa = $$8506;
   $$lcssa583 = 0;
  } while (0);
  do if ($211) {
   $spec$select548 = $spec$select539 + (($212 ^ 1) & 1) | 0;
   if (($spec$select548 | 0) > ($$5521 | 0) & ($$5521 | 0) > -5) {
    $$0479 = $5 + -1 | 0;
    $$2476 = $spec$select548 + -1 - $$5521 | 0;
   } else {
    $$0479 = $5 + -2 | 0;
    $$2476 = $spec$select548 + -1 | 0;
   }
   if (!($4 & 8)) {
    if ($$lcssa583) {
     $286 = SAFE_HEAP_LOAD($$9507$lcssa + -4 | 0, 4, 0) | 0 | 0;
     if (!$286) $$2531 = 9; else if (!(($286 >>> 0) % 10 | 0)) {
      $$1530621 = 0;
      $$3535620 = 10;
      while (1) {
       $$3535620 = $$3535620 * 10 | 0;
       $291 = $$1530621 + 1 | 0;
       if (($286 >>> 0) % ($$3535620 >>> 0) | 0 | 0) {
        $$2531 = $291;
        break;
       } else $$1530621 = $291;
      }
     } else $$2531 = 0;
    } else $$2531 = 9;
    $300 = (($$9507$lcssa - $132 >> 2) * 9 | 0) + -9 | 0;
    if (($$0479 | 32 | 0) == 102) {
     $301 = $300 - $$2531 | 0;
     $spec$select549 = ($301 | 0) > 0 ? $301 : 0;
     $$1480 = $$0479;
     $$3477 = ($$2476 | 0) < ($spec$select549 | 0) ? $$2476 : $spec$select549;
     break;
    } else {
     $305 = $300 + $$5521 - $$2531 | 0;
     $spec$select551 = ($305 | 0) > 0 ? $305 : 0;
     $$1480 = $$0479;
     $$3477 = ($$2476 | 0) < ($spec$select551 | 0) ? $$2476 : $spec$select551;
     break;
    }
   } else {
    $$1480 = $$0479;
    $$3477 = $$2476;
   }
  } else {
   $$1480 = $5;
   $$3477 = $spec$select539;
  } while (0);
  $308 = ($$3477 | 0) != 0;
  $310 = $308 ? 1 : $4 >>> 3 & 1;
  $312 = ($$1480 | 32 | 0) == 102;
  if ($312) {
   $$2515 = 0;
   $$pn = ($$5521 | 0) > 0 ? $$5521 : 0;
  } else {
   $316 = ($$5521 | 0) < 0 ? $270 : $$5521;
   $319 = _fmt_u($316, (($316 | 0) < 0) << 31 >> 31, $11) | 0;
   $320 = $11;
   if (($320 - $319 | 0) < 2) {
    $$1514614 = $319;
    while (1) {
     $324 = $$1514614 + -1 | 0;
     SAFE_HEAP_STORE($324 >> 0 | 0, 48 | 0, 1);
     if (($320 - $324 | 0) < 2) $$1514614 = $324; else {
      $$1514$lcssa = $324;
      break;
     }
    }
   } else $$1514$lcssa = $319;
   SAFE_HEAP_STORE($$1514$lcssa + -1 >> 0 | 0, ($$5521 >> 31 & 2) + 43 | 0, 1);
   $334 = $$1514$lcssa + -2 | 0;
   SAFE_HEAP_STORE($334 >> 0 | 0, $$1480 | 0, 1);
   $$2515 = $334;
   $$pn = $320 - $334 | 0;
  }
  $339 = $$0522 + 1 + $$3477 + $310 + $$pn | 0;
  _pad_676($0, 32, $2, $339, $4);
  _out_670($0, $$0523, $$0522);
  _pad_676($0, 48, $2, $339, $4 ^ 65536);
  if ($312) {
   $spec$select554 = $$9 >>> 0 > $$0498 >>> 0 ? $$0498 : $$9;
   $342 = $8 + 9 | 0;
   $343 = $342;
   $344 = $8 + 8 | 0;
   $$5493603 = $spec$select554;
   do {
    $346 = _fmt_u(SAFE_HEAP_LOAD($$5493603 | 0, 4, 0) | 0 | 0, 0, $342) | 0;
    if (($$5493603 | 0) == ($spec$select554 | 0)) if (($346 | 0) == ($342 | 0)) {
     SAFE_HEAP_STORE($344 >> 0 | 0, 48 | 0, 1);
     $$1465 = $344;
    } else $$1465 = $346; else if ($346 >>> 0 > $8 >>> 0) {
     _memset($8 | 0, 48, $346 - $9 | 0) | 0;
     $$0464599 = $346;
     while (1) {
      $351 = $$0464599 + -1 | 0;
      if ($351 >>> 0 > $8 >>> 0) $$0464599 = $351; else {
       $$1465 = $351;
       break;
      }
     }
    } else $$1465 = $346;
    _out_670($0, $$1465, $343 - $$1465 | 0);
    $$5493603 = $$5493603 + 4 | 0;
   } while ($$5493603 >>> 0 <= $$0498 >>> 0);
   if (!(($4 & 8 | 0) == 0 & ($308 ^ 1))) _out_670($0, 98953, 1);
   if ($$5493603 >>> 0 < $$9507$lcssa >>> 0 & ($$3477 | 0) > 0) {
    $$4478594 = $$3477;
    $$6494593 = $$5493603;
    while (1) {
     $364 = _fmt_u(SAFE_HEAP_LOAD($$6494593 | 0, 4, 0) | 0 | 0, 0, $342) | 0;
     if ($364 >>> 0 > $8 >>> 0) {
      _memset($8 | 0, 48, $364 - $9 | 0) | 0;
      $$0463588 = $364;
      while (1) {
       $368 = $$0463588 + -1 | 0;
       if ($368 >>> 0 > $8 >>> 0) $$0463588 = $368; else {
        $$0463$lcssa = $368;
        break;
       }
      }
     } else $$0463$lcssa = $364;
     _out_670($0, $$0463$lcssa, ($$4478594 | 0) < 9 ? $$4478594 : 9);
     $$6494593 = $$6494593 + 4 | 0;
     $373 = $$4478594 + -9 | 0;
     if (!($$6494593 >>> 0 < $$9507$lcssa >>> 0 & ($$4478594 | 0) > 9)) {
      $$4478$lcssa = $373;
      break;
     } else $$4478594 = $373;
    }
   } else $$4478$lcssa = $$3477;
   _pad_676($0, 48, $$4478$lcssa + 9 | 0, 9, 0);
  } else {
   $spec$select557 = $$lcssa583 ? $$9507$lcssa : $$9 + 4 | 0;
   if ($$9 >>> 0 < $spec$select557 >>> 0 & ($$3477 | 0) > -1) {
    $382 = $8 + 9 | 0;
    $384 = ($4 & 8 | 0) == 0;
    $385 = $382;
    $386 = 0 - $9 | 0;
    $387 = $8 + 8 | 0;
    $$5609 = $$3477;
    $$7495608 = $$9;
    while (1) {
     $389 = _fmt_u(SAFE_HEAP_LOAD($$7495608 | 0, 4, 0) | 0 | 0, 0, $382) | 0;
     if (($389 | 0) == ($382 | 0)) {
      SAFE_HEAP_STORE($387 >> 0 | 0, 48 | 0, 1);
      $$0 = $387;
     } else $$0 = $389;
     do if (($$7495608 | 0) == ($$9 | 0)) {
      $395 = $$0 + 1 | 0;
      _out_670($0, $$0, 1);
      if ($384 & ($$5609 | 0) < 1) {
       $$2 = $395;
       break;
      }
      _out_670($0, 98953, 1);
      $$2 = $395;
     } else {
      if ($$0 >>> 0 <= $8 >>> 0) {
       $$2 = $$0;
       break;
      }
      _memset($8 | 0, 48, $$0 + $386 | 0) | 0;
      $$1604 = $$0;
      while (1) {
       $393 = $$1604 + -1 | 0;
       if ($393 >>> 0 > $8 >>> 0) $$1604 = $393; else {
        $$2 = $393;
        break;
       }
      }
     } while (0);
     $398 = $385 - $$2 | 0;
     _out_670($0, $$2, ($$5609 | 0) > ($398 | 0) ? $398 : $$5609);
     $401 = $$5609 - $398 | 0;
     $$7495608 = $$7495608 + 4 | 0;
     if (!($$7495608 >>> 0 < $spec$select557 >>> 0 & ($401 | 0) > -1)) {
      $$5$lcssa = $401;
      break;
     } else $$5609 = $401;
    }
   } else $$5$lcssa = $$3477;
   _pad_676($0, 48, $$5$lcssa + 18 | 0, 18, 0);
   _out_670($0, $$2515, $11 - $$2515 | 0);
  }
  _pad_676($0, 32, $2, $339, $4 ^ 8192);
  $$sink757 = $339;
 } while (0);
 STACKTOP = sp;
 return (($$sink757 | 0) < ($2 | 0) ? $2 : $$sink757) | 0;
}

function _printf_core($0, $1, $2, $3, $4) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 var $$0 = 0, $$0228 = 0, $$0229334 = 0, $$0232 = 0, $$0235 = 0, $$0237 = 0, $$0240313 = 0, $$0240313371 = 0, $$0240333 = 0, $$0243 = 0, $$0243$ph = 0, $$0243$ph$be = 0, $$0247 = 0, $$0247$ph = 0, $$0249$lcssa = 0, $$0249321 = 0, $$0252 = 0, $$0253 = 0, $$0254 = 0, $$0259 = 0, $$0262$lcssa = 0, $$0262328 = 0, $$0269$ph = 0, $$1 = 0, $$1230340 = 0, $$1233 = 0, $$1236 = 0, $$1238 = 0, $$1241339 = 0, $$1248 = 0, $$1255 = 0, $$1260 = 0, $$1263 = 0, $$1270 = 0, $$2 = 0, $$2234 = 0, $$2239 = 0, $$2242320 = 0, $$2256 = 0, $$2261 = 0, $$2271 = 0, $$3265 = 0, $$3272 = 0, $$3317 = 0, $$4258370 = 0, $$4266 = 0, $$5 = 0, $$6268 = 0, $$lcssa308 = 0, $$pre$phiZ2D = 0, $$pre360 = 0, $$pre363 = 0, $$sink = 0, $10 = 0, $102 = 0, $103 = 0, $106 = 0, $109 = 0, $11 = 0, $112 = 0, $114 = 0, $12 = 0, $122 = 0, $126 = 0, $13 = 0, $137 = 0, $14 = 0, $141 = 0, $148 = 0, $149 = 0, $151 = 0, $152 = 0, $154 = 0, $163 = 0, $164 = 0, $169 = 0, $172 = 0, $177 = 0, $178 = 0, $183 = 0, $185 = 0, $192 = 0, $193 = 0, $20 = 0, $204 = 0, $21 = 0, $216 = 0, $223 = 0, $225 = 0, $228 = 0, $23 = 0, $230 = 0, $238 = 0, $24 = 0, $240 = 0, $243 = 0, $244 = 0, $248 = 0, $25 = 0, $252 = 0, $254 = 0, $257 = 0, $259 = 0, $260 = 0, $261 = 0, $27 = 0, $271 = 0, $272 = 0, $277 = 0, $279 = 0, $280 = 0, $286 = 0, $298 = 0, $30 = 0, $301 = 0, $302 = 0, $315 = 0, $317 = 0, $318 = 0, $322 = 0, $326 = 0, $328 = 0, $339 = 0, $341 = 0, $348 = 0, $351 = 0, $358 = 0, $359 = 0, $43 = 0, $5 = 0, $51 = 0, $52 = 0, $54 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $7 = 0, $76 = 0, $8 = 0, $80 = 0, $9 = 0, $or$cond = 0, $or$cond278 = 0, $spec$select = 0, $spec$select284 = 0, $storemerge273$lcssa = 0, $storemerge273327 = 0, $storemerge274 = 0, label = 0, sp = 0, $154$looptemp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(64);
 $5 = sp + 56 | 0;
 $6 = sp + 40 | 0;
 $7 = sp;
 $8 = sp + 48 | 0;
 $9 = sp + 60 | 0;
 SAFE_HEAP_STORE($5 | 0, $1 | 0, 4);
 $10 = ($0 | 0) != 0;
 $11 = $7 + 40 | 0;
 $12 = $11;
 $13 = $7 + 39 | 0;
 $14 = $8 + 4 | 0;
 $$0243$ph = 0;
 $$0247$ph = 0;
 $$0269$ph = 0;
 L1 : while (1) {
  $$0243 = $$0243$ph;
  $$0247 = $$0247$ph;
  while (1) {
   do if (($$0247 | 0) > -1) if (($$0243 | 0) > (2147483647 - $$0247 | 0)) {
    SAFE_HEAP_STORE(___errno_location() | 0 | 0, 75 | 0, 4);
    $$1248 = -1;
    break;
   } else {
    $$1248 = $$0243 + $$0247 | 0;
    break;
   } else $$1248 = $$0247; while (0);
   $20 = SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0;
   $21 = SAFE_HEAP_LOAD($20 >> 0 | 0, 1, 0) | 0 | 0;
   if (!($21 << 24 >> 24)) {
    label = 94;
    break L1;
   }
   $23 = $21;
   $25 = $20;
   L12 : while (1) {
    switch ($23 << 24 >> 24) {
    case 37:
     {
      label = 10;
      break L12;
      break;
     }
    case 0:
     {
      $$0249$lcssa = $25;
      break L12;
      break;
     }
    default:
     {}
    }
    $24 = $25 + 1 | 0;
    SAFE_HEAP_STORE($5 | 0, $24 | 0, 4);
    $23 = SAFE_HEAP_LOAD($24 >> 0 | 0, 1, 0) | 0 | 0;
    $25 = $24;
   }
   L15 : do if ((label | 0) == 10) {
    label = 0;
    $$0249321 = $25;
    $27 = $25;
    while (1) {
     if ((SAFE_HEAP_LOAD($27 + 1 >> 0 | 0, 1, 0) | 0 | 0) != 37) {
      $$0249$lcssa = $$0249321;
      break L15;
     }
     $30 = $$0249321 + 1 | 0;
     $27 = $27 + 2 | 0;
     SAFE_HEAP_STORE($5 | 0, $27 | 0, 4);
     if ((SAFE_HEAP_LOAD($27 >> 0 | 0, 1, 0) | 0 | 0) != 37) {
      $$0249$lcssa = $30;
      break;
     } else $$0249321 = $30;
    }
   } while (0);
   $$0243 = $$0249$lcssa - $20 | 0;
   if ($10) _out_670($0, $20, $$0243);
   if (!$$0243) break; else $$0247 = $$1248;
  }
  $43 = (_isdigit(SAFE_HEAP_LOAD((SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0) + 1 >> 0 | 0, 1, 0) | 0 | 0) | 0) == 0;
  $$pre360 = SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0;
  if ($43) {
   $$0253 = -1;
   $$1270 = $$0269$ph;
   $$sink = 1;
  } else if ((SAFE_HEAP_LOAD($$pre360 + 2 >> 0 | 0, 1, 0) | 0 | 0) == 36) {
   $$0253 = (SAFE_HEAP_LOAD($$pre360 + 1 >> 0 | 0, 1, 0) | 0 | 0) + -48 | 0;
   $$1270 = 1;
   $$sink = 3;
  } else {
   $$0253 = -1;
   $$1270 = $$0269$ph;
   $$sink = 1;
  }
  $51 = $$pre360 + $$sink | 0;
  SAFE_HEAP_STORE($5 | 0, $51 | 0, 4);
  $52 = SAFE_HEAP_LOAD($51 >> 0 | 0, 1, 0) | 0 | 0;
  $54 = ($52 << 24 >> 24) + -32 | 0;
  if ($54 >>> 0 > 31 | (1 << $54 & 75913 | 0) == 0) {
   $$0262$lcssa = 0;
   $$lcssa308 = $52;
   $storemerge273$lcssa = $51;
  } else {
   $$0262328 = 0;
   $60 = $54;
   $storemerge273327 = $51;
   while (1) {
    $61 = 1 << $60 | $$0262328;
    $62 = $storemerge273327 + 1 | 0;
    SAFE_HEAP_STORE($5 | 0, $62 | 0, 4);
    $63 = SAFE_HEAP_LOAD($62 >> 0 | 0, 1, 0) | 0 | 0;
    $60 = ($63 << 24 >> 24) + -32 | 0;
    if ($60 >>> 0 > 31 | (1 << $60 & 75913 | 0) == 0) {
     $$0262$lcssa = $61;
     $$lcssa308 = $63;
     $storemerge273$lcssa = $62;
     break;
    } else {
     $$0262328 = $61;
     $storemerge273327 = $62;
    }
   }
  }
  if ($$lcssa308 << 24 >> 24 == 42) {
   if (!(_isdigit(SAFE_HEAP_LOAD($storemerge273$lcssa + 1 >> 0 | 0, 1, 0) | 0 | 0) | 0)) label = 27; else {
    $76 = SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0;
    if ((SAFE_HEAP_LOAD($76 + 2 >> 0 | 0, 1, 0) | 0 | 0) == 36) {
     $80 = $76 + 1 | 0;
     SAFE_HEAP_STORE($4 + ((SAFE_HEAP_LOAD($80 >> 0 | 0, 1, 0) | 0 | 0) + -48 << 2) | 0, 10 | 0, 4);
     $$0259 = SAFE_HEAP_LOAD($3 + ((SAFE_HEAP_LOAD($80 >> 0 | 0, 1, 0) | 0 | 0) + -48 << 3) | 0, 4, 0) | 0 | 0;
     $$2271 = 1;
     $storemerge274 = $76 + 3 | 0;
    } else label = 27;
   }
   if ((label | 0) == 27) {
    label = 0;
    if ($$1270 | 0) {
     $$0 = -1;
     break;
    }
    if ($10) {
     $102 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
     $103 = SAFE_HEAP_LOAD($102 | 0, 4, 0) | 0 | 0;
     SAFE_HEAP_STORE($2 | 0, $102 + 4 | 0, 4);
     $358 = $103;
    } else $358 = 0;
    $$0259 = $358;
    $$2271 = 0;
    $storemerge274 = (SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0) + 1 | 0;
   }
   SAFE_HEAP_STORE($5 | 0, $storemerge274 | 0, 4);
   $106 = ($$0259 | 0) < 0;
   $$1260 = $106 ? 0 - $$0259 | 0 : $$0259;
   $$1263 = $106 ? $$0262$lcssa | 8192 : $$0262$lcssa;
   $$3272 = $$2271;
   $112 = $storemerge274;
  } else {
   $109 = _getint_671($5) | 0;
   if (($109 | 0) < 0) {
    $$0 = -1;
    break;
   }
   $$1260 = $109;
   $$1263 = $$0262$lcssa;
   $$3272 = $$1270;
   $112 = SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0;
  }
  do if ((SAFE_HEAP_LOAD($112 >> 0 | 0, 1, 0) | 0 | 0) == 46) {
   $114 = $112 + 1 | 0;
   if ((SAFE_HEAP_LOAD($114 >> 0 | 0, 1, 0) | 0 | 0) != 42) {
    SAFE_HEAP_STORE($5 | 0, $114 | 0, 4);
    $152 = _getint_671($5) | 0;
    $$0254 = $152;
    $$pre363 = SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0;
    break;
   }
   if (_isdigit(SAFE_HEAP_LOAD($112 + 2 >> 0 | 0, 1, 0) | 0 | 0) | 0) {
    $122 = SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0;
    if ((SAFE_HEAP_LOAD($122 + 3 >> 0 | 0, 1, 0) | 0 | 0) == 36) {
     $126 = $122 + 2 | 0;
     SAFE_HEAP_STORE($4 + ((SAFE_HEAP_LOAD($126 >> 0 | 0, 1, 0) | 0 | 0) + -48 << 2) | 0, 10 | 0, 4);
     $137 = SAFE_HEAP_LOAD($3 + ((SAFE_HEAP_LOAD($126 >> 0 | 0, 1, 0) | 0 | 0) + -48 << 3) | 0, 4, 0) | 0 | 0;
     $141 = $122 + 4 | 0;
     SAFE_HEAP_STORE($5 | 0, $141 | 0, 4);
     $$0254 = $137;
     $$pre363 = $141;
     break;
    }
   }
   if ($$3272 | 0) {
    $$0 = -1;
    break L1;
   }
   if ($10) {
    $148 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
    $149 = SAFE_HEAP_LOAD($148 | 0, 4, 0) | 0 | 0;
    SAFE_HEAP_STORE($2 | 0, $148 + 4 | 0, 4);
    $359 = $149;
   } else $359 = 0;
   $151 = (SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0) + 2 | 0;
   SAFE_HEAP_STORE($5 | 0, $151 | 0, 4);
   $$0254 = $359;
   $$pre363 = $151;
  } else {
   $$0254 = -1;
   $$pre363 = $112;
  } while (0);
  $$0252 = 0;
  $154 = $$pre363;
  while (1) {
   if (((SAFE_HEAP_LOAD($154 >> 0 | 0, 1, 0) | 0 | 0) + -65 | 0) >>> 0 > 57) {
    $$0 = -1;
    break L1;
   }
   $154$looptemp = $154;
   $154 = $154 + 1 | 0;
   SAFE_HEAP_STORE($5 | 0, $154 | 0, 4);
   $163 = SAFE_HEAP_LOAD((SAFE_HEAP_LOAD($154$looptemp >> 0 | 0, 1, 0) | 0 | 0) + -65 + (95168 + ($$0252 * 58 | 0)) >> 0 | 0, 1, 0) | 0 | 0;
   $164 = $163 & 255;
   if (($164 + -1 | 0) >>> 0 >= 8) break; else $$0252 = $164;
  }
  if (!($163 << 24 >> 24)) {
   $$0 = -1;
   break;
  }
  $169 = ($$0253 | 0) > -1;
  do if ($163 << 24 >> 24 == 19) if ($169) {
   $$0 = -1;
   break L1;
  } else label = 54; else {
   if ($169) {
    SAFE_HEAP_STORE($4 + ($$0253 << 2) | 0, $164 | 0, 4);
    $172 = $3 + ($$0253 << 3) | 0;
    $177 = SAFE_HEAP_LOAD($172 + 4 | 0, 4, 0) | 0 | 0;
    $178 = $6;
    SAFE_HEAP_STORE($178 | 0, SAFE_HEAP_LOAD($172 | 0, 4, 0) | 0 | 0, 4);
    SAFE_HEAP_STORE($178 + 4 | 0, $177 | 0, 4);
    label = 54;
    break;
   }
   if (!$10) {
    $$0 = 0;
    break L1;
   }
   _pop_arg_673($6, $164, $2);
   $183 = SAFE_HEAP_LOAD($5 | 0, 4, 0) | 0 | 0;
   label = 55;
  } while (0);
  if ((label | 0) == 54) {
   label = 0;
   if ($10) {
    $183 = $154;
    label = 55;
   } else $$0243$ph$be = 0;
  }
  L77 : do if ((label | 0) == 55) {
   label = 0;
   $185 = SAFE_HEAP_LOAD($183 + -1 >> 0 | 0, 1, 0) | 0 | 0;
   $$0235 = ($$0252 | 0) != 0 & ($185 & 15 | 0) == 3 ? $185 & -33 : $185;
   $192 = $$1263 & -65537;
   $spec$select = ($$1263 & 8192 | 0) == 0 ? $$1263 : $192;
   L79 : do switch ($$0235 | 0) {
   case 110:
    {
     switch (($$0252 & 255) << 24 >> 24) {
     case 0:
      {
       SAFE_HEAP_STORE(SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0, $$1248 | 0, 4);
       $$0243$ph$be = 0;
       break L77;
       break;
      }
     case 1:
      {
       SAFE_HEAP_STORE(SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0, $$1248 | 0, 4);
       $$0243$ph$be = 0;
       break L77;
       break;
      }
     case 2:
      {
       $204 = SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0;
       SAFE_HEAP_STORE($204 | 0, $$1248 | 0, 4);
       SAFE_HEAP_STORE($204 + 4 | 0, (($$1248 | 0) < 0) << 31 >> 31 | 0, 4);
       $$0243$ph$be = 0;
       break L77;
       break;
      }
     case 3:
      {
       SAFE_HEAP_STORE(SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0, $$1248 | 0, 2);
       $$0243$ph$be = 0;
       break L77;
       break;
      }
     case 4:
      {
       SAFE_HEAP_STORE((SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0) >> 0 | 0, $$1248 | 0, 1);
       $$0243$ph$be = 0;
       break L77;
       break;
      }
     case 6:
      {
       SAFE_HEAP_STORE(SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0, $$1248 | 0, 4);
       $$0243$ph$be = 0;
       break L77;
       break;
      }
     case 7:
      {
       $216 = SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0;
       SAFE_HEAP_STORE($216 | 0, $$1248 | 0, 4);
       SAFE_HEAP_STORE($216 + 4 | 0, (($$1248 | 0) < 0) << 31 >> 31 | 0, 4);
       $$0243$ph$be = 0;
       break L77;
       break;
      }
     default:
      {
       $$0243$ph$be = 0;
       break L77;
      }
     }
     break;
    }
   case 112:
    {
     $$1236 = 120;
     $$1255 = $$0254 >>> 0 > 8 ? $$0254 : 8;
     $$3265 = $spec$select | 8;
     label = 67;
     break;
    }
   case 88:
   case 120:
    {
     $$1236 = $$0235;
     $$1255 = $$0254;
     $$3265 = $spec$select;
     label = 67;
     break;
    }
   case 111:
    {
     $238 = $6;
     $240 = SAFE_HEAP_LOAD($238 | 0, 4, 0) | 0 | 0;
     $243 = SAFE_HEAP_LOAD($238 + 4 | 0, 4, 0) | 0 | 0;
     $244 = _fmt_o($240, $243, $11) | 0;
     $248 = $12 - $244 | 0;
     $$0228 = $244;
     $$1233 = 0;
     $$1238 = 98901;
     $$2256 = ($spec$select & 8 | 0) == 0 | ($$0254 | 0) > ($248 | 0) ? $$0254 : $248 + 1 | 0;
     $$4266 = $spec$select;
     $277 = $240;
     $279 = $243;
     label = 73;
     break;
    }
   case 105:
   case 100:
    {
     $252 = $6;
     $254 = SAFE_HEAP_LOAD($252 | 0, 4, 0) | 0 | 0;
     $257 = SAFE_HEAP_LOAD($252 + 4 | 0, 4, 0) | 0 | 0;
     if (($257 | 0) < 0) {
      $259 = _i64Subtract(0, 0, $254 | 0, $257 | 0) | 0;
      $260 = tempRet0;
      $261 = $6;
      SAFE_HEAP_STORE($261 | 0, $259 | 0, 4);
      SAFE_HEAP_STORE($261 + 4 | 0, $260 | 0, 4);
      $$0232 = 1;
      $$0237 = 98901;
      $271 = $259;
      $272 = $260;
      label = 72;
      break L79;
     } else {
      $$0232 = ($spec$select & 2049 | 0) != 0 & 1;
      $$0237 = ($spec$select & 2048 | 0) == 0 ? (($spec$select & 1 | 0) == 0 ? 98901 : 98903) : 98902;
      $271 = $254;
      $272 = $257;
      label = 72;
      break L79;
     }
     break;
    }
   case 117:
    {
     $193 = $6;
     $$0232 = 0;
     $$0237 = 98901;
     $271 = SAFE_HEAP_LOAD($193 | 0, 4, 0) | 0 | 0;
     $272 = SAFE_HEAP_LOAD($193 + 4 | 0, 4, 0) | 0 | 0;
     label = 72;
     break;
    }
   case 99:
    {
     SAFE_HEAP_STORE($13 >> 0 | 0, SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0, 1);
     $$2 = $13;
     $$2234 = 0;
     $$2239 = 98901;
     $$5 = 1;
     $$6268 = $192;
     $$pre$phiZ2D = $12;
     break;
    }
   case 109:
    {
     $$1 = _strerror(SAFE_HEAP_LOAD(___errno_location() | 0 | 0, 4, 0) | 0 | 0) | 0;
     label = 77;
     break;
    }
   case 115:
    {
     $298 = SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0;
     $$1 = ($298 | 0) == 0 ? 98911 : $298;
     label = 77;
     break;
    }
   case 67:
    {
     SAFE_HEAP_STORE($8 | 0, SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0, 4);
     SAFE_HEAP_STORE($14 | 0, 0 | 0, 4);
     SAFE_HEAP_STORE($6 | 0, $8 | 0, 4);
     $$4258370 = -1;
     label = 81;
     break;
    }
   case 83:
    {
     if (!$$0254) {
      _pad_676($0, 32, $$1260, 0, $spec$select);
      $$0240313371 = 0;
      label = 91;
     } else {
      $$4258370 = $$0254;
      label = 81;
     }
     break;
    }
   case 65:
   case 71:
   case 70:
   case 69:
   case 97:
   case 103:
   case 102:
   case 101:
    {
     $$0243$ph$be = _fmt_fp($0, +(+SAFE_HEAP_LOAD_D($6 | 0, 8)), $$1260, $$0254, $spec$select, $$0235) | 0;
     break L77;
     break;
    }
   default:
    {
     $$2 = $20;
     $$2234 = 0;
     $$2239 = 98901;
     $$5 = $$0254;
     $$6268 = $spec$select;
     $$pre$phiZ2D = $12;
    }
   } while (0);
   L103 : do if ((label | 0) == 67) {
    label = 0;
    $223 = $6;
    $225 = SAFE_HEAP_LOAD($223 | 0, 4, 0) | 0 | 0;
    $228 = SAFE_HEAP_LOAD($223 + 4 | 0, 4, 0) | 0 | 0;
    $230 = _fmt_x($225, $228, $11, $$1236 & 32) | 0;
    $or$cond278 = ($$3265 & 8 | 0) == 0 | ($225 | 0) == 0 & ($228 | 0) == 0;
    $$0228 = $230;
    $$1233 = $or$cond278 ? 0 : 2;
    $$1238 = $or$cond278 ? 98901 : 98901 + ($$1236 >>> 4) | 0;
    $$2256 = $$1255;
    $$4266 = $$3265;
    $277 = $225;
    $279 = $228;
    label = 73;
   } else if ((label | 0) == 72) {
    label = 0;
    $$0228 = _fmt_u($271, $272, $11) | 0;
    $$1233 = $$0232;
    $$1238 = $$0237;
    $$2256 = $$0254;
    $$4266 = $spec$select;
    $277 = $271;
    $279 = $272;
    label = 73;
   } else if ((label | 0) == 77) {
    label = 0;
    $301 = _memchr($$1, 0, $$0254) | 0;
    $302 = ($301 | 0) == 0;
    $$2 = $$1;
    $$2234 = 0;
    $$2239 = 98901;
    $$5 = $302 ? $$0254 : $301 - $$1 | 0;
    $$6268 = $192;
    $$pre$phiZ2D = $302 ? $$1 + $$0254 | 0 : $301;
   } else if ((label | 0) == 81) {
    label = 0;
    $$0229334 = SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0;
    $$0240333 = 0;
    while (1) {
     $315 = SAFE_HEAP_LOAD($$0229334 | 0, 4, 0) | 0 | 0;
     if (!$315) {
      $$0240313 = $$0240333;
      break;
     }
     $317 = _wctomb($9, $315) | 0;
     $318 = ($317 | 0) < 0;
     if ($318 | $317 >>> 0 > ($$4258370 - $$0240333 | 0) >>> 0) {
      label = 85;
      break;
     }
     $322 = $317 + $$0240333 | 0;
     if ($$4258370 >>> 0 > $322 >>> 0) {
      $$0229334 = $$0229334 + 4 | 0;
      $$0240333 = $322;
     } else {
      $$0240313 = $322;
      break;
     }
    }
    if ((label | 0) == 85) {
     label = 0;
     if ($318) {
      $$0 = -1;
      break L1;
     } else $$0240313 = $$0240333;
    }
    _pad_676($0, 32, $$1260, $$0240313, $spec$select);
    if (!$$0240313) {
     $$0240313371 = 0;
     label = 91;
    } else {
     $$1230340 = SAFE_HEAP_LOAD($6 | 0, 4, 0) | 0 | 0;
     $$1241339 = 0;
     while (1) {
      $326 = SAFE_HEAP_LOAD($$1230340 | 0, 4, 0) | 0 | 0;
      if (!$326) {
       $$0240313371 = $$0240313;
       label = 91;
       break L103;
      }
      $328 = _wctomb($9, $326) | 0;
      $$1241339 = $328 + $$1241339 | 0;
      if (($$1241339 | 0) > ($$0240313 | 0)) {
       $$0240313371 = $$0240313;
       label = 91;
       break L103;
      }
      _out_670($0, $9, $328);
      if ($$1241339 >>> 0 >= $$0240313 >>> 0) {
       $$0240313371 = $$0240313;
       label = 91;
       break;
      } else $$1230340 = $$1230340 + 4 | 0;
     }
    }
   } while (0);
   if ((label | 0) == 73) {
    label = 0;
    $280 = ($277 | 0) != 0 | ($279 | 0) != 0;
    $or$cond = ($$2256 | 0) != 0 | $280;
    $286 = $12 - $$0228 + (($280 ^ 1) & 1) | 0;
    $$2 = $or$cond ? $$0228 : $11;
    $$2234 = $$1233;
    $$2239 = $$1238;
    $$5 = $or$cond ? (($$2256 | 0) > ($286 | 0) ? $$2256 : $286) : 0;
    $$6268 = ($$2256 | 0) > -1 ? $$4266 & -65537 : $$4266;
    $$pre$phiZ2D = $12;
   } else if ((label | 0) == 91) {
    label = 0;
    _pad_676($0, 32, $$1260, $$0240313371, $spec$select ^ 8192);
    $$0243$ph$be = ($$1260 | 0) > ($$0240313371 | 0) ? $$1260 : $$0240313371;
    break;
   }
   $339 = $$pre$phiZ2D - $$2 | 0;
   $spec$select284 = ($$5 | 0) < ($339 | 0) ? $339 : $$5;
   $341 = $spec$select284 + $$2234 | 0;
   $$2261 = ($$1260 | 0) < ($341 | 0) ? $341 : $$1260;
   _pad_676($0, 32, $$2261, $341, $$6268);
   _out_670($0, $$2239, $$2234);
   _pad_676($0, 48, $$2261, $341, $$6268 ^ 65536);
   _pad_676($0, 48, $spec$select284, $339, 0);
   _out_670($0, $$2, $339);
   _pad_676($0, 32, $$2261, $341, $$6268 ^ 8192);
   $$0243$ph$be = $$2261;
  } while (0);
  $$0243$ph = $$0243$ph$be;
  $$0247$ph = $$1248;
  $$0269$ph = $$3272;
 }
 L125 : do if ((label | 0) == 94) if (!$0) if (!$$0269$ph) $$0 = 0; else {
  $$2242320 = 1;
  while (1) {
   $348 = SAFE_HEAP_LOAD($4 + ($$2242320 << 2) | 0, 4, 0) | 0 | 0;
   if (!$348) break;
   _pop_arg_673($3 + ($$2242320 << 3) | 0, $348, $2);
   $351 = $$2242320 + 1 | 0;
   if ($351 >>> 0 < 10) $$2242320 = $351; else {
    $$0 = 1;
    break L125;
   }
  }
  $$3317 = $$2242320;
  while (1) {
   if (SAFE_HEAP_LOAD($4 + ($$3317 << 2) | 0, 4, 0) | 0 | 0) {
    $$0 = -1;
    break L125;
   }
   $$3317 = $$3317 + 1 | 0;
   if ($$3317 >>> 0 >= 10) {
    $$0 = 1;
    break;
   }
  }
 } else $$0 = $$1248; while (0);
 STACKTOP = sp;
 return $$0 | 0;
}

function _free($0) {
 $0 = $0 | 0;
 var $$0211$i = 0, $$0211$in$i = 0, $$0381438 = 0, $$0382$lcssa = 0, $$0382437 = 0, $$0394 = 0, $$0401 = 0, $$1 = 0, $$1380 = 0, $$1385 = 0, $$1385$be = 0, $$1385$ph = 0, $$1388 = 0, $$1388$be = 0, $$1388$ph = 0, $$1396 = 0, $$1396$be = 0, $$1396$ph = 0, $$1400 = 0, $$1400$be = 0, $$1400$ph = 0, $$2 = 0, $$3 = 0, $$3398 = 0, $$pre$phi444Z2D = 0, $$pre$phi446Z2D = 0, $$pre$phiZ2D = 0, $10 = 0, $105 = 0, $106 = 0, $114 = 0, $115 = 0, $116 = 0, $124 = 0, $13 = 0, $132 = 0, $137 = 0, $138 = 0, $141 = 0, $143 = 0, $145 = 0, $16 = 0, $160 = 0, $165 = 0, $167 = 0, $17 = 0, $170 = 0, $173 = 0, $176 = 0, $179 = 0, $180 = 0, $181 = 0, $183 = 0, $185 = 0, $186 = 0, $188 = 0, $189 = 0, $195 = 0, $196 = 0, $2 = 0, $205 = 0, $21 = 0, $210 = 0, $213 = 0, $214 = 0, $220 = 0, $235 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $244 = 0, $245 = 0, $251 = 0, $256 = 0, $257 = 0, $26 = 0, $260 = 0, $262 = 0, $265 = 0, $270 = 0, $276 = 0, $28 = 0, $280 = 0, $281 = 0, $288 = 0, $3 = 0, $300 = 0, $305 = 0, $312 = 0, $313 = 0, $314 = 0, $323 = 0, $41 = 0, $46 = 0, $48 = 0, $51 = 0, $53 = 0, $56 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $63 = 0, $65 = 0, $66 = 0, $68 = 0, $69 = 0, $7 = 0, $74 = 0, $75 = 0, $84 = 0, $89 = 0, $9 = 0, $92 = 0, $93 = 0, $99 = 0;
 if (!$0) return;
 $2 = $0 + -8 | 0;
 $3 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
 if ($2 >>> 0 < $3 >>> 0) _abort();
 $6 = SAFE_HEAP_LOAD($0 + -4 | 0, 4, 0) | 0 | 0;
 $7 = $6 & 3;
 if (($7 | 0) == 1) _abort();
 $9 = $6 & -8;
 $10 = $2 + $9 | 0;
 L10 : do if (!($6 & 1)) {
  $13 = SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0;
  if (!$7) return;
  $16 = $2 + (0 - $13) | 0;
  $17 = $13 + $9 | 0;
  if ($16 >>> 0 < $3 >>> 0) _abort();
  if ((SAFE_HEAP_LOAD(25122 * 4 | 0, 4, 0) | 0 | 0) == ($16 | 0)) {
   $105 = $10 + 4 | 0;
   $106 = SAFE_HEAP_LOAD($105 | 0, 4, 0) | 0 | 0;
   if (($106 & 3 | 0) != 3) {
    $$1 = $16;
    $$1380 = $17;
    $114 = $16;
    break;
   }
   SAFE_HEAP_STORE(25119 * 4 | 0, $17 | 0, 4);
   SAFE_HEAP_STORE($105 | 0, $106 & -2 | 0, 4);
   SAFE_HEAP_STORE($16 + 4 | 0, $17 | 1 | 0, 4);
   SAFE_HEAP_STORE($16 + $17 | 0, $17 | 0, 4);
   return;
  }
  $21 = $13 >>> 3;
  if ($13 >>> 0 < 256) {
   $24 = SAFE_HEAP_LOAD($16 + 8 | 0, 4, 0) | 0 | 0;
   $26 = SAFE_HEAP_LOAD($16 + 12 | 0, 4, 0) | 0 | 0;
   $28 = 100508 + ($21 << 1 << 2) | 0;
   if (($24 | 0) != ($28 | 0)) {
    if ($3 >>> 0 > $24 >>> 0) _abort();
    if ((SAFE_HEAP_LOAD($24 + 12 | 0, 4, 0) | 0 | 0) != ($16 | 0)) _abort();
   }
   if (($26 | 0) == ($24 | 0)) {
    SAFE_HEAP_STORE(25117 * 4 | 0, (SAFE_HEAP_LOAD(25117 * 4 | 0, 4, 0) | 0) & ~(1 << $21) | 0, 4);
    $$1 = $16;
    $$1380 = $17;
    $114 = $16;
    break;
   }
   if (($26 | 0) == ($28 | 0)) $$pre$phi446Z2D = $26 + 8 | 0; else {
    if ($3 >>> 0 > $26 >>> 0) _abort();
    $41 = $26 + 8 | 0;
    if ((SAFE_HEAP_LOAD($41 | 0, 4, 0) | 0 | 0) == ($16 | 0)) $$pre$phi446Z2D = $41; else _abort();
   }
   SAFE_HEAP_STORE($24 + 12 | 0, $26 | 0, 4);
   SAFE_HEAP_STORE($$pre$phi446Z2D | 0, $24 | 0, 4);
   $$1 = $16;
   $$1380 = $17;
   $114 = $16;
   break;
  }
  $46 = SAFE_HEAP_LOAD($16 + 24 | 0, 4, 0) | 0 | 0;
  $48 = SAFE_HEAP_LOAD($16 + 12 | 0, 4, 0) | 0 | 0;
  do if (($48 | 0) == ($16 | 0)) {
   $59 = $16 + 16 | 0;
   $60 = $59 + 4 | 0;
   $61 = SAFE_HEAP_LOAD($60 | 0, 4, 0) | 0 | 0;
   if (!$61) {
    $63 = SAFE_HEAP_LOAD($59 | 0, 4, 0) | 0 | 0;
    if (!$63) {
     $$3 = 0;
     break;
    } else {
     $$1385$ph = $63;
     $$1388$ph = $59;
    }
   } else {
    $$1385$ph = $61;
    $$1388$ph = $60;
   }
   $$1385 = $$1385$ph;
   $$1388 = $$1388$ph;
   while (1) {
    $65 = $$1385 + 20 | 0;
    $66 = SAFE_HEAP_LOAD($65 | 0, 4, 0) | 0 | 0;
    if (!$66) {
     $68 = $$1385 + 16 | 0;
     $69 = SAFE_HEAP_LOAD($68 | 0, 4, 0) | 0 | 0;
     if (!$69) break; else {
      $$1385$be = $69;
      $$1388$be = $68;
     }
    } else {
     $$1385$be = $66;
     $$1388$be = $65;
    }
    $$1385 = $$1385$be;
    $$1388 = $$1388$be;
   }
   if ($3 >>> 0 > $$1388 >>> 0) _abort(); else {
    SAFE_HEAP_STORE($$1388 | 0, 0 | 0, 4);
    $$3 = $$1385;
    break;
   }
  } else {
   $51 = SAFE_HEAP_LOAD($16 + 8 | 0, 4, 0) | 0 | 0;
   if ($3 >>> 0 > $51 >>> 0) _abort();
   $53 = $51 + 12 | 0;
   if ((SAFE_HEAP_LOAD($53 | 0, 4, 0) | 0 | 0) != ($16 | 0)) _abort();
   $56 = $48 + 8 | 0;
   if ((SAFE_HEAP_LOAD($56 | 0, 4, 0) | 0 | 0) == ($16 | 0)) {
    SAFE_HEAP_STORE($53 | 0, $48 | 0, 4);
    SAFE_HEAP_STORE($56 | 0, $51 | 0, 4);
    $$3 = $48;
    break;
   } else _abort();
  } while (0);
  if (!$46) {
   $$1 = $16;
   $$1380 = $17;
   $114 = $16;
  } else {
   $74 = SAFE_HEAP_LOAD($16 + 28 | 0, 4, 0) | 0 | 0;
   $75 = 100772 + ($74 << 2) | 0;
   do if ((SAFE_HEAP_LOAD($75 | 0, 4, 0) | 0 | 0) == ($16 | 0)) {
    SAFE_HEAP_STORE($75 | 0, $$3 | 0, 4);
    if (!$$3) {
     SAFE_HEAP_STORE(25118 * 4 | 0, (SAFE_HEAP_LOAD(25118 * 4 | 0, 4, 0) | 0) & ~(1 << $74) | 0, 4);
     $$1 = $16;
     $$1380 = $17;
     $114 = $16;
     break L10;
    }
   } else if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $46 >>> 0) _abort(); else {
    $84 = $46 + 16 | 0;
    SAFE_HEAP_STORE(((SAFE_HEAP_LOAD($84 | 0, 4, 0) | 0 | 0) == ($16 | 0) ? $84 : $46 + 20 | 0) | 0, $$3 | 0, 4);
    if (!$$3) {
     $$1 = $16;
     $$1380 = $17;
     $114 = $16;
     break L10;
    } else break;
   } while (0);
   $89 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
   if ($89 >>> 0 > $$3 >>> 0) _abort();
   SAFE_HEAP_STORE($$3 + 24 | 0, $46 | 0, 4);
   $92 = $16 + 16 | 0;
   $93 = SAFE_HEAP_LOAD($92 | 0, 4, 0) | 0 | 0;
   do if ($93 | 0) if ($89 >>> 0 > $93 >>> 0) _abort(); else {
    SAFE_HEAP_STORE($$3 + 16 | 0, $93 | 0, 4);
    SAFE_HEAP_STORE($93 + 24 | 0, $$3 | 0, 4);
    break;
   } while (0);
   $99 = SAFE_HEAP_LOAD($92 + 4 | 0, 4, 0) | 0 | 0;
   if (!$99) {
    $$1 = $16;
    $$1380 = $17;
    $114 = $16;
   } else if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $99 >>> 0) _abort(); else {
    SAFE_HEAP_STORE($$3 + 20 | 0, $99 | 0, 4);
    SAFE_HEAP_STORE($99 + 24 | 0, $$3 | 0, 4);
    $$1 = $16;
    $$1380 = $17;
    $114 = $16;
    break;
   }
  }
 } else {
  $$1 = $2;
  $$1380 = $9;
  $114 = $2;
 } while (0);
 if ($114 >>> 0 >= $10 >>> 0) _abort();
 $115 = $10 + 4 | 0;
 $116 = SAFE_HEAP_LOAD($115 | 0, 4, 0) | 0 | 0;
 if (!($116 & 1)) _abort();
 if (!($116 & 2)) {
  if ((SAFE_HEAP_LOAD(25123 * 4 | 0, 4, 0) | 0 | 0) == ($10 | 0)) {
   $124 = (SAFE_HEAP_LOAD(25120 * 4 | 0, 4, 0) | 0 | 0) + $$1380 | 0;
   SAFE_HEAP_STORE(25120 * 4 | 0, $124 | 0, 4);
   SAFE_HEAP_STORE(25123 * 4 | 0, $$1 | 0, 4);
   SAFE_HEAP_STORE($$1 + 4 | 0, $124 | 1 | 0, 4);
   if (($$1 | 0) != (SAFE_HEAP_LOAD(25122 * 4 | 0, 4, 0) | 0 | 0)) return;
   SAFE_HEAP_STORE(25122 * 4 | 0, 0 | 0, 4);
   SAFE_HEAP_STORE(25119 * 4 | 0, 0 | 0, 4);
   return;
  }
  if ((SAFE_HEAP_LOAD(25122 * 4 | 0, 4, 0) | 0 | 0) == ($10 | 0)) {
   $132 = (SAFE_HEAP_LOAD(25119 * 4 | 0, 4, 0) | 0 | 0) + $$1380 | 0;
   SAFE_HEAP_STORE(25119 * 4 | 0, $132 | 0, 4);
   SAFE_HEAP_STORE(25122 * 4 | 0, $114 | 0, 4);
   SAFE_HEAP_STORE($$1 + 4 | 0, $132 | 1 | 0, 4);
   SAFE_HEAP_STORE($114 + $132 | 0, $132 | 0, 4);
   return;
  }
  $137 = ($116 & -8) + $$1380 | 0;
  $138 = $116 >>> 3;
  L111 : do if ($116 >>> 0 < 256) {
   $141 = SAFE_HEAP_LOAD($10 + 8 | 0, 4, 0) | 0 | 0;
   $143 = SAFE_HEAP_LOAD($10 + 12 | 0, 4, 0) | 0 | 0;
   $145 = 100508 + ($138 << 1 << 2) | 0;
   if (($141 | 0) != ($145 | 0)) {
    if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $141 >>> 0) _abort();
    if ((SAFE_HEAP_LOAD($141 + 12 | 0, 4, 0) | 0 | 0) != ($10 | 0)) _abort();
   }
   if (($143 | 0) == ($141 | 0)) {
    SAFE_HEAP_STORE(25117 * 4 | 0, (SAFE_HEAP_LOAD(25117 * 4 | 0, 4, 0) | 0) & ~(1 << $138) | 0, 4);
    break;
   }
   if (($143 | 0) == ($145 | 0)) $$pre$phi444Z2D = $143 + 8 | 0; else {
    if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $143 >>> 0) _abort();
    $160 = $143 + 8 | 0;
    if ((SAFE_HEAP_LOAD($160 | 0, 4, 0) | 0 | 0) == ($10 | 0)) $$pre$phi444Z2D = $160; else _abort();
   }
   SAFE_HEAP_STORE($141 + 12 | 0, $143 | 0, 4);
   SAFE_HEAP_STORE($$pre$phi444Z2D | 0, $141 | 0, 4);
  } else {
   $165 = SAFE_HEAP_LOAD($10 + 24 | 0, 4, 0) | 0 | 0;
   $167 = SAFE_HEAP_LOAD($10 + 12 | 0, 4, 0) | 0 | 0;
   do if (($167 | 0) == ($10 | 0)) {
    $179 = $10 + 16 | 0;
    $180 = $179 + 4 | 0;
    $181 = SAFE_HEAP_LOAD($180 | 0, 4, 0) | 0 | 0;
    if (!$181) {
     $183 = SAFE_HEAP_LOAD($179 | 0, 4, 0) | 0 | 0;
     if (!$183) {
      $$3398 = 0;
      break;
     } else {
      $$1396$ph = $183;
      $$1400$ph = $179;
     }
    } else {
     $$1396$ph = $181;
     $$1400$ph = $180;
    }
    $$1396 = $$1396$ph;
    $$1400 = $$1400$ph;
    while (1) {
     $185 = $$1396 + 20 | 0;
     $186 = SAFE_HEAP_LOAD($185 | 0, 4, 0) | 0 | 0;
     if (!$186) {
      $188 = $$1396 + 16 | 0;
      $189 = SAFE_HEAP_LOAD($188 | 0, 4, 0) | 0 | 0;
      if (!$189) break; else {
       $$1396$be = $189;
       $$1400$be = $188;
      }
     } else {
      $$1396$be = $186;
      $$1400$be = $185;
     }
     $$1396 = $$1396$be;
     $$1400 = $$1400$be;
    }
    if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $$1400 >>> 0) _abort(); else {
     SAFE_HEAP_STORE($$1400 | 0, 0 | 0, 4);
     $$3398 = $$1396;
     break;
    }
   } else {
    $170 = SAFE_HEAP_LOAD($10 + 8 | 0, 4, 0) | 0 | 0;
    if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $170 >>> 0) _abort();
    $173 = $170 + 12 | 0;
    if ((SAFE_HEAP_LOAD($173 | 0, 4, 0) | 0 | 0) != ($10 | 0)) _abort();
    $176 = $167 + 8 | 0;
    if ((SAFE_HEAP_LOAD($176 | 0, 4, 0) | 0 | 0) == ($10 | 0)) {
     SAFE_HEAP_STORE($173 | 0, $167 | 0, 4);
     SAFE_HEAP_STORE($176 | 0, $170 | 0, 4);
     $$3398 = $167;
     break;
    } else _abort();
   } while (0);
   if ($165 | 0) {
    $195 = SAFE_HEAP_LOAD($10 + 28 | 0, 4, 0) | 0 | 0;
    $196 = 100772 + ($195 << 2) | 0;
    do if ((SAFE_HEAP_LOAD($196 | 0, 4, 0) | 0 | 0) == ($10 | 0)) {
     SAFE_HEAP_STORE($196 | 0, $$3398 | 0, 4);
     if (!$$3398) {
      SAFE_HEAP_STORE(25118 * 4 | 0, (SAFE_HEAP_LOAD(25118 * 4 | 0, 4, 0) | 0) & ~(1 << $195) | 0, 4);
      break L111;
     }
    } else if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $165 >>> 0) _abort(); else {
     $205 = $165 + 16 | 0;
     SAFE_HEAP_STORE(((SAFE_HEAP_LOAD($205 | 0, 4, 0) | 0 | 0) == ($10 | 0) ? $205 : $165 + 20 | 0) | 0, $$3398 | 0, 4);
     if (!$$3398) break L111; else break;
    } while (0);
    $210 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
    if ($210 >>> 0 > $$3398 >>> 0) _abort();
    SAFE_HEAP_STORE($$3398 + 24 | 0, $165 | 0, 4);
    $213 = $10 + 16 | 0;
    $214 = SAFE_HEAP_LOAD($213 | 0, 4, 0) | 0 | 0;
    do if ($214 | 0) if ($210 >>> 0 > $214 >>> 0) _abort(); else {
     SAFE_HEAP_STORE($$3398 + 16 | 0, $214 | 0, 4);
     SAFE_HEAP_STORE($214 + 24 | 0, $$3398 | 0, 4);
     break;
    } while (0);
    $220 = SAFE_HEAP_LOAD($213 + 4 | 0, 4, 0) | 0 | 0;
    if ($220 | 0) if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $220 >>> 0) _abort(); else {
     SAFE_HEAP_STORE($$3398 + 20 | 0, $220 | 0, 4);
     SAFE_HEAP_STORE($220 + 24 | 0, $$3398 | 0, 4);
     break;
    }
   }
  } while (0);
  SAFE_HEAP_STORE($$1 + 4 | 0, $137 | 1 | 0, 4);
  SAFE_HEAP_STORE($114 + $137 | 0, $137 | 0, 4);
  if (($$1 | 0) == (SAFE_HEAP_LOAD(25122 * 4 | 0, 4, 0) | 0 | 0)) {
   SAFE_HEAP_STORE(25119 * 4 | 0, $137 | 0, 4);
   return;
  } else $$2 = $137;
 } else {
  SAFE_HEAP_STORE($115 | 0, $116 & -2 | 0, 4);
  SAFE_HEAP_STORE($$1 + 4 | 0, $$1380 | 1 | 0, 4);
  SAFE_HEAP_STORE($114 + $$1380 | 0, $$1380 | 0, 4);
  $$2 = $$1380;
 }
 $235 = $$2 >>> 3;
 if ($$2 >>> 0 < 256) {
  $238 = 100508 + ($235 << 1 << 2) | 0;
  $239 = SAFE_HEAP_LOAD(25117 * 4 | 0, 4, 0) | 0 | 0;
  $240 = 1 << $235;
  if (!($239 & $240)) {
   SAFE_HEAP_STORE(25117 * 4 | 0, $239 | $240 | 0, 4);
   $$0401 = $238;
   $$pre$phiZ2D = $238 + 8 | 0;
  } else {
   $244 = $238 + 8 | 0;
   $245 = SAFE_HEAP_LOAD($244 | 0, 4, 0) | 0 | 0;
   if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $245 >>> 0) _abort(); else {
    $$0401 = $245;
    $$pre$phiZ2D = $244;
   }
  }
  SAFE_HEAP_STORE($$pre$phiZ2D | 0, $$1 | 0, 4);
  SAFE_HEAP_STORE($$0401 + 12 | 0, $$1 | 0, 4);
  SAFE_HEAP_STORE($$1 + 8 | 0, $$0401 | 0, 4);
  SAFE_HEAP_STORE($$1 + 12 | 0, $238 | 0, 4);
  return;
 }
 $251 = $$2 >>> 8;
 if (!$251) $$0394 = 0; else if ($$2 >>> 0 > 16777215) $$0394 = 31; else {
  $256 = ($251 + 1048320 | 0) >>> 16 & 8;
  $257 = $251 << $256;
  $260 = ($257 + 520192 | 0) >>> 16 & 4;
  $262 = $257 << $260;
  $265 = ($262 + 245760 | 0) >>> 16 & 2;
  $270 = 14 - ($260 | $256 | $265) + ($262 << $265 >>> 15) | 0;
  $$0394 = $$2 >>> ($270 + 7 | 0) & 1 | $270 << 1;
 }
 $276 = 100772 + ($$0394 << 2) | 0;
 SAFE_HEAP_STORE($$1 + 28 | 0, $$0394 | 0, 4);
 SAFE_HEAP_STORE($$1 + 20 | 0, 0 | 0, 4);
 SAFE_HEAP_STORE($$1 + 16 | 0, 0 | 0, 4);
 $280 = SAFE_HEAP_LOAD(25118 * 4 | 0, 4, 0) | 0 | 0;
 $281 = 1 << $$0394;
 L197 : do if (!($280 & $281)) {
  SAFE_HEAP_STORE(25118 * 4 | 0, $280 | $281 | 0, 4);
  SAFE_HEAP_STORE($276 | 0, $$1 | 0, 4);
  SAFE_HEAP_STORE($$1 + 24 | 0, $276 | 0, 4);
  SAFE_HEAP_STORE($$1 + 12 | 0, $$1 | 0, 4);
  SAFE_HEAP_STORE($$1 + 8 | 0, $$1 | 0, 4);
 } else {
  $288 = SAFE_HEAP_LOAD($276 | 0, 4, 0) | 0 | 0;
  L200 : do if (((SAFE_HEAP_LOAD($288 + 4 | 0, 4, 0) | 0) & -8 | 0) == ($$2 | 0)) $$0382$lcssa = $288; else {
   $$0381438 = $$2 << (($$0394 | 0) == 31 ? 0 : 25 - ($$0394 >>> 1) | 0);
   $$0382437 = $288;
   while (1) {
    $305 = $$0382437 + 16 + ($$0381438 >>> 31 << 2) | 0;
    $300 = SAFE_HEAP_LOAD($305 | 0, 4, 0) | 0 | 0;
    if (!$300) break;
    if (((SAFE_HEAP_LOAD($300 + 4 | 0, 4, 0) | 0) & -8 | 0) == ($$2 | 0)) {
     $$0382$lcssa = $300;
     break L200;
    } else {
     $$0381438 = $$0381438 << 1;
     $$0382437 = $300;
    }
   }
   if ((SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0) >>> 0 > $305 >>> 0) _abort(); else {
    SAFE_HEAP_STORE($305 | 0, $$1 | 0, 4);
    SAFE_HEAP_STORE($$1 + 24 | 0, $$0382437 | 0, 4);
    SAFE_HEAP_STORE($$1 + 12 | 0, $$1 | 0, 4);
    SAFE_HEAP_STORE($$1 + 8 | 0, $$1 | 0, 4);
    break L197;
   }
  } while (0);
  $312 = $$0382$lcssa + 8 | 0;
  $313 = SAFE_HEAP_LOAD($312 | 0, 4, 0) | 0 | 0;
  $314 = SAFE_HEAP_LOAD(25121 * 4 | 0, 4, 0) | 0 | 0;
  if ($314 >>> 0 <= $313 >>> 0 & $314 >>> 0 <= $$0382$lcssa >>> 0) {
   SAFE_HEAP_STORE($313 + 12 | 0, $$1 | 0, 4);
   SAFE_HEAP_STORE($312 | 0, $$1 | 0, 4);
   SAFE_HEAP_STORE($$1 + 8 | 0, $313 | 0, 4);
   SAFE_HEAP_STORE($$1 + 12 | 0, $$0382$lcssa | 0, 4);
   SAFE_HEAP_STORE($$1 + 24 | 0, 0 | 0, 4);
   break;
  } else _abort();
 } while (0);
 $323 = (SAFE_HEAP_LOAD(25125 * 4 | 0, 4, 0) | 0 | 0) + -1 | 0;
 SAFE_HEAP_STORE(25125 * 4 | 0, $323 | 0, 4);
 if ($323 | 0) return;
 $$0211$in$i = 100924;
 while (1) {
  $$0211$i = SAFE_HEAP_LOAD($$0211$in$i | 0, 4, 0) | 0 | 0;
  if (!$$0211$i) break; else $$0211$in$i = $$0211$i + 8 | 0;
 }
 SAFE_HEAP_STORE(25125 * 4 | 0, -1 | 0, 4);
 return;
}

function _LoadMap_b() {
 var $$0105112 = 0, $$0113 = 0, $$1108 = 0, $$2107 = 0, $$3106 = 0, $$lcssa = 0, $109 = 0, $121 = 0, $132 = 0, $160 = 0, $167 = 0, $180 = 0, $188 = 0, $190 = 0, $197 = 0, $2 = 0, $205 = 0, $207 = 0, $211 = 0, $215 = 0, $224 = 0, $233 = 0, $242 = 0, $260 = 0, $267 = 0, $289 = 0, $3 = 0, $33 = 0, $37 = 0, $39 = 0, $47 = 0, $53 = 0, $58 = 0, $60 = 0, $69 = 0, $72 = 0, $75 = 0, $77 = 0, $79 = 0, $84 = 0, $88 = 0, $99 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer10 = 0, $vararg_buffer13 = 0, $vararg_buffer16 = 0, $vararg_buffer19 = 0, $vararg_buffer22 = 0, $vararg_buffer25 = 0, $vararg_buffer28 = 0, $vararg_buffer31 = 0, $vararg_buffer34 = 0, $vararg_buffer37 = 0, $vararg_buffer4 = 0, $vararg_buffer40 = 0, $vararg_buffer43 = 0, $vararg_buffer46 = 0, $vararg_buffer49 = 0, $vararg_buffer52 = 0, $vararg_buffer55 = 0, $vararg_buffer58 = 0, $vararg_buffer7 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 176 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(176);
 $vararg_buffer58 = sp + 160 | 0;
 $vararg_buffer55 = sp + 152 | 0;
 $vararg_buffer52 = sp + 144 | 0;
 $vararg_buffer49 = sp + 136 | 0;
 $vararg_buffer46 = sp + 128 | 0;
 $vararg_buffer43 = sp + 120 | 0;
 $vararg_buffer40 = sp + 112 | 0;
 $vararg_buffer37 = sp + 104 | 0;
 $vararg_buffer34 = sp + 96 | 0;
 $vararg_buffer31 = sp + 88 | 0;
 $vararg_buffer28 = sp + 80 | 0;
 $vararg_buffer25 = sp + 72 | 0;
 $vararg_buffer22 = sp + 64 | 0;
 $vararg_buffer19 = sp + 56 | 0;
 $vararg_buffer16 = sp + 48 | 0;
 $vararg_buffer13 = sp + 40 | 0;
 $vararg_buffer10 = sp + 32 | 0;
 $vararg_buffer7 = sp + 24 | 0;
 $vararg_buffer4 = sp + 16 | 0;
 $vararg_buffer1 = sp + 8 | 0;
 $vararg_buffer = sp;
 _display_off();
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | 2 | 0, 1);
 SAFE_HEAP_STORE(98418 | 0, -112 | 0, 1);
 SAFE_HEAP_STORE(98419 | 0, -112 | 0, 1);
 SAFE_HEAP_STORE(65355 | 0, 7 | 0, 1);
 $2 = SAFE_HEAP_LOAD(101079 | 0, 1, 0) | 0 | 0;
 SAFE_HEAP_STORE(101044 | 0, $2 | 0, 1);
 $3 = $2 & 255;
 SAFE_HEAP_STORE(25114 * 4 | 0, SAFE_HEAP_LOAD(31968 + ($3 << 2) | 0, 4, 0) | 0 | 0, 4);
 SAFE_HEAP_STORE(97940 | 0, SAFE_HEAP_LOAD(32720 + $3 >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(97941 | 0, SAFE_HEAP_LOAD(32784 + $3 >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(25115 * 4 | 0, SAFE_HEAP_LOAD(32384 + ($3 << 2) | 0, 4, 0) | 0 | 0, 4);
 SAFE_HEAP_STORE(98965 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(98961 | 0, SAFE_HEAP_LOAD(101171 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(98962 | 0, SAFE_HEAP_LOAD(101172 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(98963 | 0, SAFE_HEAP_LOAD(101173 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(98964 | 0, SAFE_HEAP_LOAD(101174 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(98967 | 0, 0 | 0, 1);
 _SetBankedBkgData(SAFE_HEAP_LOAD(32656 + $3 >> 0 | 0, 1, 0) | 0 | 0, 0, -64, SAFE_HEAP_LOAD(32176 + ($3 << 2) | 0, 4, 0) | 0 | 0);
 _SetBankedBkgTiles(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, 0, 0, SAFE_HEAP_LOAD(97940 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(97941 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(25114 * 4 | 0, 4, 0) | 0 | 0);
 SAFE_HEAP_STORE($vararg_buffer | 0, SAFE_HEAP_LOAD(33056 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 1) | 0 | 0, 4);
 _printf(97943, $vararg_buffer) | 0;
 _SpritesReset();
 _SetBankedSpriteData(3, 0, 24, 192);
 $33 = SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0;
 if (!(SAFE_HEAP_LOAD(33056 + $33 >> 0 | 0, 1, 0) | 0)) $$lcssa = $33; else {
  $$0105112 = 24;
  $$0113 = 0;
  $37 = 0;
  while (1) {
   SAFE_HEAP_STORE($vararg_buffer1 | 0, $37 | 0, 4);
   _printf(97960, $vararg_buffer1) | 0;
   $39 = SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0;
   $47 = (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + $39 >> 0 | 0, 1, 0) | 0 | 0, (SAFE_HEAP_LOAD(32848 + ($39 << 2) | 0, 4, 0) | 0 | 0) + $37 | 0) | 0) & 255;
   SAFE_HEAP_STORE($vararg_buffer4 | 0, $47 | 0, 4);
   _printf(97976, $vararg_buffer4) | 0;
   $53 = (SAFE_HEAP_LOAD(98577 + $47 >> 0 | 0, 1, 1) | 0) << 2;
   _SetBankedSpriteData(7, $$0105112, $53 & 255, SAFE_HEAP_LOAD(31904 + ($47 << 2) | 0, 4, 0) | 0 | 0);
   $58 = $$0113 + 1 << 24 >> 24;
   $60 = SAFE_HEAP_LOAD(101044 | 0, 1, 0) | 0 | 0;
   if ($58 << 24 >> 24 == (SAFE_HEAP_LOAD(33056 + ($60 & 255) >> 0 | 0, 1, 0) | 0 | 0)) break; else {
    $$0105112 = $53 + ($$0105112 & 255) & 255;
    $$0113 = $58;
    $37 = $58 & 255;
   }
  }
  $$lcssa = $60 & 255;
 }
 SAFE_HEAP_STORE($vararg_buffer7 | 0, SAFE_HEAP_LOAD(33328 + $$lcssa >> 0 | 0, 1, 1) | 0 | 0, 4);
 _printf(97982, $vararg_buffer7) | 0;
 $69 = SAFE_HEAP_LOAD(101044 | 0, 1, 0) | 0 | 0;
 $72 = SAFE_HEAP_LOAD(33328 + ($69 & 255) >> 0 | 0, 1, 0) | 0 | 0;
 $75 = ($72 & 255) + 1 & 255;
 SAFE_HEAP_STORE(97937 | 0, $75 | 0, 1);
 if (!($72 << 24 >> 24)) {
  $188 = $75;
  $289 = $69;
 } else {
  $$1108 = 1;
  $77 = 1;
  do {
   SAFE_HEAP_STORE($vararg_buffer10 | 0, $77 | 0, 4);
   _printf(97998, $vararg_buffer10) | 0;
   $79 = SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0;
   $84 = ($77 << 3) + -8 + (SAFE_HEAP_LOAD(33120 + ($79 << 2) | 0, 4, 0) | 0 | 0) | 0;
   $88 = _ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + $79 >> 0 | 0, 1, 0) | 0 | 0, $84) | 0;
   SAFE_HEAP_STORE($vararg_buffer13 | 0, $88 & 255 | 0, 4);
   _printf(97976, $vararg_buffer13) | 0;
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) >> 0 | 0, $88 | 0, 1);
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 5 >> 0 | 0, 1 | 0, 1);
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 6 >> 0 | 0, 1 | 0, 1);
   $99 = _ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $84 + 1 | 0) | 0;
   SAFE_HEAP_STORE($vararg_buffer16 | 0, $99 & 255 | 0, 4);
   _printf(98013, $vararg_buffer16) | 0;
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 8 >> 0 | 0, $99 | 0, 1);
   $109 = (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $84 + 2 | 0) | 0) & 255;
   SAFE_HEAP_STORE($vararg_buffer19 | 0, $109 | 0, 4);
   _printf(98028, $vararg_buffer19) | 0;
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 1 >> 0 | 0, ($109 << 3) + 8 | 0, 1);
   $121 = (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $84 + 3 | 0) | 0) & 255;
   SAFE_HEAP_STORE($vararg_buffer22 | 0, $121 | 0, 4);
   _printf(98034, $vararg_buffer22) | 0;
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 2 >> 0 | 0, ($121 << 3) + 8 | 0, 1);
   $132 = _ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $84 + 4 | 0) | 0;
   SAFE_HEAP_STORE($vararg_buffer25 | 0, $132 & 255 | 0, 4);
   _printf(98040, $vararg_buffer25) | 0;
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 3 >> 0 | 0, ($132 << 24 >> 24 == 2 ? -1 : $132 << 24 >> 24 == 4 & 1) | 0, 1);
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 4 >> 0 | 0, ($132 << 24 >> 24 == 8 ? -1 : $132 << 24 >> 24 == 1 & 1) | 0, 1);
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 16 | 0, (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $84 + 5 | 0) | 0) & 255 | 0, 4);
   $160 = (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $84 + 6 | 0) | 0) & 255;
   SAFE_HEAP_STORE($vararg_buffer28 | 0, $160 | 0, 4);
   _printf(98054, $vararg_buffer28) | 0;
   $167 = $84 + 7 | 0;
   SAFE_HEAP_STORE(98960 + ($77 * 20 | 0) + 12 | 0, $160 << 8 | (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $167) | 0) & 255 | 0, 4);
   SAFE_HEAP_STORE($vararg_buffer31 | 0, (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $167) | 0) & 255 | 0, 4);
   _printf(98061, $vararg_buffer31) | 0;
   $$1108 = $$1108 + 1 << 24 >> 24;
   $77 = $$1108 & 255;
   $180 = SAFE_HEAP_LOAD(101044 | 0, 1, 0) | 0 | 0;
  } while (((SAFE_HEAP_LOAD(33328 + ($180 & 255) >> 0 | 0, 1, 1) | 0 | 0) + 1 | 0) != ($77 | 0));
  $188 = SAFE_HEAP_LOAD(97937 | 0, 1, 0) | 0 | 0;
  $289 = $180;
 }
 if ($188 << 24 >> 24 == 9) $197 = $289; else {
  $$2107 = $188;
  do {
   $190 = ($$2107 & 255) << 1;
   _move_sprite($190 & 255 | 0, 0, 0);
   _move_sprite(($190 | 1) & 255 | 0, 0, 0);
   $$2107 = $$2107 + 1 << 24 >> 24;
  } while ($$2107 << 24 >> 24 != 9);
  $197 = SAFE_HEAP_LOAD(101044 | 0, 1, 0) | 0 | 0;
 }
 SAFE_HEAP_STORE($vararg_buffer34 | 0, SAFE_HEAP_LOAD(33600 + ($197 & 255) >> 0 | 0, 1, 1) | 0 | 0, 4);
 _printf(98068, $vararg_buffer34) | 0;
 SAFE_HEAP_STORE(101045 | 0, SAFE_HEAP_LOAD(33600 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
 $$3106 = 0;
 $205 = 0;
 do {
  SAFE_HEAP_STORE($vararg_buffer37 | 0, $205 | 0, 4);
  _printf(98086, $vararg_buffer37) | 0;
  $207 = SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0;
  $211 = (SAFE_HEAP_LOAD(33392 + ($207 << 2) | 0, 4, 0) | 0 | 0) + ($205 * 7 | 0) | 0;
  $215 = _ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + $207 >> 0 | 0, 1, 0) | 0 | 0, $211) | 0;
  SAFE_HEAP_STORE($vararg_buffer40 | 0, $215 & 255 | 0, 4);
  _printf(98028, $vararg_buffer40) | 0;
  SAFE_HEAP_STORE(99152 + ($205 << 3) >> 0 | 0, $215 | 0, 1);
  $224 = _ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $211 + 1 | 0) | 0;
  SAFE_HEAP_STORE($vararg_buffer43 | 0, $224 & 255 | 0, 4);
  _printf(98034, $vararg_buffer43) | 0;
  SAFE_HEAP_STORE(99152 + ($205 << 3) + 1 >> 0 | 0, $224 | 0, 1);
  $233 = _ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $211 + 2 | 0) | 0;
  SAFE_HEAP_STORE($vararg_buffer46 | 0, $233 & 255 | 0, 4);
  _printf(98103, $vararg_buffer46) | 0;
  SAFE_HEAP_STORE(99152 + ($205 << 3) + 2 >> 0 | 0, $233 | 0, 1);
  $242 = _ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $211 + 3 | 0) | 0;
  SAFE_HEAP_STORE($vararg_buffer49 | 0, $242 & 255 | 0, 4);
  _printf(98109, $vararg_buffer49) | 0;
  SAFE_HEAP_STORE(99152 + ($205 << 3) + 3 >> 0 | 0, $242 | 0, 1);
  SAFE_HEAP_STORE($vararg_buffer52 | 0, (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $211 + 4 | 0) | 0) & 255 | 0, 4);
  _printf(98115, $vararg_buffer52) | 0;
  $260 = (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $211 + 5 | 0) | 0) & 255;
  SAFE_HEAP_STORE($vararg_buffer55 | 0, $260 | 0, 4);
  _printf(98054, $vararg_buffer55) | 0;
  $267 = $211 + 6 | 0;
  SAFE_HEAP_STORE(99152 + ($205 << 3) + 4 | 0, $260 << 8 | (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $267) | 0) & 255 | 0, 4);
  SAFE_HEAP_STORE($vararg_buffer58 | 0, (_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $267) | 0) & 255 | 0, 4);
  _printf(98061, $vararg_buffer58) | 0;
  $$3106 = $$3106 + 1 << 24 >> 24;
  $205 = $$3106 & 255;
 } while (((SAFE_HEAP_LOAD(33600 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 1) | 0 | 0) + 1 | 0) != ($205 | 0));
 SAFE_HEAP_STORE(101048 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(97938 | 0, 16 | 0, 1);
 _MapRepositionCamera_b();
 _MapHandleTrigger_b();
 _SetBankedSpriteData(3, 124, 4, 2496);
 _set_sprite_tile(38, 124);
 _set_sprite_tile(39, 126);
 _move_sprite(38, 48, 104);
 _move_sprite(39, 56, 104);
 SAFE_HEAP_STORE(101060 | 0, 0 | 0, 1);
 _FadeIn();
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | -128 | 0, 1);
 STACKTOP = sp;
 return;
}

function _MapUpdateActors_b() {
 var $$0109 = 0, $$088 = 0, $$1105 = 0, $$189$ph = 0, $$2104 = 0, $$sink = 0, $105 = 0, $108 = 0, $109 = 0, $11 = 0, $122 = 0, $124 = 0, $125 = 0, $127 = 0, $129 = 0, $130 = 0, $131 = 0, $15 = 0, $158 = 0, $17 = 0, $173 = 0, $175 = 0, $176 = 0, $181 = 0, $183 = 0, $189 = 0, $19 = 0, $193 = 0, $201 = 0, $206 = 0, $213 = 0, $218 = 0, $219 = 0, $225 = 0, $226 = 0, $231 = 0, $236 = 0, $242 = 0, $246 = 0, $3 = 0, $32 = 0, $34 = 0, $35 = 0, $39 = 0, $40 = 0, $46 = 0, $48 = 0, $57 = 0, $6 = 0, $66 = 0, $69 = 0, $71 = 0, $75 = 0, $85 = 0, $95 = 0, $99 = 0, $sext = 0, $vararg_buffer = 0, $vararg_buffer4 = 0, $vararg_buffer8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(48);
 $vararg_buffer8 = sp + 24 | 0;
 $vararg_buffer4 = sp + 16 | 0;
 $vararg_buffer = sp;
 do if ((SAFE_HEAP_LOAD(101058 | 0, 1, 0) | 0 | 0) < 0) {
  $3 = SAFE_HEAP_LOAD(101059 | 0, 1, 1) | 0 | 0;
  $6 = SAFE_HEAP_LOAD(98960 + ($3 * 20 | 0) + 1 >> 0 | 0, 1, 1) | 0 | 0;
  if (!($6 & 7)) {
   $11 = SAFE_HEAP_LOAD(98960 + ($3 * 20 | 0) + 2 >> 0 | 0, 1, 1) | 0 | 0;
   if (!($11 & 7)) {
    $15 = SAFE_HEAP_LOAD(101167 | 0, 1, 1) | 0 | 0;
    $17 = SAFE_HEAP_LOAD(101168 | 0, 1, 1) | 0 | 0;
    SAFE_HEAP_STORE($vararg_buffer | 0, $6 | 0, 4);
    SAFE_HEAP_STORE($vararg_buffer + 4 | 0, $11 | 0, 4);
    SAFE_HEAP_STORE($vararg_buffer + 8 | 0, $15 | 0, 4);
    SAFE_HEAP_STORE($vararg_buffer + 12 | 0, $17 | 0, 4);
    _printf(98144, $vararg_buffer) | 0;
    $19 = SAFE_HEAP_LOAD(101059 | 0, 1, 1) | 0 | 0;
    if ((SAFE_HEAP_LOAD(98960 + ($19 * 20 | 0) + 1 >> 0 | 0, 1, 0) | 0 | 0) == (SAFE_HEAP_LOAD(101167 | 0, 1, 0) | 0 | 0)) if ((SAFE_HEAP_LOAD(98960 + ($19 * 20 | 0) + 2 >> 0 | 0, 1, 0) | 0 | 0) == (SAFE_HEAP_LOAD(101168 | 0, 1, 0) | 0 | 0)) {
     SAFE_HEAP_STORE(101058 | 0, (SAFE_HEAP_LOAD(101058 | 0, 1, 0) | 0) & 127 | 0, 1);
     SAFE_HEAP_STORE(97939 | 0, 1 | 0, 1);
     SAFE_HEAP_STORE(98960 + ($19 * 20 | 0) + 7 >> 0 | 0, 0 | 0, 1);
     break;
    }
    _puts(98184) | 0;
    $32 = SAFE_HEAP_LOAD(101059 | 0, 1, 1) | 0 | 0;
    $34 = SAFE_HEAP_LOAD(98960 + ($32 * 20 | 0) + 1 >> 0 | 0, 1, 0) | 0 | 0;
    $35 = SAFE_HEAP_LOAD(101167 | 0, 1, 0) | 0 | 0;
    do if (($34 & 255) > ($35 & 255)) {
     _puts(98198) | 0;
     SAFE_HEAP_STORE(101169 | 0, -1 | 0, 1);
     $$sink = 0;
    } else {
     if (($34 & 255) < ($35 & 255)) {
      _puts(98203) | 0;
      SAFE_HEAP_STORE(101169 | 0, 1 | 0, 1);
      $$sink = 0;
      break;
     }
     SAFE_HEAP_STORE(101169 | 0, 0 | 0, 1);
     $39 = SAFE_HEAP_LOAD(98960 + ($32 * 20 | 0) + 2 >> 0 | 0, 1, 0) | 0 | 0;
     $40 = SAFE_HEAP_LOAD(101168 | 0, 1, 0) | 0 | 0;
     if (($39 & 255) > ($40 & 255)) {
      _puts(98209) | 0;
      $$sink = -1;
      break;
     }
     if (($39 & 255) < ($40 & 255)) {
      _puts(98212) | 0;
      $$sink = 1;
     } else $$sink = 0;
    } while (0);
    SAFE_HEAP_STORE(101170 | 0, $$sink | 0, 1);
    _MapUpdateActorMovement_b(SAFE_HEAP_LOAD(101059 | 0, 1, 0) | 0 | 0);
   }
  }
 } while (0);
 $46 = SAFE_HEAP_LOAD(97937 | 0, 1, 0) | 0 | 0;
 if ((SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) != 0 | $46 << 24 >> 24 == 1) $99 = $46; else {
  $$0109 = 1;
  while (1) {
   $48 = $$0109 & 255;
   L25 : do if (!((SAFE_HEAP_LOAD(98960 + ($48 * 20 | 0) + 1 >> 0 | 0, 1, 0) | 0) & 7)) if (!((SAFE_HEAP_LOAD(98960 + ($48 * 20 | 0) + 2 >> 0 | 0, 1, 0) | 0) & 7)) {
    $57 = 98960 + ($48 * 20 | 0) + 16 | 0;
    switch (SAFE_HEAP_LOAD($57 | 0, 4, 0) | 0 | 0) {
    case 3:
    case 5:
     {
      if (!((SAFE_HEAP_LOAD(101054 | 0, 1, 0) | 0) & 63)) {
       $sext = (_rand() | 0) << 24;
       if (($sext | 0) > 1073741824) {
        if ((SAFE_HEAP_LOAD($57 | 0, 4, 0) | 0 | 0) != 5) break L25;
        $66 = 98960 + ($48 * 20 | 0) + 3 | 0;
        $69 = 98960 + ($48 * 20 | 0) + 4 | 0;
        $71 = SAFE_HEAP_LOAD($69 >> 0 | 0, 1, 0) | 0 | 0;
        SAFE_HEAP_STORE($vararg_buffer4 | 0, SAFE_HEAP_LOAD($66 >> 0 | 0, 1, 0) | 0 | 0, 4);
        SAFE_HEAP_STORE($vararg_buffer4 + 4 | 0, $71 | 0, 4);
        _printf(98217, $vararg_buffer4) | 0;
        SAFE_HEAP_STORE(101169 | 0, SAFE_HEAP_LOAD($66 >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
        SAFE_HEAP_STORE(101170 | 0, SAFE_HEAP_LOAD($69 >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
        _MapUpdateActorMovement_b($$0109);
        break L25;
       }
       if (($sext | 0) > 0) {
        $75 = _rand() | 0;
        SAFE_HEAP_STORE(98960 + ($48 * 20 | 0) + 3 >> 0 | 0, (($75 << 24 | 0) > 0 & 1) - ($75 >>> 7 & 1) | 0, 1);
        SAFE_HEAP_STORE(98960 + ($48 * 20 | 0) + 4 >> 0 | 0, 0 | 0, 1);
        SAFE_HEAP_STORE(98960 + ($48 * 20 | 0) + 5 >> 0 | 0, 1 | 0, 1);
        break L25;
       }
       if (($sext | 0) <= -1073741824) break L25;
       $85 = _rand() | 0;
       SAFE_HEAP_STORE(98960 + ($48 * 20 | 0) + 3 >> 0 | 0, 0 | 0, 1);
       SAFE_HEAP_STORE(98960 + ($48 * 20 | 0) + 4 >> 0 | 0, (($85 << 24 | 0) > 0 & 1) - ($85 >>> 7 & 1) | 0, 1);
       SAFE_HEAP_STORE(98960 + ($48 * 20 | 0) + 5 >> 0 | 0, 1 | 0, 1);
       break L25;
      }
      break;
     }
    default:
     {}
    }
    SAFE_HEAP_STORE(98960 + ($48 * 20 | 0) + 7 >> 0 | 0, 0 | 0, 1);
   } while (0);
   $95 = $$0109 + 1 << 24 >> 24;
   if ($95 << 24 >> 24 == (SAFE_HEAP_LOAD(97937 | 0, 1, 0) | 0 | 0)) {
    $99 = $95;
    break;
   } else $$0109 = $95;
  }
 }
 if ($99 << 24 >> 24) {
  $$1105 = 0;
  $105 = 0;
  while (1) {
   if ((SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) == 0 ? 1 : $$1105 << 24 >> 24 == (SAFE_HEAP_LOAD(101059 | 0, 1, 0) | 0 | 0)) label = 35; else if (SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 5 >> 0 | 0, 1, 0) | 0 | 0) label = 35;
   if ((label | 0) == 35) {
    label = 0;
    $108 = 98960 + ($105 * 20 | 0) + 7 | 0;
    $109 = SAFE_HEAP_LOAD($108 >> 0 | 0, 1, 0) | 0 | 0;
    if (!($109 << 24 >> 24)) label = 38; else if (!((SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 1 >> 0 | 0, 1, 0) | 0) & 7)) if (!((SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 2 >> 0 | 0, 1, 0) | 0) & 7)) label = 39; else label = 38; else label = 38;
    if ((label | 0) == 38) {
     label = 0;
     if (!(SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 5 >> 0 | 0, 1, 0) | 0)) $189 = $109; else label = 39;
    }
    if ((label | 0) == 39) {
     label = 0;
     $122 = 98960 + ($105 * 20 | 0) + 3 | 0;
     $124 = SAFE_HEAP_LOAD($122 >> 0 | 0, 1, 0) | 0 | 0;
     $125 = 98960 + ($105 * 20 | 0) + 4 | 0;
     $127 = SAFE_HEAP_LOAD($125 >> 0 | 0, 1, 0) | 0 | 0;
     SAFE_HEAP_STORE($vararg_buffer8 | 0, $105 | 0, 4);
     SAFE_HEAP_STORE($vararg_buffer8 + 4 | 0, $124 | 0, 4);
     SAFE_HEAP_STORE($vararg_buffer8 + 8 | 0, $127 | 0, 4);
     _printf(98244, $vararg_buffer8) | 0;
     $129 = SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) >> 0 | 0, 1, 0) | 0 | 0;
     $130 = $105 << 1;
     $131 = $130 & 255;
     if (!(SAFE_HEAP_LOAD($108 >> 0 | 0, 1, 0) | 0)) $$088 = $129; else if (!(SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 8 >> 0 | 0, 1, 0) | 0)) $$088 = $129; else {
      _puts(98265) | 0;
      $$088 = ((((SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 2 >> 0 | 0, 1, 0) | 0) ^ (SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 1 >> 0 | 0, 1, 0) | 0)) & 255) >>> 4 & 1 ^ 1) + ($129 & 255) & 255;
     }
     do if ((SAFE_HEAP_LOAD($125 >> 0 | 0, 1, 0) | 0 | 0) < 0) {
      _puts(98275) | 0;
      $$189$ph = ($$088 & 255) + 1 + (SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 8 >> 0 | 0, 1, 1) | 0 | 0) & 255;
      label = 48;
     } else {
      $158 = SAFE_HEAP_LOAD($122 >> 0 | 0, 1, 0) | 0 | 0;
      if ($158 << 24 >> 24 < 0) {
       _puts(98295) | 0;
       $173 = ($$088 & 255) + 2 + ((SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 8 >> 0 | 0, 1, 1) | 0) << 1) | 0;
       _set_sprite_prop($131 | 0, 32);
       $175 = ($130 | 1) & 255;
       _set_sprite_prop($175 | 0, 32);
       $176 = $173 << 2;
       _set_sprite_tile($131 | 0, ($176 | 2) & 255 | 0);
       _set_sprite_tile($175 | 0, $176 & 255 | 0);
       break;
      }
      if (!($158 << 24 >> 24)) {
       $$189$ph = $$088;
       label = 48;
      } else {
       _puts(98285) | 0;
       $$189$ph = ($$088 & 255) + 2 + ((SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 8 >> 0 | 0, 1, 1) | 0) << 1) & 255;
       label = 48;
      }
     } while (0);
     if ((label | 0) == 48) {
      label = 0;
      _set_sprite_prop($131 | 0, 0);
      $181 = ($130 | 1) & 255;
      _set_sprite_prop($181 | 0, 0);
      $183 = ($$189$ph & 255) << 2;
      _set_sprite_tile($131 | 0, $183 & 255 | 0);
      _set_sprite_tile($181 | 0, ($183 | 2) & 255 | 0);
     }
     SAFE_HEAP_STORE(98960 + ($105 * 20 | 0) + 5 >> 0 | 0, 0 | 0, 1);
     $189 = SAFE_HEAP_LOAD($108 >> 0 | 0, 1, 0) | 0 | 0;
    }
    if ($189 << 24 >> 24) {
     $193 = 98960 + ($105 * 20 | 0) + 1 | 0;
     SAFE_HEAP_STORE($193 >> 0 | 0, (SAFE_HEAP_LOAD($193 >> 0 | 0, 1, 1) | 0 | 0) + (SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 3 >> 0 | 0, 1, 1) | 0 | 0) | 0, 1);
     $201 = 98960 + ($105 * 20 | 0) + 2 | 0;
     SAFE_HEAP_STORE($201 >> 0 | 0, (SAFE_HEAP_LOAD($201 >> 0 | 0, 1, 1) | 0 | 0) + (SAFE_HEAP_LOAD(98960 + ($105 * 20 | 0) + 4 >> 0 | 0, 1, 1) | 0 | 0) | 0, 1);
    }
   }
   $206 = $$1105 + 1 << 24 >> 24;
   if ($206 << 24 >> 24 == (SAFE_HEAP_LOAD(97937 | 0, 1, 0) | 0 | 0)) break; else {
    $$1105 = $206;
    $105 = $206 & 255;
   }
  }
 }
 _MapHandleTrigger_b();
 _MapRepositionCamera_b();
 if (!(SAFE_HEAP_LOAD(97937 | 0, 1, 0) | 0)) {
  _MapUpdateEmotionBubble_b();
  STACKTOP = sp;
  return;
 }
 $$2104 = 0;
 $213 = 0;
 while (1) {
  $218 = (SAFE_HEAP_LOAD(98960 + ($213 * 20 | 0) + 1 >> 0 | 0, 1, 1) | 0 | 0) - (SAFE_HEAP_LOAD(65347 | 0, 1, 1) | 0 | 0) | 0;
  $219 = $218 & 255;
  $225 = (SAFE_HEAP_LOAD(98960 + ($213 * 20 | 0) + 2 >> 0 | 0, 1, 1) | 0 | 0) - (SAFE_HEAP_LOAD(65346 | 0, 1, 1) | 0 | 0) | 0;
  $226 = $225 & 255;
  if (!(SAFE_HEAP_LOAD(98960 + ($213 * 20 | 0) + 6 >> 0 | 0, 1, 0) | 0)) label = 58; else {
   $231 = SAFE_HEAP_LOAD(98418 | 0, 1, 0) | 0 | 0;
   if ($231 << 24 >> 24 == -112 | ($225 & 255) >>> 0 < (($231 & 255) + 16 | 0) >>> 0) {
    $236 = $213 << 1;
    _move_sprite($236 & 255 | 0, $219 | 0, $226 | 0);
    _move_sprite(($236 | 1) & 255 | 0, $218 + 8 & 255 | 0, $226 | 0);
   } else label = 58;
  }
  if ((label | 0) == 58) {
   label = 0;
   $242 = $213 << 1;
   _move_sprite($242 & 255 | 0, 0, 0);
   _move_sprite(($242 | 1) & 255 | 0, 0, 0);
  }
  $246 = $$2104 + 1 << 24 >> 24;
  if ($246 << 24 >> 24 == (SAFE_HEAP_LOAD(97937 | 0, 1, 0) | 0 | 0)) break; else {
   $$2104 = $246;
   $213 = $246 & 255;
  }
 }
 _MapUpdateEmotionBubble_b();
 STACKTOP = sp;
 return;
}

function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 $rem = $rem | 0;
 var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $_0$0 = 0, $_0$1 = 0, $q_sroa_1_1198$looptemp = 0;
 $n_sroa_0_0_extract_trunc = $a$0;
 $n_sroa_1_4_extract_shift$0 = $a$1;
 $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
 $d_sroa_0_0_extract_trunc = $b$0;
 $d_sroa_1_4_extract_shift$0 = $b$1;
 $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
 if (!$n_sroa_1_4_extract_trunc) {
  $4 = ($rem | 0) != 0;
  if (!$d_sroa_1_4_extract_trunc) {
   if ($4) {
    SAFE_HEAP_STORE($rem | 0, ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0) | 0, 4);
    SAFE_HEAP_STORE($rem + 4 | 0, 0 | 0, 4);
   }
   $_0$1 = 0;
   $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  } else {
   if (!$4) {
    $_0$1 = 0;
    $_0$0 = 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
   SAFE_HEAP_STORE($rem | 0, $a$0 | 0 | 0, 4);
   SAFE_HEAP_STORE($rem + 4 | 0, $a$1 & 0 | 0, 4);
   $_0$1 = 0;
   $_0$0 = 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  }
 }
 $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
 do if (!$d_sroa_0_0_extract_trunc) {
  if ($17) {
   if ($rem | 0) {
    SAFE_HEAP_STORE($rem | 0, ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0) | 0, 4);
    SAFE_HEAP_STORE($rem + 4 | 0, 0 | 0, 4);
   }
   $_0$1 = 0;
   $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  }
  if (!$n_sroa_0_0_extract_trunc) {
   if ($rem | 0) {
    SAFE_HEAP_STORE($rem | 0, 0 | 0, 4);
    SAFE_HEAP_STORE($rem + 4 | 0, ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0) | 0, 4);
   }
   $_0$1 = 0;
   $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  }
  $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
  if (!($37 & $d_sroa_1_4_extract_trunc)) {
   if ($rem | 0) {
    SAFE_HEAP_STORE($rem | 0, $a$0 | 0 | 0, 4);
    SAFE_HEAP_STORE($rem + 4 | 0, $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0 | 0, 4);
   }
   $_0$1 = 0;
   $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
   return (tempRet0 = $_0$1, $_0$0) | 0;
  }
  $51 = (Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0) - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
  if ($51 >>> 0 <= 30) {
   $57 = $51 + 1 | 0;
   $58 = 31 - $51 | 0;
   $sr_1_ph = $57;
   $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
   $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
   $q_sroa_0_1_ph = 0;
   $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
   break;
  }
  if (!$rem) {
   $_0$1 = 0;
   $_0$0 = 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  }
  SAFE_HEAP_STORE($rem | 0, $a$0 | 0 | 0, 4);
  SAFE_HEAP_STORE($rem + 4 | 0, $n_sroa_1_4_extract_shift$0 | $a$1 & 0 | 0, 4);
  $_0$1 = 0;
  $_0$0 = 0;
  return (tempRet0 = $_0$1, $_0$0) | 0;
 } else {
  if (!$17) {
   $119 = (Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0) - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
   if ($119 >>> 0 <= 31) {
    $125 = $119 + 1 | 0;
    $126 = 31 - $119 | 0;
    $130 = $119 - 31 >> 31;
    $sr_1_ph = $125;
    $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
    $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
    $q_sroa_0_1_ph = 0;
    $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
    break;
   }
   if (!$rem) {
    $_0$1 = 0;
    $_0$0 = 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
   SAFE_HEAP_STORE($rem | 0, $a$0 | 0 | 0, 4);
   SAFE_HEAP_STORE($rem + 4 | 0, $n_sroa_1_4_extract_shift$0 | $a$1 & 0 | 0, 4);
   $_0$1 = 0;
   $_0$0 = 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  }
  $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
  if ($66 & $d_sroa_0_0_extract_trunc | 0) {
   $88 = (Math_clz32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
   $89 = 64 - $88 | 0;
   $91 = 32 - $88 | 0;
   $92 = $91 >> 31;
   $95 = $88 - 32 | 0;
   $105 = $95 >> 31;
   $sr_1_ph = $88;
   $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
   $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
   $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
   $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
   break;
  }
  if ($rem | 0) {
   SAFE_HEAP_STORE($rem | 0, $66 & $n_sroa_0_0_extract_trunc | 0, 4);
   SAFE_HEAP_STORE($rem + 4 | 0, 0 | 0, 4);
  }
  if (($d_sroa_0_0_extract_trunc | 0) == 1) {
   $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
   $_0$0 = $a$0 | 0 | 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  } else {
   $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
   $_0$1 = $n_sroa_1_4_extract_trunc >>> ($78 >>> 0) | 0;
   $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  }
 } while (0);
 if (!$sr_1_ph) {
  $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
  $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
  $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
  $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
  $carry_0_lcssa$1 = 0;
  $carry_0_lcssa$0 = 0;
 } else {
  $d_sroa_0_0_insert_insert99$0 = $b$0 | 0 | 0;
  $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
  $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0 | 0, $d_sroa_0_0_insert_insert99$1 | 0, -1, -1) | 0;
  $137$1 = tempRet0;
  $q_sroa_1_1198 = $q_sroa_1_1_ph;
  $q_sroa_0_1199 = $q_sroa_0_1_ph;
  $r_sroa_1_1200 = $r_sroa_1_1_ph;
  $r_sroa_0_1201 = $r_sroa_0_1_ph;
  $sr_1202 = $sr_1_ph;
  $carry_0203 = 0;
  do {
   $q_sroa_1_1198$looptemp = $q_sroa_1_1198;
   $q_sroa_1_1198 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
   $q_sroa_0_1199 = $carry_0203 | $q_sroa_0_1199 << 1;
   $r_sroa_0_0_insert_insert42$0 = $r_sroa_0_1201 << 1 | $q_sroa_1_1198$looptemp >>> 31 | 0;
   $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
   _i64Subtract($137$0 | 0, $137$1 | 0, $r_sroa_0_0_insert_insert42$0 | 0, $r_sroa_0_0_insert_insert42$1 | 0) | 0;
   $150$1 = tempRet0;
   $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
   $carry_0203 = $151$0 & 1;
   $r_sroa_0_1201 = _i64Subtract($r_sroa_0_0_insert_insert42$0 | 0, $r_sroa_0_0_insert_insert42$1 | 0, $151$0 & $d_sroa_0_0_insert_insert99$0 | 0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1 | 0) | 0;
   $r_sroa_1_1200 = tempRet0;
   $sr_1202 = $sr_1202 - 1 | 0;
  } while (($sr_1202 | 0) != 0);
  $q_sroa_1_1_lcssa = $q_sroa_1_1198;
  $q_sroa_0_1_lcssa = $q_sroa_0_1199;
  $r_sroa_1_1_lcssa = $r_sroa_1_1200;
  $r_sroa_0_1_lcssa = $r_sroa_0_1201;
  $carry_0_lcssa$1 = 0;
  $carry_0_lcssa$0 = $carry_0203;
 }
 $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
 $q_sroa_0_0_insert_ext75$1 = 0;
 if ($rem | 0) {
  SAFE_HEAP_STORE($rem | 0, $r_sroa_0_1_lcssa | 0, 4);
  SAFE_HEAP_STORE($rem + 4 | 0, $r_sroa_1_1_lcssa | 0, 4);
 }
 $_0$1 = ($q_sroa_0_0_insert_ext75$0 | 0) >>> 31 | ($q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1) << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
 $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
 return (tempRet0 = $_0$1, $_0$0) | 0;
}

function _PongUpdate_b() {
 var $$pr$i = 0, $$sink = 0, $$sink16 = 0, $$sink18 = 0, $0 = 0, $18 = 0, $2 = 0, $21 = 0, $24 = 0, $25 = 0, $28 = 0, $33 = 0, $35 = 0, $36 = 0, $39 = 0, $40 = 0, $43 = 0, $46 = 0, $48 = 0, $5 = 0, $51 = 0, $52 = 0, $53 = 0, $63 = 0, $64 = 0, $65 = 0, $73 = 0, $75 = 0, $80 = 0, $88 = 0, $94 = 0, $storemerge = 0, $storemerge1 = 0, $storemerge1$in = 0, label = 0;
 $0 = SAFE_HEAP_LOAD(101099 | 0, 1, 0) | 0 | 0;
 $2 = SAFE_HEAP_LOAD(101052 | 0, 1, 0) | 0 | 0;
 if ($0 << 24 >> 24 != 0 | ($2 & 16) == 0) $21 = $0; else {
  SAFE_HEAP_STORE(101099 | 0, 1 | 0, 1);
  SAFE_HEAP_STORE(101094 | 0, 84 | 0, 1);
  SAFE_HEAP_STORE(101095 | 0, 72 | 0, 1);
  SAFE_HEAP_STORE(101098 | 0, 0 | 0, 1);
  SAFE_HEAP_STORE(98430 | 0, 1 | 0, 1);
  $21 = 1;
 }
 $5 = $2 & 255;
 if (!($5 & 4)) {
  $$pr$i = SAFE_HEAP_LOAD(101090 | 0, 1, 0) | 0 | 0;
  if (!($5 & 8)) $18 = $$pr$i; else {
   $$sink = ($$pr$i & 255) + 2 & 255;
   label = 7;
  }
 } else {
  $$sink = (SAFE_HEAP_LOAD(101090 | 0, 1, 1) | 0 | 0) + 254 & 255;
  label = 7;
 }
 if ((label | 0) == 7) {
  SAFE_HEAP_STORE(101090 | 0, $$sink | 0, 1);
  $18 = $$sink;
 }
 if (($18 & 255) < 16) {
  $$sink16 = 16;
  label = 10;
 } else if (($18 & 255) > 128) {
  $$sink16 = -128;
  label = 10;
 } else $53 = $18;
 if ((label | 0) == 10) {
  SAFE_HEAP_STORE(101090 | 0, $$sink16 | 0, 1);
  $53 = $$sink16;
 }
 do if ($21 << 24 >> 24) {
  $24 = SAFE_HEAP_LOAD(98430 | 0, 1, 0) | 0 | 0;
  $25 = $24 & 255;
  $28 = 0 - $25 | 0;
  $storemerge = ((SAFE_HEAP_LOAD(101096 | 0, 1, 0) | 0 | 0) == 0 ? $25 : $28) + (SAFE_HEAP_LOAD(101094 | 0, 1, 1) | 0 | 0) & 255;
  SAFE_HEAP_STORE(101094 | 0, $storemerge | 0, 1);
  $storemerge1$in = ((SAFE_HEAP_LOAD(101097 | 0, 1, 0) | 0 | 0) == 0 ? $25 : $28) + (SAFE_HEAP_LOAD(101095 | 0, 1, 1) | 0 | 0) | 0;
  $storemerge1 = $storemerge1$in & 255;
  SAFE_HEAP_STORE(101095 | 0, $storemerge1 | 0, 1);
  $33 = SAFE_HEAP_LOAD(101101 | 0, 1, 0) | 0 | 0;
  if (!($33 << 24 >> 24)) {
   SAFE_HEAP_STORE(101101 | 0, 120 | 0, 1);
   $36 = 120;
  } else $36 = $33;
  $35 = $36 + -1 << 24 >> 24;
  SAFE_HEAP_STORE(101101 | 0, $35 | 0, 1);
  $39 = SAFE_HEAP_LOAD(101091 | 0, 1, 0) | 0 | 0;
  do if (($storemerge & 255) > 40 & ($35 & 255) > 20) {
   $40 = $39 & 255;
   if (($39 & 255) < ($storemerge1 & 255)) {
    $43 = $40 + 2 & 255;
    SAFE_HEAP_STORE(101091 | 0, $43 | 0, 1);
    $48 = $43;
    break;
   }
   if (($39 & 255) > ($storemerge1 & 255)) {
    $46 = $40 + 254 & 255;
    SAFE_HEAP_STORE(101091 | 0, $46 | 0, 1);
    $48 = $46;
   } else $48 = $39;
  } else $48 = $39; while (0);
  if (($48 & 255) < 16) {
   $$sink18 = 16;
   label = 21;
  } else if (($48 & 255) > 128) {
   $$sink18 = -128;
   label = 21;
  } else $65 = $48;
  if ((label | 0) == 21) {
   SAFE_HEAP_STORE(101091 | 0, $$sink18 | 0, 1);
   $65 = $$sink18;
  }
  if (($storemerge + -29 & 255) < 3) {
   $51 = $storemerge1$in & 255;
   $52 = $53 & 255;
   if (($52 + -16 | 0) < ($51 | 0) & ($52 + 24 | 0) >>> 0 > $51 >>> 0) {
    SAFE_HEAP_STORE(101096 | 0, 0 | 0, 1);
    SAFE_HEAP_STORE(101097 | 0, ($53 & 255) > ($storemerge1 & 255) & 1 | 0, 1);
    SAFE_HEAP_STORE(101098 | 0, (SAFE_HEAP_LOAD(101098 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
    label = 28;
   } else label = 28;
  } else if (($storemerge + 119 & 255) < 3) {
   $63 = $storemerge1$in & 255;
   $64 = $65 & 255;
   if (($64 + -16 | 0) < ($63 | 0) & ($64 + 24 | 0) >>> 0 > $63 >>> 0) {
    SAFE_HEAP_STORE(101096 | 0, 1 | 0, 1);
    SAFE_HEAP_STORE(101097 | 0, ($65 & 255) > ($storemerge1 & 255) & 1 | 0, 1);
    $73 = (SAFE_HEAP_LOAD(101098 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24;
    SAFE_HEAP_STORE(101098 | 0, $73 | 0, 1);
    $75 = $73;
   } else label = 28;
  } else label = 28;
  if ((label | 0) == 28) $75 = SAFE_HEAP_LOAD(101098 | 0, 1, 0) | 0 | 0;
  if (($24 & 255) < 8 & ($75 & 255) > 2) {
   SAFE_HEAP_STORE(98430 | 0, $24 + 1 << 24 >> 24 | 0, 1);
   SAFE_HEAP_STORE(101098 | 0, 0 | 0, 1);
  }
  do if (($storemerge & 255) > 160) {
   $80 = (SAFE_HEAP_LOAD(101092 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24;
   SAFE_HEAP_STORE(101092 | 0, $80 | 0, 1);
   SAFE_HEAP_STORE(101099 | 0, 0 | 0, 1);
   if (($80 & 255) <= 3) {
    _set_bkg_tiles(4, 2, 1, 1, 98420 + ($80 & 255) | 0);
    break;
   }
   if (!(SAFE_HEAP_LOAD(101100 | 0, 1, 0) | 0)) {
    SAFE_HEAP_STORE(101100 | 0, 1 | 0, 1);
    _FadeSetSpeed(4);
    _FadeOut();
    SAFE_HEAP_STORE(24388 * 4 | 0, 3 | 0, 4);
   }
  } else if (($storemerge & 255) < 8) {
   $88 = (SAFE_HEAP_LOAD(101093 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24;
   SAFE_HEAP_STORE(101093 | 0, $88 | 0, 1);
   SAFE_HEAP_STORE(101099 | 0, 0 | 0, 1);
   if (($88 & 255) <= 3) {
    _set_bkg_tiles(15, 2, 1, 1, 98420 + ($88 & 255) | 0);
    break;
   }
   if (!(SAFE_HEAP_LOAD(101100 | 0, 1, 0) | 0)) {
    SAFE_HEAP_STORE(101100 | 0, 1 | 0, 1);
    _FadeSetSpeed(4);
    _FadeOut();
    SAFE_HEAP_STORE(24388 * 4 | 0, 3 | 0, 4);
   }
  } while (0);
  $94 = SAFE_HEAP_LOAD(101095 | 0, 1, 0) | 0 | 0;
  if (($94 & 255) > 144) {
   SAFE_HEAP_STORE(101097 | 0, 1 | 0, 1);
   break;
  }
  if (($94 & 255) < 8) SAFE_HEAP_STORE(101097 | 0, 0 | 0, 1);
 } while (0);
 _move_sprite(1, 24, SAFE_HEAP_LOAD(101090 | 0, 1, 0) | 0 | 0);
 _move_sprite(2, 24, (SAFE_HEAP_LOAD(101090 | 0, 1, 1) | 0 | 0) + 16 & 255 | 0);
 _move_sprite(3, -112, SAFE_HEAP_LOAD(101091 | 0, 1, 0) | 0 | 0);
 _move_sprite(4, -112, (SAFE_HEAP_LOAD(101091 | 0, 1, 1) | 0 | 0) + 16 & 255 | 0);
 if (!(SAFE_HEAP_LOAD(101099 | 0, 1, 0) | 0)) {
  _move_sprite(0, 0, 0);
  return;
 } else {
  _move_sprite(0, SAFE_HEAP_LOAD(101094 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(101095 | 0, 1, 0) | 0 | 0);
  return;
 }
}

function _MapHandleInput_b() {
 var $$0$i = 0, $$sink = 0, $27 = 0, $37 = 0, $38 = 0, $39 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $49 = 0, $50 = 0, $51 = 0, $55 = 0, $58 = 0, $63 = 0, $73 = 0, $89 = 0, $indvars$iv$i = 0, label = 0;
 do if ((SAFE_HEAP_LOAD(98418 | 0, 1, 0) | 0 | 0) == 112) if ((SAFE_HEAP_LOAD(101052 | 0, 1, 0) | 0) & 16) if (!((SAFE_HEAP_LOAD(101053 | 0, 1, 0) | 0) & 16)) {
  if (!(SAFE_HEAP_LOAD(101083 | 0, 1, 0) | 0)) {
   _draw_text(1);
   break;
  }
  SAFE_HEAP_STORE(98419 | 0, -112 | 0, 1);
  if ((SAFE_HEAP_LOAD(25113 * 4 | 0, 4, 0) | 0 | 0) == 2) SAFE_HEAP_STORE(97939 | 0, 1 | 0, 1);
 } while (0);
 if ((SAFE_HEAP_LOAD(98961 | 0, 1, 0) | 0) & 7) return;
 if (!((SAFE_HEAP_LOAD(98418 | 0, 1, 0) | 0 | 0) == -112 ? (SAFE_HEAP_LOAD(101060 | 0, 1, 0) | 0 | (SAFE_HEAP_LOAD(98962 | 0, 1, 0) | 0) & 7) << 24 >> 24 == 0 : 0)) return;
 if (!(SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0)) if (!((_IsFading() | 0) << 24 >> 24)) {
  $27 = SAFE_HEAP_LOAD(101052 | 0, 1, 0) | 0 | 0;
  if ($27 & 16) if (!((SAFE_HEAP_LOAD(101053 | 0, 1, 0) | 0) & 16)) {
   SAFE_HEAP_STORE(98967 | 0, 0 | 0, 1);
   $37 = SAFE_HEAP_LOAD(98963 | 0, 1, 1) | 0 | 0;
   $38 = ((SAFE_HEAP_LOAD(98961 | 0, 1, 1) | 0 | 0) >>> 3) + $37 | 0;
   $39 = $38 & 255;
   $44 = SAFE_HEAP_LOAD(98964 | 0, 1, 1) | 0 | 0;
   $45 = ((SAFE_HEAP_LOAD(98962 | 0, 1, 1) | 0 | 0) >>> 3) + $44 | 0;
   $46 = $45 & 255;
   $47 = SAFE_HEAP_LOAD(97937 | 0, 1, 0) | 0 | 0;
   do if (!($47 << 24 >> 24)) $$0$i = 0; else {
    $49 = $38 & 255;
    $50 = $49 + 1 | 0;
    $51 = $45 & 255;
    $indvars$iv$i = 0;
    L24 : while (1) {
     do if ($indvars$iv$i | 0) {
      $55 = (SAFE_HEAP_LOAD(98960 + ($indvars$iv$i * 20 | 0) + 1 >> 0 | 0, 1, 1) | 0 | 0) >>> 3;
      $58 = (SAFE_HEAP_LOAD(98960 + ($indvars$iv$i * 20 | 0) + 2 >> 0 | 0, 1, 1) | 0 | 0) >>> 3;
      if ($58 << 24 >> 24 != $46 << 24 >> 24) if ((($58 & 255) + -1 | 0) != ($51 | 0)) break;
      $63 = $55 & 255;
      if (($50 | 0) == ($63 | 0) | (($63 + 1 | 0) == ($49 | 0) ? 1 : $55 << 24 >> 24 == $39 << 24 >> 24)) {
       label = 22;
       break L24;
      }
     } while (0);
     if (($indvars$iv$i & 255) + 1 << 24 >> 24 << 24 >> 24 == $47 << 24 >> 24) {
      label = 35;
      break;
     } else $indvars$iv$i = $indvars$iv$i + 1 | 0;
    }
    if ((label | 0) == 22) {
     $$0$i = $indvars$iv$i & 255;
     break;
    } else if ((label | 0) == 35) return;
   } while (0);
   if ($$0$i << 24 >> 24 == $47 << 24 >> 24) return;
   $73 = $$0$i & 255;
   SAFE_HEAP_STORE(98967 | 0, 0 | 0, 1);
   if ((SAFE_HEAP_LOAD(98960 + ($73 * 20 | 0) + 16 | 0, 4, 0) | 0 | 0) != 1) {
    SAFE_HEAP_STORE(98960 + ($73 * 20 | 0) + 3 >> 0 | 0, 0 - $37 | 0, 1);
    SAFE_HEAP_STORE(98960 + ($73 * 20 | 0) + 4 >> 0 | 0, 0 - $44 | 0, 1);
   }
   SAFE_HEAP_STORE(98960 + ($73 * 20 | 0) + 7 >> 0 | 0, 0 | 0, 1);
   SAFE_HEAP_STORE(98960 + ($73 * 20 | 0) + 5 >> 0 | 0, 1 | 0, 1);
   SAFE_HEAP_STORE(101059 | 0, $$0$i | 0, 1);
   SAFE_HEAP_STORE(25110 * 4 | 0, SAFE_HEAP_LOAD(98960 + ($73 * 20 | 0) + 12 | 0, 4, 0) | 0 | 0, 4);
   return;
  }
  if ((SAFE_HEAP_LOAD(24744 * 4 | 0, 4, 0) | 0 | 0) != 2) return;
  $89 = $27 & 255;
  do if (!($89 & 2)) {
   if ($89 & 1 | 0) {
    SAFE_HEAP_STORE(101169 | 0, 1 | 0, 1);
    $$sink = 0;
    break;
   }
   SAFE_HEAP_STORE(101169 | 0, 0 | 0, 1);
   if (!($89 & 4)) $$sink = $89 >>> 3 & 1; else $$sink = -1;
  } else {
   SAFE_HEAP_STORE(101169 | 0, -1 | 0, 1);
   $$sink = 0;
  } while (0);
  SAFE_HEAP_STORE(101170 | 0, $$sink | 0, 1);
  _MapUpdateActorMovement_b(0);
  return;
 }
 SAFE_HEAP_STORE(98967 | 0, 0 | 0, 1);
 return;
}

function _pop_arg_673($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $10 = 0, $108 = 0, $109 = 0.0, $115 = 0, $116 = 0.0, $16 = 0, $17 = 0, $20 = 0, $29 = 0, $30 = 0, $31 = 0, $40 = 0, $41 = 0, $43 = 0, $46 = 0, $47 = 0, $56 = 0, $57 = 0, $59 = 0, $62 = 0, $71 = 0, $72 = 0, $73 = 0, $82 = 0, $83 = 0, $85 = 0, $88 = 0, $9 = 0, $97 = 0, $98 = 0, $99 = 0;
 L1 : do if ($1 >>> 0 <= 20) do switch ($1 | 0) {
 case 9:
  {
   $9 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
   $10 = SAFE_HEAP_LOAD($9 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($2 | 0, $9 + 4 | 0, 4);
   SAFE_HEAP_STORE($0 | 0, $10 | 0, 4);
   break L1;
   break;
  }
 case 10:
  {
   $16 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
   $17 = SAFE_HEAP_LOAD($16 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($2 | 0, $16 + 4 | 0, 4);
   $20 = $0;
   SAFE_HEAP_STORE($20 | 0, $17 | 0, 4);
   SAFE_HEAP_STORE($20 + 4 | 0, (($17 | 0) < 0) << 31 >> 31 | 0, 4);
   break L1;
   break;
  }
 case 11:
  {
   $29 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
   $30 = SAFE_HEAP_LOAD($29 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($2 | 0, $29 + 4 | 0, 4);
   $31 = $0;
   SAFE_HEAP_STORE($31 | 0, $30 | 0, 4);
   SAFE_HEAP_STORE($31 + 4 | 0, 0 | 0, 4);
   break L1;
   break;
  }
 case 12:
  {
   $40 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (8 - 1) & ~(8 - 1);
   $41 = $40;
   $43 = SAFE_HEAP_LOAD($41 | 0, 4, 0) | 0 | 0;
   $46 = SAFE_HEAP_LOAD($41 + 4 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($2 | 0, $40 + 8 | 0, 4);
   $47 = $0;
   SAFE_HEAP_STORE($47 | 0, $43 | 0, 4);
   SAFE_HEAP_STORE($47 + 4 | 0, $46 | 0, 4);
   break L1;
   break;
  }
 case 13:
  {
   $56 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
   $57 = SAFE_HEAP_LOAD($56 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($2 | 0, $56 + 4 | 0, 4);
   $59 = ($57 & 65535) << 16 >> 16;
   $62 = $0;
   SAFE_HEAP_STORE($62 | 0, $59 | 0, 4);
   SAFE_HEAP_STORE($62 + 4 | 0, (($59 | 0) < 0) << 31 >> 31 | 0, 4);
   break L1;
   break;
  }
 case 14:
  {
   $71 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
   $72 = SAFE_HEAP_LOAD($71 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($2 | 0, $71 + 4 | 0, 4);
   $73 = $0;
   SAFE_HEAP_STORE($73 | 0, $72 & 65535 | 0, 4);
   SAFE_HEAP_STORE($73 + 4 | 0, 0 | 0, 4);
   break L1;
   break;
  }
 case 15:
  {
   $82 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
   $83 = SAFE_HEAP_LOAD($82 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($2 | 0, $82 + 4 | 0, 4);
   $85 = ($83 & 255) << 24 >> 24;
   $88 = $0;
   SAFE_HEAP_STORE($88 | 0, $85 | 0, 4);
   SAFE_HEAP_STORE($88 + 4 | 0, (($85 | 0) < 0) << 31 >> 31 | 0, 4);
   break L1;
   break;
  }
 case 16:
  {
   $97 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (4 - 1) & ~(4 - 1);
   $98 = SAFE_HEAP_LOAD($97 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($2 | 0, $97 + 4 | 0, 4);
   $99 = $0;
   SAFE_HEAP_STORE($99 | 0, $98 & 255 | 0, 4);
   SAFE_HEAP_STORE($99 + 4 | 0, 0 | 0, 4);
   break L1;
   break;
  }
 case 17:
  {
   $108 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (8 - 1) & ~(8 - 1);
   $109 = +(+SAFE_HEAP_LOAD_D($108 | 0, 8));
   SAFE_HEAP_STORE($2 | 0, $108 + 8 | 0, 4);
   SAFE_HEAP_STORE_D($0 | 0, +$109, 8);
   break L1;
   break;
  }
 case 18:
  {
   $115 = (SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0) + (8 - 1) & ~(8 - 1);
   $116 = +(+SAFE_HEAP_LOAD_D($115 | 0, 8));
   SAFE_HEAP_STORE($2 | 0, $115 + 8 | 0, 4);
   SAFE_HEAP_STORE_D($0 | 0, +$116, 8);
   break L1;
   break;
  }
 default:
  break L1;
 } while (0); while (0);
 return;
}

function _draw_text($0) {
 $0 = $0 | 0;
 var $$011$lcssa = 0, $$01112 = 0, $$013 = 0, $$pre23 = 0, $1 = 0, $12 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $23 = 0, $30 = 0, $38 = 0, $39 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $5 = 0, $55 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16);
 $1 = sp;
 $2 = SAFE_HEAP_LOAD(101084 | 0, 1, 0) | 0 | 0;
 if ($2 << 24 >> 24) {
  SAFE_HEAP_STORE(101084 | 0, $2 + -1 << 24 >> 24 | 0, 1);
  STACKTOP = sp;
  return;
 }
 $5 = _strlen(99216) | 0;
 $6 = SAFE_HEAP_LOAD(101082 | 0, 1, 0) | 0 | 0;
 $7 = $6 & 255;
 $8 = $5 & 255;
 if ($8 >>> 0 <= $7 >>> 0) {
  SAFE_HEAP_STORE(101083 | 0, 1 | 0, 1);
  STACKTOP = sp;
  return;
 }
 SAFE_HEAP_STORE(101083 | 0, 0 | 0, 1);
 if (!($6 << 24 >> 24)) {
  SAFE_HEAP_STORE(101080 | 0, 0 | 0, 1);
  SAFE_HEAP_STORE(101081 | 0, 0 | 0, 1);
  $23 = 0;
 } else $23 = SAFE_HEAP_LOAD(101080 | 0, 1, 0) | 0 | 0;
 $12 = SAFE_HEAP_LOAD(99216 + $7 >> 0 | 0, 1, 0) | 0 | 0;
 SAFE_HEAP_STORE($1 >> 0 | 0, ($12 & 255) + 165 | 0, 1);
 if (($8 | 0) == ($7 | 0)) $30 = $23; else {
  $$01112 = 0;
  $$013 = $6;
  $17 = $12;
  L15 : while (1) {
   switch ($17 << 24 >> 24) {
   case 0:
   case 10:
   case 32:
    {
     $$011$lcssa = $$01112;
     break L15;
     break;
    }
   default:
    {}
   }
   $18 = $$01112 + 1 << 24 >> 24;
   $19 = $$013 + 1 << 24 >> 24;
   $20 = $19 & 255;
   if (($8 | 0) == ($20 | 0)) {
    $$011$lcssa = $18;
    break;
   }
   $$01112 = $18;
   $$013 = $19;
   $17 = SAFE_HEAP_LOAD(99216 + $20 >> 0 | 0, 1, 0) | 0 | 0;
  }
  if (($$011$lcssa & 255) > (18 - $23 & 255) & ($$011$lcssa & 255) < 18) {
   SAFE_HEAP_STORE(101080 | 0, 0 | 0, 1);
   SAFE_HEAP_STORE(101081 | 0, (SAFE_HEAP_LOAD(101081 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
   $30 = 0;
  } else $30 = $23;
 }
 L22 : do if ($12 << 24 >> 24 == 8) {
  $55 = $6;
  label = 17;
 } else {
  _set_win_tiles(($30 & 255) + 1 & 255 | 0, (SAFE_HEAP_LOAD(101081 | 0, 1, 1) | 0 | 0) + 1 & 255 | 0, 1, 1, $1 | 0);
  $$pre23 = SAFE_HEAP_LOAD(101082 | 0, 1, 0) | 0 | 0;
  switch (SAFE_HEAP_LOAD(99216 + ($$pre23 & 255) >> 0 | 0, 1, 0) | 0 | 0) {
  case 8:
   {
    $55 = $$pre23;
    label = 17;
    break L22;
    break;
   }
  case 32:
   break;
  default:
   {
    $42 = $$pre23;
    $44 = SAFE_HEAP_LOAD(101080 | 0, 1, 0) | 0 | 0;
    break L22;
   }
  }
  $39 = SAFE_HEAP_LOAD(101080 | 0, 1, 0) | 0 | 0;
  if (!($39 << 24 >> 24)) {
   SAFE_HEAP_STORE(101080 | 0, -1 | 0, 1);
   $42 = $$pre23;
   $44 = -1;
  } else {
   $42 = $$pre23;
   $44 = $39;
  }
 } while (0);
 if ((label | 0) == 17) {
  $38 = (SAFE_HEAP_LOAD(101080 | 0, 1, 0) | 0 | 0) + -1 << 24 >> 24;
  SAFE_HEAP_STORE(101080 | 0, $38 | 0, 1);
  SAFE_HEAP_STORE(101084 | 0, 10 | 0, 1);
  $42 = $55;
  $44 = $38;
 }
 $41 = $42 + 1 << 24 >> 24;
 SAFE_HEAP_STORE(101082 | 0, $41 | 0, 1);
 $43 = $44 + 1 << 24 >> 24;
 SAFE_HEAP_STORE(101080 | 0, $43 | 0, 1);
 if ((SAFE_HEAP_LOAD(99216 + ($41 & 255) >> 0 | 0, 1, 0) | 0 | 0) == 10) {
  SAFE_HEAP_STORE(101080 | 0, 0 | 0, 1);
  SAFE_HEAP_STORE(101081 | 0, (SAFE_HEAP_LOAD(101081 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
  SAFE_HEAP_STORE(101082 | 0, $42 + 2 << 24 >> 24 | 0, 1);
  STACKTOP = sp;
  return;
 }
 if (($43 & 255) <= 17) {
  STACKTOP = sp;
  return;
 }
 SAFE_HEAP_STORE(101080 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101081 | 0, (SAFE_HEAP_LOAD(101081 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
 STACKTOP = sp;
 return;
}

function _MapUpdateActorMovement_b($0) {
 $0 = $0 | 0;
 var $$0$i = 0, $1 = 0, $10 = 0, $14 = 0, $2 = 0, $24 = 0, $25 = 0, $33 = 0, $34 = 0, $35 = 0, $37 = 0, $38 = 0, $39 = 0, $43 = 0, $46 = 0, $5 = 0, $51 = 0, $61 = 0, $64 = 0, $67 = 0, $7 = 0, $72 = 0, $85 = 0, $indvars$iv$i = 0, label = 0;
 $1 = SAFE_HEAP_LOAD(101169 | 0, 1, 0) | 0 | 0;
 $2 = SAFE_HEAP_LOAD(101170 | 0, 1, 0) | 0 | 0;
 $5 = $0 & 255;
 if (!(($2 | $1) << 24 >> 24)) {
  SAFE_HEAP_STORE(98960 + ($5 * 20 | 0) + 7 >> 0 | 0, 0 | 0, 1);
  return;
 }
 $7 = 98960 + ($5 * 20 | 0) + 3 | 0;
 $10 = 98960 + ($5 * 20 | 0) + 4 | 0;
 if ((SAFE_HEAP_LOAD($7 >> 0 | 0, 1, 0) | 0 | 0) == $1 << 24 >> 24) {
  if ((SAFE_HEAP_LOAD($10 >> 0 | 0, 1, 0) | 0 | 0) != $2 << 24 >> 24) label = 5;
 } else label = 5;
 if ((label | 0) == 5) {
  SAFE_HEAP_STORE($7 >> 0 | 0, $1 | 0, 1);
  SAFE_HEAP_STORE($10 >> 0 | 0, $2 | 0, 1);
  SAFE_HEAP_STORE(98960 + ($5 * 20 | 0) + 5 >> 0 | 0, 1 | 0, 1);
 }
 $14 = 98960 + ($5 * 20 | 0) + 7 | 0;
 SAFE_HEAP_STORE($14 >> 0 | 0, 1 | 0, 1);
 if (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) return;
 $24 = ((SAFE_HEAP_LOAD(98960 + ($5 * 20 | 0) + 1 >> 0 | 0, 1, 1) | 0 | 0) >>> 3) + (SAFE_HEAP_LOAD(98960 + ($5 * 20 | 0) + 3 >> 0 | 0, 1, 1) | 0 | 0) | 0;
 $25 = $24 & 255;
 $33 = ((SAFE_HEAP_LOAD(98960 + ($5 * 20 | 0) + 2 >> 0 | 0, 1, 1) | 0 | 0) >>> 3) + (SAFE_HEAP_LOAD(98960 + ($5 * 20 | 0) + 4 >> 0 | 0, 1, 1) | 0 | 0) | 0;
 $34 = $33 & 255;
 $35 = SAFE_HEAP_LOAD(97937 | 0, 1, 0) | 0 | 0;
 L13 : do if (!($35 << 24 >> 24)) {
  $$0$i = 0;
  label = 15;
 } else {
  $37 = $24 & 255;
  $38 = $37 + 1 | 0;
  $39 = $33 & 255;
  $indvars$iv$i = 0;
  L15 : while (1) {
   do if (($indvars$iv$i | 0) != ($5 | 0)) {
    $43 = (SAFE_HEAP_LOAD(98960 + ($indvars$iv$i * 20 | 0) + 1 >> 0 | 0, 1, 1) | 0 | 0) >>> 3;
    $46 = (SAFE_HEAP_LOAD(98960 + ($indvars$iv$i * 20 | 0) + 2 >> 0 | 0, 1, 1) | 0 | 0) >>> 3;
    if ($46 << 24 >> 24 != $34 << 24 >> 24) if ((($46 & 255) + -1 | 0) != ($39 | 0)) break;
    $51 = $43 & 255;
    if (($38 | 0) == ($51 | 0) | (($51 + 1 | 0) == ($37 | 0) ? 1 : $43 << 24 >> 24 == $25 << 24 >> 24)) break L15;
   } while (0);
   if (($indvars$iv$i & 255) + 1 << 24 >> 24 << 24 >> 24 == $35 << 24 >> 24) break L13; else $indvars$iv$i = $indvars$iv$i + 1 | 0;
  }
  $$0$i = $indvars$iv$i & 255;
  label = 15;
 } while (0);
 if ((label | 0) == 15) if ($$0$i << 24 >> 24 != $35 << 24 >> 24) SAFE_HEAP_STORE($14 >> 0 | 0, 0 | 0, 1);
 $61 = SAFE_HEAP_LOAD(25115 * 4 | 0, 4, 0) | 0 | 0;
 if (!$61) return;
 $64 = $24 & 255;
 $67 = ($33 & 255) + -1 | 0;
 $72 = $64 + -1 + $61 + (Math_imul($67, SAFE_HEAP_LOAD(97940 | 0, 1, 1) | 0 | 0) | 0) | 0;
 if ((_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $72) | 0) << 24 >> 24) SAFE_HEAP_STORE($14 >> 0 | 0, 0 | 0, 1);
 $85 = (SAFE_HEAP_LOAD(25115 * 4 | 0, 4, 0) | 0 | 0) + $64 + (Math_imul($67, SAFE_HEAP_LOAD(97940 | 0, 1, 1) | 0 | 0) | 0) | 0;
 if (!((_ReadBankedUBYTE(SAFE_HEAP_LOAD(32592 + (SAFE_HEAP_LOAD(101044 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0, $85) | 0) << 24 >> 24)) return;
 SAFE_HEAP_STORE($14 >> 0 | 0, 0 | 0, 1);
 return;
}

function _TitleUpdate_b() {
 var $$sink = 0, $0 = 0, $15 = 0, $17 = 0, $2 = 0, label = 0;
 SAFE_HEAP_STORE(65349 | 0, 0 | 0, 1);
 $0 = SAFE_HEAP_LOAD(101052 | 0, 1, 0) | 0 | 0;
 $2 = SAFE_HEAP_LOAD(101053 | 0, 1, 0) | 0 | 0;
 if ($0 << 24 >> 24 > -1 | $2 << 24 >> 24 < 0) {
  if (($0 & 16) != 0 & ($2 & 16) == 0) label = 3;
 } else label = 3;
 if ((label | 0) == 3) {
  if (!(SAFE_HEAP_LOAD(101065 | 0, 1, 0) | 0)) {
   SAFE_HEAP_STORE(101065 | 0, 1 | 0, 1);
   _FadeSetSpeed(4);
   _FadeOut();
   SAFE_HEAP_STORE(65344 | 0, (SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0) & -3 | 0, 1);
   SAFE_HEAP_STORE(24388 * 4 | 0, 3 | 0, 4);
  }
  _set_sprite_prop(0, 16);
  _set_sprite_prop(1, 16);
  _set_sprite_prop(2, 16);
  _set_sprite_prop(3, 16);
  _set_sprite_prop(4, 16);
  _set_sprite_prop(5, 16);
  _set_sprite_prop(6, 16);
  _set_sprite_prop(7, 16);
  _set_sprite_prop(8, 16);
  _set_sprite_prop(9, 16);
  _set_sprite_prop(10, 16);
  _set_sprite_prop(11, 16);
  _set_sprite_prop(12, 16);
  _set_sprite_prop(13, 16);
 }
 if (!(((SAFE_HEAP_LOAD(101054 | 0, 1, 1) | 0 | 0) % 15 | 0) << 24 >> 24)) {
  $15 = SAFE_HEAP_LOAD(101066 | 0, 1, 0) | 0 | 0;
  switch ($15 << 24 >> 24) {
  case 3:
   {
    _set_sprite_prop(0, 16);
    _set_sprite_tile(0, 0);
    _move_sprite(0, 44, 112);
    _set_sprite_prop(1, 16);
    _set_sprite_tile(1, 2);
    _move_sprite(1, 52, 112);
    _set_sprite_prop(2, 16);
    _set_sprite_tile(2, 4);
    _move_sprite(2, 60, 112);
    _set_sprite_prop(3, 16);
    _set_sprite_tile(3, 6);
    _move_sprite(3, 68, 112);
    _set_sprite_prop(4, 16);
    _set_sprite_tile(4, 6);
    _move_sprite(4, 76, 112);
    _set_sprite_prop(5, 16);
    _set_sprite_tile(5, 6);
    _move_sprite(5, 92, 112);
    _set_sprite_prop(6, 16);
    _set_sprite_tile(6, 8);
    _move_sprite(6, 100, 112);
    _set_sprite_prop(7, 16);
    _set_sprite_tile(7, 10);
    _move_sprite(7, 108, 112);
    _set_sprite_prop(8, 16);
    _set_sprite_tile(8, 2);
    _move_sprite(8, 116, 112);
    _set_sprite_prop(9, 16);
    _set_sprite_tile(9, 8);
    _move_sprite(9, 124, 112);
    _set_sprite_prop(10, 16);
    _set_sprite_tile(10, 12);
    _move_sprite(10, 72, -120);
    _set_sprite_prop(11, 16);
    _set_sprite_tile(11, 14);
    _move_sprite(11, 80, -120);
    _set_sprite_prop(12, 16);
    _set_sprite_tile(12, 16);
    _move_sprite(12, 88, -120);
    _set_sprite_prop(13, 16);
    _set_sprite_tile(13, 18);
    _move_sprite(13, 96, -120);
    $$sink = -25;
    label = 9;
    break;
   }
  case 4:
   {
    $$sink = -46;
    label = 9;
    break;
   }
  default:
   $17 = $15;
  }
  if ((label | 0) == 9) {
   SAFE_HEAP_STORE(65353 | 0, $$sink | 0, 1);
   $17 = SAFE_HEAP_LOAD(101066 | 0, 1, 0) | 0 | 0;
  }
  if (($17 & 255) < 4) SAFE_HEAP_STORE(101066 | 0, $17 + 1 << 24 >> 24 | 0, 1);
 }
 if ((SAFE_HEAP_LOAD(101054 | 0, 1, 0) | 0) & 1) return;
 SAFE_HEAP_STORE(101078 | 0, (SAFE_HEAP_LOAD(101078 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
 return;
}

function ___stdio_write($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$0 = 0, $$04756 = 0, $$04855 = 0, $$04954 = 0, $$051 = 0, $$1 = 0, $$150 = 0, $12 = 0, $13 = 0, $17 = 0, $20 = 0, $25 = 0, $27 = 0, $3 = 0, $37 = 0, $38 = 0, $4 = 0, $44 = 0, $5 = 0, $7 = 0, $9 = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(48);
 $vararg_buffer3 = sp + 32 | 0;
 $vararg_buffer = sp + 16 | 0;
 $3 = sp;
 $4 = $0 + 28 | 0;
 $5 = SAFE_HEAP_LOAD($4 | 0, 4, 0) | 0 | 0;
 SAFE_HEAP_STORE($3 | 0, $5 | 0, 4);
 $7 = $0 + 20 | 0;
 $9 = (SAFE_HEAP_LOAD($7 | 0, 4, 0) | 0 | 0) - $5 | 0;
 SAFE_HEAP_STORE($3 + 4 | 0, $9 | 0, 4);
 SAFE_HEAP_STORE($3 + 8 | 0, $1 | 0, 4);
 SAFE_HEAP_STORE($3 + 12 | 0, $2 | 0, 4);
 $12 = $9 + $2 | 0;
 $13 = $0 + 60 | 0;
 SAFE_HEAP_STORE($vararg_buffer | 0, SAFE_HEAP_LOAD($13 | 0, 4, 0) | 0 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 4 | 0, $3 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 8 | 0, 2 | 0, 4);
 $17 = ___syscall_ret(___syscall146(146, $vararg_buffer | 0) | 0) | 0;
 L1 : do if (($12 | 0) == ($17 | 0)) label = 3; else {
  $$04756 = 2;
  $$04855 = $12;
  $$04954 = $3;
  $27 = $17;
  while (1) {
   if (($27 | 0) < 0) break;
   $$04855 = $$04855 - $27 | 0;
   $37 = SAFE_HEAP_LOAD($$04954 + 4 | 0, 4, 0) | 0 | 0;
   $38 = $27 >>> 0 > $37 >>> 0;
   $$150 = $38 ? $$04954 + 8 | 0 : $$04954;
   $$1 = $$04756 + ($38 << 31 >> 31) | 0;
   $$0 = $27 - ($38 ? $37 : 0) | 0;
   SAFE_HEAP_STORE($$150 | 0, (SAFE_HEAP_LOAD($$150 | 0, 4, 0) | 0 | 0) + $$0 | 0, 4);
   $44 = $$150 + 4 | 0;
   SAFE_HEAP_STORE($44 | 0, (SAFE_HEAP_LOAD($44 | 0, 4, 0) | 0 | 0) - $$0 | 0, 4);
   SAFE_HEAP_STORE($vararg_buffer3 | 0, SAFE_HEAP_LOAD($13 | 0, 4, 0) | 0 | 0, 4);
   SAFE_HEAP_STORE($vararg_buffer3 + 4 | 0, $$150 | 0, 4);
   SAFE_HEAP_STORE($vararg_buffer3 + 8 | 0, $$1 | 0, 4);
   $27 = ___syscall_ret(___syscall146(146, $vararg_buffer3 | 0) | 0) | 0;
   if (($$04855 | 0) == ($27 | 0)) {
    label = 3;
    break L1;
   } else {
    $$04756 = $$1;
    $$04954 = $$150;
   }
  }
  SAFE_HEAP_STORE($0 + 16 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE($4 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE($7 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE($0 | 0, SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0 | 32 | 0, 4);
  if (($$04756 | 0) == 2) $$051 = 0; else $$051 = $2 - (SAFE_HEAP_LOAD($$04954 + 4 | 0, 4, 0) | 0 | 0) | 0;
 } while (0);
 if ((label | 0) == 3) {
  $20 = SAFE_HEAP_LOAD($0 + 44 | 0, 4, 0) | 0 | 0;
  SAFE_HEAP_STORE($0 + 16 | 0, $20 + (SAFE_HEAP_LOAD($0 + 48 | 0, 4, 0) | 0 | 0) | 0, 4);
  $25 = $20;
  SAFE_HEAP_STORE($4 | 0, $25 | 0, 4);
  SAFE_HEAP_STORE($7 | 0, $25 | 0, 4);
  $$051 = $2;
 }
 STACKTOP = sp;
 return $$051 | 0;
}

function _memcpy(dest, src, num) {
 dest = dest | 0;
 src = src | 0;
 num = num | 0;
 var ret = 0, aligned_dest_end = 0, block_aligned_dest_end = 0, dest_end = 0;
 if ((num | 0) >= 8192) return _emscripten_memcpy_big(dest | 0, src | 0, num | 0) | 0;
 ret = dest | 0;
 dest_end = dest + num | 0;
 if ((dest & 3) == (src & 3)) {
  while (dest & 3) {
   if (!num) return ret | 0;
   SAFE_HEAP_STORE(dest | 0, SAFE_HEAP_LOAD(src | 0, 1, 0) | 0, 1);
   dest = dest + 1 | 0;
   src = src + 1 | 0;
   num = num - 1 | 0;
  }
  aligned_dest_end = dest_end & -4 | 0;
  block_aligned_dest_end = aligned_dest_end - 64 | 0;
  while ((dest | 0) <= (block_aligned_dest_end | 0)) {
   SAFE_HEAP_STORE(dest | 0, SAFE_HEAP_LOAD(src | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 4 | 0, SAFE_HEAP_LOAD(src + 4 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 8 | 0, SAFE_HEAP_LOAD(src + 8 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 12 | 0, SAFE_HEAP_LOAD(src + 12 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 16 | 0, SAFE_HEAP_LOAD(src + 16 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 20 | 0, SAFE_HEAP_LOAD(src + 20 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 24 | 0, SAFE_HEAP_LOAD(src + 24 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 28 | 0, SAFE_HEAP_LOAD(src + 28 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 32 | 0, SAFE_HEAP_LOAD(src + 32 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 36 | 0, SAFE_HEAP_LOAD(src + 36 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 40 | 0, SAFE_HEAP_LOAD(src + 40 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 44 | 0, SAFE_HEAP_LOAD(src + 44 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 48 | 0, SAFE_HEAP_LOAD(src + 48 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 52 | 0, SAFE_HEAP_LOAD(src + 52 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 56 | 0, SAFE_HEAP_LOAD(src + 56 | 0, 4, 0) | 0, 4);
   SAFE_HEAP_STORE(dest + 60 | 0, SAFE_HEAP_LOAD(src + 60 | 0, 4, 0) | 0, 4);
   dest = dest + 64 | 0;
   src = src + 64 | 0;
  }
  while ((dest | 0) < (aligned_dest_end | 0)) {
   SAFE_HEAP_STORE(dest | 0, SAFE_HEAP_LOAD(src | 0, 4, 0) | 0, 4);
   dest = dest + 4 | 0;
   src = src + 4 | 0;
  }
 } else {
  aligned_dest_end = dest_end - 4 | 0;
  while ((dest | 0) < (aligned_dest_end | 0)) {
   SAFE_HEAP_STORE(dest | 0, SAFE_HEAP_LOAD(src | 0, 1, 0) | 0, 1);
   SAFE_HEAP_STORE(dest + 1 | 0, SAFE_HEAP_LOAD(src + 1 | 0, 1, 0) | 0, 1);
   SAFE_HEAP_STORE(dest + 2 | 0, SAFE_HEAP_LOAD(src + 2 | 0, 1, 0) | 0, 1);
   SAFE_HEAP_STORE(dest + 3 | 0, SAFE_HEAP_LOAD(src + 3 | 0, 1, 0) | 0, 1);
   dest = dest + 4 | 0;
   src = src + 4 | 0;
  }
 }
 while ((dest | 0) < (dest_end | 0)) {
  SAFE_HEAP_STORE(dest | 0, SAFE_HEAP_LOAD(src | 0, 1, 0) | 0, 1);
  dest = dest + 1 | 0;
  src = src + 1 | 0;
 }
 return ret | 0;
}

function _memchr($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$0$lcssa = 0, $$035$lcssa = 0, $$035$lcssa65 = 0, $$03555 = 0, $$036$lcssa = 0, $$036$lcssa64 = 0, $$03654 = 0, $$046 = 0, $$137$lcssa = 0, $$137$lcssa66 = 0, $$13745 = 0, $$140 = 0, $$23839 = 0, $$in = 0, $$lcssa = 0, $11 = 0, $12 = 0, $16 = 0, $18 = 0, $20 = 0, $23 = 0, $29 = 0, $3 = 0, $30 = 0, $39 = 0, $7 = 0, $8 = 0, label = 0;
 $3 = $1 & 255;
 $7 = ($2 | 0) != 0;
 L1 : do if ($7 & ($0 & 3 | 0) != 0) {
  $8 = $1 & 255;
  $$03555 = $0;
  $$03654 = $2;
  while (1) {
   if ((SAFE_HEAP_LOAD($$03555 >> 0 | 0, 1, 0) | 0 | 0) == $8 << 24 >> 24) {
    $$035$lcssa65 = $$03555;
    $$036$lcssa64 = $$03654;
    label = 6;
    break L1;
   }
   $11 = $$03555 + 1 | 0;
   $12 = $$03654 + -1 | 0;
   $16 = ($12 | 0) != 0;
   if ($16 & ($11 & 3 | 0) != 0) {
    $$03555 = $11;
    $$03654 = $12;
   } else {
    $$035$lcssa = $11;
    $$036$lcssa = $12;
    $$lcssa = $16;
    label = 5;
    break;
   }
  }
 } else {
  $$035$lcssa = $0;
  $$036$lcssa = $2;
  $$lcssa = $7;
  label = 5;
 } while (0);
 if ((label | 0) == 5) if ($$lcssa) {
  $$035$lcssa65 = $$035$lcssa;
  $$036$lcssa64 = $$036$lcssa;
  label = 6;
 } else label = 16;
 L8 : do if ((label | 0) == 6) {
  $18 = $1 & 255;
  if ((SAFE_HEAP_LOAD($$035$lcssa65 >> 0 | 0, 1, 0) | 0 | 0) == $18 << 24 >> 24) if (!$$036$lcssa64) {
   label = 16;
   break;
  } else {
   $39 = $$035$lcssa65;
   break;
  }
  $20 = Math_imul($3, 16843009) | 0;
  L13 : do if ($$036$lcssa64 >>> 0 > 3) {
   $$046 = $$035$lcssa65;
   $$13745 = $$036$lcssa64;
   while (1) {
    $23 = (SAFE_HEAP_LOAD($$046 | 0, 4, 0) | 0) ^ $20;
    if (($23 & -2139062144 ^ -2139062144) & $23 + -16843009 | 0) {
     $$137$lcssa66 = $$13745;
     $$in = $$046;
     break L13;
    }
    $29 = $$046 + 4 | 0;
    $30 = $$13745 + -4 | 0;
    if ($30 >>> 0 > 3) {
     $$046 = $29;
     $$13745 = $30;
    } else {
     $$0$lcssa = $29;
     $$137$lcssa = $30;
     label = 11;
     break;
    }
   }
  } else {
   $$0$lcssa = $$035$lcssa65;
   $$137$lcssa = $$036$lcssa64;
   label = 11;
  } while (0);
  if ((label | 0) == 11) if (!$$137$lcssa) {
   label = 16;
   break;
  } else {
   $$137$lcssa66 = $$137$lcssa;
   $$in = $$0$lcssa;
  }
  $$140 = $$in;
  $$23839 = $$137$lcssa66;
  while (1) {
   if ((SAFE_HEAP_LOAD($$140 >> 0 | 0, 1, 0) | 0 | 0) == $18 << 24 >> 24) {
    $39 = $$140;
    break L8;
   }
   $$23839 = $$23839 + -1 | 0;
   if (!$$23839) {
    label = 16;
    break;
   } else $$140 = $$140 + 1 | 0;
  }
 } while (0);
 if ((label | 0) == 16) $39 = 0;
 return $39 | 0;
}

function _MapRepositionCamera_b() {
 var $$sink = 0, $$sink2 = 0, $$sink4 = 0, $0 = 0, $15 = 0, $16 = 0, $20 = 0, $27 = 0, $3 = 0, $35 = 0, $38 = 0, $4 = 0, $43 = 0, $46 = 0, $53 = 0, $8 = 0, label = 0;
 $0 = SAFE_HEAP_LOAD(97938 | 0, 1, 0) | 0 | 0;
 if ($0 & 16) {
  $3 = SAFE_HEAP_LOAD(98961 | 0, 1, 0) | 0 | 0;
  $4 = $3 & 255;
  do if (($3 & 255) < 80) $$sink = 0; else {
   $8 = (SAFE_HEAP_LOAD(97940 | 0, 1, 1) | 0) << 3;
   if (($8 + -80 | 0) < ($4 | 0)) {
    $$sink = $8 + 96 & 255;
    break;
   } else {
    $$sink = $4 + 176 & 255;
    break;
   }
  } while (0);
  SAFE_HEAP_STORE(101165 | 0, $$sink | 0, 1);
  $15 = SAFE_HEAP_LOAD(98962 | 0, 1, 0) | 0 | 0;
  $16 = $15 & 255;
  do if (($15 & 255) < 72) $$sink2 = 0; else {
   $20 = (SAFE_HEAP_LOAD(97941 | 0, 1, 1) | 0) << 3;
   if (($20 + -72 | 0) < ($16 | 0)) {
    $$sink2 = $20 + 112 & 255;
    break;
   } else {
    $$sink2 = $16 + 184 & 255;
    break;
   }
  } while (0);
  SAFE_HEAP_STORE(101166 | 0, $$sink2 | 0, 1);
 }
 $27 = $0 & 255;
 do if (!($27 & 32)) {
  SAFE_HEAP_STORE(65347 | 0, SAFE_HEAP_LOAD(101165 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(65346 | 0, SAFE_HEAP_LOAD(101166 | 0, 1, 0) | 0 | 0 | 0, 1);
 } else if (!($27 & 15 & (SAFE_HEAP_LOAD(101054 | 0, 1, 1) | 0))) {
  $35 = SAFE_HEAP_LOAD(101165 | 0, 1, 0) | 0 | 0;
  $38 = SAFE_HEAP_LOAD(65347 | 0, 1, 0) | 0 | 0;
  if (($35 & 255) < (SAFE_HEAP_LOAD(65347 | 0, 1, 1) | 0 | 0)) {
   $$sink4 = $38 + -1 << 24 >> 24;
   label = 17;
  } else if (($35 & 255) > ($38 & 255)) {
   $$sink4 = (SAFE_HEAP_LOAD(65347 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24;
   label = 17;
  }
  if ((label | 0) == 17) SAFE_HEAP_STORE(65347 | 0, $$sink4 | 0, 1);
  $43 = SAFE_HEAP_LOAD(101166 | 0, 1, 0) | 0 | 0;
  $46 = SAFE_HEAP_LOAD(65346 | 0, 1, 0) | 0 | 0;
  if (($43 & 255) < (SAFE_HEAP_LOAD(65346 | 0, 1, 1) | 0 | 0)) {
   SAFE_HEAP_STORE(65346 | 0, $46 + -1 << 24 >> 24 | 0, 1);
   break;
  }
  if (($43 & 255) > ($46 & 255)) SAFE_HEAP_STORE(65346 | 0, (SAFE_HEAP_LOAD(65346 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
 } while (0);
 $53 = SAFE_HEAP_LOAD(25113 * 4 | 0, 4, 0) | 0 | 0;
 if (!(($53 | 0) == 10 | ($53 | 0) == 11)) return;
 if ((SAFE_HEAP_LOAD(65347 | 0, 1, 0) | 0 | 0) != (SAFE_HEAP_LOAD(101165 | 0, 1, 0) | 0 | 0)) return;
 if ((SAFE_HEAP_LOAD(65346 | 0, 1, 0) | 0 | 0) != (SAFE_HEAP_LOAD(101166 | 0, 1, 0) | 0 | 0)) return;
 SAFE_HEAP_STORE(97939 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(97938 | 0, (SAFE_HEAP_LOAD(97938 | 0, 1, 0) | 0) & -33 | 0, 1);
 return;
}

function _MapHandleTrigger_b() {
 var $0 = 0, $14 = 0, $19 = 0, $20 = 0, $21 = 0, $23 = 0, $25 = 0, $28 = 0, $3 = 0, $6 = 0, $indvars$iv$i = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16);
 $vararg_buffer = sp;
 $0 = SAFE_HEAP_LOAD(98961 | 0, 1, 0) | 0 | 0;
 if (!($0 & 7)) {
  $3 = SAFE_HEAP_LOAD(98962 | 0, 1, 0) | 0 | 0;
  $6 = $3 << 24 >> 24 == -2;
  if ($6 | ($3 & 7) == 0) {
   if (SAFE_HEAP_LOAD(101048 | 0, 1, 0) | 0 | 0) {
    STACKTOP = sp;
    return;
   }
   SAFE_HEAP_STORE($vararg_buffer | 0, ($0 & 255) >>> 3 | 0, 4);
   SAFE_HEAP_STORE($vararg_buffer + 4 | 0, ($3 & 255) >>> 3 | 0, 4);
   _printf(98124, $vararg_buffer) | 0;
   SAFE_HEAP_STORE(101048 | 0, 1 | 0, 1);
   $14 = (SAFE_HEAP_LOAD(98961 | 0, 1, 1) | 0 | 0) >>> 3;
   $19 = ((SAFE_HEAP_LOAD(98962 | 0, 1, 1) | 0 | 0) >>> 3) + ($6 & 1) | 0;
   $20 = $19 & 255;
   $21 = SAFE_HEAP_LOAD(101045 | 0, 1, 0) | 0 | 0;
   if (!($21 << 24 >> 24)) {
    STACKTOP = sp;
    return;
   }
   $23 = $14 & 255;
   $indvars$iv$i = 0;
   while (1) {
    $25 = SAFE_HEAP_LOAD(99152 + ($indvars$iv$i << 3) >> 0 | 0, 1, 0) | 0 | 0;
    $28 = (SAFE_HEAP_LOAD(99152 + ($indvars$iv$i << 3) + 1 >> 0 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24;
    if (($25 & 255) <= ($14 & 255)) if (!((($28 & 255) + 255 + (SAFE_HEAP_LOAD(99152 + ($indvars$iv$i << 3) + 3 >> 0 | 0, 1, 1) | 0 | 0) & 255) >>> 0 < $19 >>> 0 | (($28 & 255) > ($20 & 255) ? 1 : ((SAFE_HEAP_LOAD(99152 + ($indvars$iv$i << 3) + 2 >> 0 | 0, 1, 1) | 0 | 0) + ($25 & 255) & 255) >>> 0 < $23 >>> 0))) break;
    if (($indvars$iv$i & 255) + 1 << 24 >> 24 << 24 >> 24 == $21 << 24 >> 24) {
     label = 12;
     break;
    } else $indvars$iv$i = $indvars$iv$i + 1 | 0;
   }
   if ((label | 0) == 12) {
    STACKTOP = sp;
    return;
   }
   _puts(98139) | 0;
   if ((SAFE_HEAP_LOAD(101045 | 0, 1, 0) | 0 | 0) == ($indvars$iv$i & 255) << 24 >> 24) {
    STACKTOP = sp;
    return;
   }
   SAFE_HEAP_STORE(98967 | 0, 0 | 0, 1);
   SAFE_HEAP_STORE(101059 | 0, 0 | 0, 1);
   SAFE_HEAP_STORE(25110 * 4 | 0, SAFE_HEAP_LOAD(99152 + (($indvars$iv$i & 255) << 3) + 4 | 0, 4, 0) | 0 | 0, 4);
   STACKTOP = sp;
   return;
  }
 }
 SAFE_HEAP_STORE(101048 | 0, 0 | 0, 1);
 STACKTOP = sp;
 return;
}

function _game_loop() {
 var $19 = 0;
 _emscripten_update_registers(SAFE_HEAP_LOAD(65347 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(65346 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(65355 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(65354 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(65349 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(65351 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(65352 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(65353 | 0, 1, 0) | 0 | 0);
 _wait_vbl_done();
 SAFE_HEAP_STORE(65349 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101052 | 0, _joypad() | 0 | 0, 1);
 if (!1) return;
 FUNCTION_TABLE_v[(SAFE_FT_MASK(SAFE_HEAP_LOAD(25111 * 4 | 0, 4, 0) | 0 | 0, 31 | 0) | 0) & 31]();
 _run_script();
 _FadeUpdate();
 L4 : do if ((SAFE_HEAP_LOAD(25112 * 4 | 0, 4, 0) | 0 | 0) != (SAFE_HEAP_LOAD(24388 * 4 | 0, 4, 0) | 0 | 0)) if (!((_IsFading() | 0) << 24 >> 24)) {
  if ((SAFE_HEAP_LOAD(25112 * 4 | 0, 4, 0) | 0 | 0) == 1) _TitleCleanup();
  $19 = SAFE_HEAP_LOAD(24388 * 4 | 0, 4, 0) | 0 | 0;
  SAFE_HEAP_STORE(25112 * 4 | 0, $19 | 0, 4);
  SAFE_HEAP_STORE(101044 | 0, SAFE_HEAP_LOAD(101079 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(101171 | 0, SAFE_HEAP_LOAD(98961 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(101172 | 0, SAFE_HEAP_LOAD(98962 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(101173 | 0, SAFE_HEAP_LOAD(98963 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(101174 | 0, SAFE_HEAP_LOAD(98964 | 0, 1, 0) | 0 | 0 | 0, 1);
  switch ($19 | 0) {
  case 3:
   {
    _LoadMap();
    SAFE_HEAP_STORE(25111 * 4 | 0, 26 | 0, 4);
    break L4;
    break;
   }
  case 4:
   {
    _PongInit();
    SAFE_HEAP_STORE(25111 * 4 | 0, 28 | 0, 4);
    break L4;
    break;
   }
  case 2:
   {
    _LogoInit();
    SAFE_HEAP_STORE(25111 * 4 | 0, 29 | 0, 4);
    break L4;
    break;
   }
  case 1:
   {
    _TitleInit();
    SAFE_HEAP_STORE(25111 * 4 | 0, 30 | 0, 4);
    break L4;
    break;
   }
  case 6:
   {
    _PongInit();
    SAFE_HEAP_STORE(25111 * 4 | 0, 28 | 0, 4);
    break L4;
    break;
   }
  default:
   break L4;
  }
 } while (0);
 SAFE_HEAP_STORE(101053 | 0, SAFE_HEAP_LOAD(101052 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(101054 | 0, (SAFE_HEAP_LOAD(101054 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
 return;
}

function _run_script() {
 var $13 = 0, $17 = 0, $23 = 0, $26 = 0, $28 = 0, $4 = 0, $46 = 0, $9 = 0, label = 0;
 if (!(SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0)) return;
 L4 : while (1) {
  do if (!(SAFE_HEAP_LOAD(97939 | 0, 1, 0) | 0)) {
   $4 = SAFE_HEAP_LOAD(25113 * 4 | 0, 4, 0) | 0 | 0;
   if (($4 | 0) == 14) {
    if (!((_IsFading() | 0) << 24 >> 24)) break;
    $9 = SAFE_HEAP_LOAD(25113 * 4 | 0, 4, 0) | 0 | 0;
   } else $9 = $4;
   if (($9 | 0) == 13) {
    if (!((_IsFading() | 0) << 24 >> 24)) break;
    $13 = SAFE_HEAP_LOAD(25113 * 4 | 0, 4, 0) | 0 | 0;
   } else $13 = $9;
   if (($13 | 0) == 15) {
    if (!((_IsFading() | 0) << 24 >> 24)) break;
    $17 = SAFE_HEAP_LOAD(25113 * 4 | 0, 4, 0) | 0 | 0;
   } else $17 = $13;
   if (($17 | 0) == 20 & (SAFE_HEAP_LOAD(25112 * 4 | 0, 4, 0) | 0 | 0) != 4) {
    if (!((_IsFading() | 0) << 24 >> 24)) break;
    $23 = SAFE_HEAP_LOAD(25113 * 4 | 0, 4, 0) | 0 | 0;
   } else $23 = $17;
   if (($23 | 0) != 23) {
    label = 19;
    break L4;
   }
   if ((_IsEmoting() | 0) << 24 >> 24) {
    label = 19;
    break L4;
   }
  } while (0);
  SAFE_HEAP_STORE(101051 | 0, 0 | 0, 1);
  SAFE_HEAP_STORE(97939 | 0, 1 | 0, 1);
  SAFE_HEAP_STORE(8192 | 0, 4 | 0, 1);
  $26 = SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0;
  $28 = SAFE_HEAP_LOAD(52880 + $26 >> 0 | 0, 1, 0) | 0 | 0;
  SAFE_HEAP_STORE(101049 | 0, SAFE_HEAP_LOAD(52880 + ($26 + 1) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(101050 | 0, SAFE_HEAP_LOAD(52880 + ($26 + 2) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(101055 | 0, SAFE_HEAP_LOAD(52880 + ($26 + 3) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(101056 | 0, SAFE_HEAP_LOAD(52880 + ($26 + 4) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(101057 | 0, SAFE_HEAP_LOAD(52880 + ($26 + 5) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
  SAFE_HEAP_STORE(8192 | 0, 11 | 0, 1);
  $46 = SAFE_HEAP_LOAD(16 + (($28 & 255) << 2) | 0, 4, 0) | 0 | 0;
  SAFE_HEAP_STORE(25113 * 4 | 0, $46 | 0, 4);
  FUNCTION_TABLE_v[(SAFE_FT_MASK($46 | 0, 31 | 0) | 0) & 31]();
  if ((SAFE_HEAP_LOAD(101051 | 0, 1, 0) | 0 | 0) == 0 | (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) == 0) {
   label = 19;
   break;
  }
 }
 if ((label | 0) == 19) return;
}

function _vfprintf($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$0 = 0, $$1 = 0, $13 = 0, $14 = 0, $19 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $28 = 0, $29 = 0, $3 = 0, $35 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $spec$select = 0, dest = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(224);
 $3 = sp + 208 | 0;
 $4 = sp + 160 | 0;
 $5 = sp + 80 | 0;
 $6 = sp;
 dest = $4;
 stop = dest + 40 | 0;
 do {
  SAFE_HEAP_STORE(dest | 0, 0 | 0, 4);
  dest = dest + 4 | 0;
 } while ((dest | 0) < (stop | 0));
 SAFE_HEAP_STORE($3 | 0, SAFE_HEAP_LOAD($2 | 0, 4, 0) | 0 | 0, 4);
 if ((_printf_core(0, $1, $3, $5, $4) | 0) < 0) $$0 = -1; else {
  if ((SAFE_HEAP_LOAD($0 + 76 | 0, 4, 0) | 0 | 0) > -1) $40 = ___lockfile($0) | 0; else $40 = 0;
  $13 = SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0 | 0;
  $14 = $13 & 32;
  if ((SAFE_HEAP_LOAD($0 + 74 >> 0 | 0, 1, 0) | 0 | 0) < 1) SAFE_HEAP_STORE($0 | 0, $13 & -33 | 0, 4);
  $19 = $0 + 48 | 0;
  if (!(SAFE_HEAP_LOAD($19 | 0, 4, 0) | 0)) {
   $23 = $0 + 44 | 0;
   $24 = SAFE_HEAP_LOAD($23 | 0, 4, 0) | 0 | 0;
   SAFE_HEAP_STORE($23 | 0, $6 | 0, 4);
   $25 = $0 + 28 | 0;
   SAFE_HEAP_STORE($25 | 0, $6 | 0, 4);
   $26 = $0 + 20 | 0;
   SAFE_HEAP_STORE($26 | 0, $6 | 0, 4);
   SAFE_HEAP_STORE($19 | 0, 80 | 0, 4);
   $28 = $0 + 16 | 0;
   SAFE_HEAP_STORE($28 | 0, $6 + 80 | 0, 4);
   $29 = _printf_core($0, $1, $3, $5, $4) | 0;
   if (!$24) $$1 = $29; else {
    FUNCTION_TABLE_iiii[(SAFE_FT_MASK(SAFE_HEAP_LOAD($0 + 36 | 0, 4, 0) | 0 | 0, 3 | 0) | 0) & 3]($0, 0, 0) | 0;
    $spec$select = (SAFE_HEAP_LOAD($26 | 0, 4, 0) | 0 | 0) == 0 ? -1 : $29;
    SAFE_HEAP_STORE($23 | 0, $24 | 0, 4);
    SAFE_HEAP_STORE($19 | 0, 0 | 0, 4);
    SAFE_HEAP_STORE($28 | 0, 0 | 0, 4);
    SAFE_HEAP_STORE($25 | 0, 0 | 0, 4);
    SAFE_HEAP_STORE($26 | 0, 0 | 0, 4);
    $$1 = $spec$select;
   }
  } else $$1 = _printf_core($0, $1, $3, $5, $4) | 0;
  $35 = SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0 | 0;
  SAFE_HEAP_STORE($0 | 0, $35 | $14 | 0, 4);
  if ($40 | 0) ___unlockfile($0);
  $$0 = ($35 & 32 | 0) == 0 ? $$1 : -1;
 }
 STACKTOP = sp;
 return $$0 | 0;
}

function _LogoUpdate_b() {
 var $$sink = 0, $$sink2 = 0, $13 = 0, $25 = 0, $4 = 0, $8 = 0;
 switch ((SAFE_HEAP_LOAD(24389 * 4 | 0, 4, 0) | 0) & 3) {
 case 1:
  {
   if (!((SAFE_HEAP_LOAD(101054 | 0, 1, 0) | 0) & 7)) {
    $4 = SAFE_HEAP_LOAD(101085 | 0, 1, 0) | 0 | 0;
    SAFE_HEAP_STORE(101085 | 0, $4 + 1 << 24 >> 24 | 0, 1);
    if (($4 & 255) < 4) {
     $$sink = -2139095040 >>> (($4 & 255) << 3) & 255;
     $$sink2 = $4 << 7 & 255;
     $25 = $4 << 7 & 255;
    } else {
     SAFE_HEAP_STORE(101085 | 0, 1 | 0, 1);
     $$sink = 0;
     $$sink2 = 0;
     $25 = 0;
    }
    SAFE_HEAP_STORE(101086 | 0, $$sink2 | 0, 1);
    SAFE_HEAP_STORE(101087 | 0, $$sink | 0, 1);
    $8 = (SAFE_HEAP_LOAD(101088 | 0, 1, 0) | 0 | 0) + -1 << 24 >> 24;
    SAFE_HEAP_STORE(101088 | 0, $8 | 0, 1);
    if (!($8 << 24 >> 24)) {
     _display_off();
     SAFE_HEAP_STORE(101088 | 0, 20 | 0, 1);
     SAFE_HEAP_STORE(24389 * 4 | 0, 2 | 0, 4);
     _set_bkg_data(0, 105, 7504);
     _set_bkg_tiles(0, 0, 20, 18, 8032);
     SAFE_HEAP_STORE(101086 | 0, 0 | 0, 1);
     SAFE_HEAP_STORE(101087 | 0, 32 | 0, 1);
     SAFE_HEAP_STORE(65347 | 0, 0 | 0, 1);
     SAFE_HEAP_STORE(65346 | 0, 0 | 0, 1);
     SAFE_HEAP_STORE(65354 | 0, SAFE_HEAP_LOAD(101087 | 0, 1, 0) | 0 | 0 | 0, 1);
     SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | -128 | 0, 1);
     return;
    } else $13 = $25;
   } else $13 = SAFE_HEAP_LOAD(101086 | 0, 1, 0) | 0 | 0;
   SAFE_HEAP_STORE(65347 | 0, $13 | 0, 1);
   SAFE_HEAP_STORE(65346 | 0, SAFE_HEAP_LOAD(101087 | 0, 1, 0) | 0 | 0 | 0, 1);
   return;
  }
 case 2:
  {
   if (!((SAFE_HEAP_LOAD(101054 | 0, 1, 0) | 0) & 1)) SAFE_HEAP_STORE(101087 | 0, (SAFE_HEAP_LOAD(101087 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
   SAFE_HEAP_STORE(65355 | 0, 7 | 0, 1);
   SAFE_HEAP_STORE(65354 | 0, SAFE_HEAP_LOAD(101087 | 0, 1, 0) | 0 | 0 | 0, 1);
   if (!((SAFE_HEAP_LOAD(101087 | 0, 1, 1) | 0 | 0) > 144 & (SAFE_HEAP_LOAD(101089 | 0, 1, 0) | 0 | 0) == 0)) return;
   SAFE_HEAP_STORE(101089 | 0, 1 | 0, 1);
   _FadeSetSpeed(4);
   _FadeOut();
   SAFE_HEAP_STORE(24388 * 4 | 0, 1 | 0, 4);
   return;
  }
 default:
  return;
 }
}

function ___stpcpy($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $$0$lcssa = 0, $$025$lcssa = 0, $$02536 = 0, $$026$lcssa = 0, $$02642 = 0, $$027$lcssa = 0, $$02741 = 0, $$030 = 0, $$037 = 0, $$1 = 0, $$128 = 0, $$22934 = 0, $$235 = 0, $11 = 0, $12 = 0, $16 = 0, $2 = 0, $22 = 0, $23 = 0, $24 = 0, $31 = 0, $34 = 0, $35 = 0, $9 = 0, label = 0;
 $2 = $1;
 L1 : do if (!(($2 ^ $0) & 3)) {
  if (!($2 & 3)) {
   $$026$lcssa = $1;
   $$027$lcssa = $0;
  } else {
   $$02642 = $1;
   $$02741 = $0;
   while (1) {
    $9 = SAFE_HEAP_LOAD($$02642 >> 0 | 0, 1, 0) | 0 | 0;
    SAFE_HEAP_STORE($$02741 >> 0 | 0, $9 | 0, 1);
    if (!($9 << 24 >> 24)) {
     $$030 = $$02741;
     break L1;
    }
    $11 = $$02642 + 1 | 0;
    $12 = $$02741 + 1 | 0;
    if (!($11 & 3)) {
     $$026$lcssa = $11;
     $$027$lcssa = $12;
     break;
    } else {
     $$02642 = $11;
     $$02741 = $12;
    }
   }
  }
  $16 = SAFE_HEAP_LOAD($$026$lcssa | 0, 4, 0) | 0 | 0;
  if (!(($16 & -2139062144 ^ -2139062144) & $16 + -16843009)) {
   $$02536 = $$027$lcssa;
   $$037 = $$026$lcssa;
   $24 = $16;
   while (1) {
    $22 = $$037 + 4 | 0;
    $23 = $$02536 + 4 | 0;
    SAFE_HEAP_STORE($$02536 | 0, $24 | 0, 4);
    $24 = SAFE_HEAP_LOAD($22 | 0, 4, 0) | 0 | 0;
    if (($24 & -2139062144 ^ -2139062144) & $24 + -16843009 | 0) {
     $$0$lcssa = $22;
     $$025$lcssa = $23;
     break;
    } else {
     $$02536 = $23;
     $$037 = $22;
    }
   }
  } else {
   $$0$lcssa = $$026$lcssa;
   $$025$lcssa = $$027$lcssa;
  }
  $$1 = $$0$lcssa;
  $$128 = $$025$lcssa;
  label = 10;
 } else {
  $$1 = $1;
  $$128 = $0;
  label = 10;
 } while (0);
 if ((label | 0) == 10) {
  $31 = SAFE_HEAP_LOAD($$1 >> 0 | 0, 1, 0) | 0 | 0;
  SAFE_HEAP_STORE($$128 >> 0 | 0, $31 | 0, 1);
  if (!($31 << 24 >> 24)) $$030 = $$128; else {
   $$22934 = $$128;
   $$235 = $$1;
   while (1) {
    $$235 = $$235 + 1 | 0;
    $34 = $$22934 + 1 | 0;
    $35 = SAFE_HEAP_LOAD($$235 >> 0 | 0, 1, 0) | 0 | 0;
    SAFE_HEAP_STORE($34 >> 0 | 0, $35 | 0, 1);
    if (!($35 << 24 >> 24)) {
     $$030 = $34;
     break;
    } else $$22934 = $34;
   }
  }
 }
 return $$030 | 0;
}

function ___mo_lookup($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$090 = 0, $$094 = 0, $$4 = 0, $10 = 0, $13 = 0, $17 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $31 = 0, $35 = 0, $4 = 0, $44 = 0, $46 = 0, $49 = 0, $53 = 0, $63 = 0, $7 = 0;
 $4 = (SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0 | 0) + 1794895138 | 0;
 $7 = _swapc(SAFE_HEAP_LOAD($0 + 8 | 0, 4, 0) | 0 | 0, $4) | 0;
 $10 = _swapc(SAFE_HEAP_LOAD($0 + 12 | 0, 4, 0) | 0 | 0, $4) | 0;
 $13 = _swapc(SAFE_HEAP_LOAD($0 + 16 | 0, 4, 0) | 0 | 0, $4) | 0;
 L1 : do if ($7 >>> 0 < $1 >>> 2 >>> 0) {
  $17 = $1 - ($7 << 2) | 0;
  if ($10 >>> 0 < $17 >>> 0 & $13 >>> 0 < $17 >>> 0) if (!(($13 | $10) & 3)) {
   $23 = $10 >>> 2;
   $24 = $13 >>> 2;
   $$090 = 0;
   $$094 = $7;
   while (1) {
    $25 = $$094 >>> 1;
    $26 = $$090 + $25 | 0;
    $27 = $26 << 1;
    $28 = $27 + $23 | 0;
    $31 = _swapc(SAFE_HEAP_LOAD($0 + ($28 << 2) | 0, 4, 0) | 0 | 0, $4) | 0;
    $35 = _swapc(SAFE_HEAP_LOAD($0 + ($28 + 1 << 2) | 0, 4, 0) | 0 | 0, $4) | 0;
    if (!($35 >>> 0 < $1 >>> 0 & $31 >>> 0 < ($1 - $35 | 0) >>> 0)) {
     $$4 = 0;
     break L1;
    }
    if (SAFE_HEAP_LOAD($0 + ($35 + $31) >> 0 | 0, 1, 0) | 0 | 0) {
     $$4 = 0;
     break L1;
    }
    $44 = _strcmp($2, $0 + $35 | 0) | 0;
    if (!$44) break;
    $63 = ($44 | 0) < 0;
    if (($$094 | 0) == 1) {
     $$4 = 0;
     break L1;
    }
    $$090 = $63 ? $$090 : $26;
    $$094 = $63 ? $25 : $$094 - $25 | 0;
   }
   $46 = $27 + $24 | 0;
   $49 = _swapc(SAFE_HEAP_LOAD($0 + ($46 << 2) | 0, 4, 0) | 0 | 0, $4) | 0;
   $53 = _swapc(SAFE_HEAP_LOAD($0 + ($46 + 1 << 2) | 0, 4, 0) | 0 | 0, $4) | 0;
   if ($53 >>> 0 < $1 >>> 0 & $49 >>> 0 < ($1 - $53 | 0) >>> 0) $$4 = (SAFE_HEAP_LOAD($0 + ($53 + $49) >> 0 | 0, 1, 0) | 0 | 0) == 0 ? $0 + $53 | 0 : 0; else $$4 = 0;
  } else $$4 = 0; else $$4 = 0;
 } else $$4 = 0; while (0);
 return $$4 | 0;
}

function _UIDrawFrame_b($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $$03844 = 0, $$03844$us = 0, $$040$us = 0, $$139 = 0, $$pre$phi50Z2D = 0, $12 = 0, $13 = 0, $15 = 0, $20 = 0, $22 = 0, $4 = 0, $7 = 0, $8 = 0, $9 = 0;
 _set_win_tiles($0 | 0, $1 | 0, 1, 1, 98393);
 $4 = $1 & 255;
 $7 = $4 + -1 + ($3 & 255) | 0;
 $8 = $7 & 255;
 _set_win_tiles($0 | 0, $8 | 0, 1, 1, 98394);
 $9 = $0 & 255;
 $12 = $9 + -1 + ($2 & 255) | 0;
 $13 = $12 & 255;
 _set_win_tiles($13 | 0, $1 | 0, 1, 1, 98395);
 _set_win_tiles($13 | 0, $8 | 0, 1, 1, 98396);
 $15 = $9 + 1 & 255;
 L1 : do if (($12 | 0) > ($0 + 1 & 255 | 0)) {
  $20 = $4 + 1 & 255;
  $22 = $1 + 1 & 255;
  if (($7 | 0) <= ($22 | 0)) {
   $$03844 = $15;
   while (1) {
    _set_win_tiles($$03844 | 0, $1 | 0, 1, 1, 98397);
    _set_win_tiles($$03844 | 0, $8 | 0, 1, 1, 98398);
    $$03844 = $$03844 + 1 << 24 >> 24;
    if (($12 | 0) <= ($$03844 & 255 | 0)) {
     $$pre$phi50Z2D = $22;
     break L1;
    }
   }
  }
  $$03844$us = $15;
  do {
   _set_win_tiles($$03844$us | 0, $1 | 0, 1, 1, 98397);
   _set_win_tiles($$03844$us | 0, $8 | 0, 1, 1, 98398);
   $$040$us = $20;
   do {
    _set_win_tiles($$03844$us | 0, $$040$us | 0, 1, 1, 98401);
    $$040$us = $$040$us + 1 << 24 >> 24;
   } while (($7 | 0) > ($$040$us & 255 | 0));
   $$03844$us = $$03844$us + 1 << 24 >> 24;
  } while (($12 | 0) > ($$03844$us & 255 | 0));
  $$pre$phi50Z2D = $22;
 } else $$pre$phi50Z2D = $1 + 1 & 255; while (0);
 if (($7 | 0) <= ($$pre$phi50Z2D | 0)) return;
 $$139 = $4 + 1 & 255;
 do {
  _set_win_tiles($0 | 0, $$139 | 0, 1, 1, 98399);
  _set_win_tiles($13 | 0, $$139 | 0, 1, 1, 98400);
  $$139 = $$139 + 1 << 24 >> 24;
 } while (($7 | 0) > ($$139 & 255 | 0));
 return;
}

function ___fwritex($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$03846 = 0, $$1 = 0, $$139 = 0, $$141 = 0, $$143 = 0, $10 = 0, $12 = 0, $14 = 0, $23 = 0, $29 = 0, $3 = 0, $32 = 0, $4 = 0, $9 = 0, label = 0;
 $3 = $2 + 16 | 0;
 $4 = SAFE_HEAP_LOAD($3 | 0, 4, 0) | 0 | 0;
 if (!$4) if (!(___towrite($2) | 0)) {
  $12 = SAFE_HEAP_LOAD($3 | 0, 4, 0) | 0 | 0;
  label = 5;
 } else $$1 = 0; else {
  $12 = $4;
  label = 5;
 }
 L5 : do if ((label | 0) == 5) {
  $9 = $2 + 20 | 0;
  $10 = SAFE_HEAP_LOAD($9 | 0, 4, 0) | 0 | 0;
  $14 = $10;
  if (($12 - $10 | 0) >>> 0 < $1 >>> 0) {
   $$1 = FUNCTION_TABLE_iiii[(SAFE_FT_MASK(SAFE_HEAP_LOAD($2 + 36 | 0, 4, 0) | 0 | 0, 3 | 0) | 0) & 3]($2, $0, $1) | 0;
   break;
  }
  L10 : do if ((SAFE_HEAP_LOAD($2 + 75 >> 0 | 0, 1, 0) | 0 | 0) < 0 | ($1 | 0) == 0) {
   $$139 = 0;
   $$141 = $0;
   $$143 = $1;
   $32 = $14;
  } else {
   $$03846 = $1;
   while (1) {
    $23 = $$03846 + -1 | 0;
    if ((SAFE_HEAP_LOAD($0 + $23 >> 0 | 0, 1, 0) | 0 | 0) == 10) break;
    if (!$23) {
     $$139 = 0;
     $$141 = $0;
     $$143 = $1;
     $32 = $14;
     break L10;
    } else $$03846 = $23;
   }
   $29 = FUNCTION_TABLE_iiii[(SAFE_FT_MASK(SAFE_HEAP_LOAD($2 + 36 | 0, 4, 0) | 0 | 0, 3 | 0) | 0) & 3]($2, $0, $$03846) | 0;
   if ($29 >>> 0 < $$03846 >>> 0) {
    $$1 = $29;
    break L5;
   }
   $$139 = $$03846;
   $$141 = $0 + $$03846 | 0;
   $$143 = $1 - $$03846 | 0;
   $32 = SAFE_HEAP_LOAD($9 | 0, 4, 0) | 0 | 0;
  } while (0);
  _memcpy($32 | 0, $$141 | 0, $$143 | 0) | 0;
  SAFE_HEAP_STORE($9 | 0, (SAFE_HEAP_LOAD($9 | 0, 4, 0) | 0 | 0) + $$143 | 0, 4);
  $$1 = $$139 + $$143 | 0;
 } while (0);
 return $$1 | 0;
}

function _main() {
 var $10 = 0, $13 = 0, $16 = 0, $17 = 0, $4 = 0, $9 = 0;
 SAFE_HEAP_STORE(65344 | 0, 103 | 0, 1);
 _set_interrupts(3);
 SAFE_HEAP_STORE(65345 | 0, 69 | 0, 1);
 SAFE_HEAP_STORE(65351 | 0, -28 | 0, 1);
 SAFE_HEAP_STORE(65352 | 0, -46 | 0, 1);
 SAFE_HEAP_STORE(65355 | 0, 7 | 0, 1);
 SAFE_HEAP_STORE(65354 | 0, 96 | 0, 1);
 SAFE_HEAP_STORE(8192 | 0, 3 | 0, 1);
 SAFE_HEAP_STORE(98960 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(98965 | 0, 1 | 0, 1);
 $4 = ((SAFE_HEAP_LOAD(101118 | 0, 1, 1) | 0 | 0) << 3) + 8 & 255;
 SAFE_HEAP_STORE(98961 | 0, $4 | 0, 1);
 SAFE_HEAP_STORE(101171 | 0, $4 | 0, 1);
 $9 = ((SAFE_HEAP_LOAD(98592 | 0, 1, 1) | 0 | 0) << 3) + 8 & 255;
 SAFE_HEAP_STORE(98962 | 0, $9 | 0, 1);
 SAFE_HEAP_STORE(101172 | 0, $9 | 0, 1);
 $10 = SAFE_HEAP_LOAD(98593 | 0, 1, 0) | 0 | 0;
 $13 = $10 << 24 >> 24 == 2 ? -1 : $10 << 24 >> 24 == 4 & 1;
 SAFE_HEAP_STORE(98963 | 0, $13 | 0, 1);
 SAFE_HEAP_STORE(101173 | 0, $13 | 0, 1);
 $16 = $10 << 24 >> 24 == 8 ? -1 : $10 << 24 >> 24 == 1 & 1;
 SAFE_HEAP_STORE(98964 | 0, $16 | 0, 1);
 SAFE_HEAP_STORE(101174 | 0, $16 | 0, 1);
 SAFE_HEAP_STORE(98968 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(24744 * 4 | 0, 2 | 0, 4);
 SAFE_HEAP_STORE(98966 | 0, 1 | 0, 1);
 $17 = SAFE_HEAP_LOAD(98592 | 0, 1, 0) | 0 | 0;
 SAFE_HEAP_STORE(101044 | 0, $17 | 0, 1);
 SAFE_HEAP_STORE(101079 | 0, $17 | 0, 1);
 _UIInit();
 SAFE_HEAP_STORE(25111 * 4 | 0, 26 | 0, 4);
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | -128 | 0, 1);
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | 2 | 0, 1);
 _FadeInit();
 _emscripten_set_main_loop(27, 60, 1);
 return 0;
}

function _memset(ptr, value, num) {
 ptr = ptr | 0;
 value = value | 0;
 num = num | 0;
 var end = 0, aligned_end = 0, block_aligned_end = 0, value4 = 0;
 end = ptr + num | 0;
 value = value & 255;
 if ((num | 0) >= 67) {
  while (ptr & 3) {
   SAFE_HEAP_STORE(ptr | 0, value | 0, 1);
   ptr = ptr + 1 | 0;
  }
  aligned_end = end & -4 | 0;
  block_aligned_end = aligned_end - 64 | 0;
  value4 = value | value << 8 | value << 16 | value << 24;
  while ((ptr | 0) <= (block_aligned_end | 0)) {
   SAFE_HEAP_STORE(ptr | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 4 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 8 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 12 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 16 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 20 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 24 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 28 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 32 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 36 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 40 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 44 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 48 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 52 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 56 | 0, value4 | 0, 4);
   SAFE_HEAP_STORE(ptr + 60 | 0, value4 | 0, 4);
   ptr = ptr + 64 | 0;
  }
  while ((ptr | 0) < (aligned_end | 0)) {
   SAFE_HEAP_STORE(ptr | 0, value4 | 0, 4);
   ptr = ptr + 4 | 0;
  }
 }
 while ((ptr | 0) < (end | 0)) {
  SAFE_HEAP_STORE(ptr | 0, value | 0, 1);
  ptr = ptr + 1 | 0;
 }
 return end - num | 0;
}

function _wcrtomb($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$0 = 0;
 do if (!$0) $$0 = 1; else {
  if ($1 >>> 0 < 128) {
   SAFE_HEAP_STORE($0 >> 0 | 0, $1 | 0, 1);
   $$0 = 1;
   break;
  }
  if (!(SAFE_HEAP_LOAD(SAFE_HEAP_LOAD((___pthread_self_907() | 0) + 188 | 0, 4, 0) | 0 | 0, 4, 0) | 0)) if (($1 & -128 | 0) == 57216) {
   SAFE_HEAP_STORE($0 >> 0 | 0, $1 | 0, 1);
   $$0 = 1;
   break;
  } else {
   SAFE_HEAP_STORE(___errno_location() | 0 | 0, 84 | 0, 4);
   $$0 = -1;
   break;
  }
  if ($1 >>> 0 < 2048) {
   SAFE_HEAP_STORE($0 >> 0 | 0, $1 >>> 6 | 192 | 0, 1);
   SAFE_HEAP_STORE($0 + 1 >> 0 | 0, $1 & 63 | 128 | 0, 1);
   $$0 = 2;
   break;
  }
  if ($1 >>> 0 < 55296 | ($1 & -8192 | 0) == 57344) {
   SAFE_HEAP_STORE($0 >> 0 | 0, $1 >>> 12 | 224 | 0, 1);
   SAFE_HEAP_STORE($0 + 1 >> 0 | 0, $1 >>> 6 & 63 | 128 | 0, 1);
   SAFE_HEAP_STORE($0 + 2 >> 0 | 0, $1 & 63 | 128 | 0, 1);
   $$0 = 3;
   break;
  }
  if (($1 + -65536 | 0) >>> 0 < 1048576) {
   SAFE_HEAP_STORE($0 >> 0 | 0, $1 >>> 18 | 240 | 0, 1);
   SAFE_HEAP_STORE($0 + 1 >> 0 | 0, $1 >>> 12 & 63 | 128 | 0, 1);
   SAFE_HEAP_STORE($0 + 2 >> 0 | 0, $1 >>> 6 & 63 | 128 | 0, 1);
   SAFE_HEAP_STORE($0 + 3 >> 0 | 0, $1 & 63 | 128 | 0, 1);
   $$0 = 4;
   break;
  } else {
   SAFE_HEAP_STORE(___errno_location() | 0 | 0, 84 | 0, 4);
   $$0 = -1;
   break;
  }
 } while (0);
 return $$0 | 0;
}

function _fmt_u($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$010$lcssa$off0 = 0, $$012 = 0, $$09$lcssa = 0, $$0914 = 0, $$1$lcssa = 0, $$111 = 0, $12 = 0, $14 = 0, $30 = 0, $8 = 0, $9 = 0, $8$looptemp = 0, $9$looptemp = 0, $$012$looptemp = 0;
 if ($1 >>> 0 > 0 | ($1 | 0) == 0 & $0 >>> 0 > 4294967295) {
  $$0914 = $2;
  $8 = $0;
  $9 = $1;
  do {
   $8$looptemp = $8;
   $8 = ___udivdi3($8 | 0, $9 | 0, 10, 0) | 0;
   $9$looptemp = $9;
   $9 = tempRet0;
   $12 = ___muldi3($8 | 0, $9 | 0, 10, 0) | 0;
   $14 = _i64Subtract($8$looptemp | 0, $9$looptemp | 0, $12 | 0, tempRet0 | 0) | 0;
   $$0914 = $$0914 + -1 | 0;
   SAFE_HEAP_STORE($$0914 >> 0 | 0, $14 & 255 | 48 | 0, 1);
  } while ($9$looptemp >>> 0 > 9 | ($9$looptemp | 0) == 9 & $8$looptemp >>> 0 > 4294967295);
  $$010$lcssa$off0 = $8;
  $$09$lcssa = $$0914;
 } else {
  $$010$lcssa$off0 = $0;
  $$09$lcssa = $2;
 }
 if (!$$010$lcssa$off0) $$1$lcssa = $$09$lcssa; else {
  $$012 = $$010$lcssa$off0;
  $$111 = $$09$lcssa;
  while (1) {
   $$012$looptemp = $$012;
   $$012 = ($$012 >>> 0) / 10 | 0;
   $30 = $$111 + -1 | 0;
   SAFE_HEAP_STORE($30 >> 0 | 0, $$012$looptemp - ($$012 * 10 | 0) | 48 | 0, 1);
   if ($$012$looptemp >>> 0 < 10) {
    $$1$lcssa = $30;
    break;
   } else $$111 = $30;
  }
 }
 return $$1$lcssa | 0;
}

function _fflush($0) {
 $0 = $0 | 0;
 var $$0 = 0, $$02325 = 0, $$02327 = 0, $$024$lcssa = 0, $$02426 = 0, $$1 = 0, $26 = 0, $29 = 0, $7 = 0, $phitmp = 0;
 do if (!$0) {
  if (!(SAFE_HEAP_LOAD(24422 * 4 | 0, 4, 0) | 0)) $29 = 0; else $29 = _fflush(SAFE_HEAP_LOAD(24422 * 4 | 0, 4, 0) | 0 | 0) | 0;
  $$02325 = SAFE_HEAP_LOAD(___ofl_lock() | 0 | 0, 4, 0) | 0 | 0;
  if (!$$02325) $$024$lcssa = $29; else {
   $$02327 = $$02325;
   $$02426 = $29;
   while (1) {
    if ((SAFE_HEAP_LOAD($$02327 + 76 | 0, 4, 0) | 0 | 0) > -1) $26 = ___lockfile($$02327) | 0; else $26 = 0;
    if ((SAFE_HEAP_LOAD($$02327 + 20 | 0, 4, 0) | 0 | 0) >>> 0 > (SAFE_HEAP_LOAD($$02327 + 28 | 0, 4, 0) | 0 | 0) >>> 0) $$1 = ___fflush_unlocked($$02327) | 0 | $$02426; else $$1 = $$02426;
    if ($26 | 0) ___unlockfile($$02327);
    $$02327 = SAFE_HEAP_LOAD($$02327 + 56 | 0, 4, 0) | 0 | 0;
    if (!$$02327) {
     $$024$lcssa = $$1;
     break;
    } else $$02426 = $$1;
   }
  }
  ___ofl_unlock();
  $$0 = $$024$lcssa;
 } else {
  if ((SAFE_HEAP_LOAD($0 + 76 | 0, 4, 0) | 0 | 0) <= -1) {
   $$0 = ___fflush_unlocked($0) | 0;
   break;
  }
  $phitmp = (___lockfile($0) | 0) == 0;
  $7 = ___fflush_unlocked($0) | 0;
  if ($phitmp) $$0 = $7; else {
   ___unlockfile($0);
   $$0 = $7;
  }
 } while (0);
 return $$0 | 0;
}

function _script_cmd_actor_pos() {
 var $12 = 0, $18 = 0, $3 = 0, $5 = 0, $7 = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(32);
 $vararg_buffer3 = sp + 16 | 0;
 $vararg_buffer = sp;
 $3 = SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0;
 $5 = SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0 | 0;
 SAFE_HEAP_STORE($vararg_buffer | 0, SAFE_HEAP_LOAD(101059 | 0, 1, 1) | 0 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 4 | 0, $3 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 8 | 0, $5 | 0, 4);
 _printf(98323, $vararg_buffer) | 0;
 $7 = SAFE_HEAP_LOAD(101059 | 0, 1, 1) | 0 | 0;
 $12 = ((SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) << 3) + 8 | 0;
 SAFE_HEAP_STORE(98960 + ($7 * 20 | 0) + 1 >> 0 | 0, $12 | 0, 1);
 $18 = ((SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0 | 0) << 3) + 8 | 0;
 SAFE_HEAP_STORE(98960 + ($7 * 20 | 0) + 2 >> 0 | 0, $18 | 0, 1);
 SAFE_HEAP_STORE($vararg_buffer3 | 0, $12 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer3 + 4 | 0, $18 | 0, 4);
 _printf(98348, $vararg_buffer3) | 0;
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 3 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 STACKTOP = sp;
 return;
}

function _PongInit_b() {
 _display_off();
 _SpritesReset();
 SAFE_HEAP_STORE(65355 | 0, -90 | 0, 1);
 SAFE_HEAP_STORE(65354 | 0, -113 | 0, 1);
 SAFE_HEAP_STORE(101090 | 0, 72 | 0, 1);
 SAFE_HEAP_STORE(101091 | 0, 72 | 0, 1);
 SAFE_HEAP_STORE(101092 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101093 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101094 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101095 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101096 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101097 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101098 | 0, 0 | 0, 1);
 _set_bkg_data(0, 7, 8768);
 _set_bkg_data(7, 10, 8880);
 _set_bkg_tiles(0, 0, 20, 18, 8400);
 _set_bkg_tiles(4, 2, 1, 1, 98420);
 _set_bkg_tiles(15, 2, 1, 1, 98420);
 _set_sprite_data(0, 2, 9040);
 _set_sprite_data(2, 2, 9072);
 _set_sprite_tile(0, 2);
 _set_sprite_tile(1, 0);
 _set_sprite_tile(2, 0);
 _set_sprite_tile(3, 0);
 _set_sprite_tile(4, 0);
 _move_sprite(0, 84, 40);
 _move_sprite(1, 24, 56);
 _move_sprite(2, 24, 72);
 _move_sprite(3, -112, 56);
 _move_sprite(4, -112, 72);
 SAFE_HEAP_STORE(101099 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101100 | 0, 0 | 0, 1);
 _FadeIn();
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | -128 | 0, 1);
 return;
}

function ___overflow($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $$0 = 0, $10 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16);
 $2 = sp;
 $3 = $1 & 255;
 SAFE_HEAP_STORE($2 >> 0 | 0, $3 | 0, 1);
 $4 = $0 + 16 | 0;
 $5 = SAFE_HEAP_LOAD($4 | 0, 4, 0) | 0 | 0;
 if (!$5) if (!(___towrite($0) | 0)) {
  $12 = SAFE_HEAP_LOAD($4 | 0, 4, 0) | 0 | 0;
  label = 4;
 } else $$0 = -1; else {
  $12 = $5;
  label = 4;
 }
 do if ((label | 0) == 4) {
  $9 = $0 + 20 | 0;
  $10 = SAFE_HEAP_LOAD($9 | 0, 4, 0) | 0 | 0;
  if ($10 >>> 0 < $12 >>> 0) {
   $13 = $1 & 255;
   if (($13 | 0) != (SAFE_HEAP_LOAD($0 + 75 >> 0 | 0, 1, 0) | 0 | 0)) {
    SAFE_HEAP_STORE($9 | 0, $10 + 1 | 0, 4);
    SAFE_HEAP_STORE($10 >> 0 | 0, $3 | 0, 1);
    $$0 = $13;
    break;
   }
  }
  if ((FUNCTION_TABLE_iiii[(SAFE_FT_MASK(SAFE_HEAP_LOAD($0 + 36 | 0, 4, 0) | 0 | 0, 3 | 0) | 0) & 3]($0, $2, 1) | 0) == 1) $$0 = SAFE_HEAP_LOAD($2 >> 0 | 0, 1, 1) | 0 | 0; else $$0 = -1;
 } while (0);
 STACKTOP = sp;
 return $$0 | 0;
}

function _FadeUpdate() {
 var $11 = 0, $14 = 0, $8 = 0, $9 = 0;
 if (!(SAFE_HEAP_LOAD(101063 | 0, 1, 0) | 0)) return;
 do if (!(((SAFE_HEAP_LOAD(101061 | 0, 1, 0) | 0) & (SAFE_HEAP_LOAD(101062 | 0, 1, 0) | 0)) << 24 >> 24)) {
  $8 = SAFE_HEAP_LOAD(101064 | 0, 1, 0) | 0 | 0;
  if (!(SAFE_HEAP_LOAD(25116 * 4 | 0, 4, 0) | 0)) {
   $9 = $8 + 1 << 24 >> 24;
   SAFE_HEAP_STORE(101064 | 0, $9 | 0, 1);
   if ($9 << 24 >> 24 != 5) {
    $14 = $9;
    break;
   }
   SAFE_HEAP_STORE(101063 | 0, 0 | 0, 1);
   $14 = 5;
   break;
  } else {
   $11 = $8 + -1 << 24 >> 24;
   SAFE_HEAP_STORE(101064 | 0, $11 | 0, 1);
   if ($11 << 24 >> 24) {
    $14 = $11;
    break;
   }
   SAFE_HEAP_STORE(101063 | 0, 0 | 0, 1);
   $14 = 0;
   break;
  }
 } else $14 = SAFE_HEAP_LOAD(101064 | 0, 1, 0) | 0 | 0; while (0);
 SAFE_HEAP_STORE(65352 | 0, SAFE_HEAP_LOAD(98304 + ($14 & 255) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(65351 | 0, SAFE_HEAP_LOAD(98310 + (SAFE_HEAP_LOAD(101064 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(101062 | 0, (SAFE_HEAP_LOAD(101062 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24 | 0, 1);
 return;
}

function _MapUpdate_b() {
 var $10 = 0, $12 = 0, $6 = 0, $8 = 0;
 _MapHandleInput_b();
 if (!((SAFE_HEAP_LOAD(101054 | 0, 1, 0) | 0) & 15)) SAFE_HEAP_STORE(97936 | 0, (SAFE_HEAP_LOAD(97936 | 0, 1, 0) | 0 | 0) == 0 & 1 | 0, 1);
 $6 = SAFE_HEAP_LOAD(101046 | 0, 1, 0) | 0 | 0;
 if ($6 << 24 >> 24) {
  $8 = $6 + -1 << 24 >> 24;
  SAFE_HEAP_STORE(101046 | 0, $8 | 0, 1);
  if (!($8 << 24 >> 24)) SAFE_HEAP_STORE(97939 | 0, 1 | 0, 1);
 }
 _MapUpdateActors_b();
 _UIUpdate();
 $10 = SAFE_HEAP_LOAD(101047 | 0, 1, 0) | 0 | 0;
 if ($10 << 24 >> 24) {
  $12 = $10 + -1 << 24 >> 24;
  SAFE_HEAP_STORE(101047 | 0, $12 | 0, 1);
  SAFE_HEAP_STORE(65347 | 0, (SAFE_HEAP_LOAD(65347 | 0, 1, 1) | 0 | 0) + ($12 & 5) | 0, 1);
  if (!(SAFE_HEAP_LOAD(101047 | 0, 1, 0) | 0)) SAFE_HEAP_STORE(97939 | 0, 1 | 0, 1);
 }
 if ((SAFE_HEAP_LOAD(101044 | 0, 1, 0) | 0 | 0) == (SAFE_HEAP_LOAD(101079 | 0, 1, 0) | 0 | 0)) return;
 if ((_IsFading() | 0) << 24 >> 24) return;
 SAFE_HEAP_STORE(101044 | 0, SAFE_HEAP_LOAD(101079 | 0, 1, 0) | 0 | 0 | 0, 1);
 _LoadMap();
 return;
}

function _strlen($0) {
 $0 = $0 | 0;
 var $$0 = 0, $$015$lcssa = 0, $$01518 = 0, $$1$lcssa = 0, $$pn = 0, $$pn29 = 0, $1 = 0, $10 = 0, $19 = 0, $22 = 0, $6 = 0, label = 0;
 $1 = $0;
 L1 : do if (!($1 & 3)) {
  $$015$lcssa = $0;
  label = 5;
 } else {
  $$01518 = $0;
  $22 = $1;
  while (1) {
   if (!(SAFE_HEAP_LOAD($$01518 >> 0 | 0, 1, 0) | 0)) {
    $$pn = $22;
    break L1;
   }
   $6 = $$01518 + 1 | 0;
   $22 = $6;
   if (!($22 & 3)) {
    $$015$lcssa = $6;
    label = 5;
    break;
   } else $$01518 = $6;
  }
 } while (0);
 if ((label | 0) == 5) {
  $$0 = $$015$lcssa;
  while (1) {
   $10 = SAFE_HEAP_LOAD($$0 | 0, 4, 0) | 0 | 0;
   if (!(($10 & -2139062144 ^ -2139062144) & $10 + -16843009)) $$0 = $$0 + 4 | 0; else break;
  }
  if (!(($10 & 255) << 24 >> 24)) $$1$lcssa = $$0; else {
   $$pn29 = $$0;
   while (1) {
    $19 = $$pn29 + 1 | 0;
    if (!(SAFE_HEAP_LOAD($19 >> 0 | 0, 1, 0) | 0)) {
     $$1$lcssa = $19;
     break;
    } else $$pn29 = $19;
   }
  }
  $$pn = $$1$lcssa;
 }
 return $$pn - $1 | 0;
}

function ___fflush_unlocked($0) {
 $0 = $0 | 0;
 var $$0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $3 = 0, label = 0;
 $1 = $0 + 20 | 0;
 $3 = $0 + 28 | 0;
 if ((SAFE_HEAP_LOAD($1 | 0, 4, 0) | 0 | 0) >>> 0 > (SAFE_HEAP_LOAD($3 | 0, 4, 0) | 0 | 0) >>> 0) {
  FUNCTION_TABLE_iiii[(SAFE_FT_MASK(SAFE_HEAP_LOAD($0 + 36 | 0, 4, 0) | 0 | 0, 3 | 0) | 0) & 3]($0, 0, 0) | 0;
  if (!(SAFE_HEAP_LOAD($1 | 0, 4, 0) | 0)) $$0 = -1; else label = 3;
 } else label = 3;
 if ((label | 0) == 3) {
  $10 = $0 + 4 | 0;
  $11 = SAFE_HEAP_LOAD($10 | 0, 4, 0) | 0 | 0;
  $12 = $0 + 8 | 0;
  $13 = SAFE_HEAP_LOAD($12 | 0, 4, 0) | 0 | 0;
  if ($11 >>> 0 < $13 >>> 0) FUNCTION_TABLE_iiii[(SAFE_FT_MASK(SAFE_HEAP_LOAD($0 + 40 | 0, 4, 0) | 0 | 0, 3 | 0) | 0) & 3]($0, $11 - $13 | 0, 1) | 0;
  SAFE_HEAP_STORE($0 + 16 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE($3 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE($1 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE($12 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE($10 | 0, 0 | 0, 4);
  $$0 = 0;
 }
 return $$0 | 0;
}

function _frexp($0, $1) {
 $0 = +$0;
 $1 = $1 | 0;
 var $$0 = 0.0, $$016 = 0.0, $2 = 0, $3 = 0, $4 = 0, $9 = 0.0, $storemerge = 0;
 SAFE_HEAP_STORE_D(tempDoublePtr | 0, +$0, 8);
 $2 = SAFE_HEAP_LOAD(tempDoublePtr | 0, 4, 0) | 0 | 0;
 $3 = SAFE_HEAP_LOAD(tempDoublePtr + 4 | 0, 4, 0) | 0 | 0;
 $4 = _bitshift64Lshr($2 | 0, $3 | 0, 52) | 0;
 switch ($4 & 2047) {
 case 0:
  {
   if ($0 != 0.0) {
    $9 = +_frexp($0 * 18446744073709551616.0, $1);
    $$016 = $9;
    $storemerge = (SAFE_HEAP_LOAD($1 | 0, 4, 0) | 0 | 0) + -64 | 0;
   } else {
    $$016 = $0;
    $storemerge = 0;
   }
   SAFE_HEAP_STORE($1 | 0, $storemerge | 0, 4);
   $$0 = $$016;
   break;
  }
 case 2047:
  {
   $$0 = $0;
   break;
  }
 default:
  {
   SAFE_HEAP_STORE($1 | 0, ($4 & 2047) + -1022 | 0, 4);
   SAFE_HEAP_STORE(tempDoublePtr | 0, $2 | 0, 4);
   SAFE_HEAP_STORE(tempDoublePtr + 4 | 0, $3 & -2146435073 | 1071644672 | 0, 4);
   $$0 = +(+SAFE_HEAP_LOAD_D(tempDoublePtr | 0, 8));
  }
 }
 return +$$0;
}

function _script_actor_move_to() {
 var $3 = 0, $5 = 0, $vararg_buffer = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16);
 $vararg_buffer = sp;
 $3 = SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0;
 $5 = SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0 | 0;
 SAFE_HEAP_STORE($vararg_buffer | 0, SAFE_HEAP_LOAD(101059 | 0, 1, 1) | 0 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 4 | 0, $3 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 8 | 0, $5 | 0, 4);
 _printf(98363, $vararg_buffer) | 0;
 SAFE_HEAP_STORE(101058 | 0, SAFE_HEAP_LOAD(101058 | 0, 1, 0) | 0 | -128 | 0, 1);
 SAFE_HEAP_STORE(101167 | 0, ((SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) << 3) + 8 | 0, 1);
 SAFE_HEAP_STORE(101168 | 0, ((SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0 | 0) << 3) + 8 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 3 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 STACKTOP = sp;
 return;
}

function ___strerror_l($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $$012$lcssa = 0, $$01214 = 0, $$016 = 0, $$113 = 0, $$115 = 0, $$115$ph = 0, $6 = 0, label = 0, $$113$looptemp = 0;
 $$016 = 0;
 while (1) {
  if ((SAFE_HEAP_LOAD(95648 + $$016 >> 0 | 0, 1, 1) | 0 | 0) == ($0 | 0)) {
   label = 4;
   break;
  }
  $6 = $$016 + 1 | 0;
  if (($6 | 0) == 87) {
   $$115$ph = 87;
   label = 5;
   break;
  } else $$016 = $6;
 }
 if ((label | 0) == 4) if (!$$016) $$012$lcssa = 95744; else {
  $$115$ph = $$016;
  label = 5;
 }
 if ((label | 0) == 5) {
  $$01214 = 95744;
  $$115 = $$115$ph;
  while (1) {
   $$113 = $$01214;
   do {
    $$113$looptemp = $$113;
    $$113 = $$113 + 1 | 0;
   } while ((SAFE_HEAP_LOAD($$113$looptemp >> 0 | 0, 1, 0) | 0 | 0) != 0);
   $$115 = $$115 + -1 | 0;
   if (!$$115) {
    $$012$lcssa = $$113;
    break;
   } else $$01214 = $$113;
  }
 }
 return ___lctrans($$012$lcssa, SAFE_HEAP_LOAD($1 + 20 | 0, 4, 0) | 0 | 0) | 0;
}

function _MapUpdateEmotionBubble_b() {
 var $$0 = 0, $$0$in = 0, $0 = 0, $17 = 0, $27 = 0, $3 = 0, $9 = 0;
 $0 = SAFE_HEAP_LOAD(101060 | 0, 1, 0) | 0 | 0;
 if (!($0 << 24 >> 24)) {
  _move_sprite(38, 0, 0);
  _move_sprite(39, 0, 0);
  return;
 }
 $3 = SAFE_HEAP_LOAD(97942 | 0, 1, 1) | 0 | 0;
 $9 = (SAFE_HEAP_LOAD(98960 + ($3 * 20 | 0) + 1 >> 0 | 0, 1, 1) | 0 | 0) - (SAFE_HEAP_LOAD(65347 | 0, 1, 1) | 0 | 0) | 0;
 $17 = (SAFE_HEAP_LOAD(98960 + ($3 * 20 | 0) + 2 >> 0 | 0, 1, 1) | 0 | 0) + 240 - (SAFE_HEAP_LOAD(65346 | 0, 1, 1) | 0 | 0) | 0;
 if (($0 & 255) < 15) $$0$in = $17 + (SAFE_HEAP_LOAD(128 + ($0 & 255) >> 0 | 0, 1, 1) | 0 | 0) | 0; else $$0$in = $17;
 $$0 = $$0$in & 255;
 _move_sprite(38, $9 & 255 | 0, $$0 | 0);
 _move_sprite(39, $9 + 8 & 255 | 0, $$0 | 0);
 $27 = (SAFE_HEAP_LOAD(101060 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24;
 SAFE_HEAP_STORE(101060 | 0, (($27 & 255) > 60 ? 0 : $27) | 0, 1);
 return;
}

function _script_load_map() {
 var $11 = 0;
 SAFE_HEAP_STORE(101079 | 0, SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(101171 | 0, ((SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0 | 0) << 3) + 8 | 0, 1);
 SAFE_HEAP_STORE(101172 | 0, ((SAFE_HEAP_LOAD(101055 | 0, 1, 1) | 0 | 0) << 3) + 8 | 0, 1);
 $11 = SAFE_HEAP_LOAD(101056 | 0, 1, 0) | 0 | 0;
 SAFE_HEAP_STORE(101173 | 0, ($11 << 24 >> 24 == 2 ? -1 : $11 << 24 >> 24 == 4 & 1) | 0, 1);
 SAFE_HEAP_STORE(101174 | 0, ($11 << 24 >> 24 == 8 ? -1 : $11 << 24 >> 24 == 1 & 1) | 0, 1);
 SAFE_HEAP_STORE(98965 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 6 | 0, 4);
 SAFE_HEAP_STORE(24388 * 4 | 0, 3 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 _FadeSetSpeed(SAFE_HEAP_LOAD(101057 | 0, 1, 0) | 0 | 0);
 _FadeOut();
 return;
}

function ___stdio_seek($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $10 = 0, $3 = 0, $vararg_buffer = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(32);
 $vararg_buffer = sp;
 $3 = sp + 20 | 0;
 SAFE_HEAP_STORE($vararg_buffer | 0, SAFE_HEAP_LOAD($0 + 60 | 0, 4, 0) | 0 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 4 | 0, 0 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 8 | 0, $1 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 12 | 0, $3 | 0, 4);
 SAFE_HEAP_STORE($vararg_buffer + 16 | 0, $2 | 0, 4);
 if ((___syscall_ret(___syscall140(140, $vararg_buffer | 0) | 0) | 0) < 0) {
  SAFE_HEAP_STORE($3 | 0, -1 | 0, 4);
  $10 = -1;
 } else $10 = SAFE_HEAP_LOAD($3 | 0, 4, 0) | 0 | 0;
 STACKTOP = sp;
 return $10 | 0;
}

function _TitleInit_b() {
 _disable_interrupts();
 _display_off();
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | 4 | 0, 1);
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | 2 | 0, 1);
 _SpritesReset();
 SAFE_HEAP_STORE(65353 | 0, -1 | 0, 1);
 SAFE_HEAP_STORE(65355 | 0, -90 | 0, 1);
 SAFE_HEAP_STORE(65354 | 0, -113 | 0, 1);
 SAFE_HEAP_STORE(65347 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(65346 | 0, 0 | 0, 1);
 _set_win_tiles(0, 0, 20, 20, 4304);
 _set_bkg_data(0, 108, 2752);
 _set_bkg_tiles(0, 0, 32, 18, 3728);
 _set_sprite_data(0, -128, 4304);
 SAFE_HEAP_STORE(101065 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101066 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | -128 | 0, 1);
 _FadeIn();
 return;
}

function _puts($0) {
 $0 = $0 | 0;
 var $1 = 0, $11 = 0, $12 = 0, $19 = 0, $20 = 0;
 $1 = SAFE_HEAP_LOAD(24390 * 4 | 0, 4, 0) | 0 | 0;
 if ((SAFE_HEAP_LOAD($1 + 76 | 0, 4, 0) | 0 | 0) > -1) $19 = ___lockfile($1) | 0; else $19 = 0;
 do if ((_fputs($0, $1) | 0) < 0) $20 = -1; else {
  if ((SAFE_HEAP_LOAD($1 + 75 >> 0 | 0, 1, 0) | 0 | 0) != 10) {
   $11 = $1 + 20 | 0;
   $12 = SAFE_HEAP_LOAD($11 | 0, 4, 0) | 0 | 0;
   if ($12 >>> 0 < (SAFE_HEAP_LOAD($1 + 16 | 0, 4, 0) | 0 | 0) >>> 0) {
    SAFE_HEAP_STORE($11 | 0, $12 + 1 | 0, 4);
    SAFE_HEAP_STORE($12 >> 0 | 0, 10 | 0, 1);
    $20 = 0;
    break;
   }
  }
  $20 = (___overflow($1, 10) | 0) >> 31;
 } while (0);
 if ($19 | 0) ___unlockfile($1);
 return $20 | 0;
}

function ___stdout_write($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $14 = 0, $vararg_buffer = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(32);
 $vararg_buffer = sp;
 SAFE_HEAP_STORE($0 + 36 | 0, 3 | 0, 4);
 if (!((SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0) & 64)) {
  SAFE_HEAP_STORE($vararg_buffer | 0, SAFE_HEAP_LOAD($0 + 60 | 0, 4, 0) | 0 | 0, 4);
  SAFE_HEAP_STORE($vararg_buffer + 4 | 0, 21523 | 0, 4);
  SAFE_HEAP_STORE($vararg_buffer + 8 | 0, sp + 16 | 0, 4);
  if (___syscall54(54, $vararg_buffer | 0) | 0) SAFE_HEAP_STORE($0 + 75 >> 0 | 0, -1 | 0, 1);
 }
 $14 = ___stdio_write($0, $1, $2) | 0;
 STACKTOP = sp;
 return $14 | 0;
}

function _pad_676($0, $1, $2, $3, $4) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 var $$0$lcssa = 0, $$011 = 0, $14 = 0, $5 = 0, $9 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 256 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(256);
 $5 = sp;
 if (($2 | 0) > ($3 | 0) & ($4 & 73728 | 0) == 0) {
  $9 = $2 - $3 | 0;
  _memset($5 | 0, $1 << 24 >> 24 | 0, ($9 >>> 0 < 256 ? $9 : 256) | 0) | 0;
  if ($9 >>> 0 > 255) {
   $14 = $2 - $3 | 0;
   $$011 = $9;
   do {
    _out_670($0, $5, 256);
    $$011 = $$011 + -256 | 0;
   } while ($$011 >>> 0 > 255);
   $$0$lcssa = $14 & 255;
  } else $$0$lcssa = $9;
  _out_670($0, $5, $$0$lcssa);
 }
 STACKTOP = sp;
 return;
}

function _strcmp($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $$011 = 0, $$0710 = 0, $$lcssa = 0, $$lcssa8 = 0, $2 = 0, $3 = 0, $8 = 0, $9 = 0;
 $2 = SAFE_HEAP_LOAD($0 >> 0 | 0, 1, 0) | 0 | 0;
 $3 = SAFE_HEAP_LOAD($1 >> 0 | 0, 1, 0) | 0 | 0;
 if ($2 << 24 >> 24 == 0 ? 1 : $2 << 24 >> 24 != $3 << 24 >> 24) {
  $$lcssa = $3;
  $$lcssa8 = $2;
 } else {
  $$011 = $1;
  $$0710 = $0;
  do {
   $$0710 = $$0710 + 1 | 0;
   $$011 = $$011 + 1 | 0;
   $8 = SAFE_HEAP_LOAD($$0710 >> 0 | 0, 1, 0) | 0 | 0;
   $9 = SAFE_HEAP_LOAD($$011 >> 0 | 0, 1, 0) | 0 | 0;
  } while (!($8 << 24 >> 24 == 0 ? 1 : $8 << 24 >> 24 != $9 << 24 >> 24));
  $$lcssa = $9;
  $$lcssa8 = $8;
 }
 return ($$lcssa8 & 255) - ($$lcssa & 255) | 0;
}

function ___towrite($0) {
 $0 = $0 | 0;
 var $$0 = 0, $1 = 0, $14 = 0, $3 = 0, $7 = 0;
 $1 = $0 + 74 | 0;
 $3 = SAFE_HEAP_LOAD($1 >> 0 | 0, 1, 0) | 0 | 0;
 SAFE_HEAP_STORE($1 >> 0 | 0, $3 + 255 | $3 | 0, 1);
 $7 = SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0 | 0;
 if (!($7 & 8)) {
  SAFE_HEAP_STORE($0 + 8 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE($0 + 4 | 0, 0 | 0, 4);
  $14 = SAFE_HEAP_LOAD($0 + 44 | 0, 4, 0) | 0 | 0;
  SAFE_HEAP_STORE($0 + 28 | 0, $14 | 0, 4);
  SAFE_HEAP_STORE($0 + 20 | 0, $14 | 0, 4);
  SAFE_HEAP_STORE($0 + 16 | 0, $14 + (SAFE_HEAP_LOAD($0 + 48 | 0, 4, 0) | 0 | 0) | 0, 4);
  $$0 = 0;
 } else {
  SAFE_HEAP_STORE($0 | 0, $7 | 32 | 0, 4);
  $$0 = -1;
 }
 return $$0 | 0;
}

function _sbrk(increment) {
 increment = increment | 0;
 var oldDynamicTop = 0, newDynamicTop = 0;
 oldDynamicTop = SAFE_HEAP_LOAD(DYNAMICTOP_PTR | 0, 4, 0) | 0 | 0;
 newDynamicTop = oldDynamicTop + increment | 0;
 if ((increment | 0) > 0 & (newDynamicTop | 0) < (oldDynamicTop | 0) | (newDynamicTop | 0) < 0) {
  abortOnCannotGrowMemory() | 0;
  ___setErrNo(12);
  return -1;
 }
 SAFE_HEAP_STORE(DYNAMICTOP_PTR | 0, newDynamicTop | 0, 4);
 if ((newDynamicTop | 0) > (getTotalMemory() | 0)) if (!(enlargeMemory() | 0)) {
  SAFE_HEAP_STORE(DYNAMICTOP_PTR | 0, oldDynamicTop | 0, 4);
  ___setErrNo(12);
  return -1;
 }
 return oldDynamicTop | 0;
}

function _script_cmd_actor_dir() {
 var $0 = 0, $5 = 0;
 $0 = SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 0;
 $5 = SAFE_HEAP_LOAD(101059 | 0, 1, 1) | 0 | 0;
 SAFE_HEAP_STORE(98960 + ($5 * 20 | 0) + 3 >> 0 | 0, ($0 << 24 >> 24 == 2 ? -1 : $0 << 24 >> 24 == 4 & 1) | 0, 1);
 SAFE_HEAP_STORE(98960 + ($5 * 20 | 0) + 4 >> 0 | 0, ($0 << 24 >> 24 == 8 ? -1 : $0 << 24 >> 24 == 1 & 1) | 0, 1);
 SAFE_HEAP_STORE(98960 + ($5 * 20 | 0) + 5 >> 0 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function _getint_671($0) {
 $0 = $0 | 0;
 var $$0$lcssa = 0, $$04 = 0, $11 = 0, $12 = 0, $7 = 0;
 if (!(_isdigit(SAFE_HEAP_LOAD((SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0) >> 0 | 0, 1, 0) | 0 | 0) | 0)) $$0$lcssa = 0; else {
  $$04 = 0;
  while (1) {
   $7 = SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0 | 0;
   $11 = ($$04 * 10 | 0) + -48 + (SAFE_HEAP_LOAD($7 >> 0 | 0, 1, 0) | 0 | 0) | 0;
   $12 = $7 + 1 | 0;
   SAFE_HEAP_STORE($0 | 0, $12 | 0, 4);
   if (!(_isdigit(SAFE_HEAP_LOAD($12 >> 0 | 0, 1, 0) | 0 | 0) | 0)) {
    $$0$lcssa = $11;
    break;
   } else $$04 = $11;
  }
 }
 return $$0$lcssa | 0;
}

function _fwrite($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $11 = 0, $13 = 0, $15 = 0, $4 = 0, $phitmp = 0, $spec$select = 0;
 $4 = Math_imul($2, $1) | 0;
 $spec$select = ($1 | 0) == 0 ? 0 : $2;
 if ((SAFE_HEAP_LOAD($3 + 76 | 0, 4, 0) | 0 | 0) > -1) {
  $phitmp = (___lockfile($3) | 0) == 0;
  $11 = ___fwritex($0, $4, $3) | 0;
  if ($phitmp) $13 = $11; else {
   ___unlockfile($3);
   $13 = $11;
  }
 } else $13 = ___fwritex($0, $4, $3) | 0;
 if (($13 | 0) == ($4 | 0)) $15 = $spec$select; else $15 = ($13 >>> 0) / ($1 >>> 0) | 0;
 return $15 | 0;
}

function _fmt_x($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $$05$lcssa = 0, $$056 = 0, $14 = 0, $15 = 0, $8 = 0;
 if (($0 | 0) == 0 & ($1 | 0) == 0) $$05$lcssa = $2; else {
  $$056 = $2;
  $15 = $1;
  $8 = $0;
  while (1) {
   $14 = $$056 + -1 | 0;
   SAFE_HEAP_STORE($14 >> 0 | 0, SAFE_HEAP_LOAD(95632 + ($8 & 15) >> 0 | 0, 1, 1) | 0 | 0 | $3 | 0, 1);
   $8 = _bitshift64Lshr($8 | 0, $15 | 0, 4) | 0;
   $15 = tempRet0;
   if (($8 | 0) == 0 & ($15 | 0) == 0) {
    $$05$lcssa = $14;
    break;
   } else $$056 = $14;
  }
 }
 return $$05$lcssa | 0;
}

function _UIUpdate_b() {
 var $$sink = 0, $12 = 0, $3 = 0, $4 = 0, $5 = 0;
 if (!((SAFE_HEAP_LOAD(101054 | 0, 1, 0) | 0) & 1)) _draw_text(0);
 $3 = SAFE_HEAP_LOAD(98418 | 0, 1, 0) | 0 | 0;
 $4 = $3 & 255;
 $5 = SAFE_HEAP_LOAD(98419 | 0, 1, 0) | 0 | 0;
 do if (($3 & 255) > ($5 & 255)) $$sink = $4 + 254 & 255; else if (($3 & 255) < ($5 & 255)) {
  $$sink = $4 + 2 & 255;
  break;
 } else {
  $12 = $3;
  SAFE_HEAP_STORE(65354 | 0, $12 | 0, 1);
  return;
 } while (0);
 SAFE_HEAP_STORE(98418 | 0, $$sink | 0, 1);
 $12 = $$sink;
 SAFE_HEAP_STORE(65354 | 0, $12 | 0, 1);
 return;
}

function _script_cmd_unless_flag() {
 var $storemerge = 0;
 if (!(SAFE_HEAP_LOAD(99360 + (SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0)) {
  $storemerge = (SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0) << 8 | (SAFE_HEAP_LOAD(101055 | 0, 1, 1) | 0);
  SAFE_HEAP_STORE(25110 * 4 | 0, $storemerge | 0, 4);
  SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
  return;
 } else {
  $storemerge = (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 4 | 0;
  SAFE_HEAP_STORE(25110 * 4 | 0, $storemerge | 0, 4);
  SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
  return;
 }
}

function _script_cmd_if_flag() {
 var $storemerge = 0;
 if (!(SAFE_HEAP_LOAD(99360 + (SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0)) {
  $storemerge = (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 4 | 0;
  SAFE_HEAP_STORE(25110 * 4 | 0, $storemerge | 0, 4);
  SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
  return;
 } else {
  $storemerge = (SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0) << 8 | (SAFE_HEAP_LOAD(101055 | 0, 1, 1) | 0);
  SAFE_HEAP_STORE(25110 * 4 | 0, $storemerge | 0, 4);
  SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
  return;
 }
}

function _LogoInit_b() {
 _display_off();
 _SpritesReset();
 SAFE_HEAP_STORE(65355 | 0, -90 | 0, 1);
 SAFE_HEAP_STORE(65354 | 0, -113 | 0, 1);
 SAFE_HEAP_STORE(101085 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101086 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101087 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101088 | 0, 20 | 0, 1);
 SAFE_HEAP_STORE(24389 * 4 | 0, 1 | 0, 4);
 _set_bkg_data(0, 51, 5648);
 _set_bkg_tiles(0, 0, 32, 32, 6480);
 SAFE_HEAP_STORE(101089 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | -128 | 0, 1);
 return;
}

function ___muldi3($a$0, $a$1, $b$0, $b$1) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0;
 $x_sroa_0_0_extract_trunc = $a$0;
 $y_sroa_0_0_extract_trunc = $b$0;
 $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
 $1$1 = tempRet0;
 return (tempRet0 = (Math_imul($a$1, $y_sroa_0_0_extract_trunc) | 0) + (Math_imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $1$1 | $1$1 & 0, $1$0 | 0 | 0) | 0;
}

function SAFE_HEAP_LOAD(dest, bytes, unsigned) {
 dest = dest | 0;
 bytes = bytes | 0;
 unsigned = unsigned | 0;
 if ((dest | 0) <= 0) segfault();
 if ((dest + bytes | 0) > (HEAP32[DYNAMICTOP_PTR >> 2] | 0)) segfault();
 if ((bytes | 0) == 4) {
  if (dest & 3) alignfault();
  return HEAP32[dest >> 2] | 0;
 } else if ((bytes | 0) == 1) if (unsigned) return HEAPU8[dest >> 0] | 0; else return HEAP8[dest >> 0] | 0;
 if (dest & 1) alignfault();
 if (unsigned) return HEAPU16[dest >> 1] | 0;
 return HEAP16[dest >> 1] | 0;
}

function _fmt_o($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$0$lcssa = 0, $$06 = 0, $10 = 0, $11 = 0, $7 = 0;
 if (($0 | 0) == 0 & ($1 | 0) == 0) $$0$lcssa = $2; else {
  $$06 = $2;
  $11 = $1;
  $7 = $0;
  while (1) {
   $10 = $$06 + -1 | 0;
   SAFE_HEAP_STORE($10 >> 0 | 0, $7 & 7 | 48 | 0, 1);
   $7 = _bitshift64Lshr($7 | 0, $11 | 0, 3) | 0;
   $11 = tempRet0;
   if (($7 | 0) == 0 & ($11 | 0) == 0) {
    $$0$lcssa = $10;
    break;
   } else $$06 = $10;
  }
 }
 return $$0$lcssa | 0;
}

function runPostSets() {}
function ___muldsi3($a, $b) {
 $a = $a | 0;
 $b = $b | 0;
 var $1 = 0, $2 = 0, $3 = 0, $6 = 0, $8 = 0, $11 = 0, $12 = 0;
 $1 = $a & 65535;
 $2 = $b & 65535;
 $3 = Math_imul($2, $1) | 0;
 $6 = $a >>> 16;
 $8 = ($3 >>> 16) + (Math_imul($2, $6) | 0) | 0;
 $11 = $b >>> 16;
 $12 = Math_imul($11, $1) | 0;
 return (tempRet0 = ($8 >>> 16) + (Math_imul($11, $6) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, $8 + $12 << 16 | $3 & 65535 | 0) | 0;
}

function _rand() {
 var $0 = 0, $10 = 0, $14 = 0, $6 = 0, $8 = 0, $9 = 0;
 $0 = 100432;
 $6 = ___muldi3(SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0 | 0, SAFE_HEAP_LOAD($0 + 4 | 0, 4, 0) | 0 | 0, 1284865837, 1481765933) | 0;
 $8 = _i64Add($6 | 0, tempRet0 | 0, 1, 0) | 0;
 $9 = tempRet0;
 $10 = 100432;
 SAFE_HEAP_STORE($10 | 0, $8 | 0, 4);
 SAFE_HEAP_STORE($10 + 4 | 0, $9 | 0, 4);
 $14 = _bitshift64Lshr($8 | 0, $9 | 0, 33) | 0;
 return $14 | 0;
}

function _script_cmd_camera_move() {
 SAFE_HEAP_STORE(101165 | 0, (SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) << 3 | 0, 1);
 SAFE_HEAP_STORE(101166 | 0, (SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0 | 0) << 3 | 0, 1);
 SAFE_HEAP_STORE(97938 | 0, (SAFE_HEAP_LOAD(101055 | 0, 1, 0) | 0) & -17 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 4 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 return;
}

function SAFE_HEAP_STORE(dest, value, bytes) {
 dest = dest | 0;
 value = value | 0;
 bytes = bytes | 0;
 if ((dest | 0) <= 0) segfault();
 if ((dest + bytes | 0) > (HEAP32[DYNAMICTOP_PTR >> 2] | 0)) segfault();
 if ((bytes | 0) == 4) {
  if (dest & 3) alignfault();
  HEAP32[dest >> 2] = value;
 } else if ((bytes | 0) == 1) HEAP8[dest >> 0] = value; else {
  if (dest & 1) alignfault();
  HEAP16[dest >> 1] = value;
 }
}

function ___stdio_close($0) {
 $0 = $0 | 0;
 var $5 = 0, $vararg_buffer = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16);
 $vararg_buffer = sp;
 SAFE_HEAP_STORE($vararg_buffer | 0, _dummy(SAFE_HEAP_LOAD($0 + 60 | 0, 4, 0) | 0 | 0) | 0 | 0, 4);
 $5 = ___syscall_ret(___syscall6(6, $vararg_buffer | 0) | 0) | 0;
 STACKTOP = sp;
 return $5 | 0;
}

function _set_text_line($0) {
 $0 = $0 | 0;
 SAFE_HEAP_STORE(98419 | 0, 112 | 0, 1);
 _PushBank(11);
 _UIDrawFrame_b(0, 0, 20, 4);
 _PopBank();
 SAFE_HEAP_STORE(8192 | 0, 2 | 0, 1);
 SAFE_HEAP_STORE(99216 | 0, 0 | 0, 1);
 _strcat(99216, 33664 + ($0 * 72 | 0) | 0) | 0;
 SAFE_HEAP_STORE(101080 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101081 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101082 | 0, 0 | 0, 1);
 return;
}

function _IsEmoting() {
 var $0 = 0, $vararg_buffer = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16);
 $vararg_buffer = sp;
 _PushBank(10);
 $0 = _IsEmoting_b() | 0;
 _PopBank();
 SAFE_HEAP_STORE($vararg_buffer | 0, $0 & 255 | 0, 4);
 _printf(98402, $vararg_buffer) | 0;
 STACKTOP = sp;
 return $0 | 0;
}

function _printf($0, $varargs) {
 $0 = $0 | 0;
 $varargs = $varargs | 0;
 var $1 = 0, $3 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16);
 $1 = sp;
 SAFE_HEAP_STORE($1 | 0, $varargs | 0, 4);
 $3 = _vfprintf(SAFE_HEAP_LOAD(24390 * 4 | 0, 4, 0) | 0 | 0, $0, $1) | 0;
 STACKTOP = sp;
 return $3 | 0;
}

function SAFE_HEAP_STORE_D(dest, value, bytes) {
 dest = dest | 0;
 value = +value;
 bytes = bytes | 0;
 if ((dest | 0) <= 0) segfault();
 if ((dest + bytes | 0) > (HEAP32[DYNAMICTOP_PTR >> 2] | 0)) segfault();
 if ((bytes | 0) == 8) {
  if (dest & 7) alignfault();
  HEAPF64[dest >> 3] = value;
 } else {
  if (dest & 3) alignfault();
  HEAPF32[dest >> 2] = value;
 }
}

function SAFE_HEAP_LOAD_D(dest, bytes) {
 dest = dest | 0;
 bytes = bytes | 0;
 if ((dest | 0) <= 0) segfault();
 if ((dest + bytes | 0) > (HEAP32[DYNAMICTOP_PTR >> 2] | 0)) segfault();
 if ((bytes | 0) == 8) {
  if (dest & 7) alignfault();
  return +HEAPF64[dest >> 3];
 }
 if (dest & 3) alignfault();
 return +HEAPF32[dest >> 2];
}

function _script_cmd_set_emotion() {
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 3 | 0, 4);
 _MapSetEmotion(SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 0, SAFE_HEAP_LOAD(101050 | 0, 1, 0) | 0 | 0);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(101051 | 0, 0 | 0, 1);
 return;
}

function _script_cmd_line() {
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 3 | 0, 4);
 _set_text_line((SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) << 8 | (SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0 | 0));
 return;
}

function _MapSetEmotion_b($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 _move_sprite(38, 0, 0);
 _move_sprite(39, 0, 0);
 _SetBankedSpriteData(3, 124, 4, 2240 + (($1 & 255) << 6) | 0);
 SAFE_HEAP_STORE(101060 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(97942 | 0, $0 | 0, 1);
 return;
}

function _script_cmd_clear_flag() {
 SAFE_HEAP_STORE(99360 + (SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) >> 0 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function _bitshift64Shl(low, high, bits) {
 low = low | 0;
 high = high | 0;
 bits = bits | 0;
 if ((bits | 0) < 32) {
  tempRet0 = high << bits | (low & (1 << bits) - 1 << 32 - bits) >>> 32 - bits;
  return low << bits;
 }
 tempRet0 = low << bits - 32;
 return 0;
}

function _script_cmd_set_flag() {
 SAFE_HEAP_STORE(99360 + (SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function _bitshift64Lshr(low, high, bits) {
 low = low | 0;
 high = high | 0;
 bits = bits | 0;
 if ((bits | 0) < 32) {
  tempRet0 = high >>> bits;
  return low >>> bits | (high & (1 << bits) - 1) << 32 - bits;
 }
 tempRet0 = 0;
 return high >>> bits - 32 | 0;
}

function _script_cmd_hide_sprites() {
 SAFE_HEAP_STORE(65344 | 0, (SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0) & -3 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 1 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function _script_cmd_active_actor() {
 SAFE_HEAP_STORE(101059 | 0, SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function _script_cmd_camera_shake() {
 SAFE_HEAP_STORE(101047 | 0, SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 return;
}

function _script_cmd_show_sprites() {
 SAFE_HEAP_STORE(65344 | 0, SAFE_HEAP_LOAD(65344 | 0, 1, 0) | 0 | 2 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 1 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function _script_cmd_camera_lock() {
 SAFE_HEAP_STORE(97938 | 0, SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 16 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 return;
}

function _script_cmd_return_title() {
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 1 | 0, 4);
 SAFE_HEAP_STORE(24388 * 4 | 0, 1 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 _FadeSetSpeed(3);
 _FadeOut();
 return;
}

function ___lctrans_impl($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $$0 = 0;
 if (!$1) $$0 = 0; else $$0 = ___mo_lookup(SAFE_HEAP_LOAD($1 | 0, 4, 0) | 0 | 0, SAFE_HEAP_LOAD($1 + 4 | 0, 4, 0) | 0 | 0, $0) | 0;
 return (($$0 | 0) == 0 ? $0 : $$0) | 0;
}

function _script_cmd_wait() {
 SAFE_HEAP_STORE(101046 | 0, SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 0 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 return;
}

function _script_load_battle() {
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(24388 * 4 | 0, 4 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 _FadeSetSpeed(3);
 _FadeOut();
 return;
}

function _StackPush($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $3 = 0;
 $3 = (SAFE_HEAP_LOAD($0 >> 0 | 0, 1, 0) | 0 | 0) + 1 << 24 >> 24;
 SAFE_HEAP_STORE($0 >> 0 | 0, $3 | 0, 1);
 SAFE_HEAP_STORE($0 + ($3 & 255) >> 0 | 0, $1 | 0, 1);
 return;
}

function ___DOUBLE_BITS_677($0) {
 $0 = +$0;
 var $1 = 0;
 SAFE_HEAP_STORE_D(tempDoublePtr | 0, +$0, 8);
 $1 = SAFE_HEAP_LOAD(tempDoublePtr | 0, 4, 0) | 0 | 0;
 tempRet0 = SAFE_HEAP_LOAD(tempDoublePtr + 4 | 0, 4, 0) | 0 | 0;
 return $1 | 0;
}

function _script_fade_out() {
 _FadeOut();
 _FadeSetSpeed(SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 0);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 return;
}

function _script_fade_in() {
 _FadeIn();
 _FadeSetSpeed(SAFE_HEAP_LOAD(101049 | 0, 1, 0) | 0 | 0);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 2 | 0, 4);
 SAFE_HEAP_STORE(97939 | 0, 0 | 0, 1);
 return;
}

function _SetBankedBkgTiles($0, $1, $2, $3, $4, $5) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 $5 = $5 | 0;
 _PushBank($0);
 _set_bkg_tiles($1 | 0, $2 | 0, $3 | 0, $4 | 0, $5 | 0);
 _PopBank();
 return;
}
function stackAlloc(size) {
 size = size | 0;
 var ret = 0;
 ret = STACKTOP;
 STACKTOP = STACKTOP + size | 0;
 STACKTOP = STACKTOP + 15 & -16;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(size | 0);
 return ret | 0;
}

function _StackPop($0) {
 $0 = $0 | 0;
 var $1 = 0;
 $1 = SAFE_HEAP_LOAD($0 >> 0 | 0, 1, 0) | 0 | 0;
 SAFE_HEAP_STORE($0 >> 0 | 0, $1 + -1 << 24 >> 24 | 0, 1);
 return SAFE_HEAP_LOAD($0 + ($1 & 255) >> 0 | 0, 1, 0) | 0 | 0;
}

function _script_cmd_show_player() {
 SAFE_HEAP_STORE(98966 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 1 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function _script_cmd_hide_player() {
 SAFE_HEAP_STORE(98966 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(25110 * 4 | 0, 4, 0) | 0 | 0) + 1 | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function _script_cmd_goto() {
 SAFE_HEAP_STORE(25110 * 4 | 0, (SAFE_HEAP_LOAD(101049 | 0, 1, 1) | 0 | 0) << 8 | (SAFE_HEAP_LOAD(101050 | 0, 1, 1) | 0 | 0) | 0, 4);
 SAFE_HEAP_STORE(101051 | 0, 1 | 0, 1);
 return;
}

function dynCall_iiii(index, a1, a2, a3) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 return FUNCTION_TABLE_iiii[(SAFE_FT_MASK(index | 0, 3 | 0) | 0) & 3](a1 | 0, a2 | 0, a3 | 0) | 0;
}

function _i64Subtract(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var h = 0;
 h = b - d >>> 0;
 h = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;
 return (tempRet0 = h, a - c >>> 0 | 0) | 0;
}

function _SpritesReset() {
 var $$04 = 0;
 $$04 = 0;
 do {
  _move_sprite($$04 | 0, 0, 0);
  _set_sprite_prop($$04 | 0, 0);
  $$04 = $$04 + 1 << 24 >> 24;
 } while ($$04 << 24 >> 24 != 40);
 return;
}

function ___syscall_ret($0) {
 $0 = $0 | 0;
 var $$0 = 0;
 if ($0 >>> 0 > 4294963200) {
  SAFE_HEAP_STORE(___errno_location() | 0 | 0, 0 - $0 | 0, 4);
  $$0 = -1;
 } else $$0 = $0;
 return $$0 | 0;
}

function _FadeOut() {
 SAFE_HEAP_STORE(101062 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(25116 * 4 | 0, 1 | 0, 4);
 SAFE_HEAP_STORE(101063 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(101064 | 0, 5 | 0, 1);
 return;
}

function _FadeIn() {
 SAFE_HEAP_STORE(101062 | 0, 0 | 0, 1);
 SAFE_HEAP_STORE(25116 * 4 | 0, 0 | 0, 4);
 SAFE_HEAP_STORE(101063 | 0, 1 | 0, 1);
 SAFE_HEAP_STORE(101064 | 0, 0 | 0, 1);
 return;
}

function _SetBankedSpriteData($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 _PushBank($0);
 _set_sprite_data($1 | 0, $2 | 0, $3 | 0);
 _PopBank();
 return;
}

function _PopBank() {
 _StackPop(101067) | 0;
 SAFE_HEAP_STORE(8192 | 0, SAFE_HEAP_LOAD(101067 + (SAFE_HEAP_LOAD(101067 | 0, 1, 1) | 0 | 0) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
 return;
}

function _i64Add(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var l = 0;
 l = a + c >>> 0;
 return (tempRet0 = b + d + (l >>> 0 < a >>> 0 | 0) >>> 0, l | 0) | 0;
}

function _SetBankedBkgData($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 _PushBank($0);
 _set_bkg_data($1 | 0, $2 | 0, $3 | 0);
 _PopBank();
 return;
}

function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 return ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
}

function _ReadBankedUBYTE($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $2 = 0;
 _PushBank($0);
 $2 = SAFE_HEAP_LOAD($1 >> 0 | 0, 1, 0) | 0 | 0;
 _PopBank();
 return $2 | 0;
}

function SAFE_FT_MASK(value, mask) {
 value = value | 0;
 mask = mask | 0;
 var ret = 0;
 ret = value & mask;
 if ((ret | 0) != (value | 0)) ftfault();
 return ret | 0;
}

function _out_670($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 if (!((SAFE_HEAP_LOAD($0 | 0, 4, 0) | 0) & 32)) ___fwritex($1, $2, $0) | 0;
 return;
}

function _fputs($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $2 = 0;
 $2 = _strlen($0) | 0;
 return ((_fwrite($0, 1, $2, $1) | 0) != ($2 | 0)) << 31 >> 31 | 0;
}

function establishStackSpace(stackBase, stackMax) {
 stackBase = stackBase | 0;
 stackMax = stackMax | 0;
 STACKTOP = stackBase;
 STACK_MAX = stackMax;
}

function dynCall_ii(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 return FUNCTION_TABLE_ii[(SAFE_FT_MASK(index | 0, 1 | 0) | 0) & 1](a1 | 0) | 0;
}

function _FadeSetSpeed($0) {
 $0 = $0 | 0;
 SAFE_HEAP_STORE(101061 | 0, SAFE_HEAP_LOAD(98316 + ($0 & 255) >> 0 | 0, 1, 0) | 0 | 0 | 0, 1);
 return;
}

function _wctomb($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $$0 = 0;
 if (!$0) $$0 = 0; else $$0 = _wcrtomb($0, $1, 0) | 0;
 return $$0 | 0;
}

function _swapc($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $3 = 0;
 $3 = _llvm_bswap_i32($0 | 0) | 0;
 return (($1 | 0) == 0 ? $0 : $3) | 0;
}

function setThrew(threw, value) {
 threw = threw | 0;
 value = value | 0;
 if (!__THREW__) {
  __THREW__ = threw;
  threwValue = value;
 }
}

function _strerror($0) {
 $0 = $0 | 0;
 return ___strerror_l($0, SAFE_HEAP_LOAD((___pthread_self_85() | 0) + 188 | 0, 4, 0) | 0 | 0) | 0;
}

function _llvm_bswap_i32(x) {
 x = x | 0;
 return (x & 255) << 24 | (x >> 8 & 255) << 16 | (x >> 16 & 255) << 8 | x >>> 24 | 0;
}

function _MapSetEmotion($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 _PushBank(10);
 _MapSetEmotion_b($0, $1);
 _PopBank();
 return;
}

function _strcat($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 _strcpy($0 + (_strlen($0) | 0) | 0, $1) | 0;
 return $0 | 0;
}

function dynCall_v(index) {
 index = index | 0;
 FUNCTION_TABLE_v[(SAFE_FT_MASK(index | 0, 31 | 0) | 0) & 31]();
}

function _PushBank($0) {
 $0 = $0 | 0;
 _StackPush(101067, $0);
 SAFE_HEAP_STORE(8192 | 0, $0 | 0, 1);
 return;
}

function setDynamicTop(value) {
 value = value | 0;
 SAFE_HEAP_STORE(DYNAMICTOP_PTR | 0, value | 0, 4);
}

function _llvm_cttz_i32(x) {
 x = x | 0;
 return (x ? 31 - (Math_clz32(x ^ x - 1) | 0) | 0 : 32) | 0;
}

function b1(p0, p1, p2) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 p2 = p2 | 0;
 nullFunc_iiii(1);
 return 0;
}

function _strcpy($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 ___stpcpy($0, $1) | 0;
 return $0 | 0;
}

function ___lctrans($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 return ___lctrans_impl($0, $1) | 0;
}

function _IsEmoting_b() {
 return (SAFE_HEAP_LOAD(101060 | 0, 1, 0) | 0 | 0) != 0 | 0;
}

function _TitleCleanup() {
 _PushBank(10);
 _TitleCleanup_b();
 _PopBank();
 return;
}

function _TitleUpdate() {
 _PushBank(10);
 _TitleUpdate_b();
 _PopBank();
 return;
}

function _script_cmd_end() {
 SAFE_HEAP_STORE(25110 * 4 | 0, 0 | 0, 4);
 return;
}

function _PongUpdate() {
 _PushBank(10);
 _PongUpdate_b();
 _PopBank();
 return;
}

function _frexpl($0, $1) {
 $0 = +$0;
 $1 = $1 | 0;
 return +(+_frexp($0, $1));
}

function _LogoUpdate() {
 _PushBank(2);
 _LogoUpdate_b();
 _PopBank();
 return;
}

function _TitleInit() {
 _PushBank(10);
 _TitleInit_b();
 _PopBank();
 return;
}

function _MapUpdate() {
 _PushBank(10);
 _MapUpdate_b();
 _PopBank();
 return;
}

function _isdigit($0) {
 $0 = $0 | 0;
 return ($0 + -48 | 0) >>> 0 < 10 | 0;
}

function _UIUpdate() {
 _PushBank(11);
 _UIUpdate_b();
 _PopBank();
 return;
}

function _PongInit() {
 _PushBank(10);
 _PongInit_b();
 _PopBank();
 return;
}

function _LogoInit() {
 _PushBank(2);
 _LogoInit_b();
 _PopBank();
 return;
}

function _LoadMap() {
 _PushBank(10);
 _LoadMap_b();
 _PopBank();
 return;
}

function _UIInit() {
 _PushBank(11);
 _UIInit_b();
 _PopBank();
 return;
}

function _IsFading() {
 return SAFE_HEAP_LOAD(101063 | 0, 1, 0) | 0 | 0;
}

function _FadeInit() {
 SAFE_HEAP_STORE(101061 | 0, 3 | 0, 1);
 return;
}

function setTempRet0(value) {
 value = value | 0;
 tempRet0 = value;
}

function _UIInit_b() {
 _set_bkg_data(-64, 64, 4624);
 return;
}

function stackRestore(top) {
 top = top | 0;
 STACKTOP = top;
}

function ___pthread_self_907() {
 return _pthread_self() | 0;
}

function ___pthread_self_85() {
 return _pthread_self() | 0;
}

function b0(p0) {
 p0 = p0 | 0;
 nullFunc_ii(0);
 return 0;
}

function ___ofl_lock() {
 ___lock(101032);
 return 101040;
}

function ___ofl_unlock() {
 ___unlock(101032);
 return;
}

function _dummy($0) {
 $0 = $0 | 0;
 return $0 | 0;
}

function ___unlockfile($0) {
 $0 = $0 | 0;
 return;
}

function ___lockfile($0) {
 $0 = $0 | 0;
 return 0;
}

function getTempRet0() {
 return tempRet0 | 0;
}

function ___errno_location() {
 return 101028;
}

function stackSave() {
 return STACKTOP | 0;
}

function _pthread_self() {
 return 97692;
}

function _TitleCleanup_b() {
 return;
}

function b2() {
 nullFunc_v(2);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_ii = [b0,___stdio_close];
var FUNCTION_TABLE_iiii = [b1,___stdout_write,___stdio_seek,___stdio_write];
var FUNCTION_TABLE_v = [b2,_script_cmd_end,_script_cmd_line,_script_cmd_goto,_script_cmd_if_flag,_script_cmd_unless_flag,_script_cmd_set_flag,_script_cmd_clear_flag,_script_cmd_actor_dir,_script_cmd_active_actor,_script_cmd_camera_move,_script_cmd_camera_lock,_script_cmd_wait,_script_fade_out,_script_fade_in,_script_load_map,_script_cmd_actor_pos,_script_actor_move_to,_script_cmd_show_sprites,_script_cmd_hide_sprites,_script_load_battle,_script_cmd_show_player,_script_cmd_hide_player,_script_cmd_set_emotion,_script_cmd_camera_shake,_script_cmd_return_title,_MapUpdate,_game_loop,_PongUpdate
,_LogoUpdate,_TitleUpdate,b2];

  return { ___errno_location: ___errno_location, ___muldi3: ___muldi3, ___udivdi3: ___udivdi3, _bitshift64Lshr: _bitshift64Lshr, _bitshift64Shl: _bitshift64Shl, _fflush: _fflush, _free: _free, _i64Add: _i64Add, _i64Subtract: _i64Subtract, _llvm_bswap_i32: _llvm_bswap_i32, _main: _main, _malloc: _malloc, _memcpy: _memcpy, _memset: _memset, _sbrk: _sbrk, dynCall_ii: dynCall_ii, dynCall_iiii: dynCall_iiii, dynCall_v: dynCall_v, establishStackSpace: establishStackSpace, getTempRet0: getTempRet0, runPostSets: runPostSets, setDynamicTop: setDynamicTop, setTempRet0: setTempRet0, setThrew: setThrew, stackAlloc: stackAlloc, stackRestore: stackRestore, stackSave: stackSave };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);

var real____errno_location = asm["___errno_location"]; asm["___errno_location"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____errno_location.apply(null, arguments);
};

var real____muldi3 = asm["___muldi3"]; asm["___muldi3"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____muldi3.apply(null, arguments);
};

var real____udivdi3 = asm["___udivdi3"]; asm["___udivdi3"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____udivdi3.apply(null, arguments);
};

var real__bitshift64Lshr = asm["_bitshift64Lshr"]; asm["_bitshift64Lshr"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__bitshift64Lshr.apply(null, arguments);
};

var real__bitshift64Shl = asm["_bitshift64Shl"]; asm["_bitshift64Shl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__bitshift64Shl.apply(null, arguments);
};

var real__fflush = asm["_fflush"]; asm["_fflush"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fflush.apply(null, arguments);
};

var real__free = asm["_free"]; asm["_free"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__free.apply(null, arguments);
};

var real__i64Add = asm["_i64Add"]; asm["_i64Add"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__i64Add.apply(null, arguments);
};

var real__i64Subtract = asm["_i64Subtract"]; asm["_i64Subtract"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__i64Subtract.apply(null, arguments);
};

var real__llvm_bswap_i32 = asm["_llvm_bswap_i32"]; asm["_llvm_bswap_i32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__llvm_bswap_i32.apply(null, arguments);
};

var real__main = asm["_main"]; asm["_main"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__main.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__malloc.apply(null, arguments);
};

var real__sbrk = asm["_sbrk"]; asm["_sbrk"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrk.apply(null, arguments);
};

var real_establishStackSpace = asm["establishStackSpace"]; asm["establishStackSpace"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_establishStackSpace.apply(null, arguments);
};

var real_getTempRet0 = asm["getTempRet0"]; asm["getTempRet0"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_getTempRet0.apply(null, arguments);
};

var real_setDynamicTop = asm["setDynamicTop"]; asm["setDynamicTop"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_setDynamicTop.apply(null, arguments);
};

var real_setTempRet0 = asm["setTempRet0"]; asm["setTempRet0"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_setTempRet0.apply(null, arguments);
};

var real_setThrew = asm["setThrew"]; asm["setThrew"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_setThrew.apply(null, arguments);
};

var real_stackAlloc = asm["stackAlloc"]; asm["stackAlloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackAlloc.apply(null, arguments);
};

var real_stackRestore = asm["stackRestore"]; asm["stackRestore"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackRestore.apply(null, arguments);
};

var real_stackSave = asm["stackSave"]; asm["stackSave"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackSave.apply(null, arguments);
};
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var ___muldi3 = Module["___muldi3"] = asm["___muldi3"];
var ___udivdi3 = Module["___udivdi3"] = asm["___udivdi3"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _fflush = Module["_fflush"] = asm["_fflush"];
var _free = Module["_free"] = asm["_free"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = asm["_llvm_bswap_i32"];
var _main = Module["_main"] = asm["_main"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _memset = Module["_memset"] = asm["_memset"];
var _sbrk = Module["_sbrk"] = asm["_sbrk"];
var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];
var getTempRet0 = Module["getTempRet0"] = asm["getTempRet0"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var setDynamicTop = Module["setDynamicTop"] = asm["setDynamicTop"];
var setTempRet0 = Module["setTempRet0"] = asm["setTempRet0"];
var setThrew = Module["setThrew"] = asm["setThrew"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
;



// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;

if (!Module["intArrayFromString"]) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["intArrayToString"]) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["ccall"]) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["cwrap"]) Module["cwrap"] = function() { abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["setValue"]) Module["setValue"] = function() { abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getValue"]) Module["getValue"] = function() { abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["allocate"]) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getMemory"]) Module["getMemory"] = function() { abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["Pointer_stringify"]) Module["Pointer_stringify"] = function() { abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["AsciiToString"]) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToAscii"]) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF8ArrayToString"]) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF8ToString"]) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF8Array"]) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF8"]) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF8"]) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF16ToString"]) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF16"]) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF16"]) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF32ToString"]) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF32"]) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF32"]) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["allocateUTF8"]) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackTrace"]) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnPreRun"]) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnInit"]) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnPreMain"]) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnExit"]) Module["addOnExit"] = function() { abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnPostRun"]) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeStringToMemory"]) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeArrayToMemory"]) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeAsciiToMemory"]) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addRunDependency"]) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["removeRunDependency"]) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["ENV"]) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["FS"]) Module["FS"] = function() { abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["FS_createFolder"]) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createPath"]) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createDataFile"]) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createPreloadedFile"]) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createLazyFile"]) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createLink"]) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createDevice"]) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_unlink"]) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["GL"]) Module["GL"] = function() { abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["staticAlloc"]) Module["staticAlloc"] = function() { abort("'staticAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["dynamicAlloc"]) Module["dynamicAlloc"] = function() { abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["warnOnce"]) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["loadDynamicLibrary"]) Module["loadDynamicLibrary"] = function() { abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["loadWebAssemblyModule"]) Module["loadWebAssemblyModule"] = function() { abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getLEB"]) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getFunctionTables"]) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["alignFunctionTables"]) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["registerFunctions"]) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addFunction"]) Module["addFunction"] = function() { abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["removeFunction"]) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getFuncWrapper"]) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["prettyPrint"]) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["makeBigInt"]) Module["makeBigInt"] = function() { abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["dynCall"]) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getCompilerSetting"]) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackSave"]) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackRestore"]) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackAlloc"]) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["establishStackSpace"]) Module["establishStackSpace"] = function() { abort("'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["print"]) Module["print"] = function() { abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["printErr"]) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };if (!Module["ALLOC_NORMAL"]) Object.defineProperty(Module, "ALLOC_NORMAL", { get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_STACK"]) Object.defineProperty(Module, "ALLOC_STACK", { get: function() { abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_STATIC"]) Object.defineProperty(Module, "ALLOC_STATIC", { get: function() { abort("'ALLOC_STATIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_DYNAMIC"]) Object.defineProperty(Module, "ALLOC_DYNAMIC", { get: function() { abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_NONE"]) Object.defineProperty(Module, "ALLOC_NONE", { get: function() { abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });

if (memoryInitializer) {
  if (!isDataURI(memoryInitializer)) {
    memoryInitializer = locateFile(memoryInitializer);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, GLOBAL_BASE);
  } else {
    addRunDependency('memory initializer');
    var applyMemoryInitializer = function(data) {
      if (data.byteLength) data = new Uint8Array(data);
      for (var i = 0; i < data.length; i++) {
        assert(HEAPU8[GLOBAL_BASE + i] === 0, "area for memory initializer should not have been touched before it's loaded");
      }
      HEAPU8.set(data, GLOBAL_BASE);
      // Delete the typed array that contains the large blob of the memory initializer request response so that
      // we won't keep unnecessary memory lying around. However, keep the XHR object itself alive so that e.g.
      // its .status field can still be accessed later.
      if (Module['memoryInitializerRequest']) delete Module['memoryInitializerRequest'].response;
      removeRunDependency('memory initializer');
    }
    function doBrowserLoad() {
      Module['readAsync'](memoryInitializer, applyMemoryInitializer, function() {
        throw 'could not load memory initializer ' + memoryInitializer;
      });
    }
    if (Module['memoryInitializerRequest']) {
      // a network request has already been created, just use that
      function useRequest() {
        var request = Module['memoryInitializerRequest'];
        var response = request.response;
        if (request.status !== 200 && request.status !== 0) {
            // If you see this warning, the issue may be that you are using locateFile and defining it in JS. That
            // means that the HTML file doesn't know about it, and when it tries to create the mem init request early, does it to the wrong place.
            // Look in your browser's devtools network console to see what's going on.
            console.warn('a problem seems to have happened with Module.memoryInitializerRequest, status: ' + request.status + ', retrying ' + memoryInitializer);
            doBrowserLoad();
            return;
        }
        applyMemoryInitializer(response);
      }
      if (Module['memoryInitializerRequest'].response) {
        setTimeout(useRequest, 0); // it's already here; but, apply it asynchronously
      } else {
        Module['memoryInitializerRequest'].addEventListener('load', useRequest); // wait for it
      }
    } else {
      // fetch it from the network ourselves
      doBrowserLoad();
    }
  }
}



/**
 * @constructor
 * @extends {Error}
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  var argv = stackAlloc((argc + 1) * 4);
  HEAP32[argv >> 2] = allocateUTF8OnStack(Module['thisProgram']);
  for (var i = 1; i < argc; i++) {
    HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1]);
  }
  HEAP32[(argv >> 2) + argc] = 0;


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
      exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      var toLog = e;
      if (e && typeof e === 'object' && e.stack) {
        toLog = [e, e.stack];
      }
      err('exception thrown: ' + toLog);
      Module['quit'](1, e);
    }
  } finally {
    calledMain = true;
  }
}




/** @type {function(Array=)} */
function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    return;
  }

  writeStackCookie();

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return;

    ensureInitRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = run;

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in NO_FILESYSTEM
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var print = out;
  var printErr = err;
  var has = false;
  out = err = function(x) {
    has = true;
  }
  try { // it doesn't matter if it fails
    var flush = flush_NO_FILESYSTEM;
    if (flush) flush(0);
  } catch(e) {}
  out = print;
  err = printErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set NO_EXIT_RUNTIME to 0 (see the FAQ), or make sure to emit a newline when you printf etc.');
  }
}

function exit(status, implicit) {
  checkUnflushedContent();

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && Module['noExitRuntime'] && status === 0) {
    return;
  }

  if (Module['noExitRuntime']) {
    // if exit() was called, we may warn the user if the runtime isn't actually being shut down
    if (!implicit) {
      err('exit(' + status + ') called, but NO_EXIT_RUNTIME is set, so halting execution but not exiting the runtime or preventing further async execution (build with NO_EXIT_RUNTIME=0, if you want a true shutdown)');
    }
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  Module['quit'](status, new ExitStatus(status));
}

var abortDecorators = [];

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  if (what !== undefined) {
    out(what);
    err(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';
  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

Module["noExitRuntime"] = true;

run();

// {{POST_RUN_ADDITIONS}}





// {{MODULE_ADDITIONS}}








