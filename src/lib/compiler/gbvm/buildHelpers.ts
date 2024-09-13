import SparkMD5 from "spark-md5";

export const anonymizeGBVMScript = (input: string): string => {
  const functionNameMatch = input.match(/_([^:\s]*)::/);
  if (!functionNameMatch) return input;
  const functionName = functionNameMatch[1];
  const globalReferencePattern = new RegExp(functionName, "gm");
  const placeholderReferencePattern = new RegExp(
    "__PLACEHOLDER\\|" + functionName + "[^|]*\\|PLACEHOLDER__",
    "gm"
  );

  return input
    .replace(globalReferencePattern, "SCRIPT")
    .replace(/^(.globl |)(GBVM\$|GBVM_END\$).*$/gm, "") // Strip debugger comments
    .replace(placeholderReferencePattern, "SCRIPT"); // Strip recursive placeholders
};

export const gbvmScriptChecksum = (input: string): string => {
  return SparkMD5.hash(anonymizeGBVMScript(input));
};
