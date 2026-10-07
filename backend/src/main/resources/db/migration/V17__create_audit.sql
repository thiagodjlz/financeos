-- Sem FK para app_users de proposito: o registro guarda o usuario do momento (id, nome, e-mail) e
-- precisa sobreviver a exclusao da conta. Com FK, ProductionBootstrap.hasRelatedRows passaria a so
-- desativar conta semeada que tivesse auditoria, e um cascade apagaria o historico junto.
-- Tipo de evento e acao ficam sem check: tipo novo entra pelo codigo, sem migration.
create table audit_records (
    id uuid primary key default gen_random_uuid(),
    occurred_at timestamptz not null default now(),
    event_type varchar(40) not null,
    action varchar(30),
    screen varchar(30),
    user_id uuid,
    user_name text,
    user_email text,
    user_super_admin boolean not null default false,
    record_id uuid,
    record_label text
);

create index audit_records_occurred_at_idx on audit_records (occurred_at desc, id desc);

create table audit_record_changes (
    id uuid primary key default gen_random_uuid(),
    audit_record_id uuid not null references audit_records(id),
    position integer not null,
    field_label text not null,
    old_value text,
    new_value text
);

create index audit_record_changes_record_idx on audit_record_changes (audit_record_id, position);

alter table profile_permissions drop constraint profile_permissions_screen_check;
alter table profile_permissions add constraint profile_permissions_screen_check
    check (screen in ('DASHBOARD','TRANSACTIONS','CATEGORIES','USERS','PROFILES','AUDIT','DOCUMENTATION','RELEASE_NOTES'));

insert into profile_permissions (profile_id, screen, can_view, can_create, can_edit, can_delete)
select p.id, 'AUDIT', p.id = '00000000-0000-0000-0000-000000000010', false, false, false
from profiles p
on conflict on constraint profile_permissions_profile_screen_uk do nothing;
