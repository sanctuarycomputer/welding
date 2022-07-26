import mixpanel from "mixpanel-browser";

let mixpanelEnabled = false;
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "production" &&
  window.location.host === "www.welding.app"
) {
  mixpanel.init("8bc32414aaddeb0ce996c598d8875e4c", { debug: true });
  mixpanelEnabled = true;
};

export const event = (eventName, params) => {
  if (mixpanelEnabled) mixpanel.track(eventName, params);
};

export const didConnect = (address) => {
  if (mixpanelEnabled) mixpanel.identify(address);
};

export const setEnsName = (address, ensName) => {
  if (mixpanelEnabled) mixpanel.alias(ensName, address);
};

export const didDisconnect = () => {
  if (mixpanelEnabled) mixpanel.reset();
};

export default event;
