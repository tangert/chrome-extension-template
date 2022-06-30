import * as React from "react";
import "./App.css";
import { Crosshair } from "react-feather";
// @ts-ignore
import { MapInteractionCSS } from "react-map-interaction";
import KEY_CODES from "./keycodes";
import { GET_CURRENT_TAB, GET_IMAGE } from "./background";
import { BASE_MAP_SIZE } from "./constants";
import { useChromeStorageLocal } from "use-chrome-storage";

/*

what do you need to test?
do people get it lol


actually back the links via bookmarks so theyre all accessible in search bar.
todo: allow duplciate links? yes, but maybe show where they are

automatically jump to the current link you're on if it's saved

keep a history of other locations / undo 
use local state for intermediate transformations
on load, grab from local storage
on blur, save

keep track of focus so you dont accidentally trigger

let you move the map around? 

collapses + expand the map itself, when its collapsed you can just save

let you toggle the map on and off with the icon

maybe add a "link inspector"?

alternate views.
- sattelite 
- 

invite people in
shareable maps
refactor map / map performance. do this on a grid.


procedurally generate the map

make movement smoother,

portals / links to other parts of the map
map search 


full screen option / take up a sidebar.... not sure

*/

const MAP_SIZE = BASE_MAP_SIZE;
const SCALE = 3;
const INIT_TRANSFORM = {
  scale: SCALE,
  translation: { x: (-1 * MAP_SIZE) / 2, y: (-1 * MAP_SIZE) / 2 },
};

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const USER_MARKER_SIZE = 32;

// use iframe
function UserDot({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="user-marker"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 100,
        position: "absolute",
        top: 0,
        transform: `translate(${x - USER_MARKER_SIZE / 2}px,${y}px)`,
        zIndex: 100,
      }}
    >
      <div
        className="bg-blue-600"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: USER_MARKER_SIZE,
          width: USER_MARKER_SIZE,
          borderRadius: 100,
          border: "2px solid rgba(255,255,255,0.25)",
          outline: "6px solid rgba(62,114,255,0.25)",
        }}
      />
    </div>
  );
}

function Button({
  text,
  onClick,
  more,
}: {
  text: string;
  onClick?: () => void;
  more?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-600 text-white p-2 rounded-2xl shadow-2xl ${more}`}
      style={{ border: "2px solid rgba(255,255,255,0.25)" }}
    >
      {text}
    </button>
  );
}

function IconButton({
  icon,
  onClick,
  more,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  more?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-600 text-white p-2 rounded-2xl shadow-2xl ${more}`}
      style={{ border: "2px solid rgba(255,255,255,0.25)" }}
    >
      {icon}
    </button>
  );
}
interface Landmark {
  id: string;
  x: number;
  y: number;
  data?: any;
}

const LANDMARK_SIZE = 16;
// avoid duplicate links, navigate to it if youve foudn it
function Landmark({
  url,
  image,
  x,
  y,
  isActive,
}: {
  url: string;
  image: string;
  x: number;
  y: number;
  isActive?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="rounded-full absolute flex items-center justify-center"
      style={{
        width: LANDMARK_SIZE,
        height: LANDMARK_SIZE,
        transform: `translate(${x}px, ${y}px)`,
        zIndex: 10,
        background: "rgba(255,255,255,0.35)",
        backdropFilter: "blur(24px)",
        border: isActive ? "1px solid rgba(23, 77, 255, 0.5)" : "none",
        boxShadow: isActive
          ? "0px 0px 16px 4px rgba(23, 77, 255, 0.95)"
          : "none",
      }}
    >
      <img
        src={image}
        className="rounded-full"
        style={{ width: "80%", height: "80%" }}
      />
    </a>
  );
}

const USER_CENTER_POS = { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);

export default function App() {
  const [userOffset, setUserOffset] = React.useState({ x: 0, y: 0 });
  // use local state for intermediate transformations
  // on load, grab from local storage
  // on blur, save
  const [transform, setTransform] = React.useState(() => INIT_TRANSFORM);
  const [mapImageURL, setMapImageURL] = React.useState("");
  const [landmarks, setLandmarks, isPersistent, error] = useChromeStorageLocal(
    "berryspace-landmarks",
    []
  );
  const [landmarksFetched, setLandmarksFetched] = React.useState(false);
  const [currentTabURL, setCurrentTabURL] = React.useState(null);

  function map2Screen(v: number) {
    const offset = (LANDMARK_SIZE * transform.scale - USER_MARKER_SIZE) / 2;
    const basePos = -1 * v + MAP_SIZE / 2;
    return (basePos - offset) / transform.scale;
  }

  async function getImage(image: string) {
    const res = await chrome.runtime.sendMessage({ msg: GET_IMAGE, image });
    return res;
  }

  async function getCurrentTab() {
    return await chrome.runtime.sendMessage({ msg: GET_CURRENT_TAB });
  }

  React.useEffect(() => {
    // @ts-ignore
    getImage("map.png").then(({ url }) => {
      setMapImageURL(url);
    });

    // @ts-ignore
    getCurrentTab().then(({ data }) => {
      setCurrentTabURL(data.url);
    });

    // remember if youve set at least one
    if (landmarks.length && !landmarksFetched) {
      setLandmarksFetched(true);
    }
  }, [landmarks]);

  React.useEffect(() => {
    if (!landmarksFetched || !currentTabURL) {
      return;
    }

    //   check exisitng landmarks
    const existingLandmark = landmarks.find(
      (l: any) => l.data.url === currentTabURL
    );

    if (existingLandmark) {
      console.log(existingLandmark.x, existingLandmark.y);
      console.log(transform.translation);

      setTransform({
        ...transform,
        translation: {
          x: existingLandmark.x,
          y: existingLandmark.y,
        },
      });
    }

    // check if current tab
  }, [currentTabURL, landmarksFetched]);

  // this works on scale of 1.
  const currLandmarkPos = {
    x: map2Screen(transform.translation.x) + userOffset.x / transform.scale,
    // offset so you can see it.
    y:
      map2Screen(transform.translation.y) +
      userOffset.y / transform.scale -
      LANDMARK_SIZE / 2,
  };

  const MOVEMENT_SPEED = MAP_SIZE / transform.scale / 10;
  const BOUNDS = {
    xMin: -1 * MAP_SIZE * (transform.scale - 1),
    xMax: 0,
    yMin: -1 * MAP_SIZE * (transform.scale - 1),
    yMax: 0,
  };

  function onKeyDown(e: any) {
    // 1. make sure you don't enter out of bounds
    // 2. when you're on the edges of the screen, automatically translate the bg.
    const yMinBound = -MAP_SIZE / 2;
    const yMaxBound = MAP_SIZE / 2;
    const xMinBound = -MAP_SIZE / 2;
    const xMaxBound = MAP_SIZE / 2 - USER_MARKER_SIZE;

    if (e.keyCode === KEY_CODES.W || e.keyCode === KEY_CODES.Up) {
      if (userOffset.y > yMinBound) {
        setUserOffset((prev) => ({
          ...prev,
          y: clamp(prev.y - MOVEMENT_SPEED, yMinBound, yMaxBound),
        }));
      } else {
        // bounds are handled automatically
        setTransform((prev) => ({
          ...prev,
          translation: {
            ...prev.translation,
            y: prev.translation.y + MOVEMENT_SPEED,
          },
        }));
      }
    } else if (e.keyCode === KEY_CODES.A || e.keyCode === KEY_CODES.Left) {
      if (userOffset.x > xMinBound) {
        setUserOffset((prev) => ({
          ...prev,
          x: clamp(prev.x - MOVEMENT_SPEED, xMinBound, xMaxBound),
        }));
      } else {
        setTransform((prev) => ({
          ...prev,
          translation: {
            ...prev.translation,
            x: prev.translation.x + MOVEMENT_SPEED,
          },
        }));
      }
    } else if (e.keyCode === KEY_CODES.S || e.keyCode === KEY_CODES.Down) {
      if (userOffset.y < yMaxBound) {
        setUserOffset((prev) => ({
          ...prev,
          y: clamp(prev.y + MOVEMENT_SPEED, yMinBound, yMaxBound),
        }));
      } else {
        setTransform((prev) => ({
          ...prev,
          translation: {
            ...prev.translation,
            y: prev.translation.y - MOVEMENT_SPEED,
          },
        }));
      }
    } else if (e.keyCode === KEY_CODES.D || e.keyCode === KEY_CODES.Right) {
      if (userOffset.x < xMaxBound) {
        setUserOffset((prev) => ({
          ...prev,
          x: clamp(prev.x + MOVEMENT_SPEED, xMinBound, xMaxBound),
        }));
      } else {
        setTransform((prev) => ({
          ...prev,
          translation: {
            ...prev.translation,
            x: prev.translation.x - MOVEMENT_SPEED,
          },
        }));
      }
    }
  }

  // save position on keyup and debounce

  React.useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [userOffset]);

  return (
    <div className="app p-4 box-border relative">
      <div
        className="flex flex-col items-start justify-end overflow-hidden rounded-2xl"
        style={{
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.5)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div style={{ width: MAP_SIZE, height: MAP_SIZE }}>
          <MapInteractionCSS
            onChange={(_transform: any) => setTransform(_transform)}
            value={transform}
            minScale={1}
            maxScale={3}
            translationBounds={BOUNDS}
          >
            {landmarks.map((l: any, i: number) => {
              const isActive = l.data.url === currentTabURL;
              return (
                <Landmark
                  x={l.x}
                  y={l.y}
                  key={i}
                  isActive={isActive}
                  image={l.data.image}
                  url={l.data.url}
                />
              );
            })}
            <img
              style={{ opacity: 0.75 }}
              onClick={() => console.log("hi")}
              src={mapImageURL}
            />
          </MapInteractionCSS>
        </div>
        <div className="z-100 p-2 flex flex-row gap-2 w-full justify-between items-center">
          <Button
            text="Plant Link"
            onClick={async () => {
              // grab data from current tab...
              const { data } = (await getCurrentTab()) as any;
              //   check exisitng landmarks
              //   const existingLandmark = landmarks.find(
              //     (l: any) => l.data.url === data.url
              //   );

              //   if (!existingLandmark) {
              const toSave = {
                ...currLandmarkPos,
                id: uuidv4(),
                data: {
                  image: data.favIconUrl,
                  url: data.url,
                },
              };
              setLandmarks([...landmarks, toSave]);
              //   }
            }}
          />
          <div className="flex flex-row gap-2">
            <IconButton
              icon={<Crosshair size={24} color="white" />}
              onClick={() => {
                setTransform(INIT_TRANSFORM);
                setUserOffset({ x: 0, y: 0 });
              }}
            />
            <Button
              text="Clear all"
              onClick={() => {
                if (confirm("delete everything?")) {
                  setLandmarks([]);
                }
              }}
            />
          </div>
        </div>
        <UserDot
          x={USER_CENTER_POS.x + userOffset.x}
          y={USER_CENTER_POS.y + userOffset.y}
        />
      </div>
    </div>
  );
}

// src={chrome.extension.getURL("assets/map.png")}
