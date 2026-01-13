/**
 * Trusted Script Event Handler Loader
 *
 * Executes handler code using native eval for trusted contexts.
 */

import type {
  FileReaderFn,
  ScriptEventHandler,
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

/**
 * Loads script event handlers using native eval for trusted code execution.
 */
export const loadScriptEventHandlerFromTrustedString = async (
  code: string,
  filename: string,
  readFile: FileReaderFn = noReadFileFn,
): Promise<ScriptEventHandlerWithCleanup> => {
  try {
    // Execute handler code with ES module conversion
    let metadata: unknown;
    try {
      const moduleSystem = detectModuleSystem(code);
      let processedCode = code;

      if (moduleSystem === "module") {
        processedCode = convertESMToCommonJS(code);
      }

      // Create controlled sandbox with mock modules
      const mockRequire = createMockRequire(readFile);
      const sandbox = {
        module: { exports: {} },
        require: (moduleName: string): unknown => {
          if (mockRequire[moduleName]) {
            return mockRequire[moduleName];
          }
          throw new Error(`Module '${moduleName}' not found in mock modules`);
        },
      };

      // Prepare sandbox variable declarations
      const contextSetup = Object.keys(sandbox)
        .map((key) => `var ${key} = arguments[0].${key};`)
        .join("\n");

      const wrappedCode = `
        ${contextSetup}
        ${processedCode}
        return module.exports;
      `;

      // Execute code with eval (must be trusted)
      // eslint-disable-next-line no-new-func
      const vmFunction = new Function(wrappedCode);
      metadata = vmFunction.call(null, sandbox);
    } catch (error) {
      throw error;
    }

    // Validate required handler metadata
    validateHandlerMetadata(metadata, filename);

    // Store module exports for function calling
    const moduleExports = metadata as Record<string, unknown>;
    const hasAutoLabelFunction = typeof moduleExports.autoLabel === "function";

    // No-op cleanup for eval-based execution
    const cleanup = () => {};

    // Direct function calls without VM overhead
    const callModuleFunction = (
      functionName: string,
      args: unknown[],
    ): unknown => {
      const targetFunction = moduleExports[functionName];
      if (typeof targetFunction === "function") {
        return (targetFunction as (...args: unknown[]) => unknown).apply(
          moduleExports,
          args,
        );
      }
      throw new Error(`Function '${functionName}' not found in module exports`);
    };

    // Create base handler using shared utilities
    const handler = createHandlerBase(
      metadata as Record<string, unknown>,
      hasAutoLabelFunction,
      cleanup,
    ) as ScriptEventHandler & { cleanup: () => void };

    // Add execution-specific methods
    handler.autoLabel = hasAutoLabelFunction
      ? (lookup: (key: string) => string, input: Record<string, unknown>) => {
          try {
            const result = callModuleFunction("autoLabel", [lookup, input]);
            if (typeof result === "string") {
              return result;
            }
            return undefined;
          } catch (error) {
            throw error;
          }
        }
      : undefined;

    handler.compile = (input: unknown, helpers: unknown) => {
      try {
        callModuleFunction("compile", [input, helpers]);
      } catch (error) {
        throw error;
      }
    };

    // Finalize handler with lookup tables and validation
    finalizeHandler(handler);

    return handler;
  } catch (error) {
    throw error;
  }
};
