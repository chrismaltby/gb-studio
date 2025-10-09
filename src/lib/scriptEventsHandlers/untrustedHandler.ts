/* eslint-disable @typescript-eslint/ban-types */

/**
 * Untrusted Script Event Handler Loader (QuickJS)
 *
 * Executes handler code in isolated QuickJS environment for security.
 */

import {
  newQuickJSWASMModuleFromVariant,
  QuickJSContext,
  QuickJSHandle,
  QuickJSRuntime,
  shouldInterruptAfterDeadline,
} from "quickjs-emscripten-core";
import quickJSVariant from "#my-quickjs-variant";
import uuid from "uuid/v4";
import type {
  FileReaderFn,
  ScriptEventHandlerWithCleanup,
} from "lib/scriptEventsHandlers/handlerTypes";
import {
  detectModuleSystem,
  createMockRequire,
  validateHandlerMetadata,
  createHandlerBase,
  finalizeHandler,
  noReadFileFn,
  convertESMToCommonJS,
} from "./handlerCommon";

export const QuickJS = newQuickJSWASMModuleFromVariant(quickJSVariant);

const TIMEOUT_MS = 60000;

/**
 * Proxy factory for creating lazy proxies in the VM
 */
const PROXY_FACTORY_SRC = `
  (function(moduleName, invoker, proxyFactory) {
    const handler = {
      get(_t, prop) {        
        if (prop === Symbol.iterator) {
          const isArray = invoker(moduleName, '__IS_ARRAY__', []);
          if (isArray) {
            return function* () {
              const keys = invoker(moduleName, '__KEYS__', []);
              if (Array.isArray(keys)) {
                for (let i = 0; i < keys.length; i++) {
                  yield invoker(moduleName, String(i), []);
                }
              }
            };
          }
          return undefined;
        }
        
        const value = invoker(moduleName, String(prop), []);
        
        if (value && typeof value === 'object' && value.__PROXY_MARKER__) {
          return proxyFactory(value.__PROXY_MARKER__, invoker, proxyFactory);
        }
        
        if (typeof value === 'function') {
          return (...args) => invoker(moduleName, String(prop), ['__CALL__', ...args]);
        }
        
        return value;
      },
      set(_t, prop, value) {
        invoker(moduleName, String(prop), ['__SET__', value]);
        return true;
      },
      ownKeys(_t) {
        const keys = invoker(moduleName, '__KEYS__', []);
        return Array.isArray(keys) ? keys : [];
      },
      has(_t, prop) {
        const result = invoker(moduleName, '__HAS__', [String(prop)]);
        return !!result;
      },
      getOwnPropertyDescriptor(_t, prop) {
        const exists = invoker(moduleName, '__HAS__', [String(prop)]);
        if (exists) {
          return {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.get(_t, prop)
          };
        }
        return undefined;
      },
      apply(_t, _thisArg, argArray) {
        return invoker(moduleName, '', ['__CALL__', ...argArray]);
      }
    };
    
    const hostObjType = invoker(moduleName, '__GET_TYPE__', []);
    const isArray = invoker(moduleName, '__IS_ARRAY__', []);
    const target = (hostObjType === 'function') ? function(){} : (isArray ? [] : {});
    return new Proxy(target, handler);
  })
`;

/**
 * Creates invoke handler for proxy system
 */
const createOnInvokeHandler = (
  hostRegistry: Map<string, unknown>,
  createProxy: (value: unknown) => { proxyId: string; needsProxy: boolean },
): ((module: string, path: string, args: unknown[]) => unknown) => {
  return (module: string, path: string, args: unknown[]) => {
    const hostObj = hostRegistry.get(module);
    if (!hostObj) {
      throw new Error(`Module ${module} not found in host registry`);
    }

    if (path === "__GET_TYPE__") {
      return typeof hostObj;
    }

    if (path === "__IS_ARRAY__") {
      return Array.isArray(hostObj);
    }

    if (path === "__KEYS__") {
      if (Array.isArray(hostObj)) {
        return hostObj.map((_, i) => String(i));
      }
      return Object.keys(hostObj as object);
    }

    if (path === "__HAS__") {
      const [prop] = args;
      return Object.prototype.hasOwnProperty.call(hostObj, String(prop));
    }

    if (args.length > 0 && args[0] === "__SET__") {
      const [, value] = args;
      if (hostObj && typeof hostObj === "object") {
        const existingValue = (hostObj as Record<string, unknown>)[path];
        // Prevent replacing functions
        if (typeof existingValue === "function") {
          return undefined;
        }
        (hostObj as Record<string, unknown>)[path] = value;
        return undefined;
      }
      return undefined;
    }

    if (args.length > 0 && args[0] === "__CALL__") {
      const [, ...callArgs] = args;
      if (typeof hostObj === "function") {
        return (hostObj as Function)(...callArgs);
      }

      const prop = (hostObj as Record<string, unknown>)[path];
      if (typeof prop === "function") {
        if (Array.isArray(hostObj)) {
          return (prop as Function).call(hostObj, ...callArgs);
        }
        return (prop as Function).call(hostObj, ...callArgs);
      }

      throw new Error(`Property ${path} is not a function`);
    }

    // Regular property access
    if (hostObj && typeof hostObj === "object") {
      const value = (hostObj as Record<string, unknown>)[path];
      if (value !== null && value !== undefined && typeof value === "object") {
        const { proxyId, needsProxy } = createProxy(value);
        if (needsProxy) {
          return { __PROXY_MARKER__: proxyId };
        }
      }

      return value;
    }

    return undefined;
  };
};

/**
 * Creates host invoke function for the proxy system
 */
const createHostInvokeFn = (
  vm: QuickJSContext,
  onInvoke: (module: string, path: string, args: unknown[]) => unknown,
  jsValueToHandle: (val: unknown, useProxies: boolean) => QuickJSHandle,
  handleToJsValue: (handle: QuickJSHandle) => unknown,
  vmHandleRegistry: Map<string, QuickJSHandle>,
) => {
  return vm.newFunction("hostInvoke", (moduleH, pathH, argsH) => {
    const module = vm.getString(moduleH);
    const path = vm.getString(pathH);

    const argsType = vm.typeof(argsH);
    let args: unknown[];

    if (argsType === "object" && argsH !== vm.null) {
      const lengthProp = vm.getProp(argsH, "length");
      const length = vm.getNumber(lengthProp);
      lengthProp.dispose();

      args = [];
      for (let i = 0; i < length; i++) {
        const elementHandle = vm.getProp(argsH, String(i));

        const elementType = vm.typeof(elementHandle);
        if (elementType === "function") {
          const funcId = `arg_func_${Date.now()}_${i}_${Math.random()}`;
          vmHandleRegistry.set(funcId, elementHandle);

          args[i] = (...callArgs: unknown[]) => {
            const storedHandle = vmHandleRegistry.get(funcId);
            if (!storedHandle) {
              throw new Error(`Function handle ${funcId} not found`);
            }

            const argHandles = callArgs.map((arg) =>
              jsValueToHandle(arg, true),
            );
            try {
              const result = vm.callFunction(
                storedHandle,
                vm.undefined,
                ...argHandles,
              );
              if (result.error) {
                const error = vm.dump(result.error);
                result.error.dispose();
                throw new Error(
                  `Callback function failed: ${JSON.stringify(error)}`,
                );
              }
              const returnValue = vm.dump(result.value);
              result.value.dispose();
              return returnValue;
            } finally {
              argHandles.forEach((h) => h.dispose());
            }
          };
        } else {
          const elementType = vm.typeof(elementHandle);
          if (elementType === "object" && elementHandle !== vm.null) {
            args[i] = handleToJsValue(elementHandle);
          } else {
            args[i] = vm.dump(elementHandle);
          }
          elementHandle.dispose();
        }
      }
    } else {
      args = [vm.dump(argsH)];
    }

    const result = onInvoke(module, path, args);

    // Convert result back to VM handle
    if (result === null) return vm.null;
    if (result === undefined) return vm.undefined;
    if (typeof result === "boolean") return result ? vm.true : vm.false;
    if (typeof result === "number") return vm.newNumber(result);
    if (typeof result === "string") return vm.newString(result);
    if (typeof result === "object" || typeof result === "function") {
      // Check if this is a proxy marker - if so, return it as-is so the VM can handle it
      if (
        result &&
        typeof result === "object" &&
        "__PROXY_MARKER__" in result &&
        Object.keys(result).length === 1
      ) {
        const markerObj = vm.newObject();
        const proxyIdHandle = vm.newString(
          (result as { __PROXY_MARKER__: string }).__PROXY_MARKER__,
        );
        vm.setProp(markerObj, "__PROXY_MARKER__", proxyIdHandle);
        proxyIdHandle.dispose();
        return markerObj;
      }
      return jsValueToHandle(result, false);
    }

    return vm.undefined;
  });
};

/**
 * Persistent VM wrapper maintaining QuickJS context across function calls.
 */
class PersistentVM {
  private vm: QuickJSContext;
  private runtime: QuickJSRuntime;
  private moduleExports: QuickJSHandle | null = null;
  private hostFunctionRegistry = new Map<string, unknown>();
  private vmHandleRegistry = new Map<string, QuickJSHandle>();
  private proxyFactory: QuickJSHandle;
  private hostInvokeFn: QuickJSHandle;
  private onInvokeHandler: (
    module: string,
    path: string,
    args: unknown[],
  ) => unknown;

  constructor(vm: QuickJSContext, runtime: QuickJSRuntime) {
    this.vm = vm;
    this.runtime = runtime;
    this.setupGlobalEnvironment();

    // Setup proxy system
    const createProxyHelper = (value: unknown) => {
      const proxyId = `proxy_${uuid()}`;
      const needsProxy =
        value !== null &&
        value !== undefined &&
        (typeof value === "object" || typeof value === "function");
      if (needsProxy) {
        this.hostFunctionRegistry.set(proxyId, value);
      }
      return { proxyId, needsProxy };
    };

    this.onInvokeHandler = createOnInvokeHandler(
      this.hostFunctionRegistry,
      createProxyHelper,
    );

    this.hostInvokeFn = createHostInvokeFn(
      this.vm,
      this.onInvokeHandler,
      this.jsValueToHandle.bind(this),
      this.handleToJsValue.bind(this),
      this.vmHandleRegistry,
    );

    const factoryEval = this.vm.evalCode(PROXY_FACTORY_SRC);
    if (factoryEval.error) {
      const err = this.vm.dump(factoryEval.error);
      factoryEval.error.dispose();
      throw new Error("Failed to install proxy factory: " + String(err));
    }
    this.proxyFactory = factoryEval.value;
  }

  /**
   * Creates a lazy proxy for objects and arrays
   */
  private createLazyProxy(hostObj: unknown): QuickJSHandle {
    const proxyId = `proxy_${uuid()}`;

    this.hostFunctionRegistry.set(proxyId, hostObj);

    const proxyIdHandle = this.vm.newString(proxyId);
    const proxyResult = this.vm.callFunction(
      this.proxyFactory,
      this.vm.undefined,
      proxyIdHandle,
      this.hostInvokeFn,
      this.proxyFactory,
    );
    proxyIdHandle.dispose();

    if (proxyResult.error) {
      const err = this.vm.dump(proxyResult.error);
      proxyResult.error.dispose();
      throw new Error("Failed to create proxy: " + String(err));
    }

    return proxyResult.value;
  }

  private setupGlobalEnvironment() {
    this.runtime.setInterruptHandler(
      shouldInterruptAfterDeadline(Date.now() + TIMEOUT_MS),
    );

    const consoleObj = this.vm.newObject();
    this.vm.setProp(this.vm.global, "console", consoleObj);

    const logFn = this.vm.newFunction("log", (...args) => {
      if (process.env.NODE_ENV !== "production") {
        const jsArgs = args.map((arg) => this.vm.dump(arg));
        console.log(...jsArgs);
      }
      return this.vm.undefined;
    });
    this.vm.setProp(consoleObj, "log", logFn);

    const warnFn = this.vm.newFunction("warn", (...args) => {
      if (process.env.NODE_ENV !== "production") {
        const jsArgs = args.map((arg) => this.vm.dump(arg));
        console.warn(...jsArgs);
      }
      return this.vm.undefined;
    });
    this.vm.setProp(consoleObj, "warn", warnFn);

    const errorFn = this.vm.newFunction("error", (...args) => {
      if (process.env.NODE_ENV !== "production") {
        const jsArgs = args.map((arg) => this.vm.dump(arg));
        console.error(...jsArgs);
      }
      return this.vm.undefined;
    });
    this.vm.setProp(consoleObj, "error", errorFn);

    const moduleObj = this.vm.newObject();
    this.vm.setProp(this.vm.global, "module", moduleObj);

    logFn.dispose();
    warnFn.dispose();
    errorFn.dispose();
    consoleObj.dispose();
    moduleObj.dispose();
  }

  /**
   * Sets up mock require for file reading and plugin API
   */
  setupMockRequire(readFile: FileReaderFn) {
    const mockRequire = createMockRequire(readFile);

    this.runtime.setModuleLoader((moduleName) => {
      const mockModule = mockRequire[moduleName];

      let namedExports = "";
      if (mockModule && typeof mockModule === "object") {
        const exportStatements = Object.keys(mockModule)
          .filter(
            (key) =>
              key !== "default" &&
              typeof (mockModule as Record<string, unknown>)[key] !==
                "undefined",
          )
          .map((key) => `export const ${key} = _module?.${key};`)
          .join("\n        ");
        namedExports = exportStatements;
      }

      const escapedModuleName = moduleName.replace(/["\\]/g, (m) => `\\${m}`);

      return `
        const _module = require("${escapedModuleName}");
        export default _module.default || _module;
        ${namedExports}
      `;
    });

    const requireFn = this.vm.newFunction("require", (moduleNameHandle) => {
      const moduleName = this.vm.dump(moduleNameHandle) as string;
      const module = mockRequire[moduleName];
      if (!module) {
        throw new Error(`Module '${moduleName}' not found`);
      }
      if (module && typeof module === "object" && this.proxyFactory) {
        return this.createLazyProxy(module);
      } else {
        return this.jsValueToHandle(module, false);
      }
    });

    this.vm.setProp(this.vm.global, "require", requireFn);
    requireFn.dispose();
  }

  /**
   * Executes code and stores module exports
   */
  executeCode(code: string, filename: string): void {
    this.runtime.setInterruptHandler(
      shouldInterruptAfterDeadline(Date.now() + TIMEOUT_MS),
    );

    const moduleType = detectModuleSystem(code);

    if (moduleType === "module") {
      const result = this.vm.evalCode(code, filename, { type: "module" });

      if (result.error) {
        const error = this.vm.dump(result.error);
        result.error.dispose();
        throw new Error(`VM execution failed: ${JSON.stringify(error)}`);
      }

      this.moduleExports = result.value;
    } else {
      const wrappedCode = `
        const module = { exports: {} };
        const exports = module.exports;
        ${code}
        module.exports;
      `;
      const result = this.vm.evalCode(wrappedCode, filename);

      if (result.error) {
        const error = this.vm.dump(result.error);
        result.error.dispose();
        throw new Error(`VM execution failed: ${JSON.stringify(error)}`);
      }

      this.moduleExports = result.value;
    }
  }

  /**
   * Converts JS value to VM handle with selective proxy optimization
   */
  private jsValueToHandle(value: unknown, useProxies: boolean): QuickJSHandle {
    if (value === null) return this.vm.null;
    if (value === undefined) return this.vm.undefined;

    switch (typeof value) {
      case "boolean":
        return value ? this.vm.true : this.vm.false;
      case "number":
        return this.vm.newNumber(value);
      case "string":
        return this.vm.newString(value);
      case "function":
        return this.vm.newFunction(value.name || "anonymous", (...vmArgs) => {
          const jsArgs = vmArgs.map((arg) => this.handleToJsValue(arg));
          const result = (value as Function)(...jsArgs);
          return this.jsValueToHandle(result, useProxies);
        });
      case "object":
        if (useProxies) {
          return this.createLazyProxy(value);
        }

        // Handle arrays
        if (Array.isArray(value)) {
          const arr = this.vm.newArray();
          value.forEach((item, index) => {
            const itemHandle = this.jsValueToHandle(item, useProxies);
            this.vm.setProp(arr, String(index), itemHandle);
            itemHandle.dispose();
          });
          return arr;
        }

        const obj = this.vm.newObject();

        for (const [key, val] of Object.entries(value)) {
          if (typeof val === "function") {
            const fn = this.vm.newFunction(key, (...vmArgs) => {
              const jsArgs = vmArgs.map((arg) => this.handleToJsValue(arg));
              const result = (val as Function)(...jsArgs);
              return this.jsValueToHandle(result, useProxies);
            });
            this.vm.setProp(obj, key, fn);
            fn.dispose();
          } else {
            const valHandle = this.jsValueToHandle(val, useProxies);
            this.vm.setProp(obj, key, valHandle);
            valHandle.dispose();
          }
        }
        return obj;
      default:
        return this.vm.undefined;
    }
  }

  /**
   * Converts VM handle to JS value with function pass-through handling
   */
  private handleToJsValue(handle: QuickJSHandle): unknown {
    const type = this.vm.typeof(handle);

    switch (type) {
      case "undefined":
        return undefined;
      case "boolean":
      case "number":
      case "string":
        return this.vm.dump(handle);
      case "object": {
        if (handle === this.vm.null) {
          return null;
        }

        const isArrayResult = this.vm.getProp(handle, "length");
        if (isArrayResult && this.vm.typeof(isArrayResult) === "number") {
          const length = this.vm.dump(isArrayResult) as number;
          isArrayResult.dispose();

          const result: unknown[] = [];
          for (let i = 0; i < length; i++) {
            const itemHandle = this.vm.getProp(handle, String(i));
            result[i] = this.handleToJsValue(itemHandle);
            itemHandle.dispose();
          }
          return result;
        }
        if (isArrayResult) {
          isArrayResult.dispose();
        }

        const keysResult = this.vm.evalCode("Object.keys");
        if (!keysResult.error) {
          const keysFn = keysResult.value;
          const objKeysResult = this.vm.callFunction(
            keysFn,
            this.vm.undefined,
            handle,
          );
          keysFn.dispose();

          if (!objKeysResult.error) {
            const keys = this.vm.dump(objKeysResult.value) as string[];
            objKeysResult.value.dispose();

            const result: Record<string, unknown> = {};

            for (const key of keys) {
              if (key === "toString") continue;

              const propHandle = this.vm.getProp(handle, key);

              const propType = this.vm.typeof(propHandle);

              if (propType === "function") {
                const funcId = `func_${uuid()}`;

                this.vmHandleRegistry.set(funcId, propHandle);

                const persistentFn = (...args: unknown[]) => {
                  this.runtime.setInterruptHandler(
                    shouldInterruptAfterDeadline(Date.now() + TIMEOUT_MS),
                  );

                  const storedHandle = this.vmHandleRegistry.get(funcId);
                  if (!storedHandle) {
                    throw new Error(`Function handle ${funcId} not found`);
                  }

                  const argHandles = args.map((arg) =>
                    this.jsValueToHandle(arg, true),
                  );
                  let result;

                  try {
                    result = this.vm.callFunction(
                      storedHandle,
                      this.vm.undefined,
                      ...argHandles,
                    );

                    if (result.error) {
                      const error = this.vm.dump(result.error);
                      result.error.dispose();
                      throw new Error(
                        `VM function call failed: ${JSON.stringify(error)}`,
                      );
                    }

                    const returnValue = this.handleToJsValue(result.value);
                    result.value.dispose();
                    return returnValue;
                  } finally {
                    argHandles.forEach((h) => h.dispose());
                  }
                };

                this.hostFunctionRegistry.set(funcId, persistentFn);
                result[key] = persistentFn;
              } else {
                result[key] = this.handleToJsValue(propHandle);
                propHandle.dispose();
              }
            }

            return result;
          } else {
            objKeysResult.error.dispose();
          }
        } else {
          keysResult.error.dispose();
        }

        return this.vm.dump(handle);
      }
      case "function": {
        throw new Error("Function handles are not supported here");
      }
      default:
        return this.vm.dump(handle);
    }
  }

  /**
   * Calls a function on the module exports
   */
  callModuleFunction(functionName: string, args: unknown[]): unknown {
    if (!this.moduleExports) {
      throw new Error("No module exports available");
    }

    this.runtime.setInterruptHandler(
      shouldInterruptAfterDeadline(Date.now() + TIMEOUT_MS),
    );

    const fnHandle = this.vm.getProp(this.moduleExports, functionName);

    if (this.vm.typeof(fnHandle) === "undefined") {
      fnHandle.dispose();
      throw new Error(`Function ${functionName} not found in module exports`);
    }

    const argHandles = args.map((arg) => {
      if (arg && typeof arg === "object") {
        return this.createLazyProxy(arg);
      } else {
        return this.jsValueToHandle(arg, false);
      }
    });

    let result;

    try {
      result = this.vm.callFunction(fnHandle, this.vm.undefined, ...argHandles);

      if (result.error) {
        const error = this.vm.dump(result.error);
        result.error.dispose();
        if ("message" in error && typeof error.message === "string") {
          if (error.message === "interrupted") {
            error.message = `Plugin ${functionName}() timed out after ${TIMEOUT_MS}ms`;
          }
        }
        throw new Error(
          `Module function call failed: ${JSON.stringify(error)}`,
        );
      }

      const returnValue = this.handleToJsValue(result.value);
      result.value.dispose();
      return returnValue;
    } finally {
      argHandles.forEach((h) => h.dispose());
      fnHandle.dispose();
    }
  }

  /**
   * Gets a property from module exports
   */
  getModuleProperty(propertyName: string): unknown {
    if (!this.moduleExports) {
      return undefined;
    }

    const propHandle = this.vm.getProp(this.moduleExports, propertyName);

    const value = this.handleToJsValue(propHandle);
    propHandle.dispose();
    return value;
  }

  /**
   * Checks if module exports has a property
   */
  hasModuleProperty(propertyName: string): boolean {
    if (!this.moduleExports) {
      return false;
    }

    const propHandle = this.vm.getProp(this.moduleExports, propertyName);

    const propType = this.vm.typeof(propHandle);
    const hasProperty =
      propHandle !== this.vm.undefined && propType !== "undefined";
    propHandle.dispose();
    return hasProperty;
  }

  /**
   * Cleans up VM resources
   */
  dispose(): void {
    if (this.moduleExports) {
      this.moduleExports.dispose();
      this.moduleExports = null;
    }

    this.proxyFactory.dispose();
    this.hostInvokeFn.dispose();

    for (const handle of this.vmHandleRegistry.values()) {
      handle.dispose();
    }
    this.vmHandleRegistry.clear();

    this.vm.dispose();
    this.runtime.dispose();
    this.hostFunctionRegistry.clear();
  }
}

/**
 * Creates a new persistent VM instance
 */
const createPersistentVM = async (): Promise<PersistentVM> => {
  const runtime = (await QuickJS).newRuntime();
  const vm = runtime.newContext();
  return new PersistentVM(vm, runtime);
};

/**
 * Loads script event handlers in isolated QuickJS environment for security.
 */
export const loadScriptEventHandlerFromUntrustedString = async (
  code: string,
  filename: string,
  readFile: FileReaderFn = noReadFileFn,
): Promise<ScriptEventHandlerWithCleanup> => {
  const persistentVM = await createPersistentVM();

  try {
    persistentVM.setupMockRequire(readFile);
    persistentVM.executeCode(convertESMToCommonJS(code), filename);

    const metadata = {
      id: persistentVM.getModuleProperty("id"),
      name: persistentVM.getModuleProperty("name"),
      description: persistentVM.getModuleProperty("description"),
      fields: persistentVM.getModuleProperty("fields"),
      groups: persistentVM.getModuleProperty("groups"),
      subGroups: persistentVM.getModuleProperty("subGroups"),
      weight: persistentVM.getModuleProperty("weight"),
      deprecated: persistentVM.getModuleProperty("deprecated"),
      editableSymbol: persistentVM.getModuleProperty("editableSymbol"),
      allowChildrenBeforeInitFade: persistentVM.getModuleProperty(
        "allowChildrenBeforeInitFade",
      ),
      waitUntilAfterInitFade: persistentVM.getModuleProperty(
        "waitUntilAfterInitFade",
      ),
      helper: persistentVM.getModuleProperty("helper"),
      presets: persistentVM.getModuleProperty("presets"),
      userPresetsGroups: persistentVM.getModuleProperty("userPresetsGroups"),
      userPresetsIgnore: persistentVM.getModuleProperty("userPresetsIgnore"),
    };

    const hasAutoLabel = persistentVM.hasModuleProperty("autoLabel");

    validateHandlerMetadata(metadata, filename);

    const baseHandler = createHandlerBase(metadata, hasAutoLabel, () =>
      persistentVM.dispose(),
    );

    const handler: ScriptEventHandlerWithCleanup = {
      ...baseHandler,
      hasAutoLabel,
      autoLabel: hasAutoLabel
        ? (
            fetchArg: (key: string) => string,
            input: Record<string, unknown>,
          ) => {
            const result = persistentVM.callModuleFunction("autoLabel", [
              fetchArg,
              input,
            ]);
            return result as string;
          }
        : undefined,
      compile: (input: unknown, helpers: unknown) => {
        persistentVM.callModuleFunction("compile", [input, helpers]);
      },
    };

    finalizeHandler(handler);

    return handler;
  } catch (error) {
    persistentVM.dispose();
    throw error;
  }
};
