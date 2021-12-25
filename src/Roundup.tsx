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
  margin-bottom: 16px;
  padding: 8px;
  border-radius: 8px;
`

function SessionCard({
  session,
  onRestore,
  onUpdate,
  onDelete,
  onRename,
}: {
  session: Session
  onRestore: (session: Session) => void
  onUpdate: (session: Session) => void
  onDelete: (id: string) => void
  onRename?: (sessionName: string, session: Session) => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [sessionName, setSessionName] = React.useState(session.name)

  return (
    <Wrap onClick={() => setIsOpen(!isOpen)}>
      <input
        placeholder="name me"
        value={sessionName}
        style={{ width: '100%' }}
        onChange={(e) => setSessionName(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          console.log('blurring')
          onRename!(sessionName!, session)
        }}
      />
      <p style={{ fontSize: '12px', opacity: 0.5 }}>{`${session.timestamp}`}</p>
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <button onClick={() => onRestore(session)}>restore</button>
        <button onClick={() => onUpdate(session)}>update</button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(session.id)
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

  // save open/close state across pages.
  const [isOpen, setIsOpen] = useChromeStorageLocal('roundup-isOpen', true)

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
              }
            }),
          )
        })
      } catch (e) {
        reject(e)
      }
    })
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

  // sort by last updated
  // typecasting to any makes ts happy lol
  const sortedSessions = sessions.sort((a: Session, b: Session) => {
    return (new Date(b.timestamp) as any) - (new Date(a.timestamp) as any)
  })

  React.useEffect(() => {
    window.chrome = chrome
  }, [])
  // make popup open/close the sidebar
  return (
    <div
      className="roundup-content"
      style={{
        padding: '16px',
        width: '100%',
        height: '100%',
      }}
    >
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'close' : 'open'}
      </button>
      <p style={{ fontWeight: 'bold' }}>roundup!</p>
      <button className="save-session" onClick={() => saveSession(false)}>
        save new session
      </button>
      {sortedSessions.map((session: Session) => {
        return (
          <SessionCard
            key={session.timestamp}
            session={session}
            onUpdate={updateSession}
            onRestore={restoreSession}
            onDelete={deleteSession}
            onRename={renameSession}
          />
        )
      })}
      <style>{`
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

export default Roundup
