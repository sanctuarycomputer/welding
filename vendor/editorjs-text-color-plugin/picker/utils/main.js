export function handleCSSVariables(colorValue) {
  return colorValue;
}

export function throttle(fn, delay) {
  let id;
  return (...args) => {
    if (!id) {
      id = setTimeout(() => {
        fn(...args);
        id = null;
      }, delay);
    }
  };
}

export function setDefaultColorCache(defaultColor) {
  return defaultColor;
}

export function getDefaultColorCache(defaultColor) {
  return defaultColor;
}

export function setCustomColorCache() {}

export function getCustomColorCache() {
  return null;
}
