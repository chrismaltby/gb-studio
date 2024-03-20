import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import actions from "./debuggerActions";

const debuggerMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    next(action);
    if (actions.setRAMData.match(action)) {
      const state = store.getState();
      const dispatch = store.dispatch.bind(store);

      const scriptContexts = state.debug.scriptContexts;
      const scriptMap = state.debug.scriptMap;
      const memoryDict = state.debug.memoryDict;

      console.log("CALCULATE CURRENT SCRIPT MIDDLEWARE");

      const getClosestAddress = (bank: number, address: number) => {
        const bankScripts = memoryDict.get(bank);
        const currentAddress = address;
        let closestAddress = -1;
        if (bankScripts) {
          const addresses = Array.from(bankScripts.keys());
          for (let i = 0; i < addresses.length; i++) {
            if (addresses[i] > currentAddress) {
              break;
            } else {
              closestAddress = addresses[i];
            }
          }
        }
        return closestAddress;
      };

      let string = "";
      scriptContexts.forEach((c) => {
        console.log({ memoryDict });
        string += `${c.current ? ">>>" : "   "} [${String(c.bank).padStart(
          3,
          "0"
        )}] ${
          memoryDict.get(c.bank)?.get(getClosestAddress(c.bank, c.address)) ??
          "NONE"
        }:${String(c.address).padStart(6, "0")}\n`;

        if (c.current) {
          const script =
            memoryDict.get(c.bank)?.get(getClosestAddress(c.bank, c.address)) ??
            "";
          console.log(script, scriptMap[script.slice(1)]);
          if (script && scriptMap[script.slice(1)]) {
            dispatch(actions.setCurrentScriptSymbol(script.slice(1)));
          }
        }
      });
    }
  };

export default debuggerMiddleware;
