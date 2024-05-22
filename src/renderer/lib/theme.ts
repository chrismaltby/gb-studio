import { ThemeId } from "shared/lib/theme";
import API from "./api";

let hasInit = false;
let defaultTheme: ThemeId = "light";

export const initTheme = async () => {
  if (hasInit) {
    return;
  }
  defaultTheme = await API.theme.getTheme();
  hasInit = true;
};

export { defaultTheme };
