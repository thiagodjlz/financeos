insert into app_users (id, name, email, password_hash)
values (
    '00000000-0000-0000-0000-000000000001',
    'FinanceOS Dev',
    'dev@financeos.local',
    'dev-only-password-hash'
)
on conflict (email) do nothing;
