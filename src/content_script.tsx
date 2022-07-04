// Uncomment this if you wanna inject UI into the current page.
// import React from "react";
// import ReactDOM from "react-dom";
// import App from "./App";

// function htmlToElement(html: string) {
//   const template = document.createElement("template");
//   html = html.trim();
//   template.innerHTML = html;
//   return template.content.firstChild;
// }

// const CONTAINER_ID = "berryspace--container";
// const SIZE = 100;

// document.body.appendChild(
//   htmlToElement(
//     `<div id="${CONTAINER_ID}" style="position:fixed;height:100%;top:0;right:0;width:${SIZE}px;height:${SIZE}px;z-index:9999;box-sizing:border-box;"></div>`
//   ) as Node
// );

// ReactDOM.render(<App />, document.getElementById(CONTAINER_ID));

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.color) {
    console.log("Receive color = " + msg.color);
    document.body.style.backgroundColor = msg.color;
    sendResponse("Change color to " + msg.color);
  } else {
    sendResponse("Color message is none.");
  }
});
