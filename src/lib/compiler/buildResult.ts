import type compileData from "./compileData";
import type { BuildManifest } from "./buildManifest";

type CompiledData = Awaited<ReturnType<typeof compileData>>;

export type BuildArtifacts = {
  compiledData: CompiledData;
  manifest: BuildManifest;
};

export type BuildWorkerResult =
  | ({ status: "success" } & BuildArtifacts)
  | {
      status: "failed";
      stage: "prepare";
      error: string;
    }
  | ({ status: "failed"; stage: "make"; error: string } & BuildArtifacts)
  | {
      status: "cancelled";
    };

export type BuildResult =
  | BuildWorkerResult
  | ({ status: "failed"; stage: "export"; error: string } & BuildArtifacts);
