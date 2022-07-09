export const GET_ALL_ACTIVE_WINDOW_TABS = "GET_ALL_ACTIVE_WINDOW_TABS";
export const GET_ACTIVE_TAB = "GET_ACTIVE_TAB";
export const GET_ALL_TABS = "GET_ALL_TABS";
export const RESTORE_SPACE = "RESTORE_SPACE";
export const GET_IMAGE = "GET_IMAGE";

async function getActiveTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  const [tab] = await chrome.tabs.query(queryOptions);
  return { data: tab };
}

async function getAllTabs() {
  return new Promise(function (resolve, reject) {
    try {
      chrome.windows.getAll({ populate: true }, (windows) => {
        resolve({
          tabs: windows.flatMap((w) => {
            return w.tabs;
          }),
          windows,
        });
      });
    } catch (e) {
      reject(e);
    }
  });
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
  if (message.msg === GET_ALL_ACTIVE_WINDOW_TABS) {
    sendAsyncResponse(getAllCurrentWindowTabs, sendResponse);
  } else if (message.msg === GET_ACTIVE_TAB) {
    sendAsyncResponse(getActiveTab, sendResponse);
  } else if (message.msg === GET_ALL_TABS) {
    sendAsyncResponse(getAllTabs, sendResponse);
  } else if (message.msg === GET_IMAGE) {
    const url = chrome.runtime.getURL(`images/${message.image}`);
    sendResponse({
      url,
    });
  }
  // have to return true to keep the port open
  return true;
});
