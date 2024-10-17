import { CompressedProjectResources } from "shared/lib/resources/types";
import {
  dummyCompressedProjectResources,
  dummyScriptResource,
} from "../../dummydata";

export const migrationTestProject: CompressedProjectResources = {
  ...dummyCompressedProjectResources,
  scripts: [
    {
      ...dummyScriptResource,
      script: [
        {
          id: "event1",
          command: "EVENT_SWITCH",
          args: {
            value1: 1,
            value2: 10,
            value3: 100,
          },
        },
      ],
    },
  ],
  metadata: {
    ...dummyCompressedProjectResources.metadata,
    _version: "4.1.0",
    _release: "1",
  },
};
