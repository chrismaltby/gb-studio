import { useState, useEffect } from "react";

const useWindowFocus = () => {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    // First render
    setFocused(document.hasFocus());

    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return focused;
};

export default useWindowFocus;
