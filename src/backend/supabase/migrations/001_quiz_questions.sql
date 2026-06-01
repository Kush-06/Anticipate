create table quiz_questions (
  id             text    not null,
  topic_id       text    not null,
  subtopic_id    text,               -- NULL = topic-level quiz question
  question       text    not null,
  options        text[]  not null,
  correct_answer integer not null,
  explanation    text    not null,
  sort_order     integer not null default 0,
  primary key (id)
);

alter table quiz_questions enable row level security;

create policy "quiz_questions_public_read" on quiz_questions
  for select using (true);
