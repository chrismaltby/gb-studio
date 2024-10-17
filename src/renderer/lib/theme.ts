import API from "./api";
import { ThemeInterface } from "ui/theme/ThemeInterface";
import lightTheme from "ui/theme/lightTheme";

let hasInit = false;
let defaultTheme: ThemeInterface = lightTheme;

export const initTheme = async () => {
  if (hasInit) {
    return;
  }
  defaultTheme = await API.theme.getTheme();
  hasInit = true;
};

export { defaultTheme };
