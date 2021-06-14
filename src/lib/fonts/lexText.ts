type Token =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "font";
      fontId: string;
    }
  | {
      type: "variable";
      variableId: string;
    }
  | {
      type: "char";
      variableId: string;
    }
  | {
      type: "speed";
      speed: number;
    };

export const lexText = (inputText: string): Token[] => {
  const tokens: Token[] = [];

  for (let i = 0; i < inputText.length; i++) {
    // Check for font change
    if (
      inputText[i] === "!" &&
      inputText[i + 1] === "F" &&
      inputText[i + 2] === ":"
    ) {
      const fontId = inputText.substring(i + 3, i + 40).replace(/!.*/, "");
      i += fontId.length + 3;
      tokens.push({
        type: "font",
        fontId,
      });
      continue;
    }
    // Check for variable
    if (inputText[i] === "$") {
      const variableMatch = inputText
        .substring(i)
        .match(/(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length - 1;
        tokens.push({
          type: "variable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      }
      continue;
    }
    // Check for character variable
    if (inputText[i] === "#") {
      const variableMatch = inputText
        .substring(i)
        .match(/(#L[0-9]#|#T[0-1]#|#V[0-9]#|#[0-9]+#)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length - 1;
        tokens.push({
          type: "char",
          variableId: variableMatch.replace(/#/g, ""),
        });
      }
      continue;
    }
    // Check for speed codes
    if (
      inputText[i] === "!" &&
      inputText[i + 1] === "S" &&
      inputText[i + 2].match(/[0-5]/) &&
      inputText[i + 3] === "!"
    ) {
      const speed = Number(inputText[i + 2]);
      tokens.push({
        type: "speed",
        speed,
      });
      i += 3;
      continue;
    }

    // Add as text token
    const lastToken = tokens[tokens.length - 1];
    if (lastToken?.type === "text") {
      lastToken.value += inputText[i];
    } else {
      tokens.push({
        type: "text",
        value: inputText[i],
      });
    }
  }
  return tokens;
};
