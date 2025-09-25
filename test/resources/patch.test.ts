import { buildCompressedProjectResourcesPatch } from "shared/lib/resources/patch";
import { buildResourceExportBuffer } from "shared/lib/resources/save";
import { WriteResourcesPatch } from "shared/lib/resources/types";
import { dummyCompressedProjectResources } from "../dummydata";

jest.mock("shared/lib/resources/save");

describe("patch.ts", () => {
  describe("buildCompressedProjectResourcesPatch", () => {
    it("should return the correct patch data", () => {
      const mockChecksums = {
        "project/scene1__0/scene.gbsres": "oldChecksum1",
        "project/actor1__0.gbsres": "oldChecksum2",
        "project/trigger1__0.gbsres": "oldChecksum3",
      };

      const mockWriteBuffer = [
        {
          path: "project/scene1__0/scene.gbsres",
          checksum: "newChecksum1",
          data: "{}",
        },
        {
          path: "project/actor1__0.gbsres",
          checksum: "newChecksum2",
          data: "{}",
        },
        {
          path: "project/trigger1__0.gbsres",
          checksum: "oldChecksum3",
          data: "{}",
        },
      ];

      (buildResourceExportBuffer as jest.Mock).mockReturnValue(mockWriteBuffer);

      const expectedPatch: WriteResourcesPatch = {
        data: [
          {
            path: "project/scene1__0/scene.gbsres",
            checksum: "newChecksum1",
            data: "{}",
          },
          {
            path: "project/actor1__0.gbsres",
            checksum: "newChecksum2",
            data: "{}",
          },
        ],
        paths: [
          "project/scene1__0/scene.gbsres",
          "project/actor1__0.gbsres",
          "project/trigger1__0.gbsres",
        ],
        metadata: dummyCompressedProjectResources.metadata,
      };

      const patch = buildCompressedProjectResourcesPatch(
        dummyCompressedProjectResources,
        mockChecksums,
      );
      expect(patch).toEqual(expectedPatch);
    });
  });
});
