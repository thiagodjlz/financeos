create extension if not exists pgcrypto;

create table app_users (
    id uuid primary key default gen_random_uuid(),
    name varchar(120) not null,
    email varchar(180) not null unique,
    password_hash varchar(255) not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references app_users(id) on delete cascade,
    parent_id uuid references categories(id) on delete set null,
    name varchar(120) not null,
    type varchar(20) not null check (type in ('INCOME', 'EXPENSE')),
    color varchar(20),
    icon varchar(80),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint categories_user_parent_name_type_uk unique (user_id, parent_id, name, type)
);

create table accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users(id) on delete cascade,
    name varchar(120) not null,
    type varchar(30) not null check (type in ('CHECKING', 'SAVINGS', 'WALLET', 'INVESTMENT', 'OTHER')),
    initial_balance numeric(14, 2) not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint accounts_user_name_uk unique (user_id, name)
);

create table cards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users(id) on delete cascade,
    account_id uuid references accounts(id) on delete set null,
    name varchar(120) not null,
    brand varchar(60),
    credit_limit numeric(14, 2),
    closing_day smallint check (closing_day between 1 and 31),
    due_day smallint check (due_day between 1 and 31),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cards_user_name_uk unique (user_id, name)
);

create table transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users(id) on delete cascade,
    category_id uuid references categories(id) on delete set null,
    account_id uuid references accounts(id) on delete set null,
    card_id uuid references cards(id) on delete set null,
    transaction_date date not null,
    description varchar(255) not null,
    amount numeric(14, 2) not null check (amount >= 0),
    type varchar(20) not null check (type in ('INCOME', 'EXPENSE')),
    status varchar(20) not null default 'PENDING' check (status in ('PENDING', 'PAID', 'CANCELED')),
    source varchar(30) not null default 'MANUAL' check (source in ('MANUAL', 'EXCEL_IMPORT', 'RECURRENCE')),
    installment_number integer,
    installment_total integer,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users(id) on delete cascade,
    name varchar(160) not null,
    target_amount numeric(14, 2) not null check (target_amount >= 0),
    current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
    monthly_contribution numeric(14, 2) default 0 check (monthly_contribution >= 0),
    due_date date,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table planning_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users(id) on delete cascade,
    category_id uuid references categories(id) on delete set null,
    title varchar(180) not null,
    planned_for date,
    estimated_amount numeric(14, 2) check (estimated_amount >= 0),
    status varchar(20) not null default 'PLANNED' check (status in ('PLANNED', 'DONE', 'DISCARDED')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table import_batches (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references app_users(id) on delete set null,
    file_name varchar(255) not null,
    status varchar(20) not null default 'PENDING' check (status in ('PENDING', 'IMPORTED', 'FAILED')),
    imported_rows integer not null default 0,
    error_message text,
    created_at timestamptz not null default now(),
    finished_at timestamptz
);

create table import_rows (
    id uuid primary key default gen_random_uuid(),
    import_batch_id uuid not null references import_batches(id) on delete cascade,
    transaction_id uuid references transactions(id) on delete set null,
    sheet_name varchar(120) not null,
    row_number integer not null,
    column_name varchar(120),
    raw_month varchar(40),
    raw_value varchar(80),
    status varchar(20) not null default 'PENDING' check (status in ('PENDING', 'IMPORTED', 'SKIPPED', 'FAILED')),
    error_message text,
    created_at timestamptz not null default now()
);

create index transactions_user_date_idx on transactions(user_id, transaction_date);
create index transactions_user_type_status_idx on transactions(user_id, type, status);
create index transactions_category_idx on transactions(category_id);
create index planning_items_user_status_idx on planning_items(user_id, status);
create index import_rows_batch_idx on import_rows(import_batch_id);
