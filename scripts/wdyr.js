import React from "react";

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}
