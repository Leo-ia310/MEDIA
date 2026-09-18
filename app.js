/* =========================================================
   AIAME · Lógica del frontend
   ---------------------------------------------------------
   El frontend está desacoplado del "cerebro". Toda respuesta
   pasa por getAgentResponse(). Hoy es un mock; en el futuro
   se sustituye por la llamada al agente IA real SIN tocar la UI.
   ========================================================= */

// ---------- Estado ----------
const state = {
  chats: [],        // [{ id, title, messages: [{role, content}] }]
  activeChatId: null,
  isResponding: false,
};

// ---------- i18n (traducción) ----------
const I18N = {
  es: {
    rail_new:"Nuevo chat", rail_search:"Buscar chats", rail_images:"Imágenes", rail_models:"Modelos", rail_settings:"Configuración",
    tb_search:"Buscar", tb_notifications:"Notificaciones", tb_account:"Cuenta",
    notif_header:"Notificaciones", notif1_title:"Bienvenido a AIAME", notif1_text:"Tu asistente está listo para conversar.",
    notif2_title:"Consejo", notif2_text:"Pulsa <kbd>Shift</kbd>+<kbd>Enter</kbd> para saltar de línea.",
    acc_hint:"Accede para guardar tus conversaciones", acc_login:"Iniciar sesión", acc_register:"Registrarse",
    welcome_title:"Hola, soy <span>AIAME</span>", welcome_subtitle:"¿En qué puedo ayudarte hoy?",
    composer_placeholder:"Escribe un mensaje a AIAME…", mic_record:"Grabar audio", mic_stop:"Detener grabación",
    send:"Enviar", composer_hint:"AIAME puede cometer errores. Verifica la información importante.",
    settings_title:"Configuración", settings_appearance:"Apariencia", settings_theme:"Tema", settings_dark:"Modo oscuro",
    settings_language:"Idioma", close:"Cerrar", back:"Volver", settings_general:"General",
    data_title:"Control de datos", data_desc:"Gestiona qué datos usa AIAME",
    data_metadata:"Meta datos", data_metadata_desc:"Permite guardar datos sobre tus conversaciones (fechas, títulos) para organizarlas mejor.",
    data_analytics:"Analytics", data_analytics_desc:"Comparte estadísticas de uso anónimas para ayudarnos a mejorar AIAME.",
    data_models:"Modelos Mejorados", data_models_desc:"Usa tus interacciones para acceder a modelos más avanzados y respuestas de mayor calidad.",
    role_you:"Tú", role_ai:"AIAME", default_chat_title:"Nuevo chat",
    mock_l1:"Esta es una respuesta de ejemplo de AIAME 🤖",
    mock_l2:"Todavía no estoy conectada a un modelo de IA real, pero la interfaz ya está lista para recibir respuestas.",
    mock_you_wrote:"Tú escribiste:",
    error_msg:"⚠️ Hubo un problema al obtener la respuesta. Inténtalo de nuevo.",
    act_copy:"Copiar", act_copied:"Copiado", act_regenerate:"Regenerar", act_good:"Buena respuesta", act_bad:"Mala respuesta",
  },
  en: {
    rail_new:"New chat", rail_search:"Search chats", rail_images:"Images", rail_models:"Models", rail_settings:"Settings",
    tb_search:"Search", tb_notifications:"Notifications", tb_account:"Account",
    notif_header:"Notifications", notif1_title:"Welcome to AIAME", notif1_text:"Your assistant is ready to chat.",
    notif2_title:"Tip", notif2_text:"Press <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line.",
    acc_hint:"Sign in to save your conversations", acc_login:"Log in", acc_register:"Sign up",
    welcome_title:"Hi, I'm <span>AIAME</span>", welcome_subtitle:"How can I help you today?",
    composer_placeholder:"Message AIAME…", mic_record:"Record audio", mic_stop:"Stop recording",
    send:"Send", composer_hint:"AIAME can make mistakes. Check important information.",
    settings_title:"Settings", settings_appearance:"Appearance", settings_theme:"Theme", settings_dark:"Dark mode",
    settings_language:"Language", close:"Close", back:"Back", settings_general:"General",
    data_title:"Data controls", data_desc:"Manage what data AIAME uses",
    data_metadata:"Metadata", data_metadata_desc:"Allow saving data about your conversations (dates, titles) to organize them better.",
    data_analytics:"Analytics", data_analytics_desc:"Share anonymous usage statistics to help us improve AIAME.",
    data_models:"Enhanced models", data_models_desc:"Use your interactions to access more advanced models and higher-quality responses.",
    role_you:"You", role_ai:"AIAME", default_chat_title:"New chat",
    mock_l1:"This is a sample response from AIAME 🤖",
    mock_l2:"I'm not connected to a real AI model yet, but the interface is ready to receive responses.",
    mock_you_wrote:"You wrote:",
    error_msg:"⚠️ There was a problem getting the response. Please try again.",
    act_copy:"Copy", act_copied:"Copied", act_regenerate:"Regenerate", act_good:"Good response", act_bad:"Bad response",
  },
  fr: {
    rail_new:"Nouveau chat", rail_search:"Rechercher", rail_images:"Images", rail_models:"Modèles", rail_settings:"Paramètres",
    tb_search:"Rechercher", tb_notifications:"Notifications", tb_account:"Compte",
    notif_header:"Notifications", notif1_title:"Bienvenue sur AIAME", notif1_text:"Votre assistant est prêt à discuter.",
    notif2_title:"Astuce", notif2_text:"Appuie sur <kbd>Shift</kbd>+<kbd>Enter</kbd> pour un saut de ligne.",
    acc_hint:"Connecte-toi pour sauvegarder tes conversations", acc_login:"Se connecter", acc_register:"S'inscrire",
    welcome_title:"Bonjour, je suis <span>AIAME</span>", welcome_subtitle:"Comment puis-je t'aider aujourd'hui ?",
    composer_placeholder:"Écris un message à AIAME…", mic_record:"Enregistrer un audio", mic_stop:"Arrêter l'enregistrement",
    send:"Envoyer", composer_hint:"AIAME peut faire des erreurs. Vérifie les informations importantes.",
    settings_title:"Paramètres", settings_appearance:"Apparence", settings_theme:"Thème", settings_dark:"Mode sombre",
    settings_language:"Langue", close:"Fermer", back:"Retour", settings_general:"Général",
    data_title:"Contrôle des données", data_desc:"Gère les données utilisées par AIAME",
    data_metadata:"Métadonnées", data_metadata_desc:"Autorise l'enregistrement de données sur tes conversations (dates, titres) pour mieux les organiser.",
    data_analytics:"Analytique", data_analytics_desc:"Partage des statistiques d'utilisation anonymes pour nous aider à améliorer AIAME.",
    data_models:"Modèles améliorés", data_models_desc:"Utilise tes interactions pour accéder à des modèles plus avancés et des réponses de meilleure qualité.",
    role_you:"Toi", role_ai:"AIAME", default_chat_title:"Nouveau chat",
    mock_l1:"Ceci est une réponse d'exemple d'AIAME 🤖",
    mock_l2:"Je ne suis pas encore connectée à un vrai modèle d'IA, mais l'interface est prête à recevoir des réponses.",
    mock_you_wrote:"Tu as écrit :",
    error_msg:"⚠️ Un problème est survenu lors de la réponse. Réessaie.",
    act_copy:"Copier", act_copied:"Copié", act_regenerate:"Régénérer", act_good:"Bonne réponse", act_bad:"Mauvaise réponse",
  },
  pt: {
    rail_new:"Novo chat", rail_search:"Buscar chats", rail_images:"Imagens", rail_models:"Modelos", rail_settings:"Configurações",
    tb_search:"Buscar", tb_notifications:"Notificações", tb_account:"Conta",
    notif_header:"Notificações", notif1_title:"Bem-vindo a AIAME", notif1_text:"Seu assistente está pronto para conversar.",
    notif2_title:"Dica", notif2_text:"Pressione <kbd>Shift</kbd>+<kbd>Enter</kbd> para pular linha.",
    acc_hint:"Entre para salvar suas conversas", acc_login:"Entrar", acc_register:"Cadastrar-se",
    welcome_title:"Olá, sou <span>AIAME</span>", welcome_subtitle:"Como posso ajudar você hoje?",
    composer_placeholder:"Escreva uma mensagem para AIAME…", mic_record:"Gravar áudio", mic_stop:"Parar gravação",
    send:"Enviar", composer_hint:"AIAME pode cometer erros. Verifique informações importantes.",
    settings_title:"Configurações", settings_appearance:"Aparência", settings_theme:"Tema", settings_dark:"Modo escuro",
    settings_language:"Idioma", close:"Fechar", back:"Voltar", settings_general:"Geral",
    data_title:"Controle de dados", data_desc:"Gerencie quais dados a AIAME usa",
    data_metadata:"Metadados", data_metadata_desc:"Permite salvar dados sobre suas conversas (datas, títulos) para organizá-las melhor.",
    data_analytics:"Análises", data_analytics_desc:"Compartilhe estatísticas de uso anônimas para nos ajudar a melhorar a AIAME.",
    data_models:"Modelos aprimorados", data_models_desc:"Usa suas interações para acessar modelos mais avançados e respostas de maior qualidade.",
    role_you:"Você", role_ai:"AIAME", default_chat_title:"Novo chat",
    mock_l1:"Esta é uma resposta de exemplo do AIAME 🤖",
    mock_l2:"Ainda não estou conectada a um modelo de IA real, mas a interface já está pronta para receber respostas.",
    mock_you_wrote:"Você escreveu:",
    error_msg:"⚠️ Ocorreu um problema ao obter a resposta. Tente novamente.",
    act_copy:"Copiar", act_copied:"Copiado", act_regenerate:"Regenerar", act_good:"Boa resposta", act_bad:"Resposta ruim",
  },
};
let lang = "es";

function t(key) {
  return (I18N[lang] && I18N[lang][key]) || I18N.es[key] || key;
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((n) => { n.setAttribute("placeholder", t(n.dataset.i18nPlaceholder)); });
  document.querySelectorAll("[data-i18n-aria]").forEach((n) => { n.setAttribute("aria-label", t(n.dataset.i18nAria)); });
  renderMessages(); // re-traduce mensajes ya pintados (roles, etc.)
  if (el.btnMic) el.btnMic.setAttribute("aria-label", el.btnMic.classList.contains("is-recording") ? t("mic_stop") : t("mic_record"));
  // Desplegable de idioma: etiqueta actual + opción activa
  if (el.langCurrent) {
    const names = { es:"Español", en:"English", fr:"Français", pt:"Português" };
    el.langCurrent.textContent = names[lang] || lang;
    document.querySelectorAll(".lang-dd__option").forEach((o) =>
      o.classList.toggle("is-active", o.dataset.value === lang)
    );
  }
}

function setLang(next) {
  lang = I18N[next] ? next : "es";
  try { localStorage.setItem("aiame-lang", lang); } catch (_) {}
  applyI18n();
}

function initLang() {
  let saved = null;
  try { saved = localStorage.getItem("aiame-lang"); } catch (_) {}
  const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
  lang = saved || (I18N[nav] ? nav : "es");
}

// ---------- Referencias al DOM ----------
const el = {
  chatList:    document.getElementById("chatList"),
  main:        document.querySelector(".main"),
  messages:    document.getElementById("messages"),
  welcome:     document.getElementById("welcome"),
  form:        document.getElementById("composerForm"),
  input:       document.getElementById("input"),
  btnSend:     document.getElementById("btnSend"),
  btnMic:      document.getElementById("btnMic"),
  sidebar:     document.getElementById("sidebar"),
  overlay:     document.getElementById("overlay"),
  suggestions: document.getElementById("suggestions"),

  // Barra superior
  btnSearch:   document.getElementById("btnSearch"),
  searchBox:   document.getElementById("searchBox"),
  searchInput: document.getElementById("searchInput"),
  btnNotif:    document.getElementById("btnNotif"),
  notifMenu:   document.getElementById("notifMenu"),
  notifBadge:  document.getElementById("notifBadge"),
  btnAccount:  document.getElementById("btnAccount"),
  accountMenu: document.getElementById("accountMenu"),

  // Ajustes (paneles slide)
  settingsPanel: document.getElementById("settingsPanel"),
  settingsBack:  document.getElementById("settingsBack"),
  settingsTheme: document.getElementById("settingsTheme"),
  langDD:        document.getElementById("langDD"),
  langTrigger:   document.getElementById("langTrigger"),
  langMenu:      document.getElementById("langMenu"),
  langCurrent:   document.getElementById("langCurrent"),
  openData:      document.getElementById("openData"),
  dataPanel:     document.getElementById("dataPanel"),
  dataBack:      document.getElementById("dataBack"),
};

/* =========================================================
   PUNTO DE INTEGRACIÓN DEL AGENTE IA (futuro) — STREAMING
   ---------------------------------------------------------
   streamAgentResponse recibe el historial y un callback onToken
   que se llama con cada fragmento de texto. Hoy es un mock que
   simula el streaming; para el agente real, reemplaza el cuerpo
   por una lectura de stream (SSE / ReadableStream), p. ej.:

     const res = await fetch("/api/chat", {
       method:"POST", headers:{ "Content-Type":"application/json" },
       body: JSON.stringify({ messages })
     });
     const reader = res.body.getReader();
     const dec = new TextDecoder();
     while (true) {
       const { value, done } = await reader.read();
       if (done) break;
       onToken(dec.decode(value, { stream:true }));
     }
   ========================================================= */
async function streamAgentResponse(messages, onToken) {
  await sleep(400 + Math.random() * 400); // latencia inicial simulada
  const last = messages[messages.length - 1]?.content ?? "";
  const full =
    t("mock_l1") + "\n\n" +
    t("mock_l2") + "\n\n" +
    "```js\nconsole.log(\"" + t("role_ai") + "\");\n```\n\n" +
    t("mock_you_wrote") + " *" + last + "*";

  const tokens = full.match(/\s*\S+|\s+/g) || [full];
  for (const tk of tokens) {
    await sleep(18 + Math.random() * 40);
    onToken(tk);
  }
}

// ---------- Markdown + código ----------
function renderMarkdown(text) {
  try {
    if (window.marked && window.DOMPurify) {
      const html = window.marked.parse(text, { breaks: true, gfm: true });
      return window.DOMPurify.sanitize(html);
    }
  } catch (_) {}
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function enhanceCodeBlocks(container) {
  container.querySelectorAll("pre code").forEach((block) => {
    try { if (window.hljs) window.hljs.highlightElement(block); } catch (_) {}
    const pre = block.closest("pre");
    if (pre && !pre.querySelector(".code-copy")) {
      const btn = document.createElement("button");
      btn.className = "code-copy";
      btn.type = "button";
      btn.textContent = t("act_copy");
      btn.addEventListener("click", () => {
        navigator.clipboard?.writeText(block.textContent).then(() => {
          btn.textContent = t("act_copied");
          btn.classList.add("is-done");
          setTimeout(() => { btn.textContent = t("act_copy"); btn.classList.remove("is-done"); }, 1500);
        });
      });
      pre.appendChild(btn);
    }
  });
}

// ---------- Utilidades ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

function getActiveChat() {
  return state.chats.find((c) => c.id === state.activeChatId) ?? null;
}

// ---------- Gestión de chats ----------
function createChat() {
  const chat = { id: uid(), title: t("default_chat_title"), messages: [] };
  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  renderChatList();
  renderMessages();
  el.input.focus();
  return chat;
}

function switchChat(id) {
  state.activeChatId = id;
  renderChatList();
  renderMessages();
  closeSidebarMobile();
}

// ---------- Render: lista de chats ----------
function renderChatList(filter = "") {
  if (!el.chatList) return;            // el historial fue retirado de la interfaz
  const q = filter.trim().toLowerCase();
  el.chatList.innerHTML = "";
  state.chats
    .filter((chat) => !q || chat.title.toLowerCase().includes(q))
    .forEach((chat) => {
    const btn = document.createElement("button");
    btn.className = "chat-item" + (chat.id === state.activeChatId ? " is-active" : "");
    btn.type = "button";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M4 5h16v10H8l-4 4V5z" stroke="currentColor" stroke-width="2"
              stroke-linejoin="round" fill="none"/>
      </svg>
      <span>${escapeHtml(chat.title)}</span>`;
    btn.addEventListener("click", () => switchChat(chat.id));
    el.chatList.appendChild(btn);
  });
}

// ---------- Render: mensajes ----------
let streamingBubble = null;   // referencia al mensaje que se está escribiendo

function renderMessages() {
  const chat = getActiveChat();
  el.messages.querySelectorAll(".msg-wrap").forEach((n) => n.remove());
  streamingBubble = null;

  const hasMessages = chat && chat.messages.length > 0;
  el.welcome.style.display = hasMessages ? "none" : "flex";
  if (el.main) el.main.classList.toggle("is-empty", !hasMessages);
  if (!hasMessages) return;

  const wrap = document.createElement("div");
  wrap.className = "msg-wrap";
  chat.messages.forEach((m, i) => wrap.appendChild(buildMessageNode(m, i, chat)));
  el.messages.appendChild(wrap);
  enhanceCodeBlocks(wrap);
  scrollToBottom();
}

function buildMessageNode(m, index, chat) {
  const role = m.role;
  const node = document.createElement("div");
  node.className = "msg msg--" + (role === "user" ? "user" : "ai");

  const avatar = role === "user" ? "U" : `<img src="assets/logo.svg" alt="AIAME" />`;
  node.innerHTML = `
    <div class="msg__avatar">${avatar}</div>
    <div class="msg__body">
      <div class="msg__role">${role === "user" ? t("role_you") : t("role_ai")}</div>
      <div class="msg__bubble"></div>
      <div class="msg__actions"></div>
    </div>`;

  const bubble = node.querySelector(".msg__bubble");
  if (role === "assistant" && m.streaming) {
    bubble.classList.add("is-streaming");
    if (m.content) bubble.textContent = m.content;
    else bubble.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`;
    streamingBubble = bubble;
  } else if (role === "assistant") {
    bubble.innerHTML = renderMarkdown(m.content);
  } else {
    bubble.textContent = m.content;
  }

  buildActions(node.querySelector(".msg__actions"), m, index, chat);
  return node;
}

// ---------- Acciones por mensaje ----------
const ICONS = {
  copy: '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  regen: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0l5-8a2 2 0 0 1 2 2v3h5.5a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 18 20H7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3zm0 0l-5 8a2 2 0 0 1-2-2v-3H4.5a2 2 0 0 1-2-2.4l1.4-7A2 2 0 0 1 6 4h11" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/></svg>',
};

function actionBtn(action, label, active) {
  const b = document.createElement("button");
  b.className = "msg__action" + (active ? " is-active" : "");
  b.type = "button";
  b.dataset.action = action;
  b.setAttribute("aria-label", label);
  b.title = label;
  b.innerHTML = ICONS[action];
  return b;
}

function buildActions(container, m, index, chat) {
  if (m.streaming) return;
  const isLastAssistant = m.role === "assistant" && index === chat.messages.length - 1;
  const add = (b) => { b.dataset.index = index; container.appendChild(b); };
  add(actionBtn("copy", t("act_copy")));
  if (m.role === "assistant") {
    if (isLastAssistant) add(actionBtn("regen", t("act_regenerate")));
    add(actionBtn("up", t("act_good"), m.feedback === "up"));
    add(actionBtn("down", t("act_bad"), m.feedback === "down"));
  }
}

// ---------- Envío de mensajes ----------
async function sendMessage(text) {
  const content = text.trim();
  if (!content || state.isResponding) return;

  let chat = getActiveChat();
  if (!chat) chat = createChat();

  chat.messages.push({ role: "user", content });
  if (chat.messages.length === 1) {
    chat.title = content.slice(0, 40) + (content.length > 40 ? "…" : "");
    renderChatList();
  }
  renderMessages();
  resetInput();
  await runAssistant(chat);
}

// Genera (o regenera) la respuesta del asistente con streaming
async function runAssistant(chat) {
  state.isResponding = true;
  el.btnSend.disabled = true;

  const aiMsg = { role: "assistant", content: "", streaming: true, feedback: null };
  chat.messages.push(aiMsg);
  renderMessages();

  try {
    await streamAgentResponse(chat.messages.slice(0, -1), (chunk) => {
      aiMsg.content += chunk;
      if (streamingBubble) {
        streamingBubble.textContent = aiMsg.content;
        scrollToBottom();
      }
    });
  } catch (err) {
    aiMsg.content = t("error_msg");
    console.error(err);
  } finally {
    aiMsg.streaming = false;
    state.isResponding = false;
    renderMessages();
    updateSendState();
  }
}

function regenerateLast() {
  if (state.isResponding) return;
  const chat = getActiveChat();
  if (!chat || !chat.messages.length) return;
  if (chat.messages[chat.messages.length - 1].role === "assistant") {
    chat.messages.pop();
  }
  renderMessages();
  runAssistant(chat);
}

// ---------- Input helpers ----------
function updateSendState() {
  el.btnSend.disabled = state.isResponding || el.input.value.trim() === "";
}

function autoGrow() {
  el.input.style.height = "auto";
  el.input.style.height = Math.min(el.input.scrollHeight, 200) + "px";
}

function resetInput() {
  el.input.value = "";
  el.input.style.height = "auto";
  updateSendState();
}

function scrollToBottom() {
  el.messages.scrollTop = el.messages.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Sidebar móvil ----------
function openSidebarMobile() {
  el.sidebar.classList.add("is-open");
  el.overlay.hidden = false;
}
function closeSidebarMobile() {
  el.sidebar.classList.remove("is-open");
  el.overlay.hidden = true;
}

// ---------- Tema ----------
function initTheme() {
  const saved = localStorage.getItem("aiame-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}
let themeTransitionTimer = null;
function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  // Crossfade suave de toda la interfaz solo durante el cambio
  root.classList.add("theme-transition");
  clearTimeout(themeTransitionTimer);
  themeTransitionTimer = setTimeout(() => root.classList.remove("theme-transition"), 600);
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("aiame-theme", next); } catch (_) {}
}

// ---------- Dropdowns de la barra superior ----------
function closeMenus(except) {
  [
    [el.notifMenu, el.btnNotif],
    [el.accountMenu, el.btnAccount],
  ].forEach(([menu, btn]) => {
    if (menu === except) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  });
}
function toggleMenu(menu, btn) {
  const willOpen = menu.hidden;
  closeMenus(willOpen ? menu : null);
  menu.hidden = !willOpen;
  btn.setAttribute("aria-expanded", String(willOpen));
}

// ---------- Buscador ----------
function toggleSearch() {
  if (!el.searchBox) return;           // sin panel de historial no hay buscador
  const willShow = el.searchBox.hidden;
  el.searchBox.hidden = !willShow;
  if (willShow) {
    el.searchInput.focus();
  } else {
    el.searchInput.value = "";
    renderChatList();
  }
}

// ---------- Eventos ----------
el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(el.input.value);
});

// Acciones por mensaje (copiar, regenerar, feedback) via delegación
el.messages.addEventListener("click", (e) => {
  const btn = e.target.closest(".msg__action");
  if (!btn) return;
  const chat = getActiveChat();
  if (!chat) return;
  const m = chat.messages[+btn.dataset.index];
  if (!m) return;
  const action = btn.dataset.action;

  if (action === "copy") {
    navigator.clipboard?.writeText(m.content).then(() => {
      btn.classList.add("is-done");
      setTimeout(() => btn.classList.remove("is-done"), 1200);
    });
  } else if (action === "regen") {
    regenerateLast();
  } else if (action === "up") {
    m.feedback = m.feedback === "up" ? null : "up";
    renderMessages();
  } else if (action === "down") {
    m.feedback = m.feedback === "down" ? null : "down";
    renderMessages();
  }
});

el.input.addEventListener("input", () => { autoGrow(); updateSendState(); });

el.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(el.input.value);
  }
});

if (el.overlay) el.overlay.addEventListener("click", closeSidebarMobile);

if (el.suggestions) {
  el.suggestions.addEventListener("click", (e) => {
    const btn = e.target.closest(".suggestion");
    if (btn) sendMessage(btn.textContent);
  });
}

// Grabar audio (placeholder visual; conectar MediaRecorder/STT en el futuro)
if (el.btnMic) {
  el.btnMic.addEventListener("click", () => {
    const recording = el.btnMic.classList.toggle("is-recording");
    el.btnMic.setAttribute("aria-label", recording ? t("mic_stop") : t("mic_record"));
    // TODO: iniciar/parar la captura de audio real y enviarla al agente.
  });
}

// Rail de iconos
document.querySelectorAll(".rail__item").forEach((item) => {
  item.addEventListener("click", () => {
    const section = item.dataset.section;

    // Acciones directas
    if (section === "nuevo")  { createChat(); return; }
    if (section === "buscar") {
      if (el.searchBox) {
        if (el.searchBox.hidden) toggleSearch();
        el.searchInput.focus();
      }
      return;
    }

    if (section === "ajustes") { openSettings(); return; }

    // Secciones (placeholder para futuras vistas: Imágenes, Modelos)
    document.querySelectorAll(".rail__item").forEach((i) => i.classList.remove("is-active"));
    item.classList.add("is-active");
    // TODO: conmutar aquí el contenido de .main según item.dataset.section
  });
});

// ---------- Ajustes (paneles deslizantes) ----------
function openPanel(node)  { node.classList.add("is-open"); node.setAttribute("aria-hidden", "false"); }
function closePanel(node) { node.classList.remove("is-open"); node.setAttribute("aria-hidden", "true"); }

function openSettings() { openPanel(el.settingsPanel); }
function closeSettings() {
  toggleLangMenu(false);
  closePanel(el.dataPanel);
  el.settingsPanel.classList.remove("is-pushed");
  closePanel(el.settingsPanel);
}
function openData()  { openPanel(el.dataPanel); el.settingsPanel.classList.add("is-pushed"); }
function closeData() { closePanel(el.dataPanel); el.settingsPanel.classList.remove("is-pushed"); }

el.settingsBack.addEventListener("click", closeSettings);
el.settingsTheme.addEventListener("click", toggleTheme);
el.openData.addEventListener("click", openData);
el.dataBack.addEventListener("click", closeData);

// Desplegable de idioma (personalizado)
function toggleLangMenu(open) {
  const willOpen = (open === undefined) ? el.langMenu.hidden : open;
  el.langMenu.hidden = !willOpen;
  el.langDD.classList.toggle("is-open", willOpen);
  el.langTrigger.setAttribute("aria-expanded", String(willOpen));
}
el.langTrigger.addEventListener("click", (e) => { e.stopPropagation(); toggleLangMenu(); });
el.langMenu.querySelectorAll(".lang-dd__option").forEach((opt) => {
  opt.addEventListener("click", () => { setLang(opt.dataset.value); toggleLangMenu(false); });
});
document.addEventListener("click", (e) => { if (!e.target.closest("#langDD")) toggleLangMenu(false); });

// ---------- Control de datos (toggles activables + persistencia) ----------
const DATA_DEFAULTS = { metadata: true, analytics: false, models: true };

function getDataPref(key) {
  try {
    const v = localStorage.getItem("aiame-data-" + key);
    if (v !== null) return v === "1";
  } catch (_) {}
  return DATA_DEFAULTS[key];
}
function setDataPref(key, on) {
  try { localStorage.setItem("aiame-data-" + key, on ? "1" : "0"); } catch (_) {}
}
function initDataToggles() {
  document.querySelectorAll(".setting-row--toggle").forEach((row) => {
    const key = row.dataset.toggle;
    row.classList.toggle("is-on", getDataPref(key));
    row.setAttribute("aria-pressed", String(getDataPref(key)));
    row.addEventListener("click", () => {
      const on = !row.classList.contains("is-on");
      row.classList.toggle("is-on", on);
      row.setAttribute("aria-pressed", String(on));
      setDataPref(key, on);
      // TODO: aplicar la preferencia real (activar/desactivar la función correspondiente).
    });
  });
}

// Barra superior: buscar
el.btnSearch.addEventListener("click", toggleSearch);
if (el.searchInput) el.searchInput.addEventListener("input", () => renderChatList(el.searchInput.value));

// Barra superior: notificaciones y cuenta
el.btnNotif.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu(el.notifMenu, el.btnNotif);
  el.notifBadge.style.display = "none"; // "leídas" al abrir
});
el.btnAccount.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu(el.accountMenu, el.btnAccount);
});

// Autenticación (placeholder; conectar con el sistema de cuentas en el futuro)
document.getElementById("btnLogin")?.addEventListener("click", () => {
  closeMenus(null);
  // TODO: abrir flujo de inicio de sesión
});
document.getElementById("btnRegister")?.addEventListener("click", () => {
  closeMenus(null);
  // TODO: abrir flujo de registro
});

// Cerrar menús al hacer clic fuera o con Escape
document.addEventListener("click", (e) => {
  if (!e.target.closest(".menu-anchor")) closeMenus(null);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeMenus(null);
    if (!el.langMenu.hidden) { toggleLangMenu(false); return; }
    if (el.dataPanel.classList.contains("is-open")) closeData();
    else if (el.settingsPanel.classList.contains("is-open")) closeSettings();
  }
});

// ---------- Init ----------
initTheme();
initLang();
initDataToggles();
createChat();
applyI18n();
