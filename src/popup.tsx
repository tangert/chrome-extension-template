import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

function Popup() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "800px",
        width: "300px",
      }}
    >
      <App />
    </div>
  );
}

export default Popup;

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
