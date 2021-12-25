import React from 'react'
import ReactDOM from 'react-dom'
import Roundup from './Roundup'

function Popup() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '500px',
        width: '280px',
      }}
    >
      {/* <h1>hi</h1> */}
      {/* <button
        style={{ display: 'block' }}
        onClick={() => {
          chrome.permissions.request(
            {
              permissions: ['tabs', 'windows', 'bookmarks'],
              origins: ['<all_urls>'],
            },
            (granted) => {
              // The callback argument will be true if the user granted the permissions.
              if (granted) {
                console.log('got it')
              } else {
                console.log('no :(')
              }
            },
          )
        }}
      >
        request permissions
      </button> */}
      <Roundup />
    </div>
  )
}

export default Popup

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById('root'),
)
