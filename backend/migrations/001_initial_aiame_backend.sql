begin;

create extension if not exists vector;
create extension if not exists pgcrypto;

create type public.message_role as enum ('user', 'assistant', 'system', 'tool');
create type public.effort_level as enum ('low', 'medium', 'high');
create type public.answer_status as enum ('grounded', 'unverified_model_knowledge', 'insufficient_evidence', 'provider_error');
create type public.verification_status as enum ('verified', 'unverified_model_knowledge', 'insufficient_evidence', 'failed');
create type public.document_status as enum ('current', 'historical', 'superseded', 'archived');
create type public.knowledge_request_status as enum ('pending', 'reviewing', 'resolved', 'rejected');
create type public.learning_event_type as enum (
  'topic_viewed',
  'question_asked',
  'repeated_question',
  'correct_answer',
  'incorrect_answer',
  'hint_requested',
  'simplification_requested',
  'explanation_understood',
  'explanation_not_understood',
  'clinical_case_completed',
  'quiz_completed',
  'flashcard_reviewed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  education_level text,
  locale text default 'es',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nuevo chat',
  archived boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  model text,
  effort public.effort_level,
  answer_status public.answer_status,
  verification_status public.verification_status,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  covered_until_message_id uuid references public.messages(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text[],
  organization text,
  specialty text,
  publication_date date,
  version text,
  source_url text,
  pdf_url text,
  pdf_path text,
  verified boolean not null default false,
  status public.document_status not null default 'current',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.medical_documents(id) on delete cascade,
  content text not null,
  embedding vector(1024),
  page_start integer,
  page_end integer,
  section text,
  subsection text,
  chunk_index integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.medical_assets (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.medical_documents(id) on delete cascade,
  asset_type text not null check (asset_type in ('image', 'diagram', 'table', 'figure')),
  page integer,
  section text,
  caption text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.user_learning_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_explanation_style text not null default 'balanced',
  preferred_difficulty text not null default 'intermediate',
  strengths text[] not null default '{}',
  growth_areas text[] not null default '{}',
  recurring_confusions text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_topic_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  subtopic text,
  mastery_score numeric(5,2),
  confidence numeric(5,2),
  evidence_count integer not null default 0,
  last_event_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, topic, subtopic)
);

create table public.user_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  event_type public.learning_event_type not null,
  topic text,
  subtopic text,
  difficulty text,
  score numeric(5,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  original_question text not null,
  normalized_topic text,
  normalized_subtopic text,
  status public.knowledge_request_status not null default 'pending',
  request_count integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clinical_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  topic text,
  difficulty text not null default 'intermediate',
  mode text not null default 'guided',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clinical_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.clinical_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer text,
  evaluation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.generated_quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  topic text,
  difficulty text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.generated_quizzes(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text,
  explanation text,
  citations jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.generated_quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score numeric(5,2),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.flashcard_sets(id) on delete cascade,
  front text not null,
  back text not null,
  difficulty text,
  citations jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  reviewed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.mindmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  type text not null,
  topic text not null,
  graph jsonb not null default '{}'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  rating integer check (rating between 1 and 5),
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index chunks_document_idx on public.medical_chunks(document_id, chunk_index);
create index chunks_embedding_idx on public.medical_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index learning_events_user_created_idx on public.user_learning_events(user_id, created_at desc);
create index knowledge_requests_status_idx on public.knowledge_requests(status, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_touch before update on public.conversations for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger learning_profiles_touch before update on public.user_learning_profiles for each row execute function public.touch_updated_at();
create trigger knowledge_requests_touch before update on public.knowledge_requests for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_summaries enable row level security;
alter table public.medical_documents enable row level security;
alter table public.medical_chunks enable row level security;
alter table public.medical_assets enable row level security;
alter table public.user_learning_profiles enable row level security;
alter table public.user_topic_mastery enable row level security;
alter table public.user_learning_events enable row level security;
alter table public.user_preferences enable row level security;
alter table public.knowledge_requests enable row level security;
alter table public.clinical_sessions enable row level security;
alter table public.clinical_attempts enable row level security;
alter table public.generated_quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.flashcard_sets enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.mindmaps enable row level security;
alter table public.feedback enable row level security;

create policy profiles_owner_all on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy conversations_owner_all on public.conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy messages_owner_all on public.messages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy summaries_owner_all on public.conversation_summaries for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy medical_documents_read_authenticated on public.medical_documents for select to authenticated using (verified = true and status <> 'archived');
create policy medical_chunks_read_authenticated on public.medical_chunks for select to authenticated using (
  exists (
    select 1 from public.medical_documents d
    where d.id = medical_chunks.document_id and d.verified = true and d.status <> 'archived'
  )
);
create policy medical_assets_read_authenticated on public.medical_assets for select to authenticated using (
  exists (
    select 1 from public.medical_documents d
    where d.id = medical_assets.document_id and d.verified = true and d.status <> 'archived'
  )
);

create policy learning_profiles_owner_all on public.user_learning_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy topic_mastery_owner_all on public.user_topic_mastery for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy learning_events_owner_all on public.user_learning_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy preferences_owner_all on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy knowledge_requests_owner_all on public.knowledge_requests for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy clinical_sessions_owner_all on public.clinical_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy clinical_attempts_owner_all on public.clinical_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy quizzes_owner_all on public.generated_quizzes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy quiz_questions_owner_read on public.quiz_questions for select using (
  exists (select 1 from public.generated_quizzes q where q.id = quiz_questions.quiz_id and q.user_id = auth.uid())
);
create policy quiz_attempts_owner_all on public.quiz_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy flashcard_sets_owner_all on public.flashcard_sets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy flashcards_owner_read on public.flashcards for select using (
  exists (select 1 from public.flashcard_sets s where s.id = flashcards.set_id and s.user_id = auth.uid())
);
create policy flashcard_reviews_owner_all on public.flashcard_reviews for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mindmaps_owner_all on public.mindmaps for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy feedback_owner_all on public.feedback for all using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;
