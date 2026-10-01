# MEDIA Performance Report

## 1. Arquitectura original del request

Flujo observado de `/api/chat` antes de esta fase:

1. Autenticacion Supabase.
2. Carga/creacion de conversacion.
3. Guardado del mensaje del usuario.
4. Carga de mensajes recientes.
5. Carga de perfil/memoria educativa.
6. RAG medico.
7. Contexto de proyecto.
8. Construccion del prompt.
9. Llamada Groq.
10. Verificacion local.
11. Guardado del mensaje del asistente.
12. Registro de evento de aprendizaje.

## 2. Cuellos de botella encontrados

- `LOAD_CONVERSATION` cargaba la conversacion completa en la ruta de chat aunque despues se pedian mensajes recientes aparte.
- `SAVE_USER_MESSAGE` hacia `INSERT` + `PATCH conversations` y `SAVE_MESSAGE` repetia el mismo patron.
- `LOAD_RECENT_MESSAGES`, `SAVE_USER_MESSAGE` y `LOAD_USER_MEMORY` se ejecutaban secuencialmente aunque no dependian entre si.
- `UPDATE_MEMORY_LEARNING_EVENT` bloqueaba la respuesta aunque ocurre despues de generar/guardar la respuesta.
- `SupabaseRepository` creaba un `httpx.AsyncClient` nuevo en cada request REST.
- El RAG hace busqueda textual `ILIKE` sobre `medical_chunks.content/section/subsection`; faltaban indices especificos para ese patron.
- El fallback local del RAG recalculaba tokens sobre miles de chunks.

## 3. Cambios implementados

- Reutilizacion de `SupabaseRepository` y del `AIOrchestrator` como singletons de proceso.
- Reutilizacion de `httpx.AsyncClient` dentro de `SupabaseRepository`.
- Nueva ruta interna `get_conversation_header()` para `/api/chat`, evitando cargar todos los mensajes.
- Paralelizacion de guardado del usuario, mensajes recientes y memoria con `asyncio.gather`.
- El mensaje del usuario se inserta sin `PATCH` redundante en el camino exitoso; si hay error antes de responder, se toca la conversacion antes de relanzar.
- El evento de aprendizaje posterior se ejecuta en background con logging de exito/error.
- Candidate limit RAG por defecto: `MEDICAL_RETRIEVAL_CANDIDATE_LIMIT=200`.
- Cache compartido del indice local del RAG fallback.
- Nuevo benchmark reproducible: `backend/scripts/benchmark_chat.py`.
- Nueva migracion no destructiva: `backend/migrations/002_performance_indexes.sql`.

## 4. Por que se eligio cada optimizacion

- Menos round trips Supabase reduce latencia sin cambiar respuesta medica.
- Paralelizar lecturas/escrituras independientes reduce camino critico sin cambiar datos requeridos.
- Background learning conserva memoria educativa pero no bloquea al usuario.
- Indices trigram corresponden al `ILIKE '%term%'` real del RAG actual.
- Candidate limit 200 reduce transferencia/procesamiento manteniendo margen sobre `top_k` maximo actual de 10.

## 5. Alternativas evaluadas pero descartadas

- Desactivar RAG: descartado por seguridad medica.
- Desactivar RLS: descartado por seguridad.
- Streaming completo SSE: pendiente; requiere contrato nuevo para persistir respuesta al cerrar stream sin romper frontend.
- Cambiar modelos/routing agresivamente: descartado en esta fase para no afectar calidad.

## 6. Queries optimizadas

- Conversacion en chat: ahora selecciona solo `id,user_id,title,archived,metadata,created_at,updated_at`.
- Historial: `list_conversations` evita `select=*`.
- RAG sigue consultando columnas necesarias, sin traer embeddings completos.

## 7. Indices creados

Archivo: `backend/migrations/002_performance_indexes.sql`

- `pg_trgm`.
- GIN trigram sobre `medical_chunks.content`.
- GIN trigram sobre `medical_chunks.section`.
- GIN trigram sobre `medical_chunks.subsection`.
- `medical_documents(verified,status,id)`.
- `messages(user_id,conversation_id,created_at desc)`.
- `messages(conversation_id,created_at desc)`.

No ejecute la migracion contra Supabase desde aqui; debe aplicarse en la base real.

## 8. Cambios de RAG

- Candidate limit default: 800 -> 200.
- Fallback local cacheado por configuracion.
- El log del navegador ahora incluye `load_local_index`.
- Se conserva RAG, fuentes, citas y abstencion.

## 9. Cambios de paralelizacion

Despues de obtener/crear conversacion:

- `SAVE_USER_MESSAGE`
- `LOAD_RECENT_MESSAGES`
- `LOAD_USER_MEMORY`

corren en paralelo dentro de `CHAT_PARALLEL_LOAD`.

## 10. Cambios de streaming

No se implemento streaming real en esta fase. El frontend sigue recibiendo respuesta completa y renderizando por trozos. Motivo: streaming real exige endpoint/contrato nuevo y persistencia robusta al final del stream.

## 11. Cambios Groq

- No se cambiaron modelos.
- No se cambiaron prompts.
- No se cambio reasoning.
- Se conserva medicion Groq existente.

## 12. Metricas ANTES

De logs reales previos:

- TOTAL: 68164 ms
- LOAD_CONVERSATION: 10455 ms
- LOAD_USER_MEMORY: 3880 ms
- RAG_VECTOR_SEARCH: 12074 ms
- SAVE_USER_MESSAGE: 6795 ms
- SAVE_MESSAGE: 3837 ms
- UPDATE_MEMORY_LEARNING: 2180 ms
- GROQ_GENERATION: 27016 ms
- INPUT_TOKENS: 9952
- OUTPUT_TOKENS: 2161
- RETRIES: 1

RAG interno:

- vector_db_query/fetch_chunks: 11473 ms
- processing_results: 598 ms
- candidate_chunks: 800
- final_chunks: 10
- supabase_queries: 1

## 13. Metricas DESPUES

Benchmark real post-cambio queda pendiente hasta ejecutar `backend/scripts/benchmark_chat.py` con un `MEDIA_AUTH_TOKEN` valido.

Validacion automatizada ejecutada:

- `python -m pytest backend/tests -q`
- Resultado: 49 passed in 86.37s

Backend verificado:

- `/api/health`: healthy
- Supabase: healthy
- Groq: healthy
- Cloudflare fallback: healthy

## 14. Comparacion porcentual

No se declara mejora porcentual total sin benchmark post real.

Mejoras esperadas por diseno:

- `UPDATE_MEMORY_LEARNING_EVENT`: sale del camino critico.
- `SAVE_USER_MESSAGE`: elimina un `PATCH conversations` en camino exitoso.
- `LOAD_CONVERSATION`: evita cargar mensajes completos.
- `SAVE_USER_MESSAGE`, `LOAD_RECENT_MESSAGES`, `LOAD_USER_MEMORY`: pasan de suma secuencial a maximo del bloque paralelo.
- RAG: candidate pool 800 -> 200, mas indices pendientes de aplicar.

## 15. TTFT antes/despues

TTFT real sigue pendiente porque no hay streaming real end-to-end. La instrumentacion actual mide Groq no streaming.

## 16. Riesgos pendientes

- Aplicar migracion en Supabase real y medir con EXPLAIN/benchmark.
- Verificar recall medico con candidate limits 30/50/100/200 en preguntas clinicas.
- Streaming real necesita contrato nuevo.
- El fallback local sigue siendo pesado en primer build si Supabase falla.

## 17. Configuracion necesaria

- `MEDICAL_RETRIEVAL_CANDIDATE_LIMIT=200`
- Para benchmark:
  - `MEDIA_API_BASE_URL=http://127.0.0.1:8000`
  - `MEDIA_AUTH_TOKEN=<token local no commitear>`

## 18. Migraciones necesarias

Aplicar:

```sql
backend/migrations/002_performance_indexes.sql
```

## 19. Pruebas ejecutadas

- Suite completa: 49 tests passing.
- Modulos cubiertos por tests existentes: chat/orquestador, RAG, fallback, grounding, conversaciones, herramientas, rutas API, providers.
- Prueba nueva: `create_user_message(..., touch=False)` evita el PATCH redundante.
- Backend levantado y health verificado.

## 20. Recomendaciones futuras

1. Aplicar migracion SQL y correr benchmark A-F con `backend/scripts/benchmark_chat.py`.
2. Medir candidate limits 30/50/100/200 con recall de fuentes.
3. Implementar streaming SSE/Fetch stream con persistencia final robusta.
4. Evaluar RPC Postgres para RAG textual/vectorial despues de ver `EXPLAIN ANALYZE`.
5. Separar trabajos pesados de herramientas educativas en jobs si aparecen en el camino critico.
