const socket = new WebSocket(
  `ws://${location.host}`
);

let currentState = null;

socket.addEventListener("message", event => {

    const data = JSON.parse(event.data);

    if (data.type === "state") {
      currentState = data.payload;
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
  const teams = currentState.teams;

  document.getElementById("team1-name").value = teams.team1.name;
  document.getElementById("team1-icon").value = teams.team1.icon;
  document.getElementById("team2-name").value = teams.team2.name;
  document.getElementById("team2-icon").value = teams.team2.icon;
}

function updateTeams() {
  socket.send(JSON.stringify({
    type: "update-teams",
    payload: {
      team1: {
        name:
          document.getElementById("team1-name").value,
        icon:
          document.getElementById("team1-icon").value
      },

      team2: {
        name:
          document.getElementById("team2-name").value,
        icon:
          document.getElementById("team2-icon").value
      }
    }
  }));
}

/* =========================
   MAPS
========================= */

function renderMaps() {
  const mapsContainer = document.getElementById("maps");

  mapsContainer.innerHTML = "";

  const maps = currentState.draft.maps;

  maps.forEach(map => {
    const div = document.createElement("div");

    div.className = "map";

    const disabled = map.state !== "available"
        ? "disabled"
        : "";

    const teams = currentState.teams;

    div.className =  "bg-base-200 rounded-xl p-3 flex gap-3 items-center";

    const team1Short =
    teams.team1.name || "Team 1";
  
  const team2Short =
    teams.team2.name || "Team 2";
  
  div.innerHTML = `
    <img
      src="${map.image}"
      class="w-28 h-16 object-cover rounded-lg shrink-0"
    >
  
    <div class="flex-1 min-w-0">
  
      <div class="flex items-center justify-between">
  
        <div class="font-bold truncate">
          ${map.name}
        </div>
  
        <div class="
          badge badge-sm
          ${map.state === 'banned' ? 'badge-error' : ''}
          ${map.state === 'picked' ? 'badge-success' : ''}
          ${map.state === 'decider' ? 'badge-info' : ''}
        ">
          ${map.state}
        </div>
  
      </div>
  
      <div class="grid grid-cols-5 gap-1 mt-2">
  
        <button
          type="button"
          class="draft-btn btn btn-xs btn-error"
          ${disabled}
          onclick="draft('${map.id}', 'ban', 'team1')"
        >
          ${team1Short} BAN
        </button>
  
        <button
          type="button"
          class="draft-btn btn btn-xs btn-success"
          ${disabled}
          onclick="draft('${map.id}', 'pick', 'team1')"
        >
          ${team1Short} PICK
        </button>
  
        <button
          type="button"
          class="draft-btn btn btn-xs btn-error"
          ${disabled}
          onclick="draft('${map.id}', 'ban', 'team2')"
        >
          ${team2Short} BAN
        </button>
  
        <button
          type="button"
          class="draft-btn btn btn-xs btn-success"
          ${disabled}
          onclick="draft('${map.id}', 'pick', 'team2')"
        >
          ${team2Short} PICK
        </button>
  
        <button
          type="button"
          class="draft-btn btn btn-xs btn-info"
          ${disabled}
          onclick="draft('${map.id}', 'decider', 'system')"
        >
          DECIDER
        </button>
  
      </div>
  
    </div>
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

  const history = currentState.draft.draftOrder;

  history.forEach(entry => {

    const div = document.createElement("div");
  
    let bgClass = "bg-base-200";
  
    if (entry.action === "ban") {
      bgClass = "bg-error text-error-content";
    }
  
    if (entry.action === "pick") {
      bgClass = "bg-success text-success-content";
    }
  
    if (entry.action === "decider") {
      bgClass = "bg-info text-info-content";
    }
  
    const team =
      entry.action === "decider"
        ? ""
        : currentState.teams[entry.team]?.name || "";
  
    div.className = `
      rounded-lg px-3 py-2 text-sm font-semibold
      ${bgClass}
    `;
  
    div.innerHTML = `
      ${team ? `${team} · ` : ""}
      ${entry.action.toUpperCase()}
      ·
      ${entry.mapName}
    `;
  
    historyContainer.appendChild(div);
  
  });
}

/* =========================
   UNDO / REDO
========================= */

function undo() {
  socket.send(JSON.stringify({type: "undo"}));
}

function redo() {
  socket.send(JSON.stringify({type: "redo"}));
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

function setOverlayVisible(visible) {
  socket.send(JSON.stringify({
    type:
      "set-overlay-visible",
    visible
  }));
}