const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* =====================================================
   BLOX FRUITS SERVERS EVENTS
   Basado en el script original del ZIP del proyecto.
   ===================================================== */

const screens = {
  welcome: $("#welcome"),
  app: $("#app"),
  create: $("#create")
};

const EVENT_TYPES = [
  ["ship-raid", "Incursión de barcos", "Sea 2 y 3", "🚢"],
  ["haunted-ship-raid", "Incursión de barcos embrujados", "Sea 3", "👻"],
  ["sea-beast", "Sea Beast", "Sea 2 y 3", "🐋"],
  ["rumbling-waters", "Aguas retumbantes", "Sea 2 y 3", "🌊"],
  ["terror-shark", "Terror Shark", "Sea 3", "🦈"],
  ["kitsune-island", "Isla Kitsune", "Sea 3", "🦊"],
  ["mirage-island", "Isla Espejismo", "Sea 3", "🏝️"],
  ["prehistoric-island", "Isla prehistórica", "Sea 3", "🦖"],
  ["leviathan", "Leviathan", "Sea 3", "🐋"],
  ["katakuri-v1", "Katakuri V1", "Sea 3", "🍰"],
  ["katakuri-v2", "Katakuri V2", "Sea 3", "🍰"],
  ["tyrant-of-the-skies", "Tyrant of the Skies", "Sea 3", "🗿"],
  ["rip-indra", "rip_indra", "Sea 3", "🏰"],
  ["cursed-captain", "Cursed Captain", "Sea 2", "👻"],
  ["low", "Low", "Sea 2", "🤖"],
  ["darkbeard", "Darkbeard", "Sea 2", "🌑"],
  ["greybeard", "Greybeard", "Sea 1", "⚓"],
  ["soul-reaper", "Soul Reaper", "Sea 3", "💀"]
].map(([id, title, sea, icon]) => ({ id, title, sea, icon }));

const STORAGE_KEY = "bfsEventsV5";
const REPORTS_KEY = "bfsPlayerReportsV1";

let events = [];
let filter = "all";
let searchText = "";

let localUserId = localStorage.getItem("bfsLocalUserId");

if (!localUserId) {
  localUserId = "local-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  localStorage.setItem("bfsLocalUserId", localUserId);
}

const defaultEvents = [
  {
    id: "demo-1",
    eventId: "ship-raid",
    title: "Incursión de barcos",
    sea: "Sea 2 y 3",
    icon: "🚢",
    host: "Jugador de ejemplo",
    ownerId: "demo",
    type: "private",
    players: 7,
    capacity: 12,
    link: "",
    description: "Buscando jugadores para el evento.",
    createdAt: Date.now(),
    startsAt: Date.now(),
    expiresAt: null,
    cancelled: false,
    events: [
      {
        id: "ship-raid",
        title: "Incursión de barcos",
        icon: "🚢",
        sea: "Sea 2 y 3"
      }
    ]
  }
];

/* =====================================================
   GUARDAR Y CARGAR
   ===================================================== */

function loadEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (error) {
    console.warn("Error cargando eventos:", error);
  }

  return [...defaultEvents];
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function loadReports() {
  try {
    const saved = JSON.parse(localStorage.getItem(REPORTS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn("Error cargando denuncias:", error);
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

events = loadEvents();

/* =====================================================
   INFORMACIÓN DE EVENTOS
   ===================================================== */

function getEventInfo(id) {
  return EVENT_TYPES.find(event => event.id === id);
}

/* =====================================================
   NAVEGACIÓN
   ===================================================== */

function showScreen(name) {
  Object.values(screens).forEach(screen => {
    screen?.classList.remove("active");
  });

  screens[name]?.classList.add("active");

  if (name === "app") renderEvents();
}

$("#nextBtn")?.addEventListener("click", () => showScreen("app"));
$("#createBtn")?.addEventListener("click", () => showScreen("create"));
$("#backBtn")?.addEventListener("click", () => showScreen("app"));
$("#eventsBtn")?.addEventListener("click", () => renderEvents());

/* =====================================================
   INICIO DE SESIÓN DEMO
   ===================================================== */

const loginModal = $("#loginModal");

$("#loginBtn")?.addEventListener("click", () => {
  loginModal?.classList.remove("hidden");
});

$("#creatorLoginBtn")?.addEventListener("click", () => {
  loginModal?.classList.remove("hidden");
});

$("#closeLogin")?.addEventListener("click", () => {
  loginModal?.classList.add("hidden");
});

$("#robloxLogin")?.addEventListener("click", () => {
  alert("La conexión real con Roblox se añadirá posteriormente.");
  loginModal?.classList.add("hidden");
});

/* =====================================================
   SELECCIÓN DE EVENTOS
   ===================================================== */

function populateEventChoices() {
  const container = $("#eventChoices");

  if (!container) return;

  container.innerHTML = "";

  EVENT_TYPES.forEach(event => {
    const label = document.createElement("label");
    label.className = "event-choice";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "event";
    input.value = event.id;

    const text = document.createElement("span");
    text.textContent = `${event.icon} ${event.title} · ${event.sea}`;

    label.append(input, text);
    container.appendChild(label);
  });
}

/* =====================================================
   SERVIDORES PRIVADOS
   ===================================================== */

const privateRadio = $('input[name="serverType"][value="private"]');
const publicRadio = $('input[name="serverType"][value="public"]');

if (privateRadio) privateRadio.checked = true;
if (publicRadio) publicRadio.checked = false;

$("#privateBox")?.classList.remove("hidden");

$$('input[name="serverType"]').forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "public" && radio.checked) {
      if (privateRadio) privateRadio.checked = true;
      radio.checked = false;
    }

    $("#privateBox")?.classList.remove("hidden");
  });
});

function isValidRobloxPrivateLink(value) {
  try {
    const url = new URL(value);

    return url.protocol === "https:" &&
      (url.hostname === "roblox.com" ||
       url.hostname.endsWith(".roblox.com"));
  } catch (_) {
    return false;
  }
}

/* =====================================================
   CREAR EVENTO
   ===================================================== */

$("#publishBtn")?.addEventListener("click", () => {
  const selected = $$('#eventChoices input[type="checkbox"]:checked');
  const message = $("#formMsg");

  const showMessage = text => {
    if (message) message.textContent = text;
  };

  if (!selected.length) {
    showMessage("⚠️ Selecciona al menos un evento.");
    return;
  }

  const privateLink = $("#privateLink")?.value.trim() || "";

  if (!privateLink) {
    showMessage("⚠️ Añade el enlace de tu servidor privado.");
    return;
  }

  if (!isValidRobloxPrivateLink(privateLink)) {
    showMessage("⚠️ Introduce un enlace válido de Roblox que comience con https://www.roblox.com/.");
    return;
  }

  const description = $("#eventDescription")?.value.trim() || "";

  let capacity = Number($("#capacity")?.value || 12);

  if (!Number.isFinite(capacity)) capacity = 12;

  capacity = Math.max(1, Math.min(12, capacity));

  const delay = Math.max(0, Number($("#startDelay")?.value || 0));
  const duration = Math.max(0, Number($("#duration")?.value || 0));

  const now = Date.now();
  const startsAt = now + delay * 60000;

  const expiresAt = duration > 0
    ? startsAt + duration * 60000
    : null;

  const selectedInfo = selected
    .map(input => getEventInfo(input.value))
    .filter(Boolean);

  const primary = selectedInfo[0];

  const newEvent = {
    id: "event-" + now + "-" + Math.random().toString(36).slice(2),

    events: selectedInfo.map(event => ({
      id: event.id,
      title: event.title,
      sea: event.sea,
      icon: event.icon
    })),

    eventId: primary.id,
    title: primary.title,
    sea: primary.sea,
    icon: primary.icon,

    host: "Tú",
    ownerId: localUserId,

    type: "private",
    players: 0,
    capacity,
    link: privateLink,
    description,

    createdAt: now,
    startsAt,
    expiresAt,
    cancelled: false
  };

  events.unshift(newEvent);
  saveEvents();

  showMessage(
    delay > 0
      ? `✅ Evento programado. Aparecerá en ${delay} minutos.`
      : "✅ ¡Evento publicado!"
  );

  setTimeout(() => showScreen("app"), 600);
});

/* =====================================================
   LIMPIEZA DE EVENTOS
   ===================================================== */

function cleanEvents() {
  const now = Date.now();
  const before = events.length;

  events = events.filter(event =>
    !event.cancelled &&
    !(event.expiresAt && now >= event.expiresAt)
  );

  if (before !== events.length) saveEvents();
}

/* =====================================================
   BÚSQUEDA
   ===================================================== */

$("#eventSearch")?.addEventListener("input", event => {
  searchText = event.target.value.trim().toLowerCase();
  renderEvents();
});

/* =====================================================
   FILTROS
   ===================================================== */

$$(".filter").forEach(button => {
  button.addEventListener("click", () => {
    $$(".filter").forEach(item => item.classList.remove("active"));

    button.classList.add("active");
    filter = button.dataset.type || "all";

    renderEvents();
  });
});

/* =====================================================
   TIEMPO RESTANTE
   ===================================================== */

function formatRemaining(timestamp) {
  const seconds = Math.floor(
    Math.max(0, timestamp - Date.now()) / 1000
  );

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;

  return `${seconds}s`;
}

/* =====================================================
   EVENTOS VISIBLES
   ===================================================== */

function isVisible(event) {
  const now = Date.now();

  if (event.cancelled) return false;
  if (event.startsAt && now < event.startsAt) return false;
  if (event.expiresAt && now >= event.expiresAt) return false;

  if (filter !== "all" && event.type !== filter) return false;

  if (searchText) {
    const names = (event.events || []).map(item => item.title);

    const text = [
      event.title,
      event.description,
      event.sea,
      ...names
    ].join(" ").toLowerCase();

    if (!text.includes(searchText)) return false;
  }

  return true;
}

/* =====================================================
   MOSTRAR VARIOS EVENTOS EN UNA TARJETA
   ===================================================== */

function renderEventTitle(event) {
  const list = event.events?.length
    ? event.events
    : [{ title: event.title, icon: event.icon }];

  const first = list[0];

  let html =
    `<strong>${escapeHTML(first.icon || "⚔️")} ${escapeHTML(first.title || "Evento")}</strong>`;

  if (list.length > 1) {
    html += '<div class="sub-event-icons">';

    list.slice(1).forEach(item => {
      html += `<span title="${escapeHTML(item.title)}">${escapeHTML(item.icon || "⚔️")}</span>`;
    });

    html += "</div>";
  }

  return html;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/* =====================================================
   DENUNCIAR JUGADORES
   ===================================================== */

function reportPlayer(event) {
  const username = prompt(
    "Escribe el nombre de usuario de Roblox del jugador:"
  );

  if (!username || !username.trim()) return;

  const reason = prompt(
    "Motivo de la denuncia:\n" +
    "1. Trolear o arruinar el evento\n" +
    "2. Insultar o molestar\n" +
    "3. Interrumpir el evento\n" +
    "4. Spam\n" +
    "5. Otro"
  );

  if (!reason) return;

  const reasons = {
    "1": "Trolear o arruinar el evento",
    "2": "Insultar o molestar",
    "3": "Interrumpir el evento",
    "4": "Spam",
    "5": "Otro"
  };

  const details = prompt(
    "Describe brevemente lo ocurrido (opcional):"
  ) || "";

  const reports = loadReports();

  const duplicate = reports.some(report =>
    report.eventId === event.id &&
    report.reporterId === localUserId &&
    report.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (duplicate) {
    alert("Ya enviaste una denuncia de ese jugador para este evento.");
    return;
  }

  reports.push({
    id: "report-" + Date.now() + "-" + Math.random().toString(36).slice(2),
    eventId: event.id,
    eventTitle: event.title,
    reporterId: localUserId,
    organizer: event.host,
    username: username.trim().replace(/^@/, ""),
    reason: reasons[reason] || "Otro",
    details: details.trim(),
    createdAt: Date.now(),
    status: "pendiente"
  });

  saveReports(reports);

  alert(
    "Denuncia guardada en este dispositivo. Todavía no se ha enviado a un administrador."
  );
}

/* =====================================================
   MOSTRAR EVENTOS
   ===================================================== */

function renderEvents() {
  cleanEvents();

  const list = $("#eventsList");

  if (!list) return;

  list.innerHTML = "";

  const visible = events.filter(isVisible);

  if ($("#eventCount")) {
    $("#eventCount").textContent = visible.length;
  }

  const totalPlayers = visible.reduce(
    (sum, event) => sum + Number(event.players || 0),
    0
  );

  if ($("#sitePlayers")) {
    $("#sitePlayers").textContent = Math.max(1, totalPlayers);
  }

  if ($("#welcomePlayers")) {
    $("#welcomePlayers").textContent = Math.max(1, totalPlayers);
  }

  if (!visible.length) {
    list.innerHTML = '<div class="empty">No hay eventos disponibles.</div>';
    return;
  }

  visible.forEach(event => {
    const template = $("#eventTemplate");

    if (!template) return;

    const node = template.content.cloneNode(true);

    const icon = node.querySelector(".event-icon");
    const title = node.querySelector(".event-title");
    const host = node.querySelector(".event-host");
    const badge = node.querySelector(".badge");
    const players = node.querySelector(".players");
    const description = node.querySelector(".event-description");
    const time = node.querySelector(".event-time");
    const join = node.querySelector(".join");
    const card = node.querySelector(".event-card");

    if (icon) icon.textContent = event.icon || "⚔️";

    if (title) title.innerHTML = renderEventTitle(event);

    if (host) {
      host.textContent = `Organizado por ${event.host || "Jugador"}`;
    }

    if (badge) {
      badge.textContent = "🔒 Servidor privado";
    }

    if (players) {
      players.textContent = `${event.players || 0}/${event.capacity || 12}`;
    }

    if (description) {
      description.textContent = event.description || "Sin descripción.";
      description.title = "Toca para leer la descripción completa";

      description.addEventListener("click", () => {
        alert(event.description || "Este evento no tiene descripción.");
      });
    }

    if (time) {
      time.textContent = event.expiresAt
        ? `⏳ ${formatRemaining(event.expiresAt)}`
        : "♾️ Sin límite";
    }

    /* Botones exclusivos del organizador */
    if (event.ownerId === localUserId && card) {
      const reportButton = document.createElement("button");

      reportButton.type = "button";
      reportButton.className = "report-player";
      reportButton.textContent = "⚠️ Denunciar jugador";

      reportButton.addEventListener("click", () => {
        reportPlayer(event);
      });

      card.appendChild(reportButton);

      const cancel = document.createElement("button");

      cancel.type = "button";
      cancel.className = "cancel-event";
      cancel.textContent = "❌ Cancelar";

      cancel.addEventListener("click", () => {
        if (confirm("¿Cancelar este evento?")) {
          event.cancelled = true;
          saveEvents();
          renderEvents();
        }
      });

      card.appendChild(cancel);
    }

    /* Botón para entrar al servidor privado */
    if (join) {
      join.addEventListener("click", () => {
        if (event.players >= event.capacity) {
          alert("Este evento está lleno.");
          return;
        }

        if (!event.link || !isValidRobloxPrivateLink(event.link)) {
          alert("Este evento no tiene un enlace privado válido.");
          return;
        }

        event.players++;
        saveEvents();
        renderEvents();

        window.open(event.link, "_blank", "noopener,noreferrer");
      });
    }

    list.appendChild(node);
  });
}

/* =====================================================
   ACTUALIZACIÓN AUTOMÁTICA
   ===================================================== */

setInterval(() => {
  cleanEvents();

  if (screens.app?.classList.contains("active")) {
    renderEvents();
  }
}, 1000);

/* =====================================================
   INICIO
   ===================================================== */

populateEventChoices();
cleanEvents();
renderEvents();
