const overlay =
  document.getElementById("overlay");

const renderedEntries =
  new Map();

let currentPosition = null;

const socket =
  createWebSocket(event => {

    const data = JSON.parse(event.data);

    if (data.type === "state") {

      render(data.payload);
    }
  });

function render(payload) {

  const draft =
    payload.draft;

  const view =
    payload.view;

  const position =
    view.position;

  const compact =
    position !== "center";

  const config =
    compact
      ? view.layoutConfig.compact
      : view.layoutConfig.center;

  const positionChanged =
    currentPosition !== position;

  currentPosition = position;

  if (positionChanged) {

    rerenderAll(
      draft,
      view,
      compact,
      config
    );

    return;
  }

  document.body.className =
    position;

  overlay.style.gap =
    `${config.gap}px`;

  const currentIds =
    new Set();

  draft.draftOrder.forEach(entry => {

    currentIds.add(entry.id);

    if (
      renderedEntries.has(entry.id)
    ) {

      return;
    }

    const div =
      createEntry(
        entry,
        draft,
        view,
        compact,
        config
      );

    overlay.appendChild(div);

    renderedEntries.set(
      entry.id,
      div
    );
  });

  for (
    const [id, element]
    of renderedEntries
  ) {

    if (!currentIds.has(id)) {

      element.remove();

      renderedEntries.delete(id);
    }
  }
}

function rerenderAll(
  draft,
  view,
  compact,
  config
) {

  document.body.className =
    view.position;

  overlay.innerHTML = "";

  renderedEntries.clear();

  overlay.style.gap =
    `${config.gap}px`;

  draft.draftOrder.forEach(entry => {

    const div =
      createEntry(
        entry,
        draft,
        view,
        compact,
        config,
        false
      );

    overlay.appendChild(div);

    renderedEntries.set(
      entry.id,
      div
    );
  });
}

function createEntry(
  entry,
  draft,
  view,
  compact,
  config,
  animate = true
) {

  const div =
    document.createElement("div");

  div.className =
    `entry ${
      compact
        ? "compact"
        : "center"
    }`;

  if (animate) {

    div.classList.add("animate");
  }

  if (
    view.position.includes(
      "right"
    )
  ) {

    div.classList.add("right");
  }

  if (
    compact
    && config.widthMode === "fixed"
  ) {

    div.style.width =
      `${config.width}px`;

  } else if (compact) {

    div.style.minWidth =
      `${config.minWidth}px`;
  }

  div.style.height =
    `${config.height}px`;

  div.style.fontSize =
    `${config.fontSize}px`;

  div.style.borderRadius =
    `${config.borderRadius}px`;

  if (animate) {

    const anim =
      config.animation;
  
    div.style.opacity =
      anim.initialOpacity;
  
    div.style.transform =
      `translateY(${anim.translateY}px)`;
  
    div.style.animation =
      `
        show
        ${anim.duration}s
        ${anim.easing}
        forwards
      `;
  }

  if (entry.action === "ban") {

    div.style.background =
      config.banBackground;

  } else if (
    entry.action === "pick"
  ) {

    div.style.background =
      config.pickBackground;

  } else {

    div.style.background =
      config.deciderBackground;
  }

  const team =
    draft.teams[entry.team]
    || {
      name: "DECIDER",
      icon: "/assets/decider.png"
    };

  if (compact) {

    const showMapIcon =
      config.showMapIcon;
  
    const showTeamIcon =
      config.showTeamIcon
      && entry.team !== "system";
  
    const mapIconHtml =
      showMapIcon
        ? `
          <img
            class="map-image"
            src="${entry.image}"
            style="
              width:${config.iconSize}px;
              height:${config.iconSize}px;
            ">
        `
        : "";
  
    const teamIconHtml =
      showTeamIcon
        ? `
          <img
            class="team-icon"
            src="${team.icon}"
  
            style="
              width:${config.teamIconSize}px;
              height:${config.teamIconSize}px;
            ">
        `
        : "";
  
    div.innerHTML = `
  
      ${mapIconHtml}
  
      <div class="info">
  
        ${teamIconHtml}
  
        <div>
          ${team.name}
        </div>
  
        <div>
          ${entry.action.toUpperCase()}
        </div>
  
        <div>
          ${entry.mapName}
        </div>
  
      </div>
    `;
  } else {

    div.innerHTML = `
      <img
        class="map-image"
        src="${entry.image}"
        style="
          width:${config.iconSize}px;
          height:${config.iconSize}px;
        ">
    
      <div class="center-info">
    
        ${
          entry.team !== "system"
            ? `
              <img
                class="team-icon"
                src="${team.icon}"
    
                style="
                  width:${config.teamIconSize}px;
                  height:${config.teamIconSize}px;
                ">
            `
            : ""
        }
    
        <div class="center-text">
    
          <div class="center-action">
    
            ${entry.action.toUpperCase()}
            ${entry.mapName}
    
          </div>
    
          <div class="center-team">
    
            ${team.name}
    
          </div>
    
        </div>
    
      </div>
    `;
  }

  return div;
}