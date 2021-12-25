import React from 'react'
import styled from 'styled-components'
import { useChromeStorageLocal } from 'use-chrome-storage'

// Used this as a base:
// https://github.com/chibat/chrome-extension-typescript-starter

// utils
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface Tab {
  id: string
  timestamp: string
  index: number
  title: string
  url: string
  isActive: boolean
}

interface Session {
  name?: string
  id: string
  timestamp: string
  tabs: Array<Tab>
  window: chrome.windows.Window
}

const Wrap = styled.div`
  background: white;
  border: 1px solid black;
  padding: 8px;
  border-radius: 8px;
`

function SessionCard({
  session,
  onRestoreSession,
  onUpdateSession,
  onDeleteSession,
  onRenameSession,
  onAddCurrentTab,
  onDeleteTab,
}: {
  session: Session
  onRestoreSession: (session: Session) => void
  onUpdateSession: (session: Session) => void
  onDeleteSession: (id: string) => void
  onRenameSession?: (sessionName: string, session: Session) => void
  onAddCurrentTab: (session: Session) => void
  onDeleteTab: (tab: Tab, session: Session) => void
}) {
  // add current tab to session

  const [isOpen, setIsOpen] = React.useState(false)
  const [sessionName, setSessionName] = React.useState(session.name)

  return (
    <Wrap>
      <div style={{ display: 'flex' }}>
        <input
          placeholder="name me"
          value={sessionName}
          style={{ width: '100%' }}
          onChange={(e) => setSessionName(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={() => {
            console.log('blurring')
            onRenameSession!(sessionName!, session)
          }}
        />
        <button onClick={() => setIsOpen(!isOpen)}>expand</button>
      </div>
      <p style={{ fontSize: '12px', opacity: 0.5 }}>{`${session.timestamp}`}</p>
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={(e) => {
            // e.stopPropagation()
            onAddCurrentTab(session)
          }}
        >
          add current link
        </button>
        <button
          onClick={(e) => {
            // e.stopPropagation()
            onRestoreSession(session)
          }}
        >
          restore
        </button>
        <button
          onClick={(e) => {
            // e.stopPropagation()
            onUpdateSession(session)
          }}
        >
          update
        </button>
        <button
          onClick={(e) => {
            // e.stopPropagation()
            onDeleteSession(session.id)
          }}
          style={{ color: 'red' }}
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
                  style={{ fontWeight: t.isActive ? 'bold' : 'normal' }}
                  href={t.url}
                  target="_blank"
                  rel="noopener"
                >
                  {t.title}
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteTab(t, session)
                  }}
                >
                  x
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </Wrap>
  )
}

function Roundup() {
  // TODO: populate with saved / initial state
  const [sessions, setSessions, isPersistent, error] = useChromeStorageLocal(
    'roundup-sessions',
    [],
  )

  React.useEffect(() => {
    // Example of how to send a message to eventPage.ts.
    chrome.runtime.sendMessage({ popupMounted: true })
  }, [])

  async function saveSession(close?: boolean) {
    chrome.windows.getCurrent(async function (window) {
      const activeTabs = (await getActiveTabs()) as Array<Tab>
      const newSession: Session = {
        id: uuidv4(),
        timestamp: new Date().toUTCString(),
        tabs: activeTabs,
        window: window,
      }
      setSessions((prev: [Session]) => [newSession, ...prev])
      if (close) {
        chrome.windows.remove(window.id!)
      }
    })
  }

  // TODO: implement this lol so its decoupled from saving
  // async function getSessionData() {

  // }

  async function getActiveTabs() {
    // grab all tabs in current window.
    const queryOptions = { currentWindow: true }
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
              }
            }),
          )
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true }
    let [tab] = await chrome.tabs.query(queryOptions)
    return tab
  }

  function restoreSession(session: Session) {
    //restores the tabs in a previous session
    // creates a window and just opens the tabs from the session in that new window
    const { window } = session
    // recreates the dimensions as well
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
          })
        })
      },
    )
  }

  async function updateSession(session: Session) {
    chrome.windows.getCurrent(async function (window) {
      const activeTabs = (await getActiveTabs()) as Array<Tab>

      const updatedSession: Session = {
        id: session.id,
        name: session.name,
        timestamp: new Date().toUTCString(),
        tabs: activeTabs,
        window: window,
      }

      const newSessions = sessions.map((s: Session) =>
        updatedSession.id === s.id ? updatedSession : s,
      )

      setSessions(() => newSessions)
    })
  }

  function renameSession(name: string, session: Session) {
    const renamed = {
      ...session,
      name,
    }

    const newSessions = sessions.map((s: Session) =>
      renamed.id === s.id ? renamed : s,
    )

    setSessions(() => newSessions)
  }

  function deleteSession(id: string) {
    const r = confirm('Are you sure you want to delete this session?')
    if (r) {
      if (sessions.length > 1) {
        setSessions((prev: [Session]) => prev.filter((s) => s.id !== id))
      } else {
        setSessions(() => [])
      }
    }
  }

  // basically updates all the sessions. but this seems like a lot of excess work.
  async function addCurrentTab(session: Session) {
    const currentTab = await getCurrentTab()
    const t = {
      id: uuidv4(),
      timestamp: new Date().toUTCString(),
      index: currentTab.index,
      url: currentTab.url,
      title: currentTab.title,
      isActive: currentTab.active,
    } as Tab

    const updatedSession: Session = {
      id: session.id,
      name: session.name,
      timestamp: new Date().toUTCString(),
      tabs: [...session.tabs, t],
      window: session.window,
    }

    const newSessions = sessions.map((s: Session) =>
      updatedSession.id === s.id ? updatedSession : s,
    )

    setSessions(() => newSessions)
  }

  function deleteTab(tab: Tab, session: Session) {
    const updatedSession: Session = {
      ...session,
      timestamp: new Date().toUTCString(),
      tabs: session.tabs.filter((t) => t.id !== tab.id),
    }
    const newSessions = sessions.map((s: Session) =>
      updatedSession.id === s.id ? updatedSession : s,
    )
    setSessions(() => newSessions)
  }

  // sort by last updated
  // typecasting to any makes ts happy lol
  // const sortedSessions = sessions.sort((a: Session, b: Session) => {
  //   return (new Date(b.timestamp) as any) - (new Date(a.timestamp) as any)
  // })

  // make popup open/close the sidebar
  return (
    <div
      className="roundup-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'start',
        gap: '8px',
        padding: '8px',
        width: '100%',
        height: '100%',
      }}
    >
      <h1 style={{ fontWeight: 'bold', margin: 0 }}>roundup!</h1>
      <button onClick={() => saveSession(false)}>save new session</button>
      <div style={{ height: 1, width: '100%', background: 'grey' }} />
      <h2>current</h2>
      {/* <SessionCard
        session={sessions[0]}
        onUpdate={() => updateSession(sessions[0])}
        onRestore={() => restoreSession(sessions[0])}
        onDelete={() => deleteSession(sessions[0])}
        onAddCurrentLink={() => addCurrentLink(sessions[0])}
      /> */}
      <div style={{ height: 1, width: '100%', background: 'grey' }} />
      <h2>all sessions</h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
        }}
      >
        {sessions.map((session: Session) => {
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
            />
          )
        })}
      </div>
      <style>{`
        * {
          box-sizing: border-box;
        }
        h1, h2, h3, h4 {
          margin:
        }
      `}</style>
    </div>
  )
}

export default Roundup
