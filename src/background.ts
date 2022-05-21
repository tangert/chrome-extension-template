import { GET_CURRENT_WINDOW_TABS } from "./App";

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function sendAsyncResponse(
  asyncFunc: () => Promise<any>,
  sendResponse: (a: any) => void
) {
  const res = await asyncFunc();
  sendResponse(res);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.msg === GET_CURRENT_WINDOW_TABS) {
    sendAsyncResponse(getCurrentTab, sendResponse);
  }

  // have to return true to keep the port open
  return true;
});
