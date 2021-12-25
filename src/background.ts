function polling() {
  setTimeout(polling, 1000 * 30);
}

// async function getCurrentTab() {
//   let queryOptions = { active: true, currentWindow: true };
//   let [tab] = await chrome.tabs.query(queryOptions);
//   return tab;
// }

// chrome.runtime.onInstalled.addListener(async () => {
//   console.log(await getCurrentTab());
// });

// chrome.browserAction.onClicked.addListener((tab) => {
//   console.log(tab)
// })

// chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {

//   console.log("RECEIVING")
//   console.log(sender.tab ?
//               "from a content script:" + sender.tab.url :
//               "from the extension");

//               // this works inside of popup
//               // chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
          
//               //   // console.log("active tab retrieved : " + tabs[0].id);
              
//               // });   // <-- add `);`

//   // console.log(chrome.tabs)
      
//   // if(typeof chrome.app.isInstalled !== "undefined")


//   if (request.greeting == "hello") {

//     // console.log(await getCurrentTab());
//     console.log(chrome)
//     // chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
//     //   var myTabId = tabs[0].id;
//     //   console.log(myTabId)
//     //   chrome.tabs.sendMessage(myTabId!, {text: "hi"}, function(response) {
//     //       alert(response);
//     //   });
//     // });

//     sendResponse({farewell: "goodbye", tab: 'hi', sender, request, tabs: chrome.tabs });


//     // console.log(await getCurrentTab())

//     // activeTab: await getCurrentTab()
//   }
// })

// console.log
// chrome.permissions.request({
//   permissions: ['tabs'],
//   // origins: ['https://www.google.com/']
//   origins: ["<all_urls>"],
// }, (granted) => {
//   // The callback argument will be true if the user granted the permissions.
//   if (granted) {
//     console.log('got it')
//   } else {
//     console.log('no :(')
//   }
// });

polling();
