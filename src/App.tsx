import * as React from "react";
import { useChromeStorageLocal } from "use-chrome-storage";
import { Play } from "react-feather";
import "./App.css";
import {
  GET_ALL_ACTIVE_WINDOW_TABS,
  GET_ACTIVE_TAB,
  GET_ALL_TABS,
} from "./background";

function uuid() {
  // Public Domain/MIT
  var d = new Date().getTime(); //Timestamp
  var d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/*
v1:

each space has its own saved links and its own unstaged / open tabs

add links to space - do they go into their own windows
// saving specifc links
save link.active space.active
save link.window space.active
save link.all space.active
save link.active space.[session-name]

// whatever is in all the windows.... save every
save space.active

save space
switch space
branch space

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

interface Link {
  id: string;
  url: URL;
  favIconURL: string;
  title: string;
  isFavorite: boolean;
}

interface Space {
  id: string;
  name: string;
  isActive: boolean;
  timeCreated: Date;
  timeModified: Date;
  unsavedLinks: Array<Link>;
  savedLinks: Array<Link>;
  windows: Array<Window>;
}

// an instance of a link that has a position and a window.
interface Tab {
  id: number;
  timeCreated: Date;
  link: Link;
  windowId: number;
}

interface Window {
  id: number;
  x: number;
  y: number;
  height: number;
  width: number;
  isActive: boolean;
  tabs: Array<Tab>;
}

async function getActiveTab() {
  return await chrome.runtime.sendMessage({ msg: GET_ACTIVE_TAB });
}

async function getAllActiveWindowTabs() {
  return await chrome.runtime.sendMessage({ msg: GET_ALL_ACTIVE_WINDOW_TABS });
}

async function getAllTabs() {
  return await chrome.runtime.sendMessage({ msg: GET_ALL_TABS });
}

interface QueryResult {
  query: string;
  result?: {
    data?: any;
    description: string;
  } | null;
  timeEvaluated: Date;
}

export default function App() {
  const [spaces, setSpaces] = React.useState<Record<string, Space>>({
    main: {
      id: uuid(),
      name: "main",
      isActive: true,
      timeCreated: new Date(),
      timeModified: new Date(),
      unsavedLinks: [],
      savedLinks: [],
      windows: [],
    },
  });
  const [activeSpace, setActiveSpace] = React.useState("main");
  const [queryHistory, setQueryHistory] = React.useState<Array<QueryResult>>(
    []
  );
  // only parse on enter
  const [query, setQuery] = React.useState("");

  // takes a parsed query and evaluates it / returns the function.

  /*
  when you actually evaluate the 
  */
  function evalQuery(inputStr: string): QueryResult {
    let res = null;
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
          if (args.length === 2 && validateArgs(args)) {
            _create(args[1]);
          }
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
        default:
          break;
      }
    } catch (e) {
      console.log(e);
    }
    // TODO: tabs permissions arent working lol
    // LINK OPS
    // save link.active space.active
    // save a link to a space
    // are you actually adding links????
    async function _save(_link: string, _space: string) {
      //
      const linkFilter = getFilter(_link);
      const spaceFilter = getFilter(_space);
      let linkToAdd;

      if (linkFilter === "active") {
        // grab the active link
        linkToAdd = await getActiveTab();
      } else if (linkFilter === "window") {
        linkToAdd = await getAllActiveWindowTabs();
      } else if (linkFilter === "all") {
        linkToAdd = await getAllTabs();
      }

      // do you actually do the state manipulation here?
      const spaceKey = _space === "active" ? activeSpace : _space;
      setSpaces({
        ...spaces,
        [spaceKey]: {
          ...spaces[spaceKey],
        },
      });

      res = {
        description: `Saved ${_link} to ${_space}`,
      };
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

    return {
      query: inputStr,
      result: res,
      timeEvaluated: new Date(),
    };
  }

  function handleQuery() {
    const result = evalQuery(query);
    setQueryHistory([...queryHistory, result]);
  }

  return (
    <div className="app box-border relative w-full bg-gray-800 flex flex-col gap-2">
      {/* Input header */}
      <div className="flex gap-2 items-center p-2 sticky">
        <input
          className="px-2 py-1 rounded-md bg-gray-700 text-white"
          placeholder="Input command"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim() !== "") {
              handleQuery();
            }
          }}
        ></input>
        <button
          onClick={() => handleQuery()}
          className="bg-blue-500 text-white px-2 py-1 rounded-md flex items-center justify-center gap-1"
        >
          <span>Run</span>
          <Play size={12} color="white" fill="white" />
        </button>
      </div>
      {/* Results */}
      <div className="flex flex-col gap-2 overflow-scroll">
        {[...queryHistory].reverse().map((q: QueryResult) => {
          return (
            <div
              className="flex gap-2 p-2 items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-white">{q.query}</span>
                <span className="text-white">{q.result?.description}</span>
              </div>
              <button className="bg-gray-700 text-white px-2 py-1 rounded-lg flex items-center justify-center gap-1">
                <Play size={12} color="white" fill="white" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
