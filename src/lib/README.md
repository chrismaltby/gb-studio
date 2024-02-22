# src/lib

Use this directory to store libraries and helpers that are either

- Dependant on running within the Electron main process or a Node process

OR

- Only relevant to / required by the main process and would not be needed by the renderer windows

Files in this directory 

- CAN import functions and types from shared/lib
- CANNOT import functions from renderer/lib
- CAN import types from renderer/lib using `import type { MyType } from "renderer/lib/renderer-lib";`
