import React, { useState, createContext, ReactChild } from "react";

interface INavContext {
  content: ReactChild | null;
  setContent: (c: ReactChild | null) => void;
}

const NavContext = createContext<INavContext>({
  content: null,
  setContent: () => undefined,
});
const { Provider } = NavContext;

function NavProvider({ children }) {
  const [content, setContent] = useState<ReactChild | null>(null);

  return (
    <Provider
      value={{
        content,
        setContent,
      }}
    >
      {children}
    </Provider>
  );
}

export { NavContext, NavProvider };
