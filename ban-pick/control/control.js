const socket = new WebSocket(
  `ws://${location.host}`
);

let currentState = null;

socket.addEventListener(
  "message",
  event => {

    const data =
      JSON.parse(event.data);

    if (data.type === "state") {

      currentState =
        data.payload;

      render();
    }
  }
);

/* =========================
   RENDER
========================= */

function render() {

  if (!currentState) return;

  renderTeams();

  renderMaps();

  renderHistory();
}

/* =========================
   TEAMS
========================= */

function renderTeams() {

  const teams =
    currentState.draft.teams;

  document.getElementById(
    "team1-name"
  ).value = teams.team1.name;

  document.getElementById(
    "team1-icon"
  ).value = teams.team1.icon;

  document.getElementById(
    "team2-name"
  ).value = teams.team2.name;

  document.getElementById(
    "team2-icon"
  ).value = teams.team2.icon;
}

function updateTeams() {

  socket.send(JSON.stringify({

    type: "update-teams",

    payload: {

      team1: {

        name:
          document.getElementById(
            "team1-name"
          ).value,

        icon:
          document.getElementById(
            "team1-icon"
          ).value
      },

      team2: {

        name:
          document.getElementById(
            "team2-name"
          ).value,

        icon:
          document.getElementById(
            "team2-icon"
          ).value
      }
    }
  }));
}

/* =========================
   MAPS
========================= */

function renderMaps() {

  const mapsContainer =
    document.getElementById(
      "maps"
    );

  mapsContainer.innerHTML = "";

  const maps =
    currentState.draft.maps;

  maps.forEach(map => {

    const div =
      document.createElement("div");

    div.className = "map";

    const disabled =
      map.state !== "available"
        ? "disabled"
        : "";

    const teams =
      currentState.draft.teams;

    div.innerHTML = `

      <img
        src="${map.image}"
        class="map-thumb">

      <div class="map-info">

        <div>
          ${map.name}
        </div>

        <div>
          Status:
          ${map.state}
        </div>

      </div>

      <button
        ${disabled}
        onclick="
          draft(
            '${map.id}',
            'ban',
            'team1'
          )
        ">

        ${teams.team1.name} BAN

      </button>

      <button
        ${disabled}
        onclick="
          draft(
            '${map.id}',
            'pick',
            'team1'
          )
        ">

        ${teams.team1.name} PICK

      </button>

      <button
        ${disabled}
        onclick="
          draft(
            '${map.id}',
            'ban',
            'team2'
          )
        ">

        ${teams.team2.name} BAN

      </button>

      <button
        ${disabled}
        onclick="
          draft(
            '${map.id}',
            'pick',
            'team2'
          )
        ">

        ${teams.team2.name} PICK

      </button>

      <button
        ${disabled}
        onclick="
          draft(
            '${map.id}',
            'decider',
            'system'
          )
        ">

        DECIDER

      </button>
    `;

    mapsContainer.appendChild(div);
  });
}

/* =========================
   DRAFT
========================= */

function draft(
  mapId,
  action,
  team
) {

  socket.send(JSON.stringify({

    type: "draft",

    mapId,

    action,

    team
  }));
}

/* =========================
   HISTORY
========================= */

function renderHistory() {

  const historyContainer =
    document.getElementById(
      "history"
    );

  historyContainer.innerHTML = "";

  const history =
    currentState.draft
      .draftOrder;

  history.forEach(entry => {

    const div =
      document.createElement("div");

    div.className = "history-entry";

    const team =
      currentState.draft.teams[
        entry.team
      ] || {

        name: "DECIDER",

        icon:
          "/assets/decider.png"
      };

    div.innerHTML = `

      <img
        src="${team.icon}"
        class="team-icon">

      <span>

        ${team.name}

        ${entry.action.toUpperCase()}

        ${entry.mapName}

      </span>
    `;

    historyContainer
      .appendChild(div);
  });
}

/* =========================
   UNDO / REDO
========================= */

function undo() {

  socket.send(JSON.stringify({

    type: "undo"
  }));
}

function redo() {

  socket.send(JSON.stringify({

    type: "redo"
  }));
}

/* =========================
   POSITION
========================= */

function setPosition(
  position
) {

  socket.send(JSON.stringify({

    type: "set-position",

    position
  }));
}