export const GET_ALL_CURRENT_WINDOW_TABS = "GET_ALL_CURRENT_WINDOW_TABS";
export const GET_CURRENT_TAB = "GET_CURRENT_TAB";
export const RESTORE_SESSION = "RESTORE_SESSION";
export const GET_IMAGE = "GET_IMAGE";

// "action": {
//   "default_icon": {"16": "icon.png"},
//   "default_title": "Click to show an alert"
// },

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return { data: tab };
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

// will take any async function you have and send the response over
async function sendAsyncResponse(
  asyncFunc: () => Promise<any>,
  sendResponse: (a: any) => any
) {
  const res = await asyncFunc();
  sendResponse(res);
}

// chrome.action.onClicked.addListener(() => {
//   console.log("HI!!!");
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.msg === GET_ALL_CURRENT_WINDOW_TABS) {
    sendAsyncResponse(getAllCurrentWindowTabs, sendResponse);
  } else if (message.msg === GET_CURRENT_TAB) {
    sendAsyncResponse(getCurrentTab, sendResponse);
  } else if (message.msg === GET_IMAGE) {
    const url = chrome.runtime.getURL(`images/${message.image}`);
    sendResponse({
      url,
    });
  }
  // have to return true to keep the port open
  return true;
});

// console.log(chrome.runtime.getURL("assets/map.png"));
