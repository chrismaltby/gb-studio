# src/renderer/lib

Use this directory to store libraries and helpers that are either

- Dependant on running within an Electron renderer process

OR

- Only relevant to / required by the renderer windows and would not be needed by the main process

Files in this directory 

- CAN import functions and types from shared/lib
- CANNOT import functions from lib
- CAN import types from lib using `import type { MyType } from "lib/main-lib";`
