create extension if not exists pg_trgm;

create index if not exists medical_chunks_content_trgm_idx
  on public.medical_chunks using gin (content gin_trgm_ops);

create index if not exists medical_chunks_section_trgm_idx
  on public.medical_chunks using gin (section gin_trgm_ops);

create index if not exists medical_chunks_subsection_trgm_idx
  on public.medical_chunks using gin (subsection gin_trgm_ops);

create index if not exists medical_documents_verified_status_id_idx
  on public.medical_documents (verified, status, id);

create index if not exists messages_user_conversation_created_desc_idx
  on public.messages (user_id, conversation_id, created_at desc);

create index if not exists messages_conversation_created_desc_idx
  on public.messages (conversation_id, created_at desc);
