-- Supabase performance advisor: foreign keys without covering index.
-- Hozircha ma'lumot kam bo'lgani uchun sezilarli farq bermaydi, lekin
-- sessiyalar soni o'sgani sayin muhim bo'ladi.

create index if not exists answers_question_id_idx on answers (question_id);
create index if not exists sessions_questionnaire_id_idx on sessions (questionnaire_id);
create index if not exists sessions_respondent_id_idx on sessions (respondent_id);
