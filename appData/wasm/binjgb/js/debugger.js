/* eslint-disable no-undef */
let debug;

const vmBreakpoints = [
  // "12::19261", "12::19335"
];

const EVENT_BREAKPOINT = 8;

class Debug {
  constructor(emulator) {
    this.emulator = emulator;
    this.module = emulator.module;
    this.e = emulator.e;

    this.vramCanvas = document.createElement("canvas");
    this.vramCanvas.width = 256;
    this.vramCanvas.height = 256;

    this.memoryMap = {};
    this.globalVariables = {};
    this.memoryDict = new Map();

    this.breakpoints = {};
    this.pauseOnScriptChanged = false;
    this.pauseOnVMStep = false;

    this.debugRunUntil = (ticks) => {
      while (true) {
        const event = this.module._emulator_run_until_f64(this.e, ticks);
        if (event & EVENT_NEW_FRAME) {
          this.emulator.rewind.pushBuffer();
          this.emulator.video.uploadTexture();
          // console.log("BREAKPOINT");
          // emulator.pause();
          // break;
        }
        if (event & EVENT_BREAKPOINT) {
          // Breakpoint hit
          // const firstCtxAddr = memoryMap["_first_ctx"];
          // let firstCtx = debug.readMemInt16(parseInt(firstCtxAddr));

          const currentCtx = this.readMemInt16(
            this.memoryMap["_executing_ctx"]
          );
          const currentScriptBank = this.readMem(currentCtx + 2);
          const currentScriptPCAddr = this.readMemInt16(currentCtx);
          const currentSymbol = this.getSymbol(
            currentScriptBank,
            currentScriptPCAddr
          );

          if (this.pauseOnVMStep) {
            console.log("@", `${currentScriptBank}::${currentScriptPCAddr}`);
            emulator.pause();
            this.pauseOnVMStep = false;
            break;
          }
          if (
            vmBreakpoints.includes(
              `${currentScriptBank}::${currentScriptPCAddr}`
            )
          ) {
            this.pauseOnVMStep = true;
            emulator.pause();
            break;
          } else if (
            this.pauseOnScriptChanged &&
            currentSymbol &&
            currentSymbol !== "bootstrap_script" &&
            currentSymbol !== "script_engine_init"
          ) {
            console.log("PAUSED ON NEW SYMOLB", currentSymbol);
            this.pauseOnVMStep = true;
            emulator.pause();
            break;
          }
          console.log("BREAKPOINT");
          // emulator.pause();
          // break;
        }
        if (event & EVENT_AUDIO_BUFFER_FULL && !this.emulator.isRewinding) {
          this.emulator.audio.pushBuffer();
        }
        if (event & EVENT_UNTIL_TICKS) {
          break;
        }
      }
      if (this.module._emulator_was_ext_ram_updated(this.e)) {
        vm.extRamUpdated = true;
      }
    };

    // replace the emulator run method with the debug one
    this.emulator.runUntil = this.debugRunUntil;
  }

  initialize(memoryMap, globalVariables) {
    this.memoryMap = memoryMap;
    this.globalVariables = globalVariables;

    const memoryDict = new Map();
    Object.keys(memoryMap).forEach((k) => {
      const match = k.match(/___bank_(.*)/);
      if (match) {
        const label = `_${match[1]}`;
        const bank = memoryMap[k];
        if (memoryMap[label]) {
          const n = memoryDict.get(bank) ?? new Map();
          const ptr = memoryMap[label] & 0x0ffff;
          n.set(ptr, label);
          memoryDict.set(bank, n);
        }
      }
    });

    this.memoryDict = memoryDict;

    // Break on VM_STEP
    this.module._emulator_set_breakpoint(this.e, memoryMap["_VM_STEP"]);
  }

  getClosestAddress(bank, address) {
    const bankScripts = this.memoryDict.get(bank);
    const currentAddress = address;
    let closestAddress = -1;
    if (bankScripts) {
      const addresses = Array.from(bankScripts.keys()).sort();
      for (let i = 0; i < addresses.length; i++) {
        if (addresses[i] > currentAddress) {
          break;
        } else {
          closestAddress = addresses[i];
        }
      }
    }
    return closestAddress;
  }

  getSymbol(bank, address) {
    const symbol = this.memoryDict.get(bank)?.get(address) ?? "";
    return symbol.slice(1);
  }

  readMem(addr) {
    return this.module._emulator_read_mem(this.e, addr);
  }

  readMemInt16(addr) {
    return (
      (this.module._emulator_read_mem(this.e, addr + 1) << 8) |
      this.module._emulator_read_mem(this.e, addr)
    );
  }

  readVariables(addr, size) {
    // const ptr = this.module._emulator_get_wram_ptr(this.e) - 0xc000;
    // const evenAddr = Math.floor(addr / 2) * 2;
    // return new Int16Array(this.module.HEAP16.buffer, ptr + evenAddr, size);
    // const ptr = this.module._emulator_get_wram_ptr(this.e) - 0xc000;
    // return new Int8Array(this.module.HEAP8.buffer, ptr + addr, size * 2);

    const ptr = this.module._emulator_get_wram_ptr(this.e) - 0xc000;
    return new Int16Array(
      this.module.HEAP8.buffer.slice(ptr + addr, ptr + addr + size * 2)
    );
  }

  renderVRam() {
    var ctx = this.vramCanvas.getContext("2d");
    var imgData = ctx.createImageData(256, 256);
    var ptr = this.module._malloc(4 * 256 * 256);
    this.module._emulator_render_vram(this.e, ptr);
    var buffer = new Uint8Array(this.module.HEAP8.buffer, ptr, 4 * 256 * 256);
    imgData.data.set(buffer);
    ctx.putImageData(imgData, 0, 0);
    this.module._free(ptr);
    return this.vramCanvas.toDataURL("image/png");
  }

  updateBreakpoints() {
    console.log(`--- CLEARED ALL BREAKPOINTS ---`);

    this.module._emulator_clear_breakpoints(this.e);
    Object.keys(this.breakpoints).forEach((addr) => {
      if (this.breakpoints[addr]) {
        console.log(`ADDED BREAKPOINT TO ${addr}`);
        this.module._emulator_set_breakpoint(this.e, addr);
      }
    });
  }

  setBreakPoint(addr) {
    this.breakpoints[addr] = true;
    this.updateBreakpoints();
  }

  unsetBreakPoint(addr) {
    this.breakpoints[addr] = false;
    this.updateBreakpoints();
  }

  step(type = "single") {
    let ticks = this.module._emulator_get_ticks_f64(this.e);
    if (type === "single") {
      ticks += 1;
    } else if (type === "frame") {
      ticks += 70224;
    }
    this.emulator.runUntil(ticks);
    this.emulator.video.renderTexture();
  }

  pause() {
    this.pauseOnVMStep = true;
    this.emulator.pause();
  }

  resume() {
    this.pauseOnVMStep = false;
    this.emulator.resume();
  }

  isPaused() {
    return this.emulator.isPaused;
  }
}

let ready = setInterval(() => {
  const debugEnabled = window.location.href.includes("debug=true");
  if (!debugEnabled) {
    // Debugging not enabled
    clearInterval(ready);
    return;
  }

  console.log("Waiting for emulator...", emulator);
  if (emulator !== null) {
    debug = new Debug(emulator);
    clearInterval(ready);

    API.debugger.sendToProjectWindow({
      action: "initialized",
    });

    API.events.debugger.data.subscribe((_, packet) => {
      // console.log("GOT MESSAGE IN DEBUGGER", packet);
      const { action, data } = packet;

      switch (action) {
        case "listener-ready":
          // console.log({ data });

          memoryMap = data.memoryMap;
          globalVariables = data.globalVariables;
          debug.pauseOnScriptChanged = data.pauseOnScriptChanged;
          // const { memoryMap, globalVariables } = data;

          debug.initialize(data.memoryMap, data.globalVariables);

          // Break emulator on each call to VM_STEP
          // debug.setBreakPoint(memoryMap["_VM_STEP"]);

          // Object.keys(memoryMap).forEach((k) => {
          //   const match = k.match(/___bank_(.*)/);
          //   if (match) {
          //     const label = `_${match[1]}`;
          //     const bank = memoryMap[k];
          //     if (memoryMap[label]) {
          //       const n = memoryDict.get(bank) ?? new Map();
          //       const ptr = memoryMap[label] & 0x0ffff;
          //       n.set(ptr, label);
          //       memoryDict.set(bank, n);
          //     }
          //   }
          // });

          const variablesStartAddr = memoryMap["_script_memory"];
          const variablesLength = globalVariables["MAX_GLOBAL_VARS"];
          const executingCtxAddr = memoryMap["_executing_ctx"];
          const firstCtxAddr = memoryMap["_first_ctx"];
          const currentSceneAddr = memoryMap["_current_scene"];

          let currentScriptBank = 0;
          let currentScriptAddr = 0;
          let currentScriptPCAddr = 0;

          // setInterval(() => {
          //   let firstCtx = debug.readMemInt16(parseInt(firstCtxAddr));
          //   currentScriptPCAddr = debug.readMemInt16(firstCtx);
          //   if (
          //     debug.emulator.isPaused &&
          //     !hitBreakpoint &&
          //     !vmBreakpoints.includes(currentScriptPCAddr)
          //   ) {
          //     debug.emulator.resume();
          //   }
          // }, 1);

          setInterval(() => {
            // console.warn({ data });

            const globals = debug.readVariables(
              parseInt(variablesStartAddr),
              parseInt(variablesLength)
            );

            const currentCtx = debug.readMemInt16(parseInt(executingCtxAddr));

            let firstCtx = debug.readMemInt16(parseInt(firstCtxAddr));

            let scriptContexts = [];
            // console.warn("firstCtx", firstCtx);

            while (firstCtx !== 0) {
              // console.log("ADDR", debug.readMemInt16(firstCtx));
              // console.log("BANK", debug.readMem(firstCtx + 2));

              scriptContexts.push({
                address: debug.readMemInt16(firstCtx),
                bank: debug.readMem(firstCtx + 2),
                current: currentCtx === firstCtx,
              });

              if (currentCtx === firstCtx) {
                currentScriptBank = debug.readMem(firstCtx + 2);
                currentScriptPCAddr = debug.readMemInt16(firstCtx);
                currentScriptAddr = debug.getClosestAddress(
                  currentScriptBank,
                  currentScriptPCAddr
                );
              }

              firstCtx = debug.readMemInt16(firstCtx + 3);
              // console.log("- firstCtx", firstCtx);

              // console.log("NEXT", firstCtx);
            }

            // console.log("currentScriptPCAddr", currentScriptPCAddr);

            // if (
            //   debug.emulator.isPaused &&
            //   !hitBreakpoint &&
            //   !vmBreakpoints.includes(currentScriptPCAddr)
            // ) {
            //   debug.emulator.resume();
            // }

            API.debugger.sendToProjectWindow({
              action: "update-globals",
              data: globals,
              vram: debug.renderVRam(),
              isPaused: debug.isPaused(),
              scriptContexts: scriptContexts,
              currentSceneSymbol: debug.getSymbol(
                debug.readMem(currentSceneAddr),
                debug.readMemInt16(currentSceneAddr + 1)
              ),
              currentScriptSymbol: debug.getSymbol(
                currentScriptBank,
                currentScriptAddr
              ),
              currentScriptAddr,
              currentScriptPCAddr,
              // currentSceneAddress: debug.readMem(currentSceneAddr),
              // currentSceneBank: debug.readMemInt16(currentSceneAddr + 1),
            });
            // }, 1000 / 60);
          }, 100);
          break;
        case "add-breakpoint":
          debug.setBreakPoint(parseInt(data.address));
          break;
        case "pause":
          debug.pause();
          break;
        case "resume":
          debug.resume();
          break;
        case "step":
          // Step 1 VM instruction
          debug.resume();
          debug.pauseOnVMStep = true;
          break;
        case "step-frame":
          // Step until next frame or VM instruction
          debug.step("frame");
          break;
        case "pause-on-script":
          debug.pauseOnScriptChanged = data;
          break;
        default:
        // console.warn(event);
      }
    });
  }
}, 50);
