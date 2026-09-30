users
מייצגת משתמש במערכת.
id                UUID PK
external_auth_id  VARCHAR UNIQUE
email             VARCHAR
name              VARCHAR
role              VARCHAR        // user | admin
status            VARCHAR        // active | disabled
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
last_login_at     TIMESTAMPTZ

external_auth_id יהיה המזהה היציב שתקבל משכבת ה-Azure Auth.

specs
כל אפיון שהמשתמש עובד עליו.
id              UUID PK
user_id         UUID FK -> users.id
title           VARCHAR
data            JSONB          // טיוטת ה-wizard
schema_version  INTEGER
final_markdown  TEXT NULL
final_at        TIMESTAMPTZ NULL
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

data = הטיוטה שה-wizard טוען: { admin, business, workflows, blocks, wizard }.
לא פלט compileSpec — הוא נבנה מחדש בכניסה לשלב 4.
אפיון הושלם = final_at לא null. final חדש דורס את הקודם.

chat_sessions
שיחה עם Claude ששייכת לאפיון.
id              UUID PK
spec_id         UUID FK -> specs.id ON DELETE CASCADE
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
completed_at    TIMESTAMPTZ NULL

הבעלים נגזר מ-specs.user_id.
שיחה הסתיימה = completed_at מוגדר (כשה-final נשמר).
כרגע שיחה פתוחה אחת לכל אפיון; הטבלה מאפשרת יותר בעתיד.

chat_messages
ההודעות עצמן בתוך השיחה.
id              UUID PK
session_id      UUID FK -> chat_sessions.id ON DELETE CASCADE
role            VARCHAR        // user | assistant
content         TEXT
message_order   INTEGER
created_at      TIMESTAMPTZ

UNIQUE (session_id, message_order)
השרת הוא מקור ההיסטוריה; לא סומכים על history מהלקוח.
האפיון הסופי נשמר ב-specs.final_markdown, לא כהודעה.

ai_usage
מידע טכני על כל request/turn מול Claude.
id                  UUID PK
user_id             UUID FK -> users.id
spec_id             UUID NULL FK -> specs.id ON DELETE SET NULL
session_id          UUID NULL FK -> chat_sessions.id ON DELETE SET NULL

model               VARCHAR
request_id          VARCHAR
message_id          VARCHAR

input_tokens        INTEGER
output_tokens       INTEGER
cache_create_tokens INTEGER
cache_read_tokens   INTEGER
thinking_tokens     INTEGER
usage               JSONB          // אובייקט usage גולמי מ-Anthropic

duration_ms         INTEGER
stop_reason         VARCHAR

created_at          TIMESTAMPTZ

user_id נשמר תמיד, כך שנתוני השימוש שורדים מחיקת אפיון.
