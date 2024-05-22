const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export const sortByName = (a: { name: string }, b: { name: string }) => {
  return collator.compare(a.name, b.name);
};

export const sortByLabel = (a: { label: string }, b: { label: string }) => {
  return collator.compare(a.label, b.label);
};
