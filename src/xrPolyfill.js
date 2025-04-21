import * as WebXRPolyfill from "webxr-polyfill";

export const xrPolyfillPromise = new Promise((resolve) => {
  console.log(navigator.xr);
  if (navigator.xr) {
    return resolve();
  }
  if (window.WebXRPolyfill) {
    new WebXRPolyfill();
    return resolve();
  }
});
