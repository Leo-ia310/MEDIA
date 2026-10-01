/* =========================================================
   Media · Lógica del frontend
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
  view: "chat",
  library: {
    loading: false,
    loaded: false,
    activeCategory: "all",
    activeBranch: "all",
    query: "",
    documents: [],
    categories: [],
  },
};

// ---------- i18n (traducción) ----------
const I18N = {
  es: {
    rail_new: "Nuevo chat", rail_search: "Buscar chats", rail_images: "Imágenes", rail_library: "Biblioteca", rail_settings: "Configuración", rail_toggle: "Contraer menú", rail_toggle_expand: "Expandir menú",
    hero_morning:"Buenos días", hero_afternoon:"Buenas tardes", hero_evening:"Buenas noches", hero_night:"Buenas noches", hero_hi:"Hola, soy", hero_sub:"¿En qué puedo ayudarte hoy?",
    day_today:"Hoy", day_yesterday:"Ayer",
    tb_search: "Buscar", tb_notifications: "Notificaciones", tb_account: "Cuenta",
    notif_header: "Notificaciones", notif1_title: "Bienvenido a Media", notif1_text: "Tu asistente está listo para conversar.",
    notif2_title: "Consejo", notif2_text: "Pulsa <kbd>Shift</kbd>+<kbd>Enter</kbd> para saltar de línea.",
    acc_hint: "Accede para guardar tus conversaciones", acc_login: "Iniciar sesión", acc_register: "Registrarse",
    acc_logout: "Cerrar sesión", auth_email: "Email", auth_password: "Contraseña", auth_ready: "Sesión iniciada", auth_missing: "Escribe email y contraseña.", auth_failed: "No se pudo autenticar.",
    auth_confirm_password: "Confirmar contraseña", auth_enter: "Entrar", auth_create: "Crear cuenta", auth_password_mismatch: "Las contraseñas no coinciden.", auth_switch_login: "Ya tengo cuenta", auth_switch_register: "Crear cuenta nueva",
    auth_title_login: "Inicia sesión", auth_title_register: "Crea tu cuenta", auth_sub_login: "Accede para guardar tus conversaciones", auth_sub_register: "Regístrate para guardar tu historial", auth_no_account: "¿No tienes cuenta?", auth_have_account: "¿Ya tienes cuenta?",
    welcome_title: "Hola, soy <span>Media</span>", welcome_subtitle: "¿En qué puedo ayudarte hoy?",
    composer_placeholder: "Escribe un mensaje a Media…", mic_record: "Grabar audio", mic_stop: "Detener grabación",
    send: "Enviar", composer_hint: "Media puede cometer errores. Verifica la información importante.",
    settings_title: "Configuración", settings_appearance: "Apariencia", settings_theme: "Tema", settings_dark: "Modo oscuro",
    settings_language: "Idioma", settings_sound: "Sonido al responder", close: "Cerrar", back: "Volver", settings_general: "General",
    data_title: "Control de datos", data_desc: "Gestiona qué datos usa Media",
    data_metadata: "Meta datos", data_metadata_desc: "Permite guardar datos sobre tus conversaciones (fechas, títulos) para organizarlas mejor.",
    data_analytics: "Analytics", data_analytics_desc: "Comparte estadísticas de uso anónimas para ayudarnos a mejorar Media.",
    role_you: "Tú", role_ai: "Media", default_chat_title: "Nuevo chat",
    mock_l1: "Esta es una respuesta de ejemplo de Media 🤖",
    mock_l2: "Todavía no estoy conectada a un modelo de IA real, pero la interfaz ya está lista para recibir respuestas.",
    mock_you_wrote: "Tú escribiste:",
    error_msg: "⚠️ Hubo un problema al obtener la respuesta. Inténtalo de nuevo.",
    act_copy: "Copiar", act_copied: "Copiado", act_regenerate: "Regenerar", act_good: "Buena respuesta", act_bad: "Mala respuesta", act_report: "Reportar error",
    scroll_bottom: "Bajar al final",
    sugg_1: "Explícame un concepto difícil", sugg_2: "Ayúdame a redactar un texto", sugg_3: "Dame ideas para un proyecto", sugg_4: "Resume esto por mí",
    attach: "Adjuntar", remove: "Quitar",
    kbd_hint: "<kbd>Enter</kbd> enviar · <kbd>Shift</kbd>+<kbd>Enter</kbd> nueva línea",
    sources: "Fuentes", kb_request: "Solicitar fuente verificada", kb_requested: "Solicitud enviada", kb_error: "No se pudo enviar", related_title: "Relacionado",
    learn_title: "Perfil de aprendizaje", learn_desc: "Cómo Media adapta sus explicaciones a ti", learn_style: "Estilo de explicación", learn_difficulty: "Nivel de dificultad", learn_strengths: "Fortalezas", learn_growth: "Áreas de mejora", learn_confusions: "Confusiones frecuentes", learn_none: "Aún no hay datos.", learn_error: "No se pudo cargar tu perfil.", learn_style_balanced: "Equilibrado", learn_style_concise: "Conciso", learn_style_detailed: "Detallado", learn_style_visual: "Visual", learn_diff_basic: "Básico", learn_diff_intermediate: "Intermedio", learn_diff_advanced: "Avanzado",
    demo_topic: "tu consulta", demo_intro: "Aquí tienes una explicación sobre", demo_point1: "Idea clave relacionada con el tema.", demo_point2: "Un segundo punto con más detalle.", demo_point3: "Un tercer punto para ampliar.", demo_code_intro: "También puedo usar formato enriquecido y bloques de código:", demo_note: "Respuesta de demostración. Inicia sesión para el tutor médico real con fuentes verificadas.", demo_followup: "¿Quieres que profundice en", demo_asset: "Recurso de ejemplo",
    practice_title: "Herramientas de estudio", history_title: "Historial", practice_slides: "Presentación", practice_mindmap: "Mapa mental", practice_quiz: "Cuestionario", practice_cards: "Tarjetas didácticas", practice_reports: "Informes",
    practice_no_conversation: "No tienes ninguna conversacion.", practice_login: "Inicia sesión para guardar y generar recursos desde tu conversación.", practice_ready: "Recurso preparado", practice_error: "No se pudo preparar el recurso.",
    img_title: "Generar imagen", img_desc: "Crea una imagen educativa con IA a partir de una descripción.", img_prompt: "Descripción", img_prompt_ph: "Ej: diagrama del ciclo cardíaco con sus fases", img_aspect: "Proporción", img_quality: "Calidad", img_quality_fast: "Rápida", img_quality_high: "Alta calidad", img_close: "Cerrar", img_generate: "Generar", img_generating: "Generando…", img_download: "Descargar PNG", img_empty: "Escribe una descripción (mín. 3 caracteres).", img_error: "No se pudo generar la imagen.",
    conv_title: "Conversaciones", conv_search: "Buscar conversaciones…", conv_empty: "Aún no tienes conversaciones.", conv_login: "Inicia sesión para ver tu historial de conversaciones.", conv_loading: "Cargando…", conv_error: "No se pudo cargar el historial.", conv_delete: "Eliminar conversación", conv_delete_confirm: "¿Eliminar esta conversación? No se puede deshacer.", conv_delete_error: "No se pudo eliminar la conversación.",
  },
  en: {
    rail_new: "New chat", rail_search: "Search chats", rail_images: "Images", rail_library: "Library", rail_settings: "Settings", rail_toggle: "Collapse menu", rail_toggle_expand: "Expand menu",
    hero_morning:"Good morning", hero_afternoon:"Good afternoon", hero_evening:"Good evening", hero_night:"Good evening", hero_hi:"Hi, I'm", hero_sub:"How can I help you today?",
    day_today:"Today", day_yesterday:"Yesterday",
    tb_search: "Search", tb_notifications: "Notifications", tb_account: "Account",
    notif_header: "Notifications", notif1_title: "Welcome to Media", notif1_text: "Your assistant is ready to chat.",
    notif2_title: "Tip", notif2_text: "Press <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line.",
    acc_hint: "Sign in to save your conversations", acc_login: "Log in", acc_register: "Sign up",
    acc_logout: "Log out", auth_email: "Email", auth_password: "Password", auth_ready: "Signed in", auth_missing: "Enter email and password.", auth_failed: "Could not authenticate.",
    auth_confirm_password: "Confirm password", auth_enter: "Enter", auth_create: "Create account", auth_password_mismatch: "Passwords do not match.", auth_switch_login: "I already have an account", auth_switch_register: "Create new account",
    auth_title_login: "Sign in", auth_title_register: "Create your account", auth_sub_login: "Sign in to save your conversations", auth_sub_register: "Sign up to keep your history", auth_no_account: "No account yet?", auth_have_account: "Already have an account?",
    welcome_title: "Hi, I'm <span>Media</span>", welcome_subtitle: "How can I help you today?",
    composer_placeholder: "Message Media…", mic_record: "Record audio", mic_stop: "Stop recording",
    send: "Send", composer_hint: "Media can make mistakes. Check important information.",
    settings_title: "Settings", settings_appearance: "Appearance", settings_theme: "Theme", settings_dark: "Dark mode",
    settings_language: "Language", settings_sound: "Sound on reply", close: "Close", back: "Back", settings_general: "General",
    data_title: "Data controls", data_desc: "Manage what data Media uses",
    data_metadata: "Metadata", data_metadata_desc: "Allow saving data about your conversations (dates, titles) to organize them better.",
    data_analytics: "Analytics", data_analytics_desc: "Share anonymous usage statistics to help us improve Media.",
    role_you: "You", role_ai: "Media", default_chat_title: "New chat",
    mock_l1: "This is a sample response from Media 🤖",
    mock_l2: "I'm not connected to a real AI model yet, but the interface is ready to receive responses.",
    mock_you_wrote: "You wrote:",
    error_msg: "⚠️ There was a problem getting the response. Please try again.",
    act_copy: "Copy", act_copied: "Copied", act_regenerate: "Regenerate", act_good: "Good response", act_bad: "Bad response", act_report: "Report error",
    scroll_bottom: "Scroll to bottom",
    sugg_1: "Explain a difficult concept", sugg_2: "Help me write something", sugg_3: "Give me project ideas", sugg_4: "Summarize this for me",
    attach: "Attach", remove: "Remove",
    kbd_hint: "<kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> new line",
    sources: "Sources", kb_request: "Request verified source", kb_requested: "Request sent", kb_error: "Could not send", related_title: "Related",
    learn_title: "Learning profile", learn_desc: "How Media tailors its explanations to you", learn_style: "Explanation style", learn_difficulty: "Difficulty level", learn_strengths: "Strengths", learn_growth: "Growth areas", learn_confusions: "Frequent confusions", learn_none: "No data yet.", learn_error: "Could not load your profile.", learn_style_balanced: "Balanced", learn_style_concise: "Concise", learn_style_detailed: "Detailed", learn_style_visual: "Visual", learn_diff_basic: "Basic", learn_diff_intermediate: "Intermediate", learn_diff_advanced: "Advanced",
    demo_topic: "your question", demo_intro: "Here's an explanation about", demo_point1: "A key idea related to the topic.", demo_point2: "A second point with more detail.", demo_point3: "A third point to expand on.", demo_code_intro: "I can also use rich formatting and code blocks:", demo_note: "Demo response. Sign in for the real medical tutor with verified sources.", demo_followup: "Want me to go deeper into", demo_asset: "Example resource",
    practice_title: "Study tools", history_title: "History", practice_slides: "Presentation", practice_mindmap: "Mind map", practice_quiz: "Quiz", practice_cards: "Flashcards", practice_reports: "Reports",
    practice_no_conversation: "You don't have any conversations.", practice_login: "Sign in to save and generate resources from your conversation.", practice_ready: "Resource prepared", practice_error: "Could not prepare the resource.",
    img_title: "Generate image", img_desc: "Create an AI educational image from a description.", img_prompt: "Description", img_prompt_ph: "e.g. diagram of the cardiac cycle with its phases", img_aspect: "Aspect ratio", img_quality: "Quality", img_quality_fast: "Fast", img_quality_high: "High quality", img_close: "Close", img_generate: "Generate", img_generating: "Generating…", img_download: "Download PNG", img_empty: "Write a description (min. 3 characters).", img_error: "Could not generate the image.",
    conv_title: "Conversations", conv_search: "Search conversations…", conv_empty: "You don't have any conversations yet.", conv_login: "Sign in to see your conversation history.", conv_loading: "Loading…", conv_error: "Could not load history.", conv_delete: "Delete conversation", conv_delete_confirm: "Delete this conversation? This can't be undone.", conv_delete_error: "Could not delete the conversation.",
  },
  fr: {
    rail_new: "Nouveau chat", rail_search: "Rechercher", rail_images: "Images", rail_settings: "Paramètres", rail_toggle: "Réduire le menu", rail_toggle_expand: "Développer le menu",
    hero_morning:"Bonjour", hero_afternoon:"Bon après-midi", hero_evening:"Bonsoir", hero_night:"Bonsoir", hero_hi:"Salut, je suis", hero_sub:"Comment puis-je t'aider aujourd'hui ?",
    day_today:"Aujourd'hui", day_yesterday:"Hier",
    tb_search: "Rechercher", tb_notifications: "Notifications", tb_account: "Compte",
    notif_header: "Notifications", notif1_title: "Bienvenue sur Media", notif1_text: "Votre assistant est prêt à discuter.",
    notif2_title: "Astuce", notif2_text: "Appuie sur <kbd>Shift</kbd>+<kbd>Enter</kbd> pour un saut de ligne.",
    acc_hint: "Connecte-toi pour sauvegarder tes conversations", acc_login: "Se connecter", acc_register: "S'inscrire",
    acc_logout: "Se déconnecter", auth_email: "Email", auth_password: "Mot de passe", auth_ready: "Session ouverte", auth_missing: "Saisis email et mot de passe.", auth_failed: "Authentification impossible.",
    auth_confirm_password: "Confirmer le mot de passe", auth_enter: "Entrer", auth_create: "Créer un compte", auth_password_mismatch: "Les mots de passe ne correspondent pas.", auth_switch_login: "J'ai déjà un compte", auth_switch_register: "Créer un nouveau compte",
    auth_title_login: "Connexion", auth_title_register: "Crée ton compte", auth_sub_login: "Connecte-toi pour sauvegarder tes conversations", auth_sub_register: "Inscris-toi pour conserver ton historique", auth_no_account: "Pas encore de compte ?", auth_have_account: "Tu as déjà un compte ?",
    welcome_title: "Bonjour, je suis <span>Media</span>", welcome_subtitle: "Comment puis-je t'aider aujourd'hui ?",
    composer_placeholder: "Écris un message à Media…", mic_record: "Enregistrer un audio", mic_stop: "Arrêter l'enregistrement",
    send: "Envoyer", composer_hint: "Media peut faire des erreurs. Vérifie les informations importantes.",
    settings_title: "Paramètres", settings_appearance: "Apparence", settings_theme: "Thème", settings_dark: "Mode sombre",
    settings_language: "Langue", settings_sound: "Son à la réponse", close: "Fermer", back: "Retour", settings_general: "Général",
    data_title: "Contrôle des données", data_desc: "Gère les données utilisées par Media",
    data_metadata: "Métadonnées", data_metadata_desc: "Autorise l'enregistrement de données sur tes conversations (dates, titres) pour mieux les organiser.",
    data_analytics: "Analytique", data_analytics_desc: "Partage des statistiques d'utilisation anonymes pour nous aider à améliorer Media.",
    role_you: "Toi", role_ai: "Media", default_chat_title: "Nouveau chat",
    mock_l1: "Ceci est une réponse d'exemple d'Media 🤖",
    mock_l2: "Je ne suis pas encore connectée à un vrai modèle d'IA, mais l'interface est prête à recevoir des réponses.",
    mock_you_wrote: "Tu as écrit :",
    error_msg: "⚠️ Un problème est survenu lors de la réponse. Réessaie.",
    act_copy: "Copier", act_copied: "Copié", act_regenerate: "Régénérer", act_good: "Bonne réponse", act_bad: "Mauvaise réponse",
    scroll_bottom: "Aller en bas",
    sugg_1: "Explique-moi un concept difficile", sugg_2: "Aide-moi à rédiger un texte", sugg_3: "Donne-moi des idées de projet", sugg_4: "Résume ceci pour moi",
    attach: "Joindre", remove: "Retirer",
    kbd_hint: "<kbd>Entrée</kbd> envoyer · <kbd>Shift</kbd>+<kbd>Entrée</kbd> nouvelle ligne",
    sources: "Sources", kb_request: "Demander une source vérifiée", kb_requested: "Demande envoyée", kb_error: "Envoi impossible", related_title: "Associé",
    learn_title: "Profil d'apprentissage", learn_desc: "Comment Media adapte ses explications", learn_style: "Style d'explication", learn_difficulty: "Niveau de difficulté", learn_strengths: "Points forts", learn_growth: "Axes de progrès", learn_confusions: "Confusions fréquentes", learn_none: "Pas encore de données.", learn_error: "Impossible de charger ton profil.", learn_style_balanced: "Équilibré", learn_style_concise: "Concis", learn_style_detailed: "Détaillé", learn_style_visual: "Visuel", learn_diff_basic: "Basique", learn_diff_intermediate: "Intermédiaire", learn_diff_advanced: "Avancé",
    demo_topic: "ta question", demo_intro: "Voici une explication sur", demo_point1: "Une idée clé liée au sujet.", demo_point2: "Un deuxième point plus détaillé.", demo_point3: "Un troisième point pour approfondir.", demo_code_intro: "Je peux aussi utiliser du formatage riche et des blocs de code :", demo_note: "Réponse de démonstration. Connecte-toi pour le vrai tuteur médical avec des sources vérifiées.", demo_followup: "Veux-tu que j'approfondisse", demo_asset: "Ressource d'exemple",
    practice_title: "Outils d'étude", history_title: "Historique", practice_slides: "Présentation", practice_mindmap: "Carte mentale", practice_quiz: "Questionnaire", practice_cards: "Cartes mémo", practice_reports: "Rapports",
    practice_no_conversation: "Tu n'as aucune conversation.", practice_login: "Connecte-toi pour sauvegarder et générer des ressources depuis ta conversation.", practice_ready: "Ressource préparée", practice_error: "Impossible de préparer la ressource.",
    img_title: "Générer une image", img_desc: "Crée une image éducative par IA à partir d'une description.", img_prompt: "Description", img_prompt_ph: "ex : schéma du cycle cardiaque et ses phases", img_aspect: "Format", img_quality: "Qualité", img_quality_fast: "Rapide", img_quality_high: "Haute qualité", img_close: "Fermer", img_generate: "Générer", img_generating: "Génération avec Gemini…", img_download: "Télécharger PNG", img_empty: "Écris une description (min. 3 caractères).", img_error: "Impossible de générer l'image.",
    conv_title: "Conversations", conv_search: "Rechercher des conversations…", conv_empty: "Tu n'as pas encore de conversations.", conv_login: "Connecte-toi pour voir ton historique de conversations.", conv_loading: "Chargement…", conv_error: "Impossible de charger l'historique.", conv_delete: "Supprimer la conversation", conv_delete_confirm: "Supprimer cette conversation ? Action irréversible.", conv_delete_error: "Impossible de supprimer la conversation.",
  },
  pt: {
    rail_new: "Novo chat", rail_search: "Buscar chats", rail_images: "Imagens", rail_settings: "Configurações", rail_toggle: "Recolher menu", rail_toggle_expand: "Expandir menu",
    hero_morning:"Bom dia", hero_afternoon:"Boa tarde", hero_evening:"Boa noite", hero_night:"Boa noite", hero_hi:"Olá, eu sou", hero_sub:"Como posso ajudar hoje?",
    day_today:"Hoje", day_yesterday:"Ontem",
    tb_search: "Buscar", tb_notifications: "Notificações", tb_account: "Conta",
    notif_header: "Notificações", notif1_title: "Bem-vindo a Media", notif1_text: "Seu assistente está pronto para conversar.",
    notif2_title: "Dica", notif2_text: "Pressione <kbd>Shift</kbd>+<kbd>Enter</kbd> para pular linha.",
    acc_hint: "Entre para salvar suas conversas", acc_login: "Entrar", acc_register: "Cadastrar-se",
    acc_logout: "Sair", auth_email: "Email", auth_password: "Senha", auth_ready: "Sessão iniciada", auth_missing: "Digite email e senha.", auth_failed: "Não foi possível autenticar.",
    auth_confirm_password: "Confirmar senha", auth_enter: "Entrar", auth_create: "Criar conta", auth_password_mismatch: "As senhas não coincidem.", auth_switch_login: "Já tenho conta", auth_switch_register: "Criar nova conta",
    auth_title_login: "Entrar", auth_title_register: "Crie sua conta", auth_sub_login: "Entre para salvar suas conversas", auth_sub_register: "Cadastre-se para guardar seu histórico", auth_no_account: "Ainda não tem conta?", auth_have_account: "Já tem conta?",
    welcome_title: "Olá, sou <span>Media</span>", welcome_subtitle: "Como posso ajudar você hoje?",
    composer_placeholder: "Escreva uma mensagem para Media…", mic_record: "Gravar áudio", mic_stop: "Parar gravação",
    send: "Enviar", composer_hint: "Media pode cometer erros. Verifique informações importantes.",
    settings_title: "Configurações", settings_appearance: "Aparência", settings_theme: "Tema", settings_dark: "Modo escuro",
    settings_language: "Idioma", settings_sound: "Som ao responder", close: "Fechar", back: "Voltar", settings_general: "Geral",
    data_title: "Controle de dados", data_desc: "Gerencie quais dados a Media usa",
    data_metadata: "Metadados", data_metadata_desc: "Permite salvar dados sobre suas conversas (datas, títulos) para organizá-las melhor.",
    data_analytics: "Análises", data_analytics_desc: "Compartilhe estatísticas de uso anônimas para nos ajudar a melhorar a Media.",
    role_you: "Você", role_ai: "Media", default_chat_title: "Novo chat",
    mock_l1: "Esta é uma resposta de exemplo do Media 🤖",
    mock_l2: "Ainda não estou conectada a um modelo de IA real, mas a interface já está pronta para receber respostas.",
    mock_you_wrote: "Você escreveu:",
    error_msg: "⚠️ Ocorreu um problema ao obter a resposta. Tente novamente.",
    act_copy: "Copiar", act_copied: "Copiado", act_regenerate: "Regenerar", act_good: "Boa resposta", act_bad: "Resposta ruim",
    scroll_bottom: "Ir para o fim",
    sugg_1: "Explique um conceito difícil", sugg_2: "Ajude-me a redigir um texto", sugg_3: "Dê-me ideias para um projeto", sugg_4: "Resuma isto para mim",
    attach: "Anexar", remove: "Remover",
    kbd_hint: "<kbd>Enter</kbd> enviar · <kbd>Shift</kbd>+<kbd>Enter</kbd> nova linha",
    sources: "Fontes", kb_request: "Solicitar fonte verificada", kb_requested: "Solicitação enviada", kb_error: "Não foi possível enviar", related_title: "Relacionado",
    learn_title: "Perfil de aprendizado", learn_desc: "Como o Media adapta as explicações a você", learn_style: "Estilo de explicação", learn_difficulty: "Nível de dificuldade", learn_strengths: "Pontos fortes", learn_growth: "Áreas de melhoria", learn_confusions: "Confusões frequentes", learn_none: "Ainda não há dados.", learn_error: "Não foi possível carregar seu perfil.", learn_style_balanced: "Equilibrado", learn_style_concise: "Conciso", learn_style_detailed: "Detalhado", learn_style_visual: "Visual", learn_diff_basic: "Básico", learn_diff_intermediate: "Intermediário", learn_diff_advanced: "Avançado",
    demo_topic: "sua pergunta", demo_intro: "Aqui está uma explicação sobre", demo_point1: "Uma ideia-chave relacionada ao tema.", demo_point2: "Um segundo ponto com mais detalhe.", demo_point3: "Um terceiro ponto para ampliar.", demo_code_intro: "Também posso usar formatação rica e blocos de código:", demo_note: "Resposta de demonstração. Entre para o tutor médico real com fontes verificadas.", demo_followup: "Quer que eu aprofunde em", demo_asset: "Recurso de exemplo",
    practice_title: "Ferramentas de estudo", history_title: "Histórico", practice_slides: "Apresentação", practice_mindmap: "Mapa mental", practice_quiz: "Questionário", practice_cards: "Cartões didáticos", practice_reports: "Relatórios",
    practice_no_conversation: "Você não tem nenhuma conversa.", practice_login: "Entre para salvar e gerar recursos a partir da sua conversa.", practice_ready: "Recurso preparado", practice_error: "Não foi possível preparar o recurso.",
    img_title: "Gerar imagem", img_desc: "Crie uma imagem educativa com IA a partir de uma descrição.", img_prompt: "Descrição", img_prompt_ph: "ex: diagrama do ciclo cardíaco com suas fases", img_aspect: "Proporção", img_quality: "Qualidade", img_quality_fast: "Rápida", img_quality_high: "Alta qualidade", img_close: "Fechar", img_generate: "Gerar", img_generating: "Gerando com Gemini…", img_download: "Baixar PNG", img_empty: "Escreva uma descrição (mín. 3 caracteres).", img_error: "Não foi possível gerar a imagem.",
    conv_title: "Conversas", conv_search: "Buscar conversas…", conv_empty: "Você ainda não tem conversas.", conv_login: "Entre para ver seu histórico de conversas.", conv_loading: "Carregando…", conv_error: "Não foi possível carregar o histórico.", conv_delete: "Excluir conversa", conv_delete_confirm: "Excluir esta conversa? Não é possível desfazer.", conv_delete_error: "Não foi possível excluir a conversa.",
  },
};
let lang = "es";
const SUPPORTED_LANGS = new Set(["es", "en"]);
let authMode = "login";
const CONFIGURED_API_BASE_URL = String(window.MEDIA_API_BASE_URL || "").replace(/\/+$/, "");
const API_BASE_URL = CONFIGURED_API_BASE_URL || (
  location.protocol === "file:" ||
  ["5500", "5173", "3000", "8080"].includes(location.port)
    ? "http://127.0.0.1:8000"
    : ""
);

const BETA_PLANS = {
  free: { name: "Plan Free", price: "$0", chars: 16000, tokens: "4,000" },
  plus: { name: "Plan Plus", price: "$5", chars: 128000, tokens: "32,000" },
  pro: { name: "Plan Pro", price: "$10", chars: 512000, tokens: "128,000" },
};

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
    const names = { es: "Español", en: "English" };
    el.langCurrent.textContent = names[lang] || lang;
    document.querySelectorAll(".lang-dd__option").forEach((o) =>
      o.classList.toggle("is-active", o.dataset.value === lang)
    );
  }
}

function setLang(next) {
  lang = (SUPPORTED_LANGS.has(next) && I18N[next]) ? next : "es";
  try { localStorage.setItem("Media-lang", lang); } catch (_) { }
  applyI18n();
  if (typeof applyRailCollapsed === "function") {
    applyRailCollapsed(document.body.classList.contains("rail-collapsed"));
  }
  if (typeof applyPracticeCollapsed === "function") {
    applyPracticeCollapsed(document.body.classList.contains("practice-collapsed"));
  }
  if (typeof updateAuthUI === "function") updateAuthUI();
  if (typeof renderHero === "function") renderHero();
}

function initLang() {
  let saved = null;
  try { saved = localStorage.getItem("Media-lang"); } catch (_) { }
  const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
  lang = (saved && SUPPORTED_LANGS.has(saved)) ? saved : (SUPPORTED_LANGS.has(nav) ? nav : "es");
}

// ---------- Referencias al DOM ----------
const el = {
  chatList: document.getElementById("railHistory"),
  main: document.querySelector(".main"),
  messages: document.getElementById("messages"),
  welcome: document.getElementById("welcome"),
  libraryView: document.getElementById("libraryView"),
  libraryClose: document.getElementById("libraryClose"),
  librarySearch: document.getElementById("librarySearch"),
  libraryTree: document.getElementById("libraryTree"),
  libraryDocs: document.getElementById("libraryDocs"),
  libraryCount: document.getElementById("libraryCount"),
  form: document.getElementById("composerForm"),
  input: document.getElementById("input"),
  btnSend: document.getElementById("btnSend"),
  btnMic: document.getElementById("btnMic"),
  scrollBottom: document.getElementById("scrollBottom"),
  btnAttach: document.getElementById("btnAttach"),
  fileInput: document.getElementById("fileInput"),
  attachPreview: document.getElementById("attachPreview"),
  composerMeta: document.getElementById("composerMeta"),
  charCount: document.getElementById("charCount"),
  sidebar: document.getElementById("sidebar"),
  railToggle: document.getElementById("railToggle"),
  practiceToggle: document.getElementById("practiceToggle"),
  overlay: document.getElementById("overlay"),
  suggestions: document.getElementById("suggestions"),

  // Barra superior
  btnSettingsTop: document.getElementById("btnSettingsTop"),
  btnSettingsRail: document.getElementById("btnSettingsRail"),
  btnProfileRail: document.getElementById("btnProfileRail"),
  btnPlansTop: document.getElementById("btnPlansTop"),
  btnChatTop: document.getElementById("btnChatTop"),
  searchBox: document.getElementById("searchBox"),
  searchInput: document.getElementById("searchInput"),
  btnNotif: document.getElementById("btnNotif"),
  notifMenu: document.getElementById("notifMenu"),
  notifBadge: document.getElementById("notifBadge"),
  btnAccount: document.getElementById("btnAccount"),
  accountMenu: document.getElementById("accountMenu"),
  authForm: document.getElementById("authForm"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authPasswordConfirm: document.getElementById("authPasswordConfirm"),
  authRegisterFields: document.getElementById("authRegisterFields"),
  authFullName: document.getElementById("authFullName"),
  authCarnet: document.getElementById("authCarnet"),
  authUniversity: document.getElementById("authUniversity"),
  authRole: document.getElementById("authRole"),
  authSpecialty: document.getElementById("authSpecialty"),
  authLearningChallenges: document.getElementById("authLearningChallenges"),
  authStatus: document.getElementById("authStatus"),
  btnAuthSubmit: document.getElementById("btnAuthSubmit"),
  btnLogout: document.getElementById("btnLogout"),
  authPanel: document.getElementById("authPanel"),
  authBack: document.getElementById("authBack"),
  authSwitchBtn: document.getElementById("authSwitchBtn"),
  authSwitchText: document.getElementById("authSwitchText"),
  authTitle: document.getElementById("authTitle"),
  authSub: document.getElementById("authSub"),
  accountEmail: document.getElementById("accountEmail"),
  accountName: document.getElementById("accountName"),
  accountAvatar: document.getElementById("accountAvatar"),
  accountDetails: document.getElementById("accountDetails"),
  accountRole: document.getElementById("accountRole"),
  accountUniversity: document.getElementById("accountUniversity"),
  accountPlan: document.getElementById("accountPlan"),
  btnAccountLearning: document.getElementById("btnAccountLearning"),
  btnAccountPlans: document.getElementById("btnAccountPlans"),

  // Ajustes (paneles slide)
  settingsPanel: document.getElementById("settingsPanel"),
  settingsBack: document.getElementById("settingsBack"),
  settingsTheme: document.getElementById("settingsTheme"),
  langDD: document.getElementById("langDD"),
  langTrigger: document.getElementById("langTrigger"),
  langMenu: document.getElementById("langMenu"),
  langCurrent: document.getElementById("langCurrent"),
  openData: document.getElementById("openData"),
  dataPanel: document.getElementById("dataPanel"),
  dataBack: document.getElementById("dataBack"),
  openLearning: document.getElementById("openLearning"),
  learningPanel: document.getElementById("learningPanel"),
  learnBack: document.getElementById("learnBack"),
  learnBody: document.getElementById("learnBody"),

  // Conversaciones (historial)
  conversationsPanel: document.getElementById("conversationsPanel"),
  convBack: document.getElementById("convBack"),
  convSearch: document.getElementById("convSearch"),
  convList: document.getElementById("convList"),

  // Landing + planes beta
  landingStart: document.getElementById("landingStart"),
  landingLogin: document.getElementById("landingLogin"),
  landingPlans: document.getElementById("landingPlans"),
  plansBeta: document.getElementById("plansBeta"),
  planName: document.getElementById("planName"),
  tokenUsed: document.getElementById("tokenUsed"),
  tokenLimit: document.getElementById("tokenLimit"),
  tokenMeterFill: document.getElementById("tokenMeterFill"),
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
// Respuesta simulada (sin sesión) que ejercita todas las funcionalidades del chat.
async function demoResponse(question, onToken) {
  const q = (question || "").trim();
  const topic = (q ? q.replace(/[?¿.!¡]+\s*$/g, "") : t("demo_topic")) || t("demo_topic");
  const full =
    `${t("demo_intro")} **${topic}**:\n\n` +
    `- ${t("demo_point1")}\n` +
    `- ${t("demo_point2")}\n` +
    `- ${t("demo_point3")}\n\n` +
    `${t("demo_code_intro")}\n\n` +
    "```js\nconsole.log('Hola desde Media');\n```\n\n" +
    `_${t("demo_note")}_`;
  const chunks = full.match(/\s*\S+|\s+/g) || [full];
  for (const ch of chunks) { await sleep(12 + Math.random() * 20); onToken(ch); }
  return {
    followup: `${t("demo_followup")} ${topic}?`,
    assets: [{ id: "demo", type: "image", caption: t("demo_asset"), path: "assets/logo-mark.png" }],
    canRequestKnowledge: true,
    originalQuestion: q,
    normalizedTopic: null,
  };
}

async function streamAgentResponse(messages, onToken) {
  const lastMessage = messages[messages.length - 1] || {};
  const last = lastMessage.content ?? "";
  const token = localStorage.getItem("Media-auth-token");
  // Sin sesión: pedir al usuario que inicie sesión en lugar de respuesta demo.
  if (!token) {
    const loginMsg = lang === "en"
      ? "🔒 You need to **sign in** to use the medical tutor. Click the account button (top right) to log in."
      : lang === "fr"
        ? "🔒 Tu dois te **connecter** pour utiliser le tuteur médical. Clique sur le bouton compte (en haut à droite) pour te connecter."
        : lang === "pt"
          ? "🔒 Você precisa fazer **login** para usar o tutor médico. Clique no botão de conta (canto superior direito) para entrar."
          : "🔒 Necesitas **iniciar sesión** para usar el tutor médico. Haz clic en el botón de cuenta (arriba a la derecha) para acceder.";
    const chunks = loginMsg.match(/\s*\S+|\s+/g) || [loginMsg];
    for (const ch of chunks) { await sleep(10); onToken(ch); }
    // Abrir automáticamente el panel de login tras mostrar el mensaje
    setTimeout(() => { if (el.btnAccount) el.btnAccount.click(); }, 800);
    return;
  }

  const activeChat = getActiveChat();
  let res;
  try {
    res = await fetchWithAuth(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_id: activeChat?.backendConversationId ?? null,
        message: last,
        effort: getEffortPref(),
        attachments: chatAttachmentsForBackend(lastMessage.attachments || []),
      }),
    });
  } catch (err) {
    // Si el token fue eliminado por clearAuthSession (tras 401 fallido), pedir login
    if (!authToken()) {
      const msg = lang === "en"
        ? "🔒 Your session has expired. Please **sign in** again to continue."
        : lang === "fr"
          ? "🔒 Ta session a expiré. **Reconnecte-toi** pour continuer."
          : lang === "pt"
            ? "🔒 Sua sessão expirou. Faça **login** novamente para continuar."
            : "🔒 Tu sesión expiró. **Inicia sesión** de nuevo para continuar.";
      const chunks = msg.match(/\s*\S+|\s+/g) || [msg];
      for (const ch of chunks) { await sleep(10); onToken(ch); }
      setTimeout(() => { if (el.btnAccount) el.btnAccount.click(); }, 800);
    } else {
      onToken(`⚠️ No pude conectar con el servidor (${API_BASE_URL}). Verifica que el backend esté en ejecución.`);
    }
    return;
  }

  if (res.status === 401) {
    const msg = lang === "en"
      ? "🔒 Your session has expired. Please **sign in** again."
      : lang === "fr"
        ? "🔒 Ta session a expiré. **Reconnecte-toi** pour continuer."
        : lang === "pt"
          ? "🔒 Sua sessão expirou. Faça **login** novamente."
          : "🔒 Tu sesión expiró. **Inicia sesión** de nuevo para continuar.";
    const chunks = msg.match(/\s*\S+|\s+/g) || [msg];
    for (const ch of chunks) { await sleep(10); onToken(ch); }
    setTimeout(() => { if (el.btnAccount) el.btnAccount.click(); }, 800);
    return;
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    logMediaLatency(errorData.metadata?.media_latency);
    logRagMetrics(errorData.metadata?.rag_metrics || errorData.metadata?.media_latency?.rag_internal_metrics);
    onToken(errorData.detail || `El backend respondió con error ${res.status}. Inténtalo de nuevo.`);
    return;
  }

  const data = await res.json();
  logMediaLatency(data.metadata?.media_latency);
  logRagMetrics(data.metadata?.rag_metrics || data.metadata?.media_latency?.rag_internal_metrics);
  if (activeChat && data.conversation_id) {
    activeChat.backendConversationId = data.conversation_id;
    touchChat(activeChat);
  }

  const status = data.answer_status === "unverified_model_knowledge"
    ? "\n\n_Esta respuesta usa conocimiento general del modelo y aun no tiene citas documentales verificadas._"
    : "";

  const sources = formatCitationSources(data.citations);

  // El backend responde completo; lo emitimos por trozos para el efecto de escritura
  const full = `${data.answer}${status}${sources}`;
  const chunks = full.match(/\s*\S+|\s+/g) || [full];
  for (const ch of chunks) {
    await sleep(10 + Math.random() * 22);
    onToken(ch);
  }

  // Metadatos extra de la respuesta para enriquecer el mensaje
  return {
    backendConversationId: data.conversation_id || null,
    backendMessageId: data.message_id || null,
    followup: data.suggested_followup || null,
    assets: Array.isArray(data.related_assets) ? data.related_assets : [],
    canRequestKnowledge: !!data.can_request_knowledge,
    originalQuestion: last,
    normalizedTopic: (data.metadata && data.metadata.normalized_topic) || null,
  };
}

function logMediaLatency(metrics) {
  if (!metrics || typeof metrics !== "object") return;
  try {
    const stageRows = Object.entries(metrics)
      .filter(([key, value]) => key.endsWith("_ms") && typeof value === "number")
      .sort(([a], [b]) => {
        if (a === "total_request_ms" || a === "total_ms") return 1;
        if (b === "total_request_ms" || b === "total_ms") return -1;
        return a.localeCompare(b);
      })
      .map(([key, value]) => ({ etapa: key.replace(/_ms$/, "").toUpperCase(), ms: value }));
    console.group(`[MEDIA LATENCY] request_id: ${metrics.request_id || "n/a"}`);
    if (stageRows.length) console.table(stageRows);
    console.log("MODEL:", metrics.model || metrics.selected_model || null);
    console.log("PROVIDER:", metrics.final_provider || metrics.provider || null);
    console.log("INPUT_TOKENS:", metrics.input_tokens ?? null);
    console.log("OUTPUT_TOKENS:", metrics.output_tokens ?? null);
    console.log("TOTAL_TOKENS:", metrics.total_tokens ?? null);
    console.log("GROQ_QUEUE_TIME:", metrics.groq_queue_time ?? null);
    console.log("GROQ_PROMPT_TIME:", metrics.groq_prompt_time ?? null);
    console.log("GROQ_COMPLETION_TIME:", metrics.groq_completion_time ?? null);
    console.log("GROQ_TOTAL_TIME:", metrics.groq_total_time ?? null);
    console.log("RETRIES:", metrics.retries ?? 0);
    console.log("FALLBACK:", Boolean(metrics.fallback));
    console.log("[MEDIA_METRICS]", JSON.stringify(metrics));
    console.groupEnd();
  } catch (err) {
    console.log("[MEDIA_METRICS]", metrics);
  }
}

function logRagMetrics(rag) {
  if (!rag || typeof rag !== "object") return;
  try {
    console.group(`[RAG_METRICS] request_id: ${rag.request_id || "n/a"}`);
    console.table([
      { etapa: "embedding", ms: rag.embedding_ms ?? 0 },
      { etapa: "embedding_provider_call", ms: rag.embedding_provider_call_ms ?? 0 },
      { etapa: "vector_db_query", ms: rag.vector_db_query_ms ?? 0 },
      { etapa: "metadata_filter", ms: rag.metadata_filter_ms ?? 0 },
      { etapa: "fetch_chunks", ms: rag.fetch_chunks_ms ?? 0 },
      { etapa: "processing_results", ms: rag.processing_results_ms ?? 0 },
      { etapa: "reranking", ms: rag.reranking_ms ?? 0 },
      { etapa: "local_reference_fallback", ms: rag.local_reference_fallback_ms ?? 0 },
      { etapa: "load_local_index", ms: rag.load_local_index_ms ?? 0 },
      { etapa: "ai_calls_inside_rag", ms: rag.ai_calls_inside_rag_ms ?? 0 },
      { etapa: "TOTAL_RAG", ms: rag.total_rag_ms ?? 0 },
    ]);
    console.log("documents_consulted:", rag.documents_consulted ?? 0);
    console.log("candidate_chunks:", rag.candidate_chunks ?? 0);
    console.log("final_chunks:", rag.final_chunks ?? 0);
    console.log("supabase_queries:", rag.supabase_queries ?? 0);
    console.log("retries:", rag.retries ?? 0);
    console.log("embedding_provider:", rag.embedding_provider ?? null);
    console.log("embedding_model:", rag.embedding_model ?? null);
    console.log("reranking_provider:", rag.reranking_provider ?? null);
    console.log("reranking_model:", rag.reranking_model ?? null);
    console.log("[RAG_METRICS_JSON]", JSON.stringify(rag));
    console.groupEnd();
  } catch (_) {
    console.log("[RAG_METRICS]", rag);
  }
}

// ---------- Markdown + código ----------
function dayLabel(ts) {
  const d = new Date(ts), now = new Date();
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86400000);
  if (diff === 0) return t("day_today");
  if (diff === 1) return t("day_yesterday");
  try { return new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" }).format(d); }
  catch (_) { return d.toLocaleDateString(); }
}

// Convierte la lista "Fuentes:" (Markdown) en tarjetas/chips con detalle al pasar el cursor.
function enhanceSources(container) {
  const labels = new Set(Object.values(I18N).map((d) => String(d.sources || "").toLowerCase()).filter(Boolean));
  container.querySelectorAll(".msg--ai .msg__bubble p").forEach((p) => {
    const head = p.textContent.trim().replace(/:$/, "");
    const ul = p.nextElementSibling;
    if (!labels.has(head.toLowerCase()) || !ul || ul.tagName !== "UL") return;
    const box = document.createElement("div");
    box.className = "src";
    const h = document.createElement("div");
    h.className = "src__head"; h.textContent = head;
    const list = document.createElement("div");
    list.className = "src__list";
    [...ul.children].forEach((li) => {
      const a = li.querySelector("a");
      const [title, ...rest] = li.textContent.trim().split(" — ");
      const detail = rest.join(" — ");
      const chip = document.createElement(a ? "a" : "span");
      chip.className = "src__chip";
      if (a) { chip.href = a.href; chip.target = "_blank"; chip.rel = "noopener noreferrer"; }
      chip.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M14 3v6h6" stroke="currentColor" stroke-width="1.8" fill="none"/></svg><span class="src__title"></span><span class="src__pop" role="tooltip"><strong></strong><em></em></span>`;
      chip.querySelector(".src__title").textContent = title;
      chip.querySelector(".src__pop strong").textContent = title;
      chip.querySelector(".src__pop em").textContent = detail;
      list.appendChild(chip);
    });
    box.append(h, list);
    p.replaceWith(box);
    ul.remove();
  });
}

function renderMarkdown(text) {
  try {
    if (window.marked && window.DOMPurify) {
      const html = window.marked.parse(text, { breaks: true, gfm: true });
      return window.DOMPurify.sanitize(html);
    }
  } catch (_) { }
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function enhanceLinks(container) {
  container.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (/^(https?:)?\/\//i.test(href) || href.startsWith('/references/')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

function formatCitationSources(citations) {
  if (!Array.isArray(citations) || !citations.length) return '';
  const grouped = new Map();
  citations.forEach((citation) => {
    if (!citation || !citation.title) return;
    const key = citation.pdf_url || citation.document_id || citation.title;
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: citation.title,
        pdf_url: citation.pdf_url || null,
        sections: new Set(),
        pages: new Set(),
      });
    }
    const item = grouped.get(key);
    const section = cleanCitationSection(citation.section);
    if (section) item.sections.add(section);
    const pages = citationPageLabel(citation);
    if (pages) item.pages.add(pages);
  });

  const lines = [...grouped.values()].map((item) => {
    const details = [];
    const sections = [...item.sections].slice(0, 2);
    const pages = [...item.pages].slice(0, 4);
    if (sections.length) details.push(sections.join('; '));
    if (pages.length) details.push(pages.join(', '));
    const label = details.length ? `${item.title} — ${details.join(' · ')}` : item.title;
    return item.pdf_url ? `- [${label}](${item.pdf_url})` : `- ${label}`;
  });
  return lines.length ? `\n\n**${t('sources')}:**\n${lines.join('\n')}` : '';
}

function cleanCitationSection(section) {
  const value = String(section || '').trim();
  if (!value) return '';
  if (/^[IVXLCDM]+\.?$/i.test(value)) return '';
  if (value.length < 4) return '';
  return value.replace(/\s+/g, ' ');
}

function citationPageLabel(citation) {
  const start = Number.isFinite(Number(citation.page_start)) ? Number(citation.page_start) : null;
  const end = Number.isFinite(Number(citation.page_end)) ? Number(citation.page_end) : null;
  if (!start && !end) return '';
  if (start && end && start !== end) return `págs. ${start}-${end}`;
  return `pág. ${start || end}`;
}

function enhanceCodeBlocks(container) {
  container.querySelectorAll("pre code").forEach((block) => {
    try { if (window.hljs) window.hljs.highlightElement(block); } catch (_) { }
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
const CHAT_STORAGE_KEY = "Media-chats-v1";
const CHAT_STORAGE_LIMIT = 50;
const AGENT_THINKING_STEPS = [
  "Pensando en tu pregunta",
  "Buscando información en documentos",
  "Revisando contexto y fuentes",
  "Comprobando inconsistencias",
  "Adaptando la explicación a tu perfil",
  "Preparando la respuesta final",
];

function getActiveChat() {
  return state.chats.find((c) => c.id === state.activeChatId) ?? null;
}

function serializeChat(chat) {
  return {
    id: chat.id,
    title: chat.title,
    backendConversationId: chat.backendConversationId || null,
    createdAt: chat.createdAt || new Date().toISOString(),
    updatedAt: chat.updatedAt || new Date().toISOString(),
    messages: (chat.messages || [])
      .filter((m) => !m.streaming)
      .map((m) => ({
        role: m.role,
        ts: m.ts || null,
        content: m.content || "",
        backendMessageId: m.backendMessageId || null,
        attachments: (m.attachments || []).map((att) => ({ ...att, dataUrl: null })),
        feedback: m.feedback || null,
        reportReason: m.reportReason || null,
        reportComment: m.reportComment || null,
        followup: m.followup || null,
        assets: m.assets || [],
        canRequestKnowledge: !!m.canRequestKnowledge,
        originalQuestion: m.originalQuestion || null,
        normalizedTopic: m.normalizedTopic || null,
        knowledgeRequested: !!m.knowledgeRequested,
        practiceArtifact: m.practiceArtifact || null,
      })),
  };
}

function saveLocalChats() {
  try {
    const chats = state.chats
      .filter((chat) => chat.messages?.length || chat.backendConversationId)
      .slice(0, CHAT_STORAGE_LIMIT)
      .map(serializeChat);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ activeChatId: state.activeChatId, chats }));
  } catch (_) { }
}

function loadLocalChats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "null");
    if (!parsed || !Array.isArray(parsed.chats) || !parsed.chats.length) return false;
    let migrated = false;
    state.chats = parsed.chats.map((chat) => ({
      ...chat,
      backendSyncPromise: null,
      messages: (chat.messages || []).map((message) => {
        if (message.role === "assistant" && isLegacyPracticeContract(message.content) && !message.practiceArtifact) {
          migrated = true;
          return {
            ...message,
            content: "**Recurso preparado**\n\nEste recurso fue creado con una versión anterior. Vuelve a presionar el botón de Practicar para generarlo como recurso editable y descargable.",
          };
        }
        return message;
      }),
    }));
    state.activeChatId = state.chats.some((chat) => chat.id === parsed.activeChatId)
      ? parsed.activeChatId
      : state.chats[0].id;
    if (migrated) saveLocalChats();
    return true;
  } catch (_) {
    return false;
  }
}

function touchChat(chat) {
  if (!chat) return;
  chat.updatedAt = new Date().toISOString();
  saveLocalChats();
}

async function ensureBackendConversation(chat) {
  const token = authToken();
  if (!chat || !token) return null;
  if (chat.backendConversationId) return chat.backendConversationId;
  if (chat.backendSyncPromise) return chat.backendSyncPromise;
  chat.backendSyncPromise = (async () => {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: chat.title || t("default_chat_title") }),
    });
    if (res.status === 401) { clearAuthSession(); return null; }
    if (!res.ok) return null;
    const data = await res.json();
    chat.backendConversationId = data.id;
    touchChat(chat);
    return data.id;
  })();
  try {
    return await chat.backendSyncPromise;
  } finally {
    chat.backendSyncPromise = null;
  }
}

// ---------- Gestión de chats ----------
function createChat(options = {}) {
  const now = new Date().toISOString();
  const chat = { id: uid(), title: t("default_chat_title"), messages: [], createdAt: now, updatedAt: now };
  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  renderChatList();
  renderMessages();
  saveLocalChats();
  el.input.focus();
  return chat;
}

function switchChat(id) {
  staggerNextRender = true;
  state.activeChatId = id;
  setMainView("chat");
  renderChatList();
  renderMessages();
  saveLocalChats();
  closeSidebarMobile();
}

// ---------- Render: lista de chats ----------
function renderChatList(filter = "") {
  if (!el.chatList) return;
  const q = filter.trim().toLowerCase();
  const items = state.chats.filter((c) =>
    Array.isArray(c.messages) && c.messages.some((m) => !m.streaming && (m.content || "").trim()) &&
    (!q || (c.title || "").toLowerCase().includes(q))
  );
  el.chatList.innerHTML = "";
  items.forEach((chat) => {
    const row = document.createElement("div");
    row.className = "chat-item" + (chat.id === state.activeChatId ? " is-active" : "");

    const main = document.createElement("button");
    main.className = "chat-item__main";
    main.type = "button";
    main.innerHTML = `<span class="chat-item__title">${escapeHtml(chat.title || t("default_chat_title"))}</span>`;
    main.addEventListener("click", () => switchChat(chat.id));

    const del = document.createElement("button");
    del.className = "chat-item__delete";
    del.type = "button";
    del.setAttribute("aria-label", t("conv_delete"));
    del.title = t("conv_delete");
    del.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
    del.addEventListener("click", (e) => { e.stopPropagation(); deleteLocalChat(chat.id); });

    row.append(main, del);
    el.chatList.appendChild(row);
  });
}

// ---------- Render: mensajes ----------
let streamingBubble = null;   // referencia al mensaje que se está escribiendo
let staggerNextRender = true; // anima en cascada la próxima lista (abrir/cambiar de chat)

// ---------- Hero de bienvenida: saludo por hora + subtítulo con efecto de escritura ----------
let heroTypeTimer = null;
function heroGreetKey() {
  const h = new Date().getHours();
  return h < 6 ? "hero_night" : h < 12 ? "hero_morning" : h < 19 ? "hero_afternoon" : "hero_evening";
}
function renderHero() {
  const greet = document.getElementById("heroGreet");
  const title = document.getElementById("heroTitle");
  const sub = document.getElementById("heroSub");
  if (!greet || !title || !sub) return;
  let day = "";
  try {
    day = new Intl.DateTimeFormat(lang, { weekday: "long" }).format(new Date());
    day = day.charAt(0).toUpperCase() + day.slice(1);
  } catch (_) { /* sin Intl: solo saludo */ }
  greet.textContent = day ? `${t(heroGreetKey())} · ${day}` : t(heroGreetKey());
  title.innerHTML = `${escapeHtml(t("hero_hi"))} <span class="hero__grad">Media</span>`;
  clearInterval(heroTypeTimer);
  const text = t("hero_sub");
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sub.textContent = text; sub.classList.remove("is-typing"); return;
  }
  sub.textContent = ""; sub.classList.add("is-typing");
  let i = 0;
  heroTypeTimer = setInterval(() => {
    i += 1; sub.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(heroTypeTimer); sub.classList.remove("is-typing"); }
  }, 28);
}

function renderMessages() {
  const chat = getActiveChat();
  const keepAtBottom = isNearBottom();
  el.messages.querySelectorAll(".msg-wrap").forEach((n) => n.remove());
  streamingBubble = null;

  const hasMessages = chat && chat.messages.length > 0;
  el.welcome.style.display = hasMessages ? "none" : "flex";
  if (el.main) el.main.classList.toggle("is-empty", !hasMessages);
  if (!hasMessages) return;

  const wrap = document.createElement("div");
  wrap.className = "msg-wrap";
  if (staggerNextRender) { wrap.classList.add("is-stagger"); staggerNextRender = false; }
  let prev = null;   // { role, ts, day } del mensaje anterior con fecha
  chat.messages.forEach((m, i) => {
    const ts = Number(m.ts) || null;
    const day = ts ? new Date(ts).toDateString() : null;
    const newDay = !!ts && (!prev || prev.day !== day);
    if (newDay) {
      const sep = document.createElement("div");
      sep.className = "msg-day";
      sep.style.setProperty("--i", String(i));
      sep.innerHTML = `<span></span>`;
      sep.firstChild.textContent = dayLabel(ts);
      wrap.appendChild(sep);
    }
    const node = buildMessageNode(m, i, chat);
    node.style.setProperty("--i", String(i));
    if (!newDay && prev && ts && prev.role === m.role && ts - prev.ts < 5 * 60 * 1000) node.classList.add("msg--cont");
    wrap.appendChild(node);
    prev = ts ? { role: m.role, ts, day } : null;
  });
  el.messages.appendChild(wrap);
  enhanceCodeBlocks(wrap);
  enhanceLinks(wrap);
  enhanceSources(wrap);
  if (keepAtBottom) scrollToBottom();
}

function buildMessageNode(m, index, chat) {
  const role = m.role;
  const node = document.createElement("div");
  node.className = "msg msg--" + (role === "user" ? "user" : "ai");

  const avatar = role === "user" ? "U" : `<img src="assets/logo-mark.png" alt="Media" />`;
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
    if (m.content) bubble.innerHTML = renderMarkdown(m.content);
    else bubble.innerHTML = renderAgentThinking(m.thinkingIndex || 0);
    streamingBubble = bubble;
  } else if (role === "assistant") {
    bubble.innerHTML = renderMarkdown(displayMessageContent(m));
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

  if (role === "assistant" && !m.streaming) enhanceLinks(bubble);

  buildActions(node.querySelector(".msg__actions"), m, index, chat);
  if (role === "assistant" && !m.streaming) {
    buildMessageExtras(node.querySelector(".msg__body"), m, chat);
  }
  return node;
}

function renderAgentThinking(index = 0) {
  const activeIndex = Math.abs(index) % AGENT_THINKING_STEPS.length;
  const label = AGENT_THINKING_STEPS[activeIndex] || AGENT_THINKING_STEPS[0];
  return `
    <div class="agent-thinking" aria-live="polite">
      <div class="agent-thinking__head">
        <span class="agent-thinking__pulse"></span>
        <span class="agent-thinking__status">${escapeHtml(label)}</span>
      </div>
    </div>`;
}

function updateAgentThinking(aiMsg) {
  if (!streamingBubble || aiMsg.content) return;
  const keepAtBottom = isNearBottom();
  streamingBubble.innerHTML = renderAgentThinking(aiMsg.thinkingIndex || 0);
  if (keepAtBottom) scrollToBottom();
}

function startAgentThinking(aiMsg) {
  aiMsg.thinkingIndex = 0;
  updateAgentThinking(aiMsg);
  return setInterval(() => {
    if (!aiMsg.streaming || aiMsg.content) return;
    aiMsg.thinkingIndex = (aiMsg.thinkingIndex || 0) + 1;
    updateAgentThinking(aiMsg);
  }, 1250);
}

function displayMessageContent(message) {
  const content = message?.content || "";
  if (message?.practiceArtifact) return content;
  if (isLegacyPracticeContract(content)) {
    return "**Recurso preparado**\n\nEste recurso fue creado con una versión anterior. Vuelve a presionar el botón de Practicar para generarlo como recurso editable y descargable.";
  }
  return content;
}

function isLegacyPracticeContract(content) {
  const text = String(content || "");
  return /generation contract is ready|enabled after vetted sources/i.test(text)
    || (/^\*\*Recurso preparado:/i.test(text) && /```json|\"conversation_id\"|\"source\"/i.test(text));
}

// ---------- Extras del mensaje: assets, follow-up y solicitud de conocimiento ----------
function buildMessageExtras(body, m, chat) {
  if (m.practiceArtifact) body.appendChild(practiceArtifactEl(m.practiceArtifact));

  // 2) Assets relacionados (imágenes / documentos)
  if (Array.isArray(m.assets) && m.assets.length) {
    const box = document.createElement("div");
    box.className = "msg__assets";
    m.assets.forEach((a) => box.appendChild(assetCard(a)));
    body.appendChild(box);
  }

  // 1) Chip de seguimiento sugerido
  if (m.followup) {
    const chip = document.createElement("button");
    chip.className = "msg__followup";
    chip.type = "button";
    chip.innerHTML = `
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span></span>`;
    chip.querySelector("span").textContent = m.followup;
    chip.addEventListener("click", () => {
      if (state.isResponding) return;
      sendMessage(m.followup);
    });
    body.appendChild(chip);
  }

  // 3) Botón para solicitar fuente verificada (base de conocimiento)
  if (m.canRequestKnowledge) {
    if (m.knowledgeRequested) {
      body.appendChild(knowledgeDoneEl());
    } else {
      const btn = document.createElement("button");
      btn.className = "msg__knowledge";
      btn.type = "button";
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="M4 5h11l5 5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>
          <path d="M9 13h6M12 10v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
        <span>${escapeHtml(t("kb_request"))}</span>`;
      btn.addEventListener("click", () => requestKnowledge(m, chat, btn));
      body.appendChild(btn);
    }
  }
}


function practiceArtifactEl(artifact) {
  const box = document.createElement("div");
  box.className = "practice-artifact";
  const title = document.createElement("div");
  title.className = "practice-artifact__title";
  title.textContent = artifact.title || "Recurso";
  const editor = document.createElement("textarea");
  editor.className = "practice-artifact__editor";
  editor.value = artifact.editable_text || "";
  editor.rows = Math.min(18, Math.max(8, editor.value.split("\n").length + 1));
  editor.addEventListener("input", () => {
    artifact.editable_text = editor.value;
    const chat = getActiveChat();
    if (chat) saveLocalChats();
  });
  const actions = document.createElement("div");
  actions.className = "practice-artifact__actions";
  (artifact.downloads || ["markdown", "json"]).forEach((format) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "practice-artifact__download";
    btn.textContent = `Descargar ${format.toUpperCase()}`;
    btn.addEventListener("click", () => downloadPracticeArtifact(artifact, format, editor.value));
    actions.appendChild(btn);
  });
  box.append(title);
  const visual = practiceStructuredPreviewEl(artifact);
  if (visual) box.appendChild(visual);
  box.appendChild(editor);
  const visualTools = practiceVisualTasksEl(artifact);
  if (visualTools) box.appendChild(visualTools);
  box.appendChild(actions);
  return box;
}

function practiceStructuredPreviewEl(artifact) {
  if (artifact.kind === "mindmap" && artifact.data?.mindmap) {
    return mindmapPreviewEl(artifact.data.mindmap);
  }
  if (artifact.kind === "presentation" && Array.isArray(artifact.data?.slides)) {
    const box = document.createElement("div");
    box.className = "practice-slide-preview";
    artifact.data.slides.slice(0, 6).forEach((slide) => {
      const card = document.createElement("article");
      card.className = "practice-slide";
      card.innerHTML = `<span>${escapeHtml(String(slide.slide || ""))}</span><strong>${escapeHtml(slide.title || "Diapositiva")}</strong>`;
      const list = document.createElement("ul");
      (slide.bullets || []).slice(0, 3).forEach((bullet) => {
        const li = document.createElement("li");
        li.textContent = bullet;
        list.appendChild(li);
      });
      card.appendChild(list);
      box.appendChild(card);
    });
    return box;
  }
  if (artifact.kind === "quiz" && Array.isArray(artifact.data?.questions)) {
    const box = document.createElement("div");
    box.className = "practice-quiz-preview";
    artifact.data.questions.slice(0, 4).forEach((q) => {
      const item = document.createElement("details");
      item.className = "practice-question";
      item.innerHTML = `<summary>${escapeHtml(q.question || "Pregunta")}</summary><p>${escapeHtml(q.explanation || q.correct_answer || "")}</p>`;
      box.appendChild(item);
    });
    return box;
  }
  if (artifact.kind === "flashcards" && Array.isArray(artifact.data?.cards)) {
    const box = document.createElement("div");
    box.className = "practice-card-preview";
    artifact.data.cards.slice(0, 6).forEach((card) => {
      const item = document.createElement("div");
      item.className = "study-card";
      item.innerHTML = `<strong>${escapeHtml(card.front || "")}</strong><span>${escapeHtml(card.back || "")}</span>`;
      box.appendChild(item);
    });
    return box;
  }
  return null;
}

function mindmapPreviewEl(mindmap) {
  const box = document.createElement("div");
  box.className = "mindmap-preview";
  const root = (mindmap.nodes || []).find((node) => node.id === "root") || (mindmap.nodes || [])[0];
  const children = (mindmap.nodes || []).filter((node) => node.id !== root?.id).slice(0, 8);
  const center = document.createElement("div");
  center.className = "mindmap-preview__root";
  center.textContent = root?.label || mindmap.title || "Tema";
  box.appendChild(center);
  const ring = document.createElement("div");
  ring.className = "mindmap-preview__ring";
  children.forEach((node) => {
    const item = document.createElement("div");
    item.className = "mindmap-preview__node";
    item.innerHTML = `<strong>${escapeHtml(node.label || "")}</strong><span>${escapeHtml(node.description || "")}</span>`;
    ring.appendChild(item);
  });
  box.appendChild(ring);
  return box;
}

function practiceVisualTasksEl(artifact) {
  const tasks = artifact.data?.image_tasks || [];
  if (!tasks.length) return null;
  const box = document.createElement("div");
  box.className = "practice-visuals";
  const head = document.createElement("div");
  head.className = "practice-visuals__title";
  head.textContent = "Imágenes educativas";
  box.appendChild(head);
  tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = "practice-visuals__item";
    const label = document.createElement("div");
    label.className = "practice-visuals__label";
    label.textContent = task.label || "Imagen educativa";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "practice-artifact__download";
    btn.textContent = "Generar imagen";
    const preview = document.createElement("div");
    preview.className = "practice-visuals__preview";
    const existing = (artifact.data?.generated_visuals || []).find((visual) => visual.task_id === task.id);
    if (existing) renderPracticeVisualPreview(preview, existing, artifact);
    btn.addEventListener("click", () => generatePracticeVisual(task, artifact, btn, preview));
    item.append(label, btn, preview);
    box.appendChild(item);
  });
  return box;
}

async function generatePracticeVisual(task, artifact, btn, preview) {
  const token = authToken();
  if (!token) {
    window.alert(t("practice_login"));
    return;
  }
  btn.disabled = true;
  const previous = btn.textContent;
  btn.textContent = "Generando...";
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/tools/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: task.prompt,
        quality: task.quality || "fast",
        aspect_ratio: task.aspect_ratio || "1:1",
      }),
    });
    if (res.status === 401) { clearAuthSession(); return; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.image) {
      window.alert(data.detail || t("practice_error"));
      return;
    }
    const visual = {
      task_id: task.id,
      label: task.label || "Imagen educativa",
      provider: "gemini",
      mime_type: data.image.mime_type || "image/png",
      data: data.image.data,
      model: data.image.model,
      asset_kind: "generated_visual",
    };
    artifact.data = artifact.data || {};
    artifact.data.generated_visuals = artifact.data.generated_visuals || [];
    artifact.data.generated_visuals = artifact.data.generated_visuals.filter((item) => item.task_id !== task.id);
    artifact.data.generated_visuals.push(visual);
    renderPracticeVisualPreview(preview, visual, artifact);
    saveLocalChats();
  } catch (_) {
    window.alert(t("practice_error"));
  } finally {
    btn.disabled = false;
    btn.textContent = previous;
  }
}

function renderPracticeVisualPreview(preview, visual, artifact) {
  preview.innerHTML = "";
  const img = document.createElement("img");
  img.alt = visual.label || "Imagen educativa generada";
  img.src = `data:${visual.mime_type || "image/png"};base64,${visual.data}`;
  const download = document.createElement("button");
  download.type = "button";
  download.className = "practice-artifact__download";
  download.textContent = "Descargar PNG";
  download.addEventListener("click", () => downloadGeneratedVisual(visual, artifact));
  preview.append(img, download);
}

function downloadGeneratedVisual(visual, artifact) {
  const link = document.createElement("a");
  link.href = `data:${visual.mime_type || "image/png"};base64,${visual.data}`;
  link.download = `${artifact.filename || "imagen"}-${visual.task_id || "gemini"}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ---------- Generador de imágenes (POST /api/tools/image, Gemini) ----------
function ensureImageModalStyles() {
  if (document.getElementById("image-modal-runtime-styles")) return;
  const style = document.createElement("style");
  style.id = "image-modal-runtime-styles";
  style.textContent = `
    .practice-modal__field textarea{width:100%!important;box-sizing:border-box!important;border:1px solid var(--border,#2b3344)!important;border-radius:14px!important;background:var(--bg-soft,#0b0b0b)!important;color:var(--text,#fff)!important;padding:11px 12px!important;font:inherit!important;outline:none!important;resize:vertical!important;min-height:84px!important}
    .image-modal__preview{margin-top:16px!important;display:grid!important;gap:10px!important;justify-items:center!important}
    .image-modal__preview img{max-width:100%!important;border-radius:16px!important;border:1px solid var(--border,#2b3344)!important}
    .image-modal__status{margin-top:14px!important;color:var(--text-muted,#9aa3b2)!important;font-size:13px!important;text-align:center!important}
  `;
  document.head.appendChild(style);
}

function openImageGenerator() {
  const token = authToken();
  if (!token) { window.alert(t("practice_login")); return; }
  ensurePracticeModalStyles();
  ensureImageModalStyles();

  const overlay = document.createElement("div");
  overlay.className = "practice-modal";
  overlay.innerHTML = `
    <div class="practice-modal__card" role="dialog" aria-modal="true">
      <h2>${escapeHtml(t("img_title"))}</h2>
      <p>${escapeHtml(t("img_desc"))}</p>
      <form class="practice-modal__form">
        <label class="practice-modal__field">${escapeHtml(t("img_prompt"))}
          <textarea name="prompt" placeholder="${escapeHtml(t("img_prompt_ph"))}" required></textarea>
        </label>
        <label class="practice-modal__field">${escapeHtml(t("img_aspect"))}
          <select name="aspect_ratio">
            <option value="1:1">1:1</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
          </select>
        </label>
        <label class="practice-modal__field">${escapeHtml(t("img_quality"))}
          <select name="quality">
            <option value="fast">${escapeHtml(t("img_quality_fast"))}</option>
            <option value="quality">${escapeHtml(t("img_quality_high"))}</option>
          </select>
        </label>
      </form>
      <div class="image-modal__preview" hidden></div>
      <div class="image-modal__status" hidden></div>
      <div class="practice-modal__actions">
        <button type="button" data-cancel>${escapeHtml(t("img_close"))}</button>
        <button type="button" data-submit>${escapeHtml(t("img_generate"))}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  const form = overlay.querySelector("form");
  const preview = overlay.querySelector(".image-modal__preview");
  const status = overlay.querySelector(".image-modal__status");
  const submit = overlay.querySelector("[data-submit]");
  const close = () => { overlay.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  overlay.querySelector("[data-cancel]").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  submit.addEventListener("click", async () => {
    const prompt = form.querySelector('[name="prompt"]').value.trim();
    if (prompt.length < 3) { status.hidden = false; status.textContent = t("img_empty"); return; }
    submit.disabled = true;
    const previous = submit.textContent;
    submit.textContent = t("img_generating");
    status.hidden = false; status.textContent = t("img_generating");
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/tools/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          quality: form.querySelector('[name="quality"]').value,
          aspect_ratio: form.querySelector('[name="aspect_ratio"]').value,
        }),
      });
      if (res.status === 401) { clearAuthSession(); close(); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.image) { status.textContent = data.detail || t("img_error"); return; }
      const mime = data.image.mime_type || "image/png";
      const src = `data:${mime};base64,${data.image.data}`;
      status.hidden = true;
      preview.hidden = false;
      preview.innerHTML = "";
      const img = document.createElement("img");
      img.alt = prompt;
      img.src = src;
      const dl = document.createElement("button");
      dl.type = "button";
      dl.className = "practice-artifact__download";
      dl.textContent = t("img_download");
      dl.addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = src;
        link.download = "Media-imagen.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
      preview.append(img, dl);
    } catch (_) {
      status.textContent = t("img_error");
    } finally {
      submit.disabled = false;
      submit.textContent = previous;
    }
  });

  form.querySelector("textarea")?.focus();
}

function getEffortPref() {
  try {
    const v = localStorage.getItem("Media-effort");
    return v === "low" || v === "medium" || v === "high" ? v : "medium";
  } catch (_) { return "medium"; }
}
function downloadPracticeArtifact(artifact, format, editableText) {
  const base = artifact.filename || "recurso";
  let content = editableText || "";
  let mime = "text/plain;charset=utf-8";
  let ext = "txt";
  if (format === "json") {
    content = JSON.stringify({ ...artifact, editable_text: editableText }, null, 2);
    mime = "application/json;charset=utf-8";
    ext = "json";
  } else if (format === "html") {
    content = `<!doctype html><html lang="es"><meta charset="utf-8"><title>${escapeHtml(artifact.title || "Recurso")}</title><body>${renderMarkdown(editableText)}</body></html>`;
    mime = "text/html;charset=utf-8";
    ext = "html";
  } else if (format === "csv") {
    const cards = artifact.data?.cards || [];
    content = cards.length
      ? "front,back,difficulty\n" + cards.map((c) => [c.front, c.back, c.difficulty].map(csvCell).join(",")).join("\n")
      : editableText;
    mime = "text/csv;charset=utf-8";
    ext = "csv";
  } else if (format === "markdown") {
    mime = "text/markdown;charset=utf-8";
    ext = "md";
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${base}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function assetCard(a) {
  const isImage = (a.type || "").toLowerCase().includes("image") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(a.path || "");
  const el = document.createElement("a");
  el.className = "msg__asset" + (isImage ? " msg__asset--img" : "");
  el.target = "_blank";
  el.rel = "noopener noreferrer";
  if (a.path) el.href = a.path;
  if (isImage && a.path) {
    el.innerHTML = `<img src="${encodeURI(a.path)}" alt="" loading="lazy" />`;
    if (a.caption) {
      const cap = document.createElement("span");
      cap.className = "msg__asset-cap";
      cap.textContent = a.caption;
      el.appendChild(cap);
    }
  } else {
    el.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>
        <path d="M14 3v6h6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>
      </svg>
      <span></span>`;
    el.querySelector("span").textContent = a.caption || a.path || a.type || "Recurso";
  }
  return el;
}

function knowledgeDoneEl() {
  const done = document.createElement("div");
  done.className = "msg__knowledge is-done";
  done.innerHTML = `
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>${escapeHtml(t("kb_requested"))}</span>`;
  return done;
}

async function requestKnowledge(m, chat, btn) {
  const token = authToken();
  if (!token) {   // modo demostración: simula el envío
    m.knowledgeRequested = true;
    btn.replaceWith(knowledgeDoneEl());
    return;
  }
  btn.disabled = true;
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/knowledge-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: chat?.backendConversationId ?? null,
        original_question: m.originalQuestion || "",
        normalized_topic: m.normalizedTopic || null,
      }),
    });
    if (res.status === 401) { clearAuthSession(); return; }
    if (!res.ok) throw new Error("kb");
    m.knowledgeRequested = true;
    btn.replaceWith(knowledgeDoneEl());
  } catch (_) {
    btn.disabled = false;
    const span = btn.querySelector("span");
    if (span) span.textContent = t("kb_error");
  }
}

// ---------- Acciones por mensaje ----------
const ICONS = {
  copy: '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  regen: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0l5-8a2 2 0 0 1 2 2v3h5.5a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 18 20H7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3zm0 0l-5 8a2 2 0 0 1-2-2v-3H4.5a2 2 0 0 1-2-2.4l1.4-7A2 2 0 0 1 6 4h11" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/></svg>',
  report: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3 2.8 20h18.4L12 3z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M12 8v6m0 3h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
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
    add(actionBtn("report", t("act_report"), m.feedback === "report" || !!m.reportReason));
  }
}

// ---------- Envío de mensajes ----------
async function sendMessage(text) {
  const content = text.trim();
  if ((!content && pendingAttachments.length === 0) || state.isResponding) return;

  let chat = getActiveChat();
  if (!chat) chat = createChat();

  const attachments = pendingAttachments.slice();
  chat.messages.push({ role: "user", content, attachments, ts: Date.now() });
  pendingAttachments = [];
  renderAttachPreview();

  if (chat.messages.length === 1) {
    chat.title = content
      ? content.slice(0, 40) + (content.length > 40 ? "…" : "")
      : (attachments[0]?.name || t("attach"));
    renderChatList();
  }
  renderMessages();
  touchChat(chat);
  resetInput();
  await runAssistant(chat);
}

// Genera (o regenera) la respuesta del asistente con streaming
async function runAssistant(chat) {
  state.isResponding = true;
  el.btnSend.disabled = true;

  const aiMsg = { role: "assistant", content: "", streaming: true, feedback: null, ts: Date.now() };
  chat.messages.push(aiMsg);
  renderMessages();
  const thinkingTimer = startAgentThinking(aiMsg);

  try {
    const meta = await streamAgentResponse(chat.messages.slice(0, -1), (chunk) => {
      if (!aiMsg.content) clearInterval(thinkingTimer);
      aiMsg.content += chunk;
      if (streamingBubble) {
        const keepAtBottom = isNearBottom();
        streamingBubble.innerHTML = renderMarkdown(aiMsg.content);
        enhanceLinks(streamingBubble);
        if (keepAtBottom) scrollToBottom();
      }
    });
    if (meta) {
      aiMsg.backendMessageId = meta.backendMessageId || aiMsg.backendMessageId || null;
      if (meta.backendConversationId) chat.backendConversationId = meta.backendConversationId;
      aiMsg.followup = meta.followup;
      aiMsg.assets = meta.assets;
      aiMsg.canRequestKnowledge = meta.canRequestKnowledge;
      aiMsg.originalQuestion = meta.originalQuestion;
      aiMsg.normalizedTopic = meta.normalizedTopic;
    }
    touchChat(chat);
    notifyResponse();   // sonido/vibración opcional al terminar
  } catch (err) {
    aiMsg.content = t("error_msg");
    console.error(err);
  } finally {
    clearInterval(thinkingTimer);
    aiMsg.streaming = false;
    delete aiMsg.thinkingIndex;
    state.isResponding = false;
    touchChat(chat);
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
  touchChat(chat);
  runAssistant(chat);
}

function previousUserQuestion(chat, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const msg = chat.messages[i];
    if (msg?.role === "user" && (msg.content || "").trim()) return msg.content.trim();
  }
  return "";
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

async function saveMessageFeedback(message, chat, rating, options = {}) {
  const token = authToken();
  if (!message || !chat) return false;
  if (!token) return false;
  const index = chat.messages.indexOf(message);
  const payload = {
    conversation_id: isUuid(chat.backendConversationId) ? chat.backendConversationId : null,
    message_id: isUuid(message.backendMessageId) ? message.backendMessageId : null,
    rating,
    reason: options.reason || (rating === "up" ? "helpful" : null),
    comment: options.comment || null,
    message_content: message.content || "",
    question: previousUserQuestion(chat, index),
    metadata: {
      local_chat_id: chat.id,
      local_message_index: index,
      source: "message_actions",
    },
  };
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) clearAuthSession();
    return res.ok;
  } catch (err) {
    console.error("Feedback save failed", err);
    return false;
  }
}

function openReportModal(message, chat, index) {
  ensurePracticeModalStyles();
  const overlay = document.createElement("div");
  overlay.className = "practice-modal";
  overlay.innerHTML = `
    <div class="practice-modal__card" role="dialog" aria-modal="true" aria-labelledby="reportTitle">
      <h2 id="reportTitle">${lang === "en" ? "Report response" : "Reportar respuesta"}</h2>
      <p>${lang === "en" ? "Tell us what went wrong so Media can improve future answers." : "Dinos que salio mal para mejorar futuras respuestas de Media."}</p>
      <form class="practice-modal__form">
        <label class="practice-modal__field">
          ${lang === "en" ? "Reason" : "Motivo"}
          <select name="reason">
            <option value="incorrect">${lang === "en" ? "Incorrect information" : "Informacion incorrecta"}</option>
            <option value="bad_sources">${lang === "en" ? "Bad or missing sources" : "Fuentes malas o faltantes"}</option>
            <option value="unsafe">${lang === "en" ? "Unsafe medical advice" : "Consejo medico inseguro"}</option>
            <option value="unclear">${lang === "en" ? "Unclear explanation" : "Explicacion confusa"}</option>
            <option value="not_medical">${lang === "en" ? "Out of medical scope" : "Fuera del tema medico"}</option>
            <option value="other">${lang === "en" ? "Other" : "Otro"}</option>
          </select>
        </label>
        <label class="practice-modal__field">
          ${lang === "en" ? "Comment" : "Comentario"}
          <textarea name="comment" rows="4" maxlength="1200" placeholder="${lang === "en" ? "Optional detail" : "Detalle opcional"}"></textarea>
        </label>
      </form>
      <div class="practice-modal__actions">
        <button type="button" data-cancel>${escapeHtml(t("close"))}</button>
        <button type="button" data-submit>${lang === "en" ? "Send report" : "Enviar reporte"}</button>
      </div>
    </div>`;
  const close = () => overlay.remove();
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-cancel]")) close();
  });
  overlay.querySelector("[data-submit]").addEventListener("click", async () => {
    const form = overlay.querySelector("form");
    const reason = form.elements.reason.value;
    const comment = form.elements.comment.value.trim();
    message.feedback = "report";
    message.reportReason = reason;
    message.reportComment = comment;
    touchChat(chat);
    await saveMessageFeedback(message, chat, "report", { reason, comment });
    close();
    renderMessages();
  });
  document.body.appendChild(overlay);
  overlay.querySelector("select")?.focus();
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
    const isImage = file.type.startsWith("image/");
    const att = {
      id: uid(),
      name: file.name,
      type: file.type || "",
      size: file.size,
      url: isImage ? URL.createObjectURL(file) : null,
      dataUrl: null,
    };
    pendingAttachments.push(att);
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        att.dataUrl = typeof reader.result === "string" ? reader.result : null;
      };
      reader.readAsDataURL(file);
    }
  });
  renderAttachPreview();
  updateSendState();
}

function chatAttachmentsForBackend(attachments) {
  return (attachments || [])
    .filter((att) => att.type?.startsWith("image/") && att.dataUrl)
    .slice(0, 4)
    .map((att) => ({
      type: "image",
      name: att.name || null,
      mime_type: att.type || "image/png",
      url: att.dataUrl,
    }));
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

function isNearBottom(threshold = 140) {
  const m = el.messages;
  if (!m) return true;
  return m.scrollHeight - m.scrollTop - m.clientHeight <= threshold;
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
  el.sidebar?.classList.remove("is-open");
  if (el.overlay) el.overlay.hidden = true;
}

// ---------- Tema ----------
function initTheme() {
  const saved = localStorage.getItem("Media-theme");
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
  try { localStorage.setItem("Media-theme", next); } catch (_) { }
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
  try { return localStorage.getItem("Media-auth-token"); } catch (_) { return null; }
}

function getRefreshToken() {
  try { return localStorage.getItem("Media-refresh-token"); } catch (_) { return null; }
}

function getStoredEmail() {
  try { return localStorage.getItem("Media-user-email"); } catch (_) { return null; }
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("Media-user-profile") || "null"); } catch (_) { return null; }
}

function setAuthSession(session) {
  try {
    if (session.access_token) localStorage.setItem("Media-auth-token", session.access_token);
    if (session.refresh_token) localStorage.setItem("Media-refresh-token", session.refresh_token);
    if (session.user?.email) localStorage.setItem("Media-user-email", session.user.email);
    if (session.user) localStorage.setItem("Media-user-profile", JSON.stringify(session.user));
  } catch (_) { }
  updateAuthUI();
  // Pre-carga el historial remoto sin bloquear ni regenerar chats antiguos.
  loadConversations();
}

// Sincroniza los chats locales al backend rehaciéndolos vía POST /api/chat.
// El backend no permite importar mensajes: reenvía cada pregunta del usuario y
// el backend regenera las respuestas (pueden diferir de las locales).
let isSyncingChats = false;
async function syncLocalChatsToBackend() {
  const token = authToken();
  if (!token || isSyncingChats) return;
  const active = getActiveChat();
  // El chat activo primero (para enlazarlo cuanto antes), luego el resto.
  const ordered = [active, ...state.chats.filter((c) => c !== active)].filter(Boolean);
  const pending = ordered.filter((c) =>
    !c.backendConversationId &&
    Array.isArray(c.messages) &&
    c.messages.some((m) => m.role === "user" && (m.content || "").trim())
  );
  if (!pending.length) return;
  isSyncingChats = true;
  try {
    for (const chat of pending) {
      const userMsgs = chat.messages.filter((m) => m.role === "user" && (m.content || "").trim());
      for (const msg of userMsgs) {
        let res;
        try {
          res = await fetchWithAuth(`${API_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversation_id: chat.backendConversationId ?? null,
              message: msg.content,
              effort: getEffortPref(),
            }),
          });
        } catch (_) { return; }  // backend caído: se reintenta en el próximo inicio de sesión
        if (res.status === 401) { clearAuthSession(); return; }
        if (!res.ok) break;      // error en este chat: pasa al siguiente
        const data = await res.json().catch(() => ({}));
        if (data.conversation_id && !chat.backendConversationId) {
          chat.backendConversationId = data.conversation_id;
          saveLocalChats();
        }
      }
    }
  } finally {
    isSyncingChats = false;
    saveLocalChats();
  }
}

function clearAuthSession() {
  try {
    localStorage.removeItem("Media-auth-token");
    localStorage.removeItem("Media-refresh-token");
    localStorage.removeItem("Media-user-email");
    localStorage.removeItem("Media-user-profile");
  } catch (_) { }
  conversationsCache = [];
  state.chats.forEach((chat) => { chat.backendConversationId = null; });
  saveLocalChats();
  renderConvMessage(t("conv_login"));
  updateAuthUI();
}

async function refreshAuthSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.access_token) return false;
    setAuthSession(data);
    return true;
  } catch (_) {
    return false;
  }
}

async function fetchWithAuth(url, options = {}, retry = true) {
  const token = authToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status !== 401 || !retry) return res;
  const refreshed = await refreshAuthSession();
  if (!refreshed) {
    clearAuthSession();
    return res;
  }
  return fetchWithAuth(url, options, false);
}

function updateAuthUI() {
  const signedIn = Boolean(getAuthToken());
  const user = getStoredUser() || {};
  const plan = BETA_PLANS[getBetaPlan()] || BETA_PLANS.free;
  if (el.btnLogout) el.btnLogout.hidden = !signedIn;
  if (el.btnAccountLearning) el.btnAccountLearning.hidden = !signedIn;
  if (el.btnAccountPlans) el.btnAccountPlans.hidden = false;
  if (el.accountName) el.accountName.textContent = signedIn ? (user.full_name || "Usuario Media") : "Invitado";
  if (el.accountAvatar) el.accountAvatar.textContent = (signedIn ? (user.full_name || user.email || "M") : "M").trim().slice(0, 1).toUpperCase();
  if (el.accountEmail) {
    if (signedIn) {
      el.accountEmail.removeAttribute("data-i18n");
      el.accountEmail.textContent = getStoredEmail() || user.email || "Sesion recordada";
    } else {
      el.accountEmail.setAttribute("data-i18n", "acc_hint");
      el.accountEmail.textContent = t("acc_hint");
    }
  }
  if (el.accountDetails) el.accountDetails.hidden = !signedIn;
  if (el.accountRole) el.accountRole.textContent = signedIn ? roleLabel(user.role) : "";
  if (el.accountUniversity) el.accountUniversity.textContent = signedIn ? (user.university || "Universidad no definida") : "";
  if (el.accountPlan) el.accountPlan.textContent = `${plan.name} · ${plan.price}`;
  updateAuthModeUI();
}

function roleLabel(role) {
  return {
    student: "Estudiante",
    doctor: "Doctor/a",
    resident: "Residente",
    teacher: "Docente",
    other: "Otro perfil",
  }[role] || "Perfil no definido";
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  if (el.authStatus && !getAuthToken()) el.authStatus.textContent = "";
  updateAuthModeUI();
}

function updateAuthModeUI() {
  const isReg = authMode === "register";
  if (el.authPassword) el.authPassword.setAttribute("autocomplete", isReg ? "new-password" : "current-password");
  if (el.btnAuthSubmit) el.btnAuthSubmit.textContent = isReg ? t("auth_create") : t("auth_enter");
  if (el.authTitle) el.authTitle.textContent = isReg ? "Crea tu cuenta Media" : "Bienvenido de nuevo";
  if (el.authSub) el.authSub.textContent = isReg ? "Cuéntale a Media quién eres para personalizar tu aprendizaje." : "Accede para guardar tus conversaciones y memoria de aprendizaje.";
  if (el.authSwitchText) el.authSwitchText.textContent = isReg ? t("auth_have_account") : t("auth_no_account");
  if (el.authSwitchBtn) el.authSwitchBtn.textContent = isReg ? t("acc_login") : t("acc_register");
  if (el.authRegisterFields) el.authRegisterFields.hidden = !isReg;
}

function openAuth() {
  setAuthMode("login");
  if (el.authStatus) el.authStatus.textContent = "";
  openPanel(el.authPanel);
  setTimeout(() => el.authEmail?.focus(), 60);
}
function closeAuth() { closePanel(el.authPanel); }

window.mediaOpenAuth = openAuth;

async function authenticate(mode) {
  setAuthMode(mode);
  const email = el.authEmail?.value.trim();
  const password = el.authPassword?.value;
  if (!email || !password) {
    if (el.authStatus) el.authStatus.textContent = t("auth_missing");
    return;
  }

  const endpoint = mode === "register" ? `${API_BASE_URL}/api/auth/register` : `${API_BASE_URL}/api/auth/login`;
  [el.authSwitchBtn, el.btnAuthSubmit].forEach((btn) => { if (btn) btn.disabled = true; });
  if (el.authStatus) el.authStatus.textContent = mode === "register" ? "Creando cuenta..." : "Iniciando sesion...";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: mode === "register" ? el.authFullName?.value.trim() || null : null,
        carnet: mode === "register" ? el.authCarnet?.value.trim() || null : null,
        university: mode === "register" ? el.authUniversity?.value.trim() || null : null,
        role: mode === "register" ? el.authRole?.value || null : null,
        specialty: mode === "register" ? el.authSpecialty?.value.trim() || null : null,
        academic_level: mode === "register" ? el.authSpecialty?.value.trim() || null : null,
        learning_challenges: mode === "register" ? el.authLearningChallenges?.value.trim() || null : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(normalizeAuthError(data.detail || data.message || t("auth_failed")));
    if (!data.access_token) {
      if (el.authStatus) el.authStatus.textContent = data.message || "Cuenta creada. Revisa tu correo e inicia sesion.";
      setAuthMode("login");
      return;
    }
    setAuthSession(data);
    closeAuth();
    closeMenus(null);
  } catch (err) {
    if (el.authStatus) el.authStatus.textContent = err.message || t("auth_failed");
  } finally {
    [el.authSwitchBtn, el.btnAuthSubmit].forEach((btn) => { if (btn) btn.disabled = false; });
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

async function handlePracticeAction(kind) {
  let chat = getActiveChat();
  if (!chat) chat = createChat();
  if (!chatHasConversationData(chat)) {
    chat.title = "Practica demo";
    touchChat(chat);
    renderChatList();
  }
  const topic = inferChatTopic(chat);
  const options = await openPracticeOptions(kind, topic);
  if (!options) return;

  const token = authToken();
  if (!token) {
    appendPracticeArtifact(chat, kind, demoPracticeResponse(kind, topic, options));
    return;
  }
  const conversationId = await ensureBackendConversation(chat);
  if (!conversationId) {
    appendPracticeArtifact(chat, kind, demoPracticeResponse(kind, topic, options));
    return;
  }

  const config = practiceConfig(kind, conversationId, topic, options);
  if (!config) return;

  const item = document.querySelector(`[data-practice="${kind}"]`);
  if (item) item.disabled = true;
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}${config.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config.payload),
    });
    if (res.status === 401) { clearAuthSession(); return; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data.detail || t("practice_error"));
      return;
    }
    appendPracticeArtifact(chat, kind, data);
  } catch (_) {
    appendPracticeArtifact(chat, kind, demoPracticeResponse(kind, topic, options));
  } finally {
    if (item) item.disabled = false;
  }
}

function appendPracticeArtifact(chat, kind, data) {
  chat.messages.push({
    role: "assistant",
    ts: Date.now(),
    content: practiceResultMarkdown(kind, data),
    practiceArtifact: data.contract?.artifact || null,
    feedback: null,
  });
  touchChat(chat);
  renderMessages();
}

function demoPracticeResponse(kind, topic, options = {}) {
  const artifact = demoPracticeArtifact(kind, topic, options);
  return {
    status: "prepared",
    message: "Modo demo visual: inicia sesion para guardar y generar con el backend real.",
    contract: { artifact, editable: true, downloadable: true },
  };
}

function demoPracticeArtifact(kind, topic, options = {}) {
  const cleanTopic = topic || "Tema de practica";
  const filename = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48) || "recurso";
  if (kind === "mapa") {
    const mindmap = demoMindmap(cleanTopic);
    return {
      kind: "mindmap",
      title: `Mapa mental: ${cleanTopic}`,
      filename: `mapa-${filename}`,
      format: "json",
      editable_text: demoMindmapMarkdown(mindmap),
      data: { mindmap, options, structured_output: { provider: "demo", validated: true } },
      downloads: ["markdown", "json"],
    };
  }
  if (kind === "presentacion") {
    const slides = demoSlides(cleanTopic, Number(options.slide_count || 6));
    return {
      kind: "presentation",
      title: `Presentacion: ${cleanTopic}`,
      filename: `presentacion-${filename}`,
      format: "markdown",
      editable_text: demoSlidesMarkdown(cleanTopic, slides, options),
      data: {
        slides,
        options,
        image_tasks: options.include_images ? [{
          id: "demo-slide-1",
          label: "Imagen educativa para portada",
          prompt: `Ilustracion educativa limpia sobre ${cleanTopic}`,
          quality: "fast",
          aspect_ratio: "16:9",
        }] : [],
      },
      downloads: ["markdown", "html", "json"],
    };
  }
  if (kind === "cuestionario") {
    const questions = Array.from({ length: Number(options.question_count || 5) }, (_, i) => ({
      number: i + 1,
      question: `Sobre ${cleanTopic}, cual es la idea clave numero ${i + 1}?`,
      options: ["Concepto central", "Dato aislado", "Excepcion rara", "No aplica"],
      correct_answer: "Concepto central",
      explanation: "La respuesta correcta conecta el tema con su mecanismo o uso principal.",
    }));
    return {
      kind: "quiz",
      title: `Cuestionario: ${cleanTopic}`,
      filename: `cuestionario-${filename}`,
      editable_text: demoQuizMarkdown(cleanTopic, questions),
      data: { questions, options },
      downloads: ["markdown", "json"],
    };
  }
  if (kind === "tarjetas") {
    const cards = Array.from({ length: Number(options.card_count || 8) }, (_, i) => ({
      front: `${cleanTopic}: concepto ${i + 1}`,
      back: "Definicion breve, ejemplo y una pista para recordarlo.",
      difficulty: options.difficulty || "intermediate",
    }));
    return {
      kind: "flashcards",
      title: `Tarjetas didacticas: ${cleanTopic}`,
      filename: `tarjetas-${filename}`,
      editable_text: demoCardsMarkdown(cleanTopic, cards),
      data: { cards, options },
      downloads: ["markdown", "json", "csv"],
    };
  }
  return {
    kind: "report",
    title: `Informe: ${cleanTopic}`,
    filename: `informe-${filename}`,
    editable_text: `# Informe: ${cleanTopic}\n\n## Resumen\nSintesis clara del tema con puntos principales.\n\n## Hallazgos clave\n- Idea central\n- Relaciones importantes\n- Puntos para repasar\n\n## Recomendaciones\n- Convertir cada punto en pregunta.\n- Crear tarjetas de memoria.\n- Verificar fuentes cuando uses el backend real.`,
    data: {
      options,
      image_tasks: [{
        id: "demo-report",
        label: "Infografia educativa del informe",
        prompt: `Infografia educativa conceptual sobre ${cleanTopic}`,
        quality: "fast",
        aspect_ratio: "16:9",
      }],
    },
    downloads: ["markdown", "html", "json"],
  };
}

function demoMindmap(topic) {
  const branches = [
    ["conceptos", "Conceptos clave", "Definiciones, signos, mecanismos y vocabulario esencial."],
    ["clinica", "Aplicacion clinica", "Como se reconoce, interpreta o usa en escenarios reales."],
    ["riesgos", "Alertas", "Errores frecuentes, limites y puntos que necesitan verificacion."],
    ["repaso", "Repaso activo", "Preguntas, tarjetas y relaciones para memorizar mejor."],
  ];
  return {
    title: topic,
    description: "Mapa mental demo",
    nodes: [
      { id: "root", label: topic, description: "Tema central", level: 0, category: "topic" },
      ...branches.map(([id, label, description]) => ({ id, label, description, level: 1, category: "concept" })),
    ],
    edges: branches.map(([id]) => ({ source: "root", target: id, label: "incluye" })),
  };
}

function demoMindmapMarkdown(mindmap) {
  return `# ${mindmap.title}\n\n## Nodos\n` +
    mindmap.nodes.map((node) => `- ${node.label}: ${node.description}`).join("\n") +
    "\n\n## Relaciones\n" +
    mindmap.edges.map((edge) => `- ${edge.source} -> ${edge.target}: ${edge.label}`).join("\n");
}

function demoSlides(topic, count) {
  const titles = ["Objetivo", "Contexto", "Conceptos clave", "Proceso", "Errores frecuentes", "Cierre"];
  return Array.from({ length: Math.max(3, Math.min(count, 12)) }, (_, i) => ({
    slide: i + 1,
    title: titles[i] || `Seccion ${i + 1}`,
    bullets: [`Idea principal sobre ${topic}`, "Ejemplo breve para estudiar", "Pregunta guia para recordar"],
    speaker_notes: "Explica con lenguaje claro y conecta con un caso sencillo.",
  }));
}

function demoSlidesMarkdown(topic, slides, options) {
  const lines = [`# Presentacion: ${topic}`, "", `Tipo: ${options.presentation_type || "study_summary"}`, ""];
  slides.forEach((slide) => {
    lines.push(`## Diapositiva ${slide.slide}: ${slide.title}`);
    slide.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
    lines.push("", `Notas: ${slide.speaker_notes}`, "");
  });
  return lines.join("\n").trim();
}

function demoQuizMarkdown(topic, questions) {
  const lines = [`# Cuestionario: ${topic}`, ""];
  questions.forEach((q) => {
    lines.push(`## ${q.number}. ${q.question}`);
    q.options.forEach((option, index) => lines.push(`${String.fromCharCode(65 + index)}. ${option}`));
    lines.push(`Respuesta: ${q.correct_answer}`, `Explicacion: ${q.explanation}`, "");
  });
  return lines.join("\n").trim();
}

function demoCardsMarkdown(topic, cards) {
  const lines = [`# Tarjetas didacticas: ${topic}`, ""];
  cards.forEach((card, index) => {
    lines.push(`## Tarjeta ${index + 1}`, `Frente: ${card.front}`, `Reverso: ${card.back}`, "");
  });
  return lines.join("\n").trim();
}

function chatHasConversationData(chat) {
  return !!chat && Array.isArray(chat.messages) && chat.messages.some((m) => !m.streaming && (m.content || "").trim());
}

function inferChatTopic(chat) {
  const firstUser = chat.messages.find((m) => m.role === "user" && (m.content || "").trim());
  return (firstUser?.content || chat.title || t("default_chat_title")).slice(0, 160);
}

function practiceConfig(kind, conversationId, topic, options = {}) {
  const base = { conversation_id: conversationId, topic };
  const map = {
    presentacion: { endpoint: "/api/tools/presentation", payload: { ...base, slide_count: Number(options.slide_count || 8), include_images: !!options.include_images, presentation_type: options.presentation_type || "study_summary", audience: options.audience || "Estudiantes de medicina" } },
    mapa: { endpoint: "/api/tools/mindmap", payload: { ...base, type: options.type || "mind_map", detail_level: options.detail_level || "intermediate" } },
    cuestionario: { endpoint: "/api/tools/quiz", payload: { ...base, difficulty: options.difficulty || "intermediate", question_count: Number(options.question_count || 5), question_type: options.question_type || "multiple_choice" } },
    tarjetas: { endpoint: "/api/tools/flashcards", payload: { ...base, difficulty: options.difficulty || "intermediate", card_count: Number(options.card_count || 10), answer_length: options.answer_length || "short", clinical_context: !!options.clinical_context, mode: options.mode || "concepts" } },
    informes: { endpoint: "/api/tools/report", payload: { ...base, report_type: options.report_type || "study_summary", include_recommendations: !!options.include_recommendations, focus: options.focus || "" } },
  };
  return map[kind] || null;
}

function practiceResultMarkdown(kind, data) {
  const title = {
    presentacion: t("practice_slides"),
    mapa: t("practice_mindmap"),
    cuestionario: t("practice_quiz"),
    tarjetas: t("practice_cards"),
    informes: t("practice_reports"),
  }[kind] || t("practice_ready");
  const artifact = data.contract?.artifact;
  return `**${t("practice_ready")}: ${title}**\n\n${data.message || ""}\n\n${artifact ? "Puedes editar el recurso abajo y descargarlo." : ""}`;
}

function openPracticeOptions(kind, topic) {
  const schema = practiceOptionSchema(kind);
  if (!schema) return Promise.resolve(null);
  ensurePracticeModalStyles();
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "practice-modal";
    overlay.innerHTML = `
      <div class="practice-modal__card" role="dialog" aria-modal="true">
        <h2>${escapeHtml(schema.title)}</h2>
        <p>Basado en: ${escapeHtml(topic)}</p>
        <form class="practice-modal__form"></form>
        <div class="practice-modal__actions">
          <button type="button" data-cancel>Cancelar</button>
          <button type="button" data-submit>Crear recurso</button>
        </div>
      </div>`;
    const form = overlay.querySelector("form");
    schema.fields.forEach((field) => form.appendChild(practiceFieldEl(field)));
    document.body.appendChild(overlay);
    const close = (value) => { overlay.remove(); resolve(value); };
    overlay.querySelector("[data-cancel]").addEventListener("click", () => close(null));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(null); });
    overlay.querySelector("[data-submit]").addEventListener("click", () => {
      const data = {};
      schema.fields.forEach((field) => {
        const input = form.querySelector(`[name="${field.name}"]`);
        data[field.name] = field.type === "checkbox" ? input.checked : input.value;
      });
      close(data);
    });
    form.querySelector("input,select")?.focus();
  });
}

function ensurePracticeModalStyles() {
  if (document.getElementById("practice-modal-runtime-styles")) return;
  const style = document.createElement("style");
  style.id = "practice-modal-runtime-styles";
  style.textContent = `
    .practice-modal{position:fixed!important;inset:0!important;z-index:9999!important;display:grid!important;place-items:center!important;padding:22px!important;background:rgba(6,12,28,.62)!important;backdrop-filter:blur(8px)!important}
    .practice-modal__card{width:min(520px,100%)!important;border:1px solid var(--border,#2b3344)!important;border-radius:26px!important;background:var(--surface,#161616)!important;color:var(--text,#fff)!important;box-shadow:0 22px 70px rgba(0,0,0,.38)!important;padding:24px!important}
    .practice-modal__card h2{margin:0 0 8px!important;font-family:var(--font-title,inherit)!important;font-size:22px!important;color:var(--text,#fff)!important}
    .practice-modal__card p{margin:0 0 18px!important;color:var(--text-muted,#9aa3b2)!important;font-size:13.5px!important;line-height:1.45!important}
    .practice-modal__form{display:grid!important;gap:12px!important}
    .practice-modal__field{display:grid!important;gap:7px!important;font-size:13.5px!important;font-weight:700!important;color:var(--text-soft,#d7dce7)!important}
    .practice-modal__field input,.practice-modal__field select,.practice-modal__field textarea{width:100%!important;box-sizing:border-box!important;border:1px solid var(--border,#2b3344)!important;border-radius:14px!important;background:var(--bg-soft,#0b0b0b)!important;color:var(--text,#fff)!important;padding:11px 12px!important;font:inherit!important;outline:none!important}
    .practice-modal__field textarea{resize:vertical!important;min-height:96px!important}
    .practice-modal__field input[type=checkbox]{width:20px!important;height:20px!important;accent-color:var(--primary,#2f6df6)!important}
    .practice-modal__actions{display:flex!important;justify-content:flex-end!important;gap:10px!important;margin-top:20px!important}
    .practice-modal__actions button{border:1px solid var(--border,#2b3344)!important;border-radius:999px!important;background:var(--bg-soft,#0b0b0b)!important;color:var(--text,#fff)!important;padding:10px 15px!important;font-weight:700!important;cursor:pointer!important}
    .practice-modal__actions [data-submit]{border-color:var(--primary,#2f6df6)!important;background:var(--primary,#2f6df6)!important;color:#fff!important}
  `;
  document.head.appendChild(style);
}

function practiceOptionSchema(kind) {
  const schemas = {
    presentacion: {
      title: "¿Qué tipo de presentación quieres?", fields: [
        { name: "presentation_type", label: "Tipo", type: "select", value: "study_summary", options: [["study_summary", "Resumen de estudio"], ["class", "Clase"], ["oral_expo", "Exposición oral"], ["clinical_case", "Caso clínico"]] },
        { name: "audience", label: "Audiencia", type: "text", value: "Estudiantes de medicina" },
        { name: "slide_count", label: "Cantidad de diapositivas", type: "number", value: 8, min: 3, max: 20 },
        { name: "include_images", label: "Preparar sugerencias visuales", type: "checkbox", value: true },
      ]
    },
    mapa: {
      title: "¿Qué tan detallado quieres el mapa?", fields: [
        { name: "detail_level", label: "Detalle", type: "select", value: "intermediate", options: [["basic", "Básico"], ["intermediate", "Intermedio"], ["advanced", "Avanzado"]] },
        { name: "type", label: "Formato", type: "select", value: "mind_map", options: [["mind_map", "Mapa mental"], ["concept_map", "Mapa conceptual"], ["synoptic_chart", "Cuadro sinóptico"], ["relationship_diagram", "Diagrama de relaciones"]] },
      ]
    },
    cuestionario: {
      title: "Configura el cuestionario", fields: [
        { name: "difficulty", label: "Dificultad", type: "select", value: "intermediate", options: [["basic", "Básico"], ["intermediate", "Intermedio"], ["advanced", "Avanzado"]] },
        { name: "question_count", label: "Cantidad de preguntas", type: "number", value: 5, min: 1, max: 20 },
        { name: "question_type", label: "Tipo", type: "select", value: "multiple_choice", options: [["multiple_choice", "Selección múltiple"], ["short_answer", "Respuesta corta"], ["mixed", "Mixto"]] },
      ]
    },
    tarjetas: {
      title: "Configura las tarjetas didácticas", fields: [
        { name: "difficulty", label: "Dificultad", type: "select", value: "intermediate", options: [["basic", "Básico"], ["intermediate", "Intermedio"], ["advanced", "Avanzado"]] },
        { name: "card_count", label: "Cantidad de tarjetas", type: "number", value: 10, min: 1, max: 40 },
        { name: "mode", label: "Enfoque", type: "select", value: "concepts", options: [["concepts", "Conceptos"], ["clinical", "Clínico"], ["exam", "Examen"]] },
        { name: "clinical_context", label: "Incluir aplicación clínica", type: "checkbox", value: true },
      ]
    },
    informes: {
      title: "Configura el informe", fields: [
        { name: "report_type", label: "Tipo", type: "select", value: "study_summary", options: [["study_summary", "Resumen de estudio"], ["progress_report", "Reporte de progreso"], ["clinical_brief", "Brief clínico"]] },
        { name: "focus", label: "Enfoque específico", type: "text", value: "puntos clave y recomendaciones" },
        { name: "include_recommendations", label: "Incluir recomendaciones", type: "checkbox", value: true },
      ]
    },
  };
  return schemas[kind];
}

function practiceFieldEl(field) {
  const label = document.createElement("label");
  label.className = "practice-modal__field";
  const span = document.createElement("span");
  span.textContent = field.label;
  label.appendChild(span);
  let input;
  if (field.type === "select") {
    input = document.createElement("select");
    field.options.forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      input.appendChild(option);
    });
  } else {
    input = document.createElement("input");
    input.type = field.type;
    if (field.min) input.min = field.min;
    if (field.max) input.max = field.max;
  }
  input.name = field.name;
  if (field.type === "checkbox") input.checked = !!field.value;
  else input.value = field.value || "";
  label.appendChild(input);
  return label;
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
    touchChat(chat);
    if (m.feedback) saveMessageFeedback(m, chat, m.feedback);
    // Actualiza en el sitio (evita re-animar los mensajes)
    const row = btn.closest(".msg__actions");
    row.querySelector('[data-action="up"]')?.classList.toggle("is-active", m.feedback === "up");
    row.querySelector('[data-action="down"]')?.classList.toggle("is-active", m.feedback === "down");
    row.querySelector('[data-action="report"]')?.classList.toggle("is-active", m.feedback === "report");
  } else if (action === "report") {
    openReportModal(m, chat, +btn.dataset.index);
  }
});

el.input.addEventListener("input", () => { autoGrow(); updateSendState(); updateComposerMeta(); });
el.input.addEventListener("focus", updateComposerMeta);
el.input.addEventListener("blur", updateComposerMeta);

// Contador de caracteres + atajos (visibles al escribir/enfocar)
function updateComposerMeta() {
  const len = el.input.value.length;
  const max = Number(el.input.getAttribute("maxlength") || 4000);
  if (el.charCount) {
    el.charCount.textContent = `${len} / ${max}`;
    el.charCount.classList.toggle("is-warn", len > max * 0.9);
  }
  updateTokenMeter(len, max);
  if (!el.composerMeta) return;
  el.composerMeta.hidden = !(len > max * 0.9);   // solo cerca del límite del plan
}

function getBetaPlan() {
  try {
    const saved = localStorage.getItem("Media-beta-plan");
    return BETA_PLANS[saved] ? saved : "free";
  } catch (_) {
    return "free";
  }
}

function setBetaPlan(plan) {
  const key = BETA_PLANS[plan] ? plan : "free";
  try { localStorage.setItem("Media-beta-plan", key); } catch (_) { }
  applyBetaPlan(key);
}

function applyBetaPlan(plan = getBetaPlan()) {
  const cfg = BETA_PLANS[plan] || BETA_PLANS.free;
  if (el.input) el.input.setAttribute("maxlength", String(cfg.chars));
  if (el.planName) el.planName.textContent = cfg.name;
  if (el.tokenLimit) el.tokenLimit.textContent = cfg.tokens;
  document.querySelectorAll(".plan-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.plan === plan);
  });
  updateComposerMeta();
}

function updateTokenMeter(chars = 0, maxChars = 4000) {
  const approxTokens = Math.ceil(chars / 4);
  const approxLimit = Math.ceil(maxChars / 4);
  const pct = Math.min(100, Math.round((chars / Math.max(1, maxChars)) * 100));
  if (el.tokenUsed) el.tokenUsed.textContent = approxTokens.toLocaleString();
  if (el.tokenLimit) el.tokenLimit.textContent = approxLimit.toLocaleString();
  if (el.tokenMeterFill) {
    el.tokenMeterFill.style.width = `${pct}%`;
    el.tokenMeterFill.classList.toggle("is-warn", pct > 85);
  }
}

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

function focusComposer() {
  el.input?.focus();
  el.input?.scrollIntoView({ behavior: "smooth", block: "center" });
}

el.btnPlansTop?.addEventListener("click", () => {
  showPlans();
});
el.btnChatTop?.addEventListener("click", focusComposer);
el.landingStart?.addEventListener("click", focusComposer);
if (el.landingLogin) {
  el.landingLogin.onclick = (e) => {
    e.preventDefault();
    openAuth();
  };
}
el.landingLogin?.addEventListener("click", (e) => {
  e.preventDefault();
  openAuth();
});
el.landingPlans?.addEventListener("click", showPlans);

document.querySelectorAll(".plan-card").forEach((card) => {
  card.addEventListener("click", () => {
    setBetaPlan(card.dataset.plan);
    focusComposer();
    updateAuthUI();
  });
});

function showPlans() {
  const hasMessages = !!getActiveChat()?.messages?.length;
  if (hasMessages) createChat();
  setTimeout(() => el.plansBeta?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
}

window.mediaShowPlans = showPlans;

document.querySelectorAll("[data-quick]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompts = {
      resume: "Resume este tema con puntos clave, advertencias y una mini-guia de repaso.",
      mapa: "Crea una explicacion base para luego convertirla en mapa mental.",
      presentacion: "Ayudame a preparar una presentacion clara con diapositivas y notas del expositor.",
      quiz: "Hazme preguntas de practica tipo examen y explica cada respuesta.",
    };
    el.input.value = prompts[btn.dataset.quick] || btn.textContent;
    autoGrow();
    updateSendState();
    updateComposerMeta();
    focusComposer();
  });
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#landingLogin")) {
    e.preventDefault();
    openAuth();
  }
});

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

// ---------- Biblioteca virtual ----------
function setMainView(view) {
  state.view = view;
  const libraryOpen = view === "library";
  if (el.libraryView) el.libraryView.hidden = !libraryOpen;
  if (el.messages) el.messages.hidden = libraryOpen;
  if (el.form?.closest(".composer")) el.form.closest(".composer").hidden = libraryOpen;
  const hint = document.querySelector(".composer__hint");
  if (hint) hint.hidden = libraryOpen;
  if (el.main) el.main.classList.toggle("is-library", libraryOpen);
  document.querySelectorAll(".rail__item").forEach((item) => {
    item.classList.toggle("is-active", libraryOpen && item.dataset.section === "biblioteca");
  });
}

async function openLibrary() {
  setMainView("library");
  if (!state.library.loaded && !state.library.loading) await loadLibrary();
  renderLibrary();
}

function closeLibrary() {
  setMainView("chat");
  renderMessages();
}

async function loadLibrary() {
  state.library.loading = true;
  renderLibraryMessage("Cargando biblioteca...");
  try {
    const res = await fetch(`${API_BASE_URL}/api/library`);
    if (!res.ok) throw new Error(`library_${res.status}`);
    const data = await res.json();
    state.library.documents = Array.isArray(data.documents) ? data.documents : [];
    state.library.categories = Array.isArray(data.categories) ? data.categories : [];
    state.library.loaded = true;
  } catch (err) {
    console.error(err);
    renderLibraryMessage("No se pudo cargar la biblioteca.");
  } finally {
    state.library.loading = false;
  }
}

function renderLibraryMessage(message) {
  if (el.libraryDocs) el.libraryDocs.innerHTML = `<p class="library-empty">${escapeHtml(message)}</p>`;
  if (el.libraryTree) el.libraryTree.innerHTML = "";
  if (el.libraryCount) el.libraryCount.textContent = "0 documentos";
}

function renderLibrary() {
  if (!el.libraryDocs || !el.libraryTree) return;
  if (state.library.loading) {
    renderLibraryMessage("Cargando biblioteca...");
    return;
  }
  const docs = filteredLibraryDocuments();
  renderLibraryTree();
  renderLibraryDocs(docs);
  if (el.libraryCount) {
    const total = state.library.documents.length;
    el.libraryCount.textContent = `${docs.length} de ${total} documentos`;
  }
}

function filteredLibraryDocuments() {
  const q = state.library.query.trim().toLowerCase();
  return state.library.documents.filter((doc) => {
    if (state.library.activeCategory !== "all" && doc.category !== state.library.activeCategory) return false;
    if (state.library.activeBranch !== "all" && doc.branch !== state.library.activeBranch) return false;
    if (!q) return true;
    const haystack = [
      doc.title,
      doc.category,
      doc.branch,
      doc.source_pdf,
      doc.document_type,
      doc.language,
      ...(doc.authors || []),
      ...(doc.topics || []),
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function renderLibraryTree() {
  const categories = state.library.categories || [];
  const button = (label, count, category, branch = "all") => {
    const active = state.library.activeCategory === category && state.library.activeBranch === branch;
    return `<button class="library-tree__item${active ? " is-active" : ""}" type="button" data-category="${escapeHtml(category)}" data-branch="${escapeHtml(branch)}">
      <span>${escapeHtml(label)}</span><strong>${count}</strong>
    </button>`;
  };
  const total = state.library.documents.length;
  const html = [
    button("Todo", total, "all", "all"),
    ...categories.map((cat) => `
      <div class="library-tree__group">
        ${button(cat.name, cat.count, cat.name, "all")}
        <div class="library-tree__branches">
          ${(cat.branches || []).map((branch) => button(branch.name, branch.count, cat.name, branch.name)).join("")}
        </div>
      </div>`),
  ].join("");
  el.libraryTree.innerHTML = html;
}

function renderLibraryDocs(docs) {
  if (!docs.length) {
    el.libraryDocs.innerHTML = `<p class="library-empty">No encontré documentos con ese filtro.</p>`;
    return;
  }
  el.libraryDocs.innerHTML = docs.map((doc) => {
    const authors = (doc.authors || []).slice(0, 3).join(", ");
    const meta = [doc.branch, doc.year, doc.language, doc.pdf_pages ? `${doc.pdf_pages} págs.` : ""].filter(Boolean).join(" · ");
    const topics = (doc.topics || []).slice(0, 4).map((topic) => `<span>${escapeHtml(topic)}</span>`).join("");
    const pdf = doc.pdf_url
      ? `<a class="library-card__pdf" href="${escapeHtml(doc.pdf_url)}" target="_blank" rel="noreferrer">Abrir PDF</a>`
      : `<span class="library-card__pdf is-disabled">PDF no enlazado</span>`;
    return `
      <article class="library-card">
        <div class="library-card__top">
          <span class="library-card__category">${escapeHtml(doc.category || "General")}</span>
          ${pdf}
        </div>
        <h2>${escapeHtml(doc.title || "Documento sin titulo")}</h2>
        <p class="library-card__meta">${escapeHtml(meta)}</p>
        ${authors ? `<p class="library-card__authors">${escapeHtml(authors)}</p>` : ""}
        ${topics ? `<div class="library-card__topics">${topics}</div>` : ""}
      </article>`;
  }).join("");
}

el.libraryClose?.addEventListener("click", closeLibrary);
el.librarySearch?.addEventListener("input", () => {
  state.library.query = el.librarySearch.value || "";
  renderLibrary();
});
el.libraryTree?.addEventListener("click", (event) => {
  const btn = event.target.closest(".library-tree__item");
  if (!btn) return;
  state.library.activeCategory = btn.dataset.category || "all";
  state.library.activeBranch = btn.dataset.branch || "all";
  renderLibrary();
});

// Rail de iconos
document.querySelectorAll(".rail__item").forEach((item) => {
  item.addEventListener("click", () => {
    if (item.dataset.practice) {
      handlePracticeAction(item.dataset.practice);
      return;
    }
    const section = item.dataset.section;

    // Acciones directas
    if (section === "nuevo") { closeLibrary(); createChat({ syncBackend: true }); return; }
    if (section === "buscar") { openConversations(); return; }

    if (section === "ajustes") { openSettings(); return; }
    if (section === "imagenes") { openImageGenerator(); return; }
    if (section === "biblioteca") { openLibrary(); return; }

    // Secciones (placeholder para futuras vistas)
    document.querySelectorAll(".rail__item").forEach((i) => i.classList.remove("is-active"));
    item.classList.add("is-active");
    // TODO: conmutar aquí el contenido de .main según item.dataset.section
  });
});

// ---------- Rail desplegable (contraer a solo iconos) ----------
function applyRailCollapsed(collapsed) {
  document.body.classList.toggle("rail-collapsed", collapsed);
  if (el.railToggle) {
    el.railToggle.setAttribute("aria-expanded", String(!collapsed));
    const label = t(collapsed ? "rail_toggle_expand" : "rail_toggle");
    el.railToggle.setAttribute("aria-label", label);
    el.railToggle.setAttribute("title", label);
  }
}
function getRailCollapsedPref() {
  try { return localStorage.getItem("Media-rail") === "1"; } catch (_) { return false; }
}
el.railToggle?.addEventListener("click", () => {
  const collapsed = !document.body.classList.contains("rail-collapsed");
  applyRailCollapsed(collapsed);
  try { localStorage.setItem("Media-rail", collapsed ? "1" : "0"); } catch (_) { }
});
applyRailCollapsed(getRailCollapsedPref());

// Rail derecho "Practicar" (mismo botón de despliegue, colapso independiente)
function applyPracticeCollapsed(collapsed) {
  document.body.classList.toggle("practice-collapsed", collapsed);
  if (el.practiceToggle) {
    el.practiceToggle.setAttribute("aria-expanded", String(!collapsed));
    const label = t(collapsed ? "rail_toggle_expand" : "rail_toggle");
    el.practiceToggle.setAttribute("aria-label", label);
    el.practiceToggle.setAttribute("title", label);
  }
}
function getPracticeCollapsedPref() {
  try {
    const saved = localStorage.getItem("Media-practice");
    return saved === null ? true : saved === "1";
  } catch (_) { return true; }
}
el.practiceToggle?.addEventListener("click", () => {
  const collapsed = !document.body.classList.contains("practice-collapsed");
  applyPracticeCollapsed(collapsed);
  try { localStorage.setItem("Media-practice", collapsed ? "1" : "0"); } catch (_) { }
});
applyPracticeCollapsed(getPracticeCollapsedPref());

// ---------- Ajustes (paneles deslizantes) ----------
function openPanel(node) { node.classList.add("is-open"); node.setAttribute("aria-hidden", "false"); }
function closePanel(node) { node.classList.remove("is-open"); node.setAttribute("aria-hidden", "true"); }

function openSettings() { openPanel(el.settingsPanel); }
function closeSettings() {
  toggleLangMenu(false);
  closePanel(el.dataPanel);
  el.settingsPanel.classList.remove("is-pushed");
  closePanel(el.settingsPanel);
}
function openData() { openPanel(el.dataPanel); el.settingsPanel.classList.add("is-pushed"); }
function closeData() { closePanel(el.dataPanel); el.settingsPanel.classList.remove("is-pushed"); }

// ---------- Perfil de aprendizaje (GET /api/learning/profile) ----------
function openLearning() { openPanel(el.learningPanel); el.settingsPanel.classList.add("is-pushed"); loadLearning(); }
function closeLearning() { closePanel(el.learningPanel); el.settingsPanel.classList.remove("is-pushed"); }

window.mediaOpenLearning = openLearning;

const STYLE_LABELS = {
  balanced: "learn_style_balanced", concise: "learn_style_concise",
  detailed: "learn_style_detailed", visual: "learn_style_visual",
};
const DIFF_LABELS = {
  basic: "learn_diff_basic", intermediate: "learn_diff_intermediate", advanced: "learn_diff_advanced",
};

function learnMsg(msg) {
  if (el.learnBody) el.learnBody.innerHTML = `<p class="conv-empty">${escapeHtml(msg)}</p>`;
}

async function loadLearning() {
  const token = authToken();
  if (!token) { learnMsg(t("conv_login")); return; }
  learnMsg(t("conv_loading"));
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/learning/profile`);
    if (res.status === 401) { clearAuthSession(); learnMsg(t("conv_login")); return; }
    if (!res.ok) { learnMsg(t("learn_error")); return; }
    renderLearning(await res.json());
  } catch (_) {
    learnMsg(t("learn_error"));
  }
}

function renderLearning(p) {
  if (!el.learnBody) return;
  const styleKey = STYLE_LABELS[p.preferred_explanation_style];
  const diffKey = DIFF_LABELS[p.preferred_difficulty];
  const style = styleKey ? t(styleKey) : (p.preferred_explanation_style || "—");
  const diff = diffKey ? t(diffKey) : (p.preferred_difficulty || "—");

  el.learnBody.innerHTML = "";

  const prefs = document.createElement("div");
  prefs.className = "learn-prefs";
  prefs.appendChild(prefCard(t("learn_style"), style));
  prefs.appendChild(prefCard(t("learn_difficulty"), diff));
  el.learnBody.appendChild(prefs);

  const meta = p.metadata || {};
  const profileItems = [
    ["Rol", roleLabel(meta.role)],
    ["Universidad", meta.university || "No definida"],
    ["Carnet", meta.carnet || "No definido"],
    ["Especialidad / año", meta.specialty || meta.academic_level || "No definido"],
    ["Dificultades declaradas", meta.learning_challenges || "Media las irá detectando con tus preguntas."],
  ];
  const profile = document.createElement("div");
  profile.className = "learn-profile";
  profileItems.forEach(([label, value]) => profile.appendChild(prefCard(label, value)));
  el.learnBody.appendChild(profile);

  el.learnBody.appendChild(chipSection(t("learn_strengths"), p.strengths, "is-pos"));
  el.learnBody.appendChild(chipSection(t("learn_growth"), p.growth_areas, "is-warn"));
  el.learnBody.appendChild(chipSection(t("learn_confusions"), p.recurring_confusions, ""));
  el.learnBody.appendChild(learningEditForm(p));
}

function prefCard(label, value) {
  const card = document.createElement("div");
  card.className = "learn-pref";
  card.innerHTML = `<span class="learn-pref__label"></span><span class="learn-pref__value"></span>`;
  card.querySelector(".learn-pref__label").textContent = label;
  card.querySelector(".learn-pref__value").textContent = value;
  return card;
}

function chipSection(title, items, tone) {
  const sec = document.createElement("div");
  sec.className = "learn-sec";
  const h = document.createElement("h3");
  h.className = "learn-sec__title";
  h.textContent = title;
  sec.appendChild(h);
  if (Array.isArray(items) && items.length) {
    const box = document.createElement("div");
    box.className = "learn-chips";
    items.forEach((it) => {
      const chip = document.createElement("span");
      chip.className = "learn-chip " + tone;
      chip.textContent = it;
      box.appendChild(chip);
    });
    sec.appendChild(box);
  } else {
    const empty = document.createElement("p");
    empty.className = "learn-sec__empty";
    empty.textContent = t("learn_none");
    sec.appendChild(empty);
  }
  return sec;
}

function csvList(value) {
  if (Array.isArray(value)) return value.join(", ");
  return "";
}

function parseList(value) {
  return String(value || "")
    .replace(/\n/g, ",")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function learningEditForm(profile) {
  const meta = profile.metadata || {};
  const form = document.createElement("form");
  form.className = "learn-form";
  form.innerHTML = `
    <h3>${lang === "en" ? "Edit profile" : "Modificar perfil"}</h3>
    <label>${t("learn_style")}
      <select name="preferred_explanation_style">
        <option value="balanced">${t("learn_style_balanced")}</option>
        <option value="concise">${t("learn_style_concise")}</option>
        <option value="detailed">${t("learn_style_detailed")}</option>
        <option value="visual">${t("learn_style_visual")}</option>
      </select>
    </label>
    <label>${t("learn_difficulty")}
      <select name="preferred_difficulty">
        <option value="basic">${t("learn_diff_basic")}</option>
        <option value="intermediate">${t("learn_diff_intermediate")}</option>
        <option value="advanced">${t("learn_diff_advanced")}</option>
      </select>
    </label>
    <label>${t("learn_strengths")}
      <textarea name="strengths" rows="2" placeholder="${lang === "en" ? "comma separated" : "separadas por comas"}"></textarea>
    </label>
    <label>${t("learn_growth")}
      <textarea name="growth_areas" rows="2" placeholder="${lang === "en" ? "comma separated" : "separadas por comas"}"></textarea>
    </label>
    <label>${t("learn_confusions")}
      <textarea name="recurring_confusions" rows="2" placeholder="${lang === "en" ? "comma separated" : "separadas por comas"}"></textarea>
    </label>
    <label>${lang === "en" ? "University" : "Universidad"}
      <input name="university" maxlength="160" />
    </label>
    <label>${lang === "en" ? "Specialty / year" : "Especialidad / año"}
      <input name="specialty" maxlength="160" />
    </label>
    <label>${lang === "en" ? "Declared difficulties" : "Dificultades declaradas"}
      <textarea name="learning_challenges" rows="2" maxlength="1200"></textarea>
    </label>
    <button type="submit">${lang === "en" ? "Save changes" : "Guardar cambios"}</button>
    <p class="auth-status" hidden></p>`;
  form.elements.preferred_explanation_style.value = profile.preferred_explanation_style || "balanced";
  form.elements.preferred_difficulty.value = profile.preferred_difficulty || "intermediate";
  form.elements.strengths.value = csvList(profile.strengths);
  form.elements.growth_areas.value = csvList(profile.growth_areas);
  form.elements.recurring_confusions.value = csvList(profile.recurring_confusions);
  form.elements.university.value = meta.university || "";
  form.elements.specialty.value = meta.specialty || meta.academic_level || "";
  form.elements.learning_challenges.value = meta.learning_challenges || "";
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveLearningProfile(form, profile);
  });
  return form;
}

async function saveLearningProfile(form, profile) {
  const status = form.querySelector(".auth-status");
  const button = form.querySelector("button[type='submit']");
  if (status) { status.hidden = false; status.textContent = lang === "en" ? "Saving..." : "Guardando..."; }
  if (button) button.disabled = true;
  const meta = {
    ...(profile.metadata || {}),
    university: form.elements.university.value.trim() || null,
    specialty: form.elements.specialty.value.trim() || null,
    learning_challenges: form.elements.learning_challenges.value.trim() || null,
  };
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/learning/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferred_explanation_style: form.elements.preferred_explanation_style.value,
        preferred_difficulty: form.elements.preferred_difficulty.value,
        strengths: parseList(form.elements.strengths.value),
        growth_areas: parseList(form.elements.growth_areas.value),
        recurring_confusions: parseList(form.elements.recurring_confusions.value),
        metadata: meta,
      }),
    });
    if (res.status === 401) { clearAuthSession(); learnMsg(t("conv_login")); return; }
    if (!res.ok) throw new Error("profile_update_failed");
    renderLearning(await res.json());
  } catch (err) {
    if (status) status.textContent = lang === "en" ? "Could not save changes." : "No se pudieron guardar los cambios.";
  } finally {
    if (button) button.disabled = false;
  }
}

// ---------- Conversaciones (historial desde /api/conversations) ----------
let conversationsCache = [];

function authToken() {
  try { return localStorage.getItem("Media-auth-token"); } catch (_) { return null; }
}

function openConversations() {
  openPanel(el.conversationsPanel);
  loadConversations();
}
function closeConversations() { closePanel(el.conversationsPanel); }

async function loadConversations() {
  const token = authToken();
  // Sin sesión: historial local (chats guardados en el navegador).
  if (!token) { renderLocalChats(el.convSearch?.value || ""); return; }
  renderLocalChats(el.convSearch?.value || "");
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/conversations`);
    if (res.status === 401) { clearAuthSession(); renderLocalChats(el.convSearch?.value || ""); return; }
    if (!res.ok) { return; }
    conversationsCache = await res.json();
    if (Array.isArray(conversationsCache) && conversationsCache.length) renderConvList(el.convSearch?.value || "");
    else renderLocalChats(el.convSearch?.value || "");
  } catch (_) {
    renderLocalChats(el.convSearch?.value || "");
  }
}

// Renderiza los chats guardados localmente (modo sin sesión)
function renderLocalChats(filter = "") {
  if (!el.convList) return;
  const q = filter.trim().toLowerCase();
  const items = state.chats
    .filter((c) => Array.isArray(c.messages) && c.messages.some((m) => !m.streaming && (m.content || "").trim()))
    .filter((c) => !q || (c.title || "").toLowerCase().includes(q));
  if (!items.length) { renderConvMessage(t("conv_empty")); return; }
  el.convList.innerHTML = "";
  items.forEach((c) => {
    const row = document.createElement("div");
    row.className = "conv-item" + (c.id === state.activeChatId ? " is-active" : "");
    const when = c.updatedAt || c.createdAt;
    const date = when ? new Date(when).toLocaleDateString(lang, { day: "2-digit", month: "short" }) : "";

    const main = document.createElement("button");
    main.className = "conv-item__main";
    main.type = "button";
    main.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
      </svg>
      <span class="conv-item__title">${escapeHtml(c.title || t("default_chat_title"))}</span>
      <span class="conv-item__date">${escapeHtml(date)}</span>`;
    main.addEventListener("click", () => { switchChat(c.id); closeConversations(); });

    const del = document.createElement("button");
    del.className = "conv-item__delete";
    del.type = "button";
    del.setAttribute("aria-label", t("conv_delete"));
    del.title = t("conv_delete");
    del.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`;
    del.addEventListener("click", () => deleteLocalChat(c.id));

    row.appendChild(main);
    row.appendChild(del);
    el.convList.appendChild(row);
  });
}

function deleteLocalChat(id) {
  if (!window.confirm(t("conv_delete_confirm"))) return;
  state.chats = state.chats.filter((c) => c.id !== id);
  if (state.activeChatId === id) {
    if (state.chats.length) state.activeChatId = state.chats[0].id;
    else createChat();
  }
  saveLocalChats();
  renderMessages();
  renderChatList();
}

function renderConvMessage(msg) {
  if (!el.convList) return;
  el.convList.innerHTML = `<p class="conv-empty">${escapeHtml(msg)}</p>`;
}

function renderConvList(filter = "") {
  if (!el.convList) return;
  const q = filter.trim().toLowerCase();
  const items = conversationsCache
    .filter((c) => !c.archived)
    .filter((c) => !q || (c.title || "").toLowerCase().includes(q));
  if (!items.length) { renderConvMessage(t("conv_empty")); return; }
  el.convList.innerHTML = "";
  items.forEach((c) => {
    const row = document.createElement("div");
    row.className = "conv-item" + (getActiveChat()?.backendConversationId === c.id ? " is-active" : "");
    const when = c.updated_at || c.created_at;
    const date = when ? new Date(when).toLocaleDateString(lang, { day: "2-digit", month: "short" }) : "";

    const main = document.createElement("button");
    main.className = "conv-item__main";
    main.type = "button";
    main.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
      </svg>
      <span class="conv-item__title">${escapeHtml(c.title || t("default_chat_title"))}</span>
      <span class="conv-item__date">${escapeHtml(date)}</span>`;
    main.addEventListener("click", () => openConversation(c.id));

    const del = document.createElement("button");
    del.className = "conv-item__delete";
    del.type = "button";
    del.setAttribute("aria-label", t("conv_delete"));
    del.title = t("conv_delete");
    del.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`;
    del.addEventListener("click", () => deleteConversation(c.id));

    row.appendChild(main);
    row.appendChild(del);
    el.convList.appendChild(row);
  });
}

async function deleteConversation(id) {
  const token = authToken();
  if (!token) return;
  if (!window.confirm(t("conv_delete_confirm"))) return;
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/conversations/${id}`, {
      method: "DELETE",
    });
    if (res.status === 401) { clearAuthSession(); renderConvMessage(t("conv_login")); return; }
    if (!res.ok && res.status !== 204) { renderConvMessage(t("conv_delete_error")); return; }
    conversationsCache = conversationsCache.filter((c) => c.id !== id);
    // Si la conversación activa fue eliminada, la desvinculamos del chat abierto.
    const active = getActiveChat();
    if (active && active.backendConversationId === id) active.backendConversationId = null;
    saveLocalChats();
    renderConvList(el.convSearch?.value || "");
  } catch (_) {
    renderConvMessage(t("conv_delete_error"));
  }
}

async function openConversation(id) {
  const token = authToken();
  if (!token) return;
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/conversations/${id}`);
    if (!res.ok) return;
    const detail = await res.json();
    const chat = {
      id: uid(),
      title: detail.title || t("default_chat_title"),
      backendConversationId: detail.id,
      createdAt: detail.created_at || new Date().toISOString(),
      updatedAt: detail.updated_at || new Date().toISOString(),
      messages: (detail.messages || [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role,
          ts: m.created_at ? Date.parse(m.created_at) : null,
          content: m.content,
          backendMessageId: m.id || null,
          feedback: null,
          practiceArtifact: m.metadata?.practice_artifact || null,
          assets: m.metadata?.related_assets || [],
        })),
    };
    const existingIndex = state.chats.findIndex((c) => c.backendConversationId === detail.id);
    if (existingIndex >= 0) state.chats.splice(existingIndex, 1);
    staggerNextRender = true;
    state.chats.unshift(chat);
    state.activeChatId = chat.id;
    saveLocalChats();
    renderChatList();
    renderMessages();
    closeConversations();
  } catch (_) { /* silencioso */ }
}

el.settingsBack.addEventListener("click", closeSettings);
el.settingsTheme.addEventListener("click", toggleTheme);
el.openData.addEventListener("click", openData);
el.openLearning?.addEventListener("click", openLearning);
el.learnBack?.addEventListener("click", closeLearning);
el.dataBack.addEventListener("click", closeData);
el.convBack?.addEventListener("click", closeConversations);
el.convSearch?.addEventListener("input", () => {
  if (authToken()) renderConvList(el.convSearch.value);
  else renderLocalChats(el.convSearch.value);
});

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
  } catch (_) { }
}
function notifyResponse() {
  if (!getDataPref("sound")) return;
  playChime();
  try { navigator.vibrate?.(30); } catch (_) { }
}

function getDataPref(key) {
  try {
    const v = localStorage.getItem("Media-data-" + key);
    if (v !== null) return v === "1";
  } catch (_) { }
  return DATA_DEFAULTS[key];
}
function setDataPref(key, on) {
  try { localStorage.setItem("Media-data-" + key, on ? "1" : "0"); } catch (_) { }
}
function initDataToggles() {
  document.querySelectorAll(".setting-row--toggle[data-toggle]").forEach((row) => {
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

// Barra superior: configuración
el.btnSettingsTop?.addEventListener("click", openSettings);
el.btnSettingsRail?.addEventListener("click", openSettings);
el.btnProfileRail?.addEventListener("click", () => {
  if (authToken()) openLearning();
  else openPanel(el.authPanel);
});

// Barra superior: notificaciones y cuenta
el.btnNotif.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu(el.notifMenu, el.btnNotif);
  el.notifBadge.style.display = "none"; // "leídas" al abrir
});
el.btnAccount.addEventListener("click", (e) => {
  e.stopPropagation();
  if (getAuthToken()) {
    toggleMenu(el.accountMenu, el.btnAccount);
  } else {
    closeMenus(null);
    openAuth();
  }
});

el.authSwitchBtn?.addEventListener("click", () => {
  setAuthMode(authMode === "register" ? "login" : "register");
});
el.authBack?.addEventListener("click", closeAuth);
el.btnLogout?.addEventListener("click", () => {
  clearAuthSession();
  closeMenus(null);
});
el.btnAccountLearning?.addEventListener("click", () => {
  closeMenus(null);
  openLearning();
});
el.btnAccountPlans?.addEventListener("click", () => {
  closeMenus(null);
  showPlans();
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
    if (el.authPanel.classList.contains("is-open")) { closeAuth(); return; }
    if (el.conversationsPanel.classList.contains("is-open")) { closeConversations(); return; }
    if (el.dataPanel.classList.contains("is-open")) closeData();
    else if (el.learningPanel.classList.contains("is-open")) closeLearning();
    else if (el.settingsPanel.classList.contains("is-open")) closeSettings();
  }
});

// ---------- Init ----------
initTheme();
initLang();
renderHero();
initDataToggles();
applyBetaPlan();
if (loadLocalChats()) {
  renderChatList();
  renderMessages();
} else {
  createChat();
}
applyI18n();
updateAuthUI();


(async function validateSessionOnStartup() {
  const token = authToken();
  if (!token) return;
  try {
    if (getRefreshToken()) {
      const refreshed = await refreshAuthSession();
      if (!refreshed) {
        clearAuthSession();
        console.warn("[Media] Sesión local expirada. El usuario deberá iniciar sesión de nuevo.");
      }
      return;
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/api/conversations`);
    if (res.status === 401) {
      clearAuthSession();
      console.warn("[Media] Sesión local expirada. El usuario deberá iniciar sesión de nuevo.");
    }
  } catch (_) { }
})();



// Spotlight del rail "Herramientas de estudio": el brillo sigue al cursor
document.getElementById("practiceRail")?.addEventListener("pointermove", (e) => {
  const item = e.target.closest(".rail__item");
  if (!item) return;
  const r = item.getBoundingClientRect();
  item.style.setProperty("--mx", (e.clientX - r.left) + "px");
  item.style.setProperty("--my", (e.clientY - r.top) + "px");
});
