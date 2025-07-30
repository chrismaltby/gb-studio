type LinkEntityType = "scene" | "actor" | "trigger" | "customEvent" | "sprite";

export type ParsedResourceTextSegment =
  | { type: "text"; value: string }
  | {
      type: "link";
      linkText: string;
      entityId: string;
      entityType: LinkEntityType;
      sceneId?: string;
    };

export const createLinkToResource = (
  label: string,
  id: string,
  type: LinkEntityType,
  sceneId = "",
): string => {
  return `|@@|${label}|@|${id}|@|${type}|@|${sceneId}|@@|`;
};

export const parseLinkedText = (text: string): ParsedResourceTextSegment[] => {
  const regex =
    /\|@@\|(.+?)\|@\|(.+?)\|@\|(scene|actor|trigger|customEvent|sprite)\|@\|\|@@\|/g;
  const segments: ParsedResourceTextSegment[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    const [, linkText, entityId, entityType] = match;

    segments.push({
      type: "link",
      linkText,
      entityId,
      entityType: entityType as LinkEntityType,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
};
