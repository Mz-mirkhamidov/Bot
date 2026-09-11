-- Bot orqali chatda to'g'ridan-to'g'ri javob berish uchun.
-- Vercel serverless funksiyalari xotirada holat saqlay olmaydi, shuning
-- uchun qaysi Telegram chat qaysi sessiyaga tegishli ekanligi bazada
-- saqlanadi. /start <token> bosilganda shu ustun to'ldiriladi.

alter table sessions add column telegram_chat_id bigint;
create index sessions_telegram_chat_id_idx on sessions (telegram_chat_id) where telegram_chat_id is not null;
