create table profiles (
    id uuid primary key default gen_random_uuid(),
    name varchar(120) not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table profile_permissions (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references profiles(id) on delete cascade,
    screen varchar(30) not null check (screen in ('DASHBOARD','TRANSACTIONS','CATEGORIES','ACCOUNTS','CARDS','USERS','PROFILES')),
    can_view boolean not null default false,
    can_create boolean not null default false,
    can_edit boolean not null default false,
    can_delete boolean not null default false,
    constraint profile_permissions_profile_screen_uk unique (profile_id, screen)
);

alter table app_users add column profile_id uuid references profiles(id);
alter table app_users add column super_admin boolean not null default false;
