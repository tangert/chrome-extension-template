import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

function htmlToElement(html: string) {
  const template = document.createElement("template");
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

const CONTAINER_ID = "lasso--container";

document.body.appendChild(
  htmlToElement(
    `<div id="${CONTAINER_ID}" style="position:fixed;height:100%;top:0;right:0;width:320px;z-index:9999;"></div>`
  ) as Node
);

ReactDOM.render(<App />, document.getElementById(CONTAINER_ID));
