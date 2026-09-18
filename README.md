# AIAME · Tutor medico IA

Interfaz web tipo chat IA con una base backend FastAPI para Supabase, Cloudflare Workers AI, memoria educativa, RAG preparado y controles anti-alucinacion.

## Estructura

```
AIAME/
├── index.html        # Frontend estatico existente
├── styles.css        # Estilos existentes
├── app.js            # UI de chat; login basico y llamada a /api/chat con Bearer token
├── backend/
│   ├── app/          # FastAPI, servicios, IA, Supabase
│   ├── migrations/   # SQL reproducible para Supabase/Postgres
│   ├── tests/        # Pruebas criticas
│   ├── .env.example  # Variables sin secretos
│   └── requirements.txt
├── assets/
│   └── logo.svg
└── README.md
```

## Ejecutar backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

El health check queda en:

```text
GET http://127.0.0.1:8000/api/health
```

## Ejecutar frontend

El frontend puede servirse desde la raiz:

```bash
python -m http.server 5173
```

El menu de cuenta incluye registro e inicio de sesion basicos con email/password mediante:

```text
POST /api/auth/register
POST /api/auth/login
```

Al autenticarse, el frontend guarda el access token en `localStorage` y llama a:

```text
POST /api/chat
```

## Variables de entorno

Copiar `backend/.env.example` a `.env` en la raiz del repo o a `backend/.env`.
No colocar secretos en archivos versionados.

Variables esperadas:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
AI_MODEL_LOW=
AI_MODEL_MEDIUM=
AI_MODEL_HIGH=
AI_EMBEDDING_MODEL=
STRICT_DOCUMENT_GROUNDING=
APP_ENV=
LOG_LEVEL=
BACKEND_CORS_ORIGINS=
REQUEST_TIMEOUT_SECONDS=
```

## Supabase

Aplicar en Supabase SQL Editor:

```text
backend/migrations/001_initial_aiame_backend.sql
```

Incluye `pgvector`, tablas de conversaciones, mensajes, perfil educativo, documentos medicos, chunks, solicitudes de conocimiento, casos clinicos, quizzes, flashcards, mindmaps, feedback, indices y RLS.

## Cloudflare Workers AI

Modelos configurados por defecto:

```env
AI_MODEL_LOW=@cf/zai-org/glm-4.7-flash
AI_MODEL_MEDIUM=@cf/qwen/qwen3.8-27b
AI_MODEL_HIGH=@cf/qwen/qwen3.8-27b
AI_EMBEDDING_MODEL=@cf/qwen/qwen3-embedding-0.6b
```

El backend no inventa citas. Con `STRICT_DOCUMENT_GROUNDING=false`, respuestas sin documentos se marcan como `unverified_model_knowledge`. Con `STRICT_DOCUMENT_GROUNDING=true` y RAG vacio, responde `insufficient_evidence`.

## Tests

```bash
cd backend
pytest
```
