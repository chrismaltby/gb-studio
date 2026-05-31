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
