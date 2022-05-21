import React from "react";
import styled from "styled-components";
import { useChromeStorageLocal } from "use-chrome-storage";
import Fuse from "fuse.js";
import { GET_ALL_CURRENT_WINDOW_TABS, RESTORE_SESSION } from "./background";

// Used this as a base:
// https://github.com/chibat/chrome-extension-typescript-starter

// utils
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface Tab {
  id: string;
  timestamp: string;
  index: number;
  title: string;
  url: string;
  isActive: boolean;
}

export interface LassoSession {
  origin?: LassoSession;
  isCurrent?: boolean;
  name?: string;
  id: string;
  timestamp: string;
  tabs: Array<Tab>;
  window: chrome.windows.Window;
}

const Wrap = styled.div`
  background: white;
  border: 1px solid black;
  padding: 8px;
  border-radius: 8px;
`;

function SessionCard({
  session,
  onSetCurrentSession,
  onRestoreSession,
  onUpdateSession,
  onDeleteSession,
  onRenameSession,
  onDuplicateSession,
  onAddCurrentTab,
  onDeleteTab,
}: {
  session: LassoSession;
  onSetCurrentSession: (session: LassoSession) => void;
  onRestoreSession: (session: LassoSession) => void;
  onUpdateSession: (session: LassoSession) => void;
  onDeleteSession: (session: LassoSession) => void;
  onRenameSession?: (sessionName: string, session: LassoSession) => void;
  onDuplicateSession: (session: LassoSession) => void;
  onAddCurrentTab: (session: LassoSession) => void;
  onDeleteTab: (tab: Tab, session: LassoSession) => void;
}) {
  // add current tab to session

  const [isOpen, setIsOpen] = React.useState(false);
  const [sessionName, setSessionName] = React.useState(session.name);

  return (
    <Wrap>
      <div style={{ display: "flex" }}>
        <input
          placeholder="name me"
          value={sessionName}
          style={{ width: "100%" }}
          onChange={(e) => setSessionName(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={() => {
            console.log("blurring");
            onRenameSession!(sessionName!, session);
          }}
        />
        <button onClick={() => setIsOpen(!isOpen)}>expand</button>
      </div>

      {/* TODO: link this to original */}

      <p style={{ fontSize: "12px", opacity: 0.5 }}>{`${session.timestamp}`}</p>
      {session.origin ? (
        <p
          style={{ fontSize: "12px", opacity: 0.5 }}
        >{`Origin: ${session.origin.name}`}</p>
      ) : null}
      <button onClick={() => onSetCurrentSession(session)}>
        set as current session
      </button>
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={(e) => {
            onAddCurrentTab(session);
          }}
        >
          add current tab
        </button>
        <button
          onClick={(e) => {
            onRestoreSession(session);
          }}
        >
          restore
        </button>
        <button
          onClick={(e) => {
            onUpdateSession(session);
          }}
        >
          update
        </button>

        <button
          onClick={(e) => {
            onDuplicateSession(session);
          }}
        >
          duplicate
        </button>
        <button
          onClick={(e) => {
            onDeleteSession(session);
          }}
          style={{ color: "red" }}
        >
          delete
        </button>
      </div>
      {isOpen && (
        <ol>
          {session.tabs.map((t, i) => {
            return (
              <li key={i}>
                <a
                  style={{ fontWeight: t.isActive ? "bold" : "normal" }}
                  href={t.url}
                  target="_blank"
                  rel="noopener"
                >
                  {t.title}
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTab(t, session);
                  }}
                >
                  x
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Wrap>
  );
}

const indexKeys = [
  "timestamp",
  "name",
  "tabs",
  "tabs.timestamp",
  "tabs.url",
  "tabs.title",
];

export default function App() {
  // TODO: populate with saved / initial state
  const [sessions, setSessions, isPersistent, error] = useChromeStorageLocal(
    "lasso-sessions",
    []
  );

  const [currentSession, setCurrentSession] = useChromeStorageLocal(
    "lasso-current-session",
    sessions.length ? 0 : null
  );

  const [searchTerm, setSearchTerm] = React.useState("");
  const [fuse, setFuse] = React.useState(
    new Fuse(sessions, {
      keys: indexKeys,
    })
  );

  React.useEffect(() => {
    // Example of how to send a message to eventPage.ts.
    chrome.runtime.sendMessage({ popupMounted: true });
    chrome.runtime.sendMessage(
      { msg: GET_ALL_CURRENT_WINDOW_TABS },
      (response) => {
        console.log(response);
      }
    );
  }, []);

  React.useEffect(() => {
    setFuse(
      new Fuse(sessions, {
        keys: indexKeys,
      })
    );
  }, [sessions]);

  async function saveSession(close?: boolean) {
    chrome.runtime.sendMessage(
      { msg: GET_ALL_CURRENT_WINDOW_TABS },
      ({ tabs, window }) => {
        const newSession: LassoSession = {
          id: uuidv4(),
          timestamp: new Date().toUTCString(),
          tabs: tabs,
          window: window,
        };
        setSessions((prev: [LassoSession]) => [newSession, ...prev]);
        if (close) {
          chrome.windows.remove(window.id!);
        }
      }
    );
  }

  async function getActiveTabs() {
    // grab all tabs in current window.
    const queryOptions = { currentWindow: true };
    // more predictable: get the current window id?
    return new Promise(function (resolve, reject) {
      try {
        chrome.tabs.query(queryOptions, (tabs) => {
          resolve(
            tabs.map((t) => {
              return {
                index: t.index,
                url: t.url,
                title: t.title,
                isActive: t.active,
                id: uuidv4(),
                timestamp: new Date().toUTCString(),
              };
            })
          );
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  function restoreSession(session: LassoSession) {
    chrome.runtime.sendMessage({ msg: RESTORE_SESSION, data: { session } });
  }

  async function updateSession(session: LassoSession) {
    chrome.windows.getCurrent(async function (window) {
      const activeTabs = (await getActiveTabs()) as Array<Tab>;

      const updatedSession: LassoSession = {
        id: session.id,
        name: session.name,
        timestamp: new Date().toUTCString(),
        tabs: activeTabs,
        window: window,
      };

      const newSessions = sessions.map((s: LassoSession) =>
        updatedSession.id === s.id ? updatedSession : s
      );

      setSessions(() => newSessions);
    });
  }

  async function duplicateSession(session: LassoSession) {
    const updatedSession: LassoSession = {
      ...session,
      origin: session,
      id: uuidv4(),
      timestamp: new Date().toUTCString(),
    };

    setSessions(() => [...sessions, updatedSession]);
  }

  function renameSession(name: string, session: LassoSession) {
    const renamed = {
      ...session,
      name,
    };

    const newSessions = sessions.map((s: LassoSession) =>
      renamed.id === s.id ? renamed : s
    );

    setSessions(() => newSessions);
  }

  function deleteSession(session: LassoSession) {
    const r = confirm("Are you sure you want to delete this session?");
    if (r) {
      if (sessions.length > 1) {
        setSessions((prev: [LassoSession]) =>
          prev.filter((s) => s.id !== session.id)
        );
      } else {
        setSessions(() => []);
      }
    }
  }

  // basically updates all the sessions. but this seems like a lot of excess work.
  async function addCurrentTab(session: LassoSession) {
    const currentTab = await getCurrentTab();
    const t = {
      id: uuidv4(),
      timestamp: new Date().toUTCString(),
      index: currentTab.index,
      url: currentTab.url,
      title: currentTab.title,
      isActive: currentTab.active,
    } as Tab;

    const updatedSession: LassoSession = {
      id: session.id,
      name: session.name,
      timestamp: new Date().toUTCString(),
      tabs: [...session.tabs, t],
      window: session.window,
    };

    const newSessions = sessions.map((s: LassoSession) =>
      updatedSession.id === s.id ? updatedSession : s
    );

    setSessions(() => newSessions);
  }

  function deleteTab(tab: Tab, session: LassoSession) {
    const updatedSession: LassoSession = {
      ...session,
      timestamp: new Date().toUTCString(),
      tabs: session.tabs.filter((t) => t.id !== tab.id),
    };
    const newSessions = sessions.map((s: LassoSession) =>
      updatedSession.id === s.id ? updatedSession : s
    );
    setSessions(() => newSessions);
  }

  // sort by last updated
  // typecasting to any makes ts happy lol
  // const sortedSessions = sessions.sort((a: Session, b: Session) => {
  //   return (new Date(b.timestamp) as any) - (new Date(a.timestamp) as any)
  // })

  // 3. Now search!

  // make popup open/close the sidebar
  const toRender =
    searchTerm !== "" ? fuse.search(searchTerm).map((r) => r.item) : sessions;

  return (
    <div
      className="lasso-content"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "start",
        gap: "8px",
        padding: "8px",
        width: "100%",
        height: "100%",
        background: "red",
      }}
    >
      <h1 style={{ fontWeight: "bold", margin: 0 }}>lasso</h1>
      <input
        placeholder="search (todo)"
        onChange={(e) => setSearchTerm(e.target.value)}
        value={searchTerm}
      ></input>
      <button onClick={() => saveSession(false)}>save new session</button>
      <div style={{ height: 1, width: "100%", background: "grey" }} />
      <h2>current</h2>
      {currentSession ? (
        <SessionCard
          session={currentSession}
          onUpdateSession={updateSession}
          onRestoreSession={restoreSession}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          onAddCurrentTab={addCurrentTab}
          onDeleteTab={deleteTab}
          onDuplicateSession={duplicateSession}
          onSetCurrentSession={() => console.log("hi")}
        />
      ) : null}
      <div style={{ height: 1, width: "100%", background: "grey" }} />
      <h2>all sessions</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "100%",
        }}
      >
        {toRender.map((session: LassoSession) => {
          return (
            <SessionCard
              key={session.timestamp}
              session={session}
              onUpdateSession={updateSession}
              onRestoreSession={restoreSession}
              onDeleteSession={deleteSession}
              onRenameSession={renameSession}
              onAddCurrentTab={addCurrentTab}
              onDeleteTab={deleteTab}
              onDuplicateSession={duplicateSession}
              onSetCurrentSession={() => setCurrentSession(session)}
            />
          );
        })}
      </div>
      <style>{`
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
