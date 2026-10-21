alter table profile_permissions drop constraint profile_permissions_screen_check;
alter table profile_permissions add constraint profile_permissions_screen_check
    check (screen in ('DASHBOARD','TRANSACTIONS','TRANSACTION_REPORTS','CATEGORIES','USERS','PROFILES','AUDIT',
                      'DOCUMENTATION','RELEASE_NOTES'));

insert into profile_permissions (profile_id, screen, can_view, can_create, can_edit, can_delete)
select p.id, 'TRANSACTION_REPORTS', true, true, true, true
from profiles p
on conflict on constraint profile_permissions_profile_screen_uk do nothing;

-- Agrupamentos e colunas ficam como lista separada por virgula, na ordem escolhida: o back-end
-- valida cada codigo antes de gravar e nenhuma consulta filtra por eles.
create table transaction_report_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users(id) on delete cascade,
    name varchar(100) not null,
    is_default boolean not null default false,
    period varchar(20) not null,
    start_date date,
    end_date date,
    type varchar(20),
    status varchar(20),
    source varchar(30),
    min_amount numeric(14, 2),
    max_amount numeric(14, 2),
    installments varchar(20) not null default 'ALL',
    group_by varchar(200) not null default '',
    report_columns varchar(200) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index transaction_report_preferences_user_name_uk
    on transaction_report_preferences (user_id, lower(name));

create unique index transaction_report_preferences_user_default_uk
    on transaction_report_preferences (user_id) where is_default;

-- Categoria excluida sai da preferencia junto (D9 da issue #114): a exclusao de categoria continua
-- bloqueada so por lancamentos.
create table transaction_report_preference_categories (
    preference_id uuid not null references transaction_report_preferences(id) on delete cascade,
    category_id uuid not null references categories(id) on delete cascade,
    primary key (preference_id, category_id)
);
