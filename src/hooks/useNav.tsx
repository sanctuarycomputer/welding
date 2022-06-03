import { useState, useEffect, createContext } from 'react';

interface INavContext {
};

const NavContext = createContext<INavContext>();
const { Provider } = NavContext;

function NavProvider({ children }) {
  const [
    content,
    setContent
  ] = useState(null);

  return (
    <Provider value={{
      content,
      setContent
    }}>
      {children}
    </Provider>
  );
};

export { NavContext, NavProvider };
