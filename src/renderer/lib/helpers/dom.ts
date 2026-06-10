export const getEventNodeName = (e: unknown) => {
  if (!e) {
    return "";
  }
  return (
    (
      e as {
        target?: {
          nodeName?: string;
        };
      }
    ).target?.nodeName ?? ""
  );
};

export const getDeepActiveElement = (): Element | null => {
  let activeElement: Element | null = document.activeElement;

  while (
    activeElement instanceof HTMLElement &&
    activeElement.shadowRoot?.activeElement
  ) {
    activeElement = activeElement.shadowRoot.activeElement;
  }

  return activeElement;
};

const selectableInputTypes = new Set([
  "",
  "text",
  "search",
  "url",
  "tel",
  "password",
  "email",
  "number",
]);

export const canPerformSelectAll = (element: Element | null): boolean => {
  if (!element) {
    return false;
  }

  if (element instanceof HTMLInputElement) {
    return !element.disabled && selectableInputTypes.has(element.type);
  }

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled;
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    return true;
  }

  return false;
};

export const performSelectAll = (element: Element): boolean => {
  if (!canPerformSelectAll(element)) {
    return false;
  }

  if (element instanceof HTMLInputElement) {
    element.select();
    return true;
  }

  if (element instanceof HTMLTextAreaElement) {
    element.select();
    return true;
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    const selection = window.getSelection();

    if (!selection) {
      return false;
    }

    const range = document.createRange();
    range.selectNodeContents(element);

    selection.removeAllRanges();
    selection.addRange(range);

    return true;
  }

  return false;
};
