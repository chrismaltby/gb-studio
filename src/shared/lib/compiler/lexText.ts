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
      fixedLength?: number;
    }
  | {
      type: "char";
      variableId: string;
    }
  | {
      type: "speed";
      speed: number;
    }
  | {
      type: "speedVariable";
      variableId: string;
    }
  | {
      type: "fontVariable";
      variableId: string;
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

    // Check for printf variable %d
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "d" &&
      inputText[i + 2] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 2)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length + 1;
        tokens.push({
          type: "variable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for printf variable %D
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "D" &&
      inputText[i + 3] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 3)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        tokens.push({
          type: "variable",
          variableId: variableMatch.replace(/\$/g, ""),
          fixedLength: parseInt(inputText[i + 2]) ?? 1,
        });
        i += variableMatch.length + 2;
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for printf variable char code %c
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "c" &&
      inputText[i + 2] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 2)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length + 1;
        tokens.push({
          type: "char",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for printf variable speed %t
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "t" &&
      inputText[i + 2] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 2)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length + 1;
        tokens.push({
          type: "speedVariable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for printf variable font %f
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "f" &&
      inputText[i + 2] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 2)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length + 1;
        tokens.push({
          type: "fontVariable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for variable
    if (inputText[i] === "$") {
      const variableMatch = inputText
        .substring(i)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length - 1;
        tokens.push({
          type: "variable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }
    // Check for character variable
    if (inputText[i] === "#") {
      const variableMatch = inputText
        .substring(i)
        .match(/^(#L[0-9]#|#T[0-1]#|#V[0-9]#|#[0-9]+#)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length - 1;
        tokens.push({
          type: "char",
          variableId: variableMatch.replace(/#/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }
    // Check for speed codes
    if (
      inputText[i] === "!" &&
      inputText[i + 1] === "S" &&
      inputText[i + 2]?.match(/[0-5]/) &&
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
