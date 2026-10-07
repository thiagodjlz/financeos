# API e banco na stack local

## Chamadas reais sem token (`http://localhost:8080`)

| Chamada | Status |
|---|---|
| `GET /api/audit` | 401 |
| `GET /api/audit/options` | 401 |
| `PUT /api/audit` | 405 |
| `DELETE /api/audit` | 405 |
| `POST /api/auth/logout` | 401 |
| `POST /api/audit/screen-access` | 401 |
| `POST /api/auth/login` `{"email":"","password":""}` | 400 (nenhum registro gravado) |
| `POST /api/auth/login` e-mail inexistente `verificacao-issue-110@exemplo.invalid` | 401 `{"message":"Credenciais inválidas."}` — bytes `inv 303 241 lidas` (UTF-8 correto) |
| `POST /api/auth/login` `Limitado@FinanceOS.local`, senha errada | 401 |
| `POST /api/auth/login` `owner@financeos.internal`, senha errada | 401 |

## `audit_records` depois das chamadas (psql, somente leitura)

| event_type | user_id | user_name | user_email | user_super_admin |
|---|---|---|---|---|
| LOGIN_FAILED | (nulo) | (nulo) | verificacao-issue-110@exemplo.invalid | f |
| LOGIN_FAILED | f654096e-... | Usuario Limitado | Limitado@FinanceOS.local (como digitado) | f |
| LOGIN_FAILED | ...0099 | System Owner | owner@financeos.internal | t |

Nenhuma linha contem a senha digitada (`ilike '%SenhaQualquer%'` = 0). Os 401 de login gravaram o evento mesmo com o erro.

## Schema

- `flyway_schema_history`: versao 17 "create audit", `success = t`.
- `pg_constraint` de `profile_permissions`: `profile_permissions_screen_check` = `DASHBOARD, TRANSACTIONS, CATEGORIES, USERS, PROFILES, AUDIT, DOCUMENTATION, RELEASE_NOTES`.
- Linhas `AUDIT` em `profile_permissions` (2 perfis): Administrador `t/f/f/f`; Somente Dashboard `f/f/f/f`.
- FKs: so `audit_record_changes_audit_record_id_fkey` (`audit_record_changes` -> `audit_records`, `confdeltype = a` = sem acao, sem cascade). Nenhuma FK de/para `app_users`.
- Checks em `audit_records`/`audit_record_changes`: nenhum (tipo/acao sem lista no banco).

## Varreduras

- Acentuacao do front (`frontend/src`, sem `.md`): vazia. Do backend (`backend/src/main/java`, `*.java`): vazia. Cor literal em `*.scss` de `frontend/src/app`: vazia.

## Suite

- `backend/target/surefire-reports`: 219 testes, 0 falhas/erros/ignorados (relatorios 21:25-21:26; ultimo arquivo da feature alterado as 21:22:55).
