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
    acc_logout:"Cerrar sesión", auth_email:"Email", auth_password:"Contraseña", auth_ready:"Sesión iniciada", auth_missing:"Escribe email y contraseña.", auth_failed:"No se pudo autenticar.",
    auth_confirm_password:"Confirmar contraseña", auth_enter:"Entrar", auth_create:"Crear cuenta", auth_password_mismatch:"Las contraseñas no coinciden.", auth_switch_login:"Ya tengo cuenta", auth_switch_register:"Crear cuenta nueva",
    welcome_title:"Hola, soy <span>AIAME</span>", welcome_subtitle:"¿En qué puedo ayudarte hoy?",
    composer_placeholder:"Escribe un mensaje a AIAME…", mic_record:"Grabar audio", mic_stop:"Detener grabación",
    send:"Enviar", composer_hint:"AIAME puede cometer errores. Verifica la información importante.",
    settings_title:"Configuración", settings_appearance:"Apariencia", settings_theme:"Tema", settings_dark:"Modo oscuro",
    settings_language:"Idioma", settings_sound:"Sonido al responder", close:"Cerrar", back:"Volver", settings_general:"General",
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
    scroll_bottom:"Bajar al final",
    sugg_1:"Explícame un concepto difícil", sugg_2:"Ayúdame a redactar un texto", sugg_3:"Dame ideas para un proyecto", sugg_4:"Resume esto por mí",
    attach:"Adjuntar", remove:"Quitar",
  },
  en: {
    rail_new:"New chat", rail_search:"Search chats", rail_images:"Images", rail_models:"Models", rail_settings:"Settings",
    tb_search:"Search", tb_notifications:"Notifications", tb_account:"Account",
    notif_header:"Notifications", notif1_title:"Welcome to AIAME", notif1_text:"Your assistant is ready to chat.",
    notif2_title:"Tip", notif2_text:"Press <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line.",
    acc_hint:"Sign in to save your conversations", acc_login:"Log in", acc_register:"Sign up",
    acc_logout:"Log out", auth_email:"Email", auth_password:"Password", auth_ready:"Signed in", auth_missing:"Enter email and password.", auth_failed:"Could not authenticate.",
    auth_confirm_password:"Confirm password", auth_enter:"Enter", auth_create:"Create account", auth_password_mismatch:"Passwords do not match.", auth_switch_login:"I already have an account", auth_switch_register:"Create new account",
    welcome_title:"Hi, I'm <span>AIAME</span>", welcome_subtitle:"How can I help you today?",
    composer_placeholder:"Message AIAME…", mic_record:"Record audio", mic_stop:"Stop recording",
    send:"Send", composer_hint:"AIAME can make mistakes. Check important information.",
    settings_title:"Settings", settings_appearance:"Appearance", settings_theme:"Theme", settings_dark:"Dark mode",
    settings_language:"Language", settings_sound:"Sound on reply", close:"Close", back:"Back", settings_general:"General",
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
    scroll_bottom:"Scroll to bottom",
    sugg_1:"Explain a difficult concept", sugg_2:"Help me write something", sugg_3:"Give me project ideas", sugg_4:"Summarize this for me",
    attach:"Attach", remove:"Remove",
  },
  fr: {
    rail_new:"Nouveau chat", rail_search:"Rechercher", rail_images:"Images", rail_models:"Modèles", rail_settings:"Paramètres",
    tb_search:"Rechercher", tb_notifications:"Notifications", tb_account:"Compte",
    notif_header:"Notifications", notif1_title:"Bienvenue sur AIAME", notif1_text:"Votre assistant est prêt à discuter.",
    notif2_title:"Astuce", notif2_text:"Appuie sur <kbd>Shift</kbd>+<kbd>Enter</kbd> pour un saut de ligne.",
    acc_hint:"Connecte-toi pour sauvegarder tes conversations", acc_login:"Se connecter", acc_register:"S'inscrire",
    acc_logout:"Se déconnecter", auth_email:"Email", auth_password:"Mot de passe", auth_ready:"Session ouverte", auth_missing:"Saisis email et mot de passe.", auth_failed:"Authentification impossible.",
    auth_confirm_password:"Confirmer le mot de passe", auth_enter:"Entrer", auth_create:"Créer un compte", auth_password_mismatch:"Les mots de passe ne correspondent pas.", auth_switch_login:"J'ai déjà un compte", auth_switch_register:"Créer un nouveau compte",
    welcome_title:"Bonjour, je suis <span>AIAME</span>", welcome_subtitle:"Comment puis-je t'aider aujourd'hui ?",
    composer_placeholder:"Écris un message à AIAME…", mic_record:"Enregistrer un audio", mic_stop:"Arrêter l'enregistrement",
    send:"Envoyer", composer_hint:"AIAME peut faire des erreurs. Vérifie les informations importantes.",
    settings_title:"Paramètres", settings_appearance:"Apparence", settings_theme:"Thème", settings_dark:"Mode sombre",
    settings_language:"Langue", settings_sound:"Son à la réponse", close:"Fermer", back:"Retour", settings_general:"Général",
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
    scroll_bottom:"Aller en bas",
    sugg_1:"Explique-moi un concept difficile", sugg_2:"Aide-moi à rédiger un texte", sugg_3:"Donne-moi des idées de projet", sugg_4:"Résume ceci pour moi",
    attach:"Joindre", remove:"Retirer",
  },
  pt: {
    rail_new:"Novo chat", rail_search:"Buscar chats", rail_images:"Imagens", rail_models:"Modelos", rail_settings:"Configurações",
    tb_search:"Buscar", tb_notifications:"Notificações", tb_account:"Conta",
    notif_header:"Notificações", notif1_title:"Bem-vindo a AIAME", notif1_text:"Seu assistente está pronto para conversar.",
    notif2_title:"Dica", notif2_text:"Pressione <kbd>Shift</kbd>+<kbd>Enter</kbd> para pular linha.",
    acc_hint:"Entre para salvar suas conversas", acc_login:"Entrar", acc_register:"Cadastrar-se",
    acc_logout:"Sair", auth_email:"Email", auth_password:"Senha", auth_ready:"Sessão iniciada", auth_missing:"Digite email e senha.", auth_failed:"Não foi possível autenticar.",
    auth_confirm_password:"Confirmar senha", auth_enter:"Entrar", auth_create:"Criar conta", auth_password_mismatch:"As senhas não coincidem.", auth_switch_login:"Já tenho conta", auth_switch_register:"Criar nova conta",
    welcome_title:"Olá, sou <span>AIAME</span>", welcome_subtitle:"Como posso ajudar você hoje?",
    composer_placeholder:"Escreva uma mensagem para AIAME…", mic_record:"Gravar áudio", mic_stop:"Parar gravação",
    send:"Enviar", composer_hint:"AIAME pode cometer erros. Verifique informações importantes.",
    settings_title:"Configurações", settings_appearance:"Aparência", settings_theme:"Tema", settings_dark:"Modo escuro",
    settings_language:"Idioma", settings_sound:"Som ao responder", close:"Fechar", back:"Voltar", settings_general:"Geral",
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
    scroll_bottom:"Ir para o fim",
    sugg_1:"Explique um conceito difícil", sugg_2:"Ajude-me a redigir um texto", sugg_3:"Dê-me ideias para um projeto", sugg_4:"Resuma isto para mim",
    attach:"Anexar", remove:"Remover",
  },
};
let lang = "es";
let authMode = "login";
const API_BASE_URL = (
  location.protocol === "file:" ||
  ["5500", "5173", "3000", "8080"].includes(location.port)
) ? "http://127.0.0.1:8000" : "";

function t(key) {
  return (I18N[lang] && I18N[lang][key]) || I18N.es[key] || key;
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((n) => { n.setAttribute("placeholder", t(n.dataset.i18nPlaceholder)); });
  document.querySelectorAll("[data-i18n-aria]").forEach((n) => { n.setAttribute("aria-label", t(n.dataset.i18nAria)); });
  if (el.authEmail) el.authEmail.setAttribute("placeholder", t("auth_email"));
  if (el.authPassword) el.authPassword.setAttribute("placeholder", t("auth_password"));
  if (el.authPasswordConfirm) el.authPasswordConfirm.setAttribute("placeholder", t("auth_confirm_password"));
  if (el.btnLogout) el.btnLogout.textContent = t("acc_logout");
  updateAuthModeUI();
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
  scrollBottom: document.getElementById("scrollBottom"),
  btnAttach:   document.getElementById("btnAttach"),
  fileInput:   document.getElementById("fileInput"),
  attachPreview: document.getElementById("attachPreview"),
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
  authForm:    document.getElementById("authForm"),
  authEmail:   document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authPasswordConfirm: document.getElementById("authPasswordConfirm"),
  authStatus:  document.getElementById("authStatus"),
  btnAuthSubmit: document.getElementById("btnAuthSubmit"),
  btnLogin:    document.getElementById("btnLogin"),
  btnRegister: document.getElementById("btnRegister"),
  btnLogout:   document.getElementById("btnLogout"),

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
  const last = messages[messages.length - 1]?.content ?? "";
  const token = localStorage.getItem("aiame-auth-token");
  if (!token) {
    await sleep(300);
    onToken("Para guardar conversaciones y usar el tutor medico real, inicia sesion con Supabase Auth. El backend ya expone POST /api/chat y espera un Bearer token.");
    return;
  }

  const activeChat = getActiveChat();
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversation_id: activeChat?.backendConversationId ?? null,
        message: last,
        effort: "low",
      }),
    });
  } catch (err) {
    onToken("⚠️ Hubo un error de red al conectar con el backend.");
    return;
  }

  if (res.status === 401) {
    clearAuthSession();
    onToken("Tu sesión no está activa o expiró. Inicia sesión otra vez desde el botón de cuenta para usar el tutor.");
    return;
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    onToken(errorData.detail || `El backend respondió con error ${res.status}. Inténtalo de nuevo.`);
    return;
  }
  
  const data = await res.json();
  if (activeChat && data.conversation_id) activeChat.backendConversationId = data.conversation_id;
  
  const status = data.answer_status === "unverified_model_knowledge"
    ? "\n\n_Esta respuesta usa conocimiento general del modelo y aun no tiene citas documentales verificadas._"
    : "";
    
  // Since the backend doesn't stream yet, we just send the whole chunk
  onToken(`${data.answer}${status}`);
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
    node.classList.add("msg--thinking");
    bubble.classList.add("is-streaming");
    if (m.content) bubble.textContent = m.content;
    else bubble.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`;
    streamingBubble = bubble;
  } else if (role === "assistant") {
    bubble.innerHTML = renderMarkdown(m.content);
  } else {
    if (m.attachments && m.attachments.length) {
      const box = document.createElement("div");
      box.className = "msg__attachments";
      m.attachments.forEach((a) => box.appendChild(attachmentEl(a, false)));
      bubble.appendChild(box);
    }
    if (m.content) {
      const txt = document.createElement("div");
      txt.className = "msg__text";
      txt.textContent = m.content;
      bubble.appendChild(txt);
    }
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
  if ((!content && pendingAttachments.length === 0) || state.isResponding) return;

  let chat = getActiveChat();
  if (!chat) chat = createChat();

  const attachments = pendingAttachments.slice();
  chat.messages.push({ role: "user", content, attachments });
  pendingAttachments = [];
  renderAttachPreview();

  if (chat.messages.length === 1) {
    chat.title = content
      ? content.slice(0, 40) + (content.length > 40 ? "…" : "")
      : (attachments[0]?.name || t("attach"));
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
    notifyResponse();   // sonido/vibración opcional al terminar
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

// ---------- Adjuntos (archivos e imágenes) ----------
let pendingAttachments = [];   // [{ id, name, type, size, url }]

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function addFiles(fileList) {
  [...fileList].forEach((file) => {
    const att = {
      id: uid(),
      name: file.name,
      type: file.type || "",
      size: file.size,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    };
    pendingAttachments.push(att);
  });
  renderAttachPreview();
  updateSendState();
}

function removeAttachment(id) {
  const i = pendingAttachments.findIndex((a) => a.id === id);
  if (i === -1) return;
  if (pendingAttachments[i].url) URL.revokeObjectURL(pendingAttachments[i].url);
  pendingAttachments.splice(i, 1);
  renderAttachPreview();
  updateSendState();
}

// Construye la miniatura/chip de un adjunto (removable = con botón quitar)
function attachmentEl(att, removable) {
  const isImg = att.type.startsWith("image/") && att.url;
  const node = document.createElement("div");
  node.className = "attach-item" + (isImg ? " attach-item--img" : "");
  if (isImg) {
    node.innerHTML = `<img src="${att.url}" alt="${escapeHtml(att.name)}" />`;
  } else {
    node.innerHTML = `
      <span class="attach-item__icon">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="attach-item__meta">
        <span class="attach-item__name">${escapeHtml(att.name)}</span>
        <span class="attach-item__size">${formatSize(att.size)}</span>
      </span>`;
  }
  if (removable) {
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "attach-item__remove";
    rm.setAttribute("aria-label", t("remove"));
    rm.title = t("remove");
    rm.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
    rm.addEventListener("click", () => removeAttachment(att.id));
    node.appendChild(rm);
  }
  return node;
}

function renderAttachPreview() {
  if (!el.attachPreview) return;
  el.attachPreview.innerHTML = "";
  el.attachPreview.hidden = pendingAttachments.length === 0;
  pendingAttachments.forEach((att) => el.attachPreview.appendChild(attachmentEl(att, true)));
}

// ---------- Input helpers ----------
function updateSendState() {
  const empty = el.input.value.trim() === "" && pendingAttachments.length === 0;
  el.btnSend.disabled = state.isResponding || empty;
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

function scrollToBottom(smooth) {
  el.messages.scrollTo({ top: el.messages.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  updateScrollBtn();
}

// Botón "bajar al final": visible cuando hay contenido por debajo
function updateScrollBtn() {
  if (!el.scrollBottom) return;
  const m = el.messages;
  const hasMsgs = !!m.querySelector(".msg-wrap");
  const farFromBottom = m.scrollHeight - m.scrollTop - m.clientHeight > 120;
  el.scrollBottom.hidden = !(hasMsgs && farFromBottom);
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

// ---------- Supabase Auth vía backend ----------
function getAuthToken() {
  try { return localStorage.getItem("aiame-auth-token"); } catch (_) { return null; }
}

function getStoredEmail() {
  try { return localStorage.getItem("aiame-user-email"); } catch (_) { return null; }
}

function setAuthSession(session) {
  try {
    localStorage.setItem("aiame-auth-token", session.access_token);
    if (session.refresh_token) localStorage.setItem("aiame-refresh-token", session.refresh_token);
    if (session.user?.email) localStorage.setItem("aiame-user-email", session.user.email);
  } catch (_) {}
  updateAuthUI();
}

function clearAuthSession() {
  try {
    localStorage.removeItem("aiame-auth-token");
    localStorage.removeItem("aiame-refresh-token");
    localStorage.removeItem("aiame-user-email");
  } catch (_) {}
  updateAuthUI();
}

function updateAuthUI() {
  const signedIn = Boolean(getAuthToken());
  if (el.btnLogin) el.btnLogin.hidden = signedIn;
  if (el.btnRegister) el.btnRegister.hidden = signedIn;
  if (el.btnLogout) el.btnLogout.hidden = !signedIn;
  if (el.authForm) el.authForm.hidden = signedIn;
  if (el.authStatus) el.authStatus.textContent = signedIn ? `${t("auth_ready")}${getStoredEmail() ? ": " + getStoredEmail() : ""}` : "";
  updateAuthModeUI();
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  if (el.authStatus && !getAuthToken()) el.authStatus.textContent = "";
  updateAuthModeUI();
}

function updateAuthModeUI() {
  const signedIn = Boolean(getAuthToken());
  if (el.authPasswordConfirm) {
    el.authPasswordConfirm.hidden = signedIn || authMode !== "register";
    el.authPasswordConfirm.required = !signedIn && authMode === "register";
  }
  if (el.btnAuthSubmit) el.btnAuthSubmit.textContent = authMode === "register" ? t("auth_create") : t("auth_enter");
  if (el.btnLogin) el.btnLogin.textContent = authMode === "register" ? t("auth_switch_login") : t("acc_login");
  if (el.btnRegister) el.btnRegister.textContent = authMode === "register" ? t("acc_register") : t("auth_switch_register");
}

async function authenticate(mode) {
  setAuthMode(mode);
  const email = el.authEmail?.value.trim();
  const password = el.authPassword?.value;
  if (!email || !password) {
    if (el.authStatus) el.authStatus.textContent = t("auth_missing");
    return;
  }
  if (mode === "register" && password !== el.authPasswordConfirm?.value) {
    if (el.authStatus) el.authStatus.textContent = t("auth_password_mismatch");
    return;
  }

  const endpoint = mode === "register" ? `${API_BASE_URL}/api/auth/register` : `${API_BASE_URL}/api/auth/login`;
  [el.btnLogin, el.btnRegister, el.btnAuthSubmit].forEach((btn) => { if (btn) btn.disabled = true; });
  if (el.authStatus) el.authStatus.textContent = mode === "register" ? "Creando cuenta..." : "Iniciando sesion...";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(normalizeAuthError(data.detail || data.message || t("auth_failed")));
    if (!data.access_token) {
      if (el.authStatus) el.authStatus.textContent = data.message || "Cuenta creada. Revisa tu correo e inicia sesion.";
      setAuthMode("login");
      return;
    }
    setAuthSession(data);
    closeMenus(null);
  } catch (err) {
    if (el.authStatus) el.authStatus.textContent = err.message || t("auth_failed");
  } finally {
    [el.btnLogin, el.btnRegister, el.btnAuthSubmit].forEach((btn) => { if (btn) btn.disabled = false; });
  }
}

function normalizeAuthError(detail) {
  if (Array.isArray(detail)) return detail.map((item) => item.msg || item.message || String(item)).join(" ");
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") return detail.msg || detail.message || JSON.stringify(detail);
  return t("auth_failed");
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
  } else if (action === "up" || action === "down") {
    m.feedback = m.feedback === action ? null : action;
    // Actualiza en el sitio (evita re-animar los mensajes)
    const row = btn.closest(".msg__actions");
    row.querySelector('[data-action="up"]')?.classList.toggle("is-active", m.feedback === "up");
    row.querySelector('[data-action="down"]')?.classList.toggle("is-active", m.feedback === "down");
  }
});

el.input.addEventListener("input", () => { autoGrow(); updateSendState(); });

// Botón "bajar al final"
el.messages.addEventListener("scroll", updateScrollBtn);
if (el.scrollBottom) el.scrollBottom.addEventListener("click", () => scrollToBottom(true));

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

// Adjuntar archivos/imágenes
if (el.btnAttach) el.btnAttach.addEventListener("click", () => el.fileInput?.click());
if (el.fileInput) {
  el.fileInput.addEventListener("change", (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";   // permite volver a elegir el mismo archivo
  });
}
// Arrastrar y soltar sobre el composer
if (el.form) {
  ["dragenter", "dragover"].forEach((ev) =>
    el.form.addEventListener(ev, (e) => { e.preventDefault(); el.form.classList.add("is-dragover"); })
  );
  el.form.addEventListener("dragleave", (e) => {
    if (!el.form.contains(e.relatedTarget)) el.form.classList.remove("is-dragover");
  });
  el.form.addEventListener("drop", (e) => {
    e.preventDefault();
    el.form.classList.remove("is-dragover");
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
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
const DATA_DEFAULTS = { metadata: true, analytics: false, models: true, sound: false };

// Sonido + vibración al recibir respuesta (opcional)
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(620, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    o.start();
    o.stop(ctx.currentTime + 0.3);
    o.onended = () => ctx.close();
  } catch (_) {}
}
function notifyResponse() {
  if (!getDataPref("sound")) return;
  playChime();
  try { navigator.vibrate?.(30); } catch (_) {}
}

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

el.btnLogin?.addEventListener("click", () => {
  if (authMode === "register") setAuthMode("login");
  else authenticate("login");
});
el.btnRegister?.addEventListener("click", () => {
  if (authMode === "login") {
    setAuthMode("register");
    el.authPasswordConfirm?.focus();
  } else {
    authenticate("register");
  }
});
el.btnLogout?.addEventListener("click", () => {
  clearAuthSession();
  closeMenus(null);
});
el.authForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  authenticate(authMode);
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
updateAuthUI();
createChat();
applyI18n();
