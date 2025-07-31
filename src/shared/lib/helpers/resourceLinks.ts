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
  const escapedLabel = label.replace(/@/g, "@@@");
  return `|@@|${escapedLabel}|@|${id}|@|${type}|@|${sceneId}|@@|`;
};

export const parseLinkedText = (text: string): ParsedResourceTextSegment[] => {
  const regex =
    /\|@@\|(.+?)\|@\|(.+?)\|@\|(scene|actor|trigger|customEvent|sprite)\|@\|(.*?)\|@@\|/g;
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

    const [, linkText, entityId, entityType, sceneId] = match;

    segments.push({
      type: "link",
      linkText: linkText.replace(/@@@/g, "@"),
      entityId,
      entityType: entityType as LinkEntityType,
      ...(sceneId && { sceneId }),
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
};
