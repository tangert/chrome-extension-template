import * as React from "react";
import { useChromeStorageLocal } from "use-chrome-storage";
import "./App.css";
import {
  GET_ALL_ACTIVE_WINDOW_TABS,
  GET_ACTIVE_TAB,
  GET_ALL_TABS,
} from "./background";

/*
v1:

each space has its own saved links and its own unstaged / open tabs

// links
save link.active space.active
save link.window space.active
save link.all space.active
save link.active space.[session-name]

// spaces
branch space.active [new name]
create space.[name]
switch space.[name]
delete space.[name]


// logging
show link.unsaved
show link.saved
show session.active
show session.[name]


later:
delete link.domain="twitter" space.active
delete link.domain="wikipedia"

merge space.name space.name
// does this create a new session? or
space.last // previous session
space.last-1 // previous - 1 
link.prop1="nice",prop2="wow"

log - logs out all the previous actions
*/

// maybe: duplicate link
// all links are automatically added and are unsaved
// some are saved, some arent
enum Action {
  // link ops
  Save = "save",
  // space ops
  Branch = "branch",
  Create = "create",
  Switch = "switch",
  Delete = "delete",
  Show = "show",
}

interface Query {}

async function getActiveTab() {
  return await chrome.runtime.sendMessage({ msg: GET_ACTIVE_TAB });
}

async function getAllActiveWindowTabs() {
  return await chrome.runtime.sendMessage({ msg: GET_ALL_ACTIVE_WINDOW_TABS });
}

async function getAllTabs() {
  return await chrome.runtime.sendMessage({ msg: GET_ALL_TABS });
}

export default function App() {
  const [queryHistory, setQueryHistory] = useChromeStorageLocal(
    "git-browsing-history",
    []
  );
  // only parse on enter
  const [query, setQuery] = React.useState("");

  // takes a parsed query and evaluates it / returns the function.
  function evalQuery(inputStr: string) {
    try {
      const args = inputStr.split(" ");
      const action = args[0];
      switch (action) {
        // Link
        case Action.Save:
          if (args.length === 3 && validateArgs(args)) {
            _save(args[1], args[2]);
          }
          break;
        // Spaces
        case Action.Create:
          _create("");
          break;
        case Action.Branch:
          _branch("", "");
          break;
        case Action.Switch:
          _switch("");
          break;
        case Action.Delete:
          _delete("");
          break;
        // Neutral
        case Action.Show:
          _show("");
          break;
        default:
          _show("");
          break;
      }
    } catch (e) {
      console.log(e);
    }

    // LINK OPS
    // save link.active space.active
    // save a link to a space
    async function _save(_link: string, _space: string) {
      const linkFilter = getFilter(_link);
      const spaceFilter = getFilter(_space);
      let linkToAdd;

      if (linkFilter === "active") {
        // grab the active link
        linkToAdd = await getActiveTab();
        // @ts-ignore
        getActiveTab().then(({ data }) => {
          console.log(data);
        });
      } else if (linkFilter === "window") {
        linkToAdd = await getAllActiveWindowTabs();
        // @ts-ignore
        getAllActiveWindowTabs().then(({ data }) => {
          console.log(data);
        });
      } else if (linkFilter === "all") {
      }

      console.log(linkToAdd);
      console.log(linkFilter, spaceFilter);
    }

    // duplicates a link in a space
    function _duplicate(_link: string, _space: string) {}

    // SPACE OPS
    // create a new empty space (new session)
    function _create(_space: string) {}

    // switch to a space
    function _switch(_space: string) {}

    // delete a space
    function _delete(_space: string) {}

    // branch from one space to another
    function _branch(_fromSpace: string, _toSpace?: string) {}

    // NEUTRAL
    // log out data about a space
    function _show(_space: string) {}

    // HELPERS
    // makes sure all args are text.
    function validateArgs(args: Array<string>) {
      return args.every(
        (a) => a !== null && a !== undefined && a.trim() !== ""
      );
    }

    function parseArg(arg: string) {
      return arg.split(".");
    }

    function getFilter(arg: string) {
      return parseArg(arg)[1];
    }
  }

  function strBetween(base: string, start: string, end: string) {
    return base.slice(base.indexOf(start) + 1, base.lastIndexOf(end));
  }

  evalQuery(query);

  return (
    <div className="app p-4 box-border relative w-full">
      <input
        className="border"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      ></input>
      <pre>
        <code>{JSON.stringify(evalQuery(query), null, 2)}</code>
      </pre>
    </div>
  );
}
