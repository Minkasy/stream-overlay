const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({
  server
});

/* =========================
   CONFIG
========================= */

const config = JSON.parse(

  fs.readFileSync(
    path.join(
      __dirname,
      "../config/config.json"
    )
  )
);

const mapsConfig = JSON.parse(

  fs.readFileSync(
    path.join(
      __dirname,
      "../config/maps.json"
    )
  )
);

const layoutsConfig = JSON.parse(

  fs.readFileSync(
    path.join(
      __dirname,
      "../config/layouts.json"
    )
  )
);

/* =========================
   STATIC
========================= */

app.use(
  express.static(
    path.join(__dirname, "..")
  )
);

app.get("/", (req, res) => {
  res.redirect("/control");
});

app.get("/control", (req, res) => {
  res.redirect(
    "/control/control.html"
  );
});

app.get("/overlay", (req, res) => {
  res.redirect(
    "/overlay/overlay.html"
  );
});

/* =========================
   INITIAL MAPS
========================= */

function createInitialMaps() {

  return mapsConfig.map(
    (map, index) => ({

      id: `map_${index + 1}`,

      name: map.name,

      image: map.image,

      state: "available"
    })
  );
}

/* =========================
   STATES
========================= */

let draftState = {

  teams: {

    team1: {

      name: "Team 1",

      icon:
        "/assets/team1.png"
    },

    team2: {

      name: "Team 2",

      icon:
        "/assets/team2.png"
    }
  },

  maps: createInitialMaps(),

  draftOrder: []
};

let viewState = {

  position:
    "compact-top-left",

  layoutConfig:
    layoutsConfig
};

/* =========================
   UNDO / REDO
========================= */

let undoStack = [];

let redoStack = [];

function cloneState() {

  return JSON.parse(
    JSON.stringify(draftState)
  );
}

function pushUndo() {

  undoStack.push(cloneState());

  if (undoStack.length > 100) {

    undoStack.shift();
  }

  redoStack = [];
}

/* =========================
   WEBSOCKET SEND
========================= */

function sendState(ws) {

  ws.send(JSON.stringify({

    type: "state",

    payload: {

      draft: draftState,

      view: viewState
    }
  }));
}

function broadcastState() {

  wss.clients.forEach(client => {

    if (
      client.readyState
      === WebSocket.OPEN
    ) {

      sendState(client);
    }
  });
}

/* =========================
   HELPERS
========================= */

function getMap(mapId) {

  return draftState.maps.find(
    m => m.id === mapId
  );
}

/* =========================
   DRAFT
========================= */

function performDraft(
  mapId,
  action,
  teamKey
) {

  const map = getMap(mapId);

  if (!map) return;

  if (
    map.state !== "available"
  ) {

    return;
  }

  pushUndo();

  if (action === "ban") {

    map.state = "banned";

  } else if (
    action === "pick"
  ) {

    map.state = "picked";

  } else {

    map.state = "decider";
  }

  draftState.draftOrder.push({

    id: Date.now(),

    mapId,

    mapName: map.name,

    image: map.image,

    action,

    team: teamKey,

    timestamp: Date.now()
  });

  broadcastState();
}

/* =========================
   TEAMS
========================= */

function updateTeams(teams) {

  pushUndo();

  draftState.teams = teams;

  broadcastState();
}

/* =========================
   UNDO
========================= */

function undo() {

  if (
    undoStack.length === 0
  ) {

    return;
  }

  redoStack.push(cloneState());

  draftState =
    undoStack.pop();

  broadcastState();
}

/* =========================
   REDO
========================= */

function redo() {

  if (
    redoStack.length === 0
  ) {

    return;
  }

  undoStack.push(cloneState());

  draftState =
    redoStack.pop();

  broadcastState();
}

/* =========================
   WEBSOCKET
========================= */

wss.on(
  "connection",
  ws => {

    sendState(ws);

    ws.on(
      "message",
      message => {

        const data =
          JSON.parse(message);

        switch (data.type) {

          case "draft":

            performDraft(
              data.mapId,
              data.action,
              data.team
            );

            break;

          case "undo":

            undo();

            break;

          case "redo":

            redo();

            break;

          case "update-teams":

            updateTeams(
              data.payload
            );

            break;

          case "set-position":

            viewState.position =
              data.position;

            broadcastState();

            break;
        }
      }
    );
  }
);

/* =========================
   START
========================= */

server.listen(
  config.port,
  () => {

    console.log(
      `Server running on port ${config.port}`
    );
  }
);