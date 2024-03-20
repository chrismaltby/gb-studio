let debug;

const EVENT_BREAKPOINT = 8;

class Debug {
  constructor(emulator) {
    this.emulator = emulator;
    this.module = emulator.module;
    this.e = emulator.e;

    this.vramCanvas = document.createElement("canvas");
    this.vramCanvas.width = 256;
    this.vramCanvas.height = 256;

    this.breakpoints = {};

    this.debugRunUntil = function (ticks) {
      while (true) {
        const event = this.module._emulator_run_until_f64(this.e, ticks);
        if (event & EVENT_NEW_FRAME) {
          this.rewind.pushBuffer();
          this.video.uploadTexture();
          // console.log("BREAKPOINT");
          // emulator.pause();
          // break;
        }
        if (event & EVENT_BREAKPOINT) {
          // Breakpoint hit
          console.log("BREAKPOINT");
          emulator.pause();
          break;
        }
        if (event & EVENT_AUDIO_BUFFER_FULL && !this.isRewinding) {
          this.audio.pushBuffer();
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
      console.log("GOT MESSAGE IN DEBUGGER", packet);
      const { action, data } = packet;

      switch (action) {
        case "listener-ready":
          const executingCtxAddr = data.executingCtxAddr;
          const firstCtxAddr = data.firstCtxAddr;

          // const currentCtx = debug.readMemInt16(
          //   parseInt(data.executingCtxAddr)
          // );

          // const currentAddress = debug.readMemInt16(currentCtx);
          // const currentBank = debug.readMem(currentCtx + 2);

          // console.log(currentBank, currentAddress);

          // console.log(
          //   "firstCtxAddr",
          //   debug.readMemInt16(parseInt(data.firstCtxAddr))
          // );

          setInterval(() => {
            console.warn({ data });

            const globals = debug.readVariables(
              parseInt(data.variablesStartAddr),
              parseInt(data.variablesLength)
            );

            const currentCtx = debug.readMemInt16(parseInt(executingCtxAddr));

            let firstCtx = debug.readMemInt16(parseInt(data.firstCtxAddr));

            let scriptContexts = [];
            while (firstCtx !== 0) {
              // console.log("ADDR", debug.readMemInt16(firstCtx));
              // console.log("BANK", debug.readMem(firstCtx + 2));

              scriptContexts.push({
                address: debug.readMemInt16(firstCtx),
                bank: debug.readMem(firstCtx + 2),
                current: currentCtx === firstCtx,
              });

              firstCtx = debug.readMemInt16(firstCtx + 3);
              // console.log("NEXT", firstCtx);
            }

            API.debugger.sendToProjectWindow({
              action: "update-globals",
              data: globals,
              vram: debug.renderVRam(),
              paused: debug.emulator.isPaused,
              currentAddress: debug.readMemInt16(currentCtx),
              currentBank: debug.readMem(currentCtx + 2),
              scriptContexts: scriptContexts,
            });
          }, 1000 / 60);
          break;
        case "add-breakpoint":
          debug.setBreakPoint(parseInt(data.address));
          break;
        case "pause":
          debug.emulator.pause();
          break;
        case "resume":
          debug.emulator.resume();
          break;
        case "step-single":
          debug.step("single");
          break;
        case "step-frame":
          debug.step("frame");
          break;

        default:
        // console.warn(event);
      }
    });
  }
}, 50);
