import SparkMD5 from "spark-md5";

export const anonymizeGBVMScript = (input: string): string => {
  const functionNameMatch = input.match(/_([^:\s]*)::/);
  if (!functionNameMatch) return input;
  const functionName = functionNameMatch[1];
  const globalReferencePattern = new RegExp(functionName, "gm");
  return input
    .replace(globalReferencePattern, "SCRIPT")
    .replace(/^(.globl |)GBVM\$.*$/gm, ""); // Strip debugger comments
};

export const gbvmScriptChecksum = (input: string): string => {
  return SparkMD5.hash(anonymizeGBVMScript(input));
};
