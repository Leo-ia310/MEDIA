# AIAME · Tutor medico IA

Interfaz web tipo chat IA con backend FastAPI, Supabase, Groq como proveedor principal de IA, Cloudflare Workers AI como fallback de texto, Gemini para imagenes, memoria educativa, RAG preparado y controles anti-alucinacion.

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
│   ├── scripts/      # Tareas operativas como ingesta de referencias
│   ├── .env.example  # Variables sin secretos
│   └── requirements.txt
├── Referencias/      # PDFs medicos y MDs preparados para RAG
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
python -m http.server 5500
```

Abrir `http://127.0.0.1:5500`.

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

GROQ_API_KEY=
GROQ_LOW_MODEL=openai/gpt-oss-20b
GROQ_MEDIUM_MODEL=qwen/qwen3.8-27b
GROQ_HIGH_MODEL=openai/gpt-oss-120b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
GROQ_TIMEOUT_SECONDS=35

GEMINI_API_KEY=
GEMINI_IMAGE_MODEL=gemini-3.1-flash-lite-image
GEMINI_IMAGE_QUALITY_MODEL=gemini-3.1-flash-image

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_AI_MODEL=@cf/qwen/qwen3.8-27b
AI_EMBEDDING_MODEL=@cf/qwen/qwen3-embedding-0.6b

RESEND_API_KEY=
STRICT_DOCUMENT_GROUNDING=
APP_ENV=
LOG_LEVEL=
BACKEND_CORS_ORIGINS=
REQUEST_TIMEOUT_SECONDS=
OBSIDIAN_RETRIEVAL_ENABLED=
OBSIDIAN_VAULT_PATH=
OBSIDIAN_MEMORY_SUBDIRS=
PROJECT_CONTEXT_TOP_K=
MEDICAL_RETRIEVAL_CANDIDATE_LIMIT=
REFERENCES_DIR=
REFERENCE_MARKDOWN_DIR=
BACKEND_PUBLIC_BASE_URL=
```


Para el entorno local actual, la memoria rapida del proyecto se lee desde:

```env
OBSIDIAN_VAULT_PATH=C:\Users\Maykel\Music\Maikel Main
OBSIDIAN_MEMORY_SUBDIRS=proyectos/media
```

Esta memoria local usa notas Markdown de Obsidian como contexto de negocio/proyecto. No es base de datos, no genera citas y no puede marcar respuestas medicas como verificadas. La base de datos real y el RAG medico viven en Supabase/Postgres con `medical_documents`, `medical_chunks` y `pgvector`.

Los documentos medicos locales se colocan en `Referencias/`: los PDFs van en esa carpeta y los Markdown preparados para RAG en `Referencias/MDs`. Para cargarlos a Supabase:

```bash
python backend/scripts/ingest_references.py --dry-run
python backend/scripts/ingest_references.py --apply
```

La ingesta usa `SUPABASE_SECRET_KEY`, actualiza el documento si ya existe por `pdf_path`, elimina solo los chunks antiguos de ese documento y vuelve a insertar los chunks nuevos. Los PDFs quedan servidos por el backend en `GET /references/<archivo.pdf>` y las citas usan `BACKEND_PUBLIC_BASE_URL` para que el frontend pueda abrirlos o descargarlos.

Las herramientas educativas expuestas en el rail derecho llaman al backend:

- `POST /api/tools/presentation`
- `POST /api/tools/mindmap`
- `POST /api/tools/quiz`
- `POST /api/tools/flashcards`
- `POST /api/tools/report`
- `POST /api/tools/image`

Las presentaciones pueden preparar prompts visuales para Gemini. Los mapas mentales se entregan como JSON estructurado, no como imagen generativa. Para probar imagenes generadas:

```bash
curl -X POST http://127.0.0.1:8000/api/tools/image \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"Infografia educativa del ciclo cardiaco\",\"quality\":\"fast\",\"aspect_ratio\":\"1:1\"}"
```


## Arquitectura de IA

Media usa una capa centralizada de proveedores:

```text
Media Backend
↓
AIProviderRouter
├── GroqProvider principal
│   ├── LOW    openai/gpt-oss-20b       reasoning_effort=low
│   ├── MEDIUM qwen/qwen3.8-27b         reasoning_effort=medium
│   ├── HIGH   openai/gpt-oss-120b      reasoning_effort=high
│   └── Vision qwen/qwen3.8-27b         reasoning_effort segun effort
├── CloudflareProvider fallback de texto
│   └── CLOUDFLARE_AI_MODEL
└── GeminiImageProvider solo para imagenes generadas
    ├── fast    gemini-3.1-flash-lite-image
    └── quality gemini-3.1-flash-image
```

Groq es el proveedor principal para chat, razonamiento y vision. Cloudflare queda como fallback de texto cuando Groq falla por timeout, 429, 5xx o indisponibilidad del modelo/proveedor. No se hace fallback en errores de autenticacion, validacion o problemas atribuibles al request.

Gemini no se usa para chat medico normal. Solo se usa para recursos visuales generados mediante `POST /api/tools/image`. Estas imagenes se marcan como `generated_visual`, separadas de `source_medical_asset` proveniente de PDFs.

Los mapas mentales, mapas conceptuales, cuadros sinópticos y diagramas de relaciones no usan imagen generativa. Se devuelven como JSON estructurado validado para render SVG/HTML en el frontend y futura exportacion PNG/PDF.

## Supabase

Aplicar en Supabase SQL Editor:

```text
backend/migrations/001_initial_aiame_backend.sql
```

Incluye `pgvector`, tablas de conversaciones, mensajes, perfil educativo, documentos medicos, chunks, solicitudes de conocimiento, casos clinicos, quizzes, flashcards, mindmaps, feedback, indices y RLS.

## Groq, Cloudflare y Gemini

Para probar Groq configura `GROQ_API_KEY` y llama a `POST /api/chat` con un Bearer token de Supabase. El backend decide el effort efectivo automaticamente y registra `requested_effort`, `effective_effort`, `primary_provider`, `fallback_used`, `fallback_reason` y latencia en metadata.

Para probar fallback, configura Cloudflare y deja temporalmente un modelo Groq invalido en `GROQ_HIGH_MODEL`; ante indisponibilidad de proveedor/modelo el backend respondera con `CLOUDFLARE_AI_MODEL` sin exponer el error tecnico al frontend.

Cloudflare tambien conserva el modelo de embeddings `AI_EMBEDDING_MODEL` para la arquitectura RAG/pgvector.

El backend no inventa citas. Solo los chunks medicos recuperados desde Supabase pueden convertirse en citas. Con `STRICT_DOCUMENT_GROUNDING=false`, respuestas sin documentos medicos se marcan como `unverified_model_knowledge`. Con `STRICT_DOCUMENT_GROUNDING=true` y RAG medico vacio, responde `insufficient_evidence`.

## Tests

```bash
cd backend
pytest
```

## Diagnostico rapido

Si el frontend muestra `Hubo un error de red al conectar con el backend`, revisar primero:

1. Que `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` este corriendo en `backend/`.
2. Que `GET http://127.0.0.1:8000/api/health` responda.
3. Que el frontend este servido desde `http://127.0.0.1:5500` o un origen incluido en `BACKEND_CORS_ORIGINS`.
