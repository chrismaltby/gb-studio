import { Type, Static } from "@sinclair/typebox";

export const PluginType = Type.Union(
  [
    Type.Literal("assetPack"),
    Type.Literal("enginePlugin"),
    Type.Literal("eventsPlugin"),
    Type.Literal("theme"),
  ],
  { default: "assetPack" }
);

export type PluginType = Static<typeof PluginType>;

export const PluginMetadata = Type.Object({
  id: Type.String(),
  type: PluginType,
  version: Type.String(),
  gbsVersion: Type.String(),
  name: Type.String(),
  author: Type.String(),
  description: Type.String(),
  url: Type.Optional(Type.String()),
  images: Type.Optional(Type.Array(Type.String())),
  filename: Type.String(),
});

export type PluginMetadata = Static<typeof PluginMetadata>;

export const PluginRepositoryMetadata = Type.Object({
  id: Type.String(),
  name: Type.String(),
  shortName: Type.String(),
  author: Type.String(),
  description: Type.String(),
  url: Type.Optional(Type.String()),
  plugins: Type.Array(PluginMetadata),
});

export type PluginRepositoryMetadata = Static<typeof PluginRepositoryMetadata>;
