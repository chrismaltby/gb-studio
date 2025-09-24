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
} from "./handlerCommon";

/**
 * Converts ES modules to CommonJS for eval compatibility.
 */
const convertESMToCommonJS = (code: string): string => {
  let convertedCode = code;

  // Convert export default statements
  convertedCode = convertedCode.replace(
    /export\s+default\s+(.+?)(?:;|$)/gm,
    "module.exports = $1;",
  );

  // Convert named exports
  convertedCode = convertedCode.replace(
    /export\s*\{\s*([^}]+)\s*\}\s*;?/gm,
    (match, exports) => {
      const exportList = exports
        .split(",")
        .map((exp: string) => exp.trim())
        .filter((exp: string) => exp);
      return `module.exports = { ${exportList.join(", ")} };`;
    },
  );

  // Track individual exports to build a combined module.exports
  const individualExports: string[] = [];

  // Convert individual export declarations like "export const id = 'value'"
  convertedCode = convertedCode.replace(
    /export\s+(const|let|var|function|class)\s+(\w+)(\s*=\s*[^;]+)?/gm,
    (match, keyword, name, assignment) => {
      individualExports.push(name);
      if (assignment) {
        return `${keyword} ${name}${assignment}`;
      } else {
        return `${keyword} ${name}`;
      }
    },
  );

  // If we found individual exports, add them to module.exports
  if (individualExports.length > 0) {
    const exportsAssignment = individualExports
      .map((name) => `${name}`)
      .join(", ");
    convertedCode += `\nmodule.exports = { ${exportsAssignment} };`;
  }

  // Convert import statements to require calls
  convertedCode = convertedCode.replace(
    /import\s+(\w+)\s+from\s+['"](.+?)['"];?\s*$/gm,
    (match, varName, moduleName) => {
      return `const _mod_${varName} = require("${moduleName}"); const ${varName} = _mod_${varName}.default || _mod_${varName}.${varName} || _mod_${varName};`;
    },
  );

  convertedCode = convertedCode.replace(
    /import\s*\{\s*([^}]+)\s*\}\s*from\s+['"](.+?)['"];?\s*$/gm,
    'const { $1 } = require("$2");',
  );

  return convertedCode;
};

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
            return String(result);
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
