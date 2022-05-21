export const GET_ALL_CURRENT_WINDOW_TABS = "GET_ALL_CURRENT_WINDOW_TABS";
export const GET_CURRENT_TAB = "GET_CURRENT_TAB";
export const RESTORE_SESSION = "RESTORE_SESSION";

import { LassoSession } from "./App";

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function getAllCurrentWindowTabs() {
  // grab all tabs in current window.
  const queryOptions = { currentWindow: true };
  // more predictable: get the current window id?
  return new Promise(function (resolve, reject) {
    try {
      chrome.tabs.query(queryOptions, async (tabs) => {
        resolve({
          tabs: tabs.map((t) => {
            return {
              index: t.index,
              url: t.url,
              title: t.title,
              isActive: t.active,
              timestamp: new Date().toUTCString(),
            };
          }),
          window: await chrome.windows.getCurrent(),
        });
      });
    } catch (e) {
      reject(e);
    }
  });
}

function restoreSession(session: LassoSession) {
  //restores the tabs in a previous session
  // creates a window and just opens the tabs from the session in that new window
  const { window } = session;

  chrome.windows.create(
    {
      width: window.width,
      height: window.height,
      top: window.top,
      left: window.left,
    },
    (window) => {
      session.tabs.forEach((tab) => {
        chrome.tabs.create({
          url: tab.url,
          windowId: window!.id,
          active: tab.isActive,
        });
      });
    }
  );
}

// will take any async function you have and send the response over
async function sendAsyncResponse(
  asyncFunc: () => Promise<any>,
  sendResponse: (a: any) => void
) {
  const res = await asyncFunc();
  sendResponse(res);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.msg === GET_ALL_CURRENT_WINDOW_TABS) {
    sendAsyncResponse(getAllCurrentWindowTabs, sendResponse);
  } else if (message.msg === GET_CURRENT_TAB) {
    sendAsyncResponse(getCurrentTab, sendResponse);
  } else if (message.msg === RESTORE_SESSION) {
    restoreSession(message.data.session);
  }
  // have to return true to keep the port open
  return true;
});
