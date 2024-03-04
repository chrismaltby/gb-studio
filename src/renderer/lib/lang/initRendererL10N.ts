import API from "renderer/lib/api";
import { setL10NData } from "shared/lib/lang/l10n";

let hasInit = false;

const initRendererL10N = async () => {
  if (hasInit) {
    return;
  }
  const data = await API.l10n.getL10NStrings();
  setL10NData(data);
  hasInit = true;
};

export default initRendererL10N;
