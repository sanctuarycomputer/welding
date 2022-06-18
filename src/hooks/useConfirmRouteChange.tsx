import Router from "next/router";
import { useEffect } from "react";

const useConfirmRouteChange = (
  unsavedChanges: boolean,
  callback: () => boolean
) => {
  useEffect(() => {
    if (!unsavedChanges) return;
    const routeChangeStart = () => {
      if (callback()) return;
      Router.events.emit("routeChangeError");
      throw "abort_route_change";
    };
    Router.events.on("routeChangeStart", routeChangeStart);
    return () => Router.events.off("routeChangeStart", routeChangeStart);
  }, [unsavedChanges]);
};

export default useConfirmRouteChange;
