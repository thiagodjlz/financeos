insert into profiles (id, name)
values ('00000000-0000-0000-0000-000000000010', 'Administrador');

insert into profile_permissions (profile_id, screen, can_view, can_create, can_edit, can_delete)
select '00000000-0000-0000-0000-000000000010', screen, true, true, true, true
from unnest(array['DASHBOARD','TRANSACTIONS','CATEGORIES','ACCOUNTS','CARDS','USERS','PROFILES']) as screen;

update app_users
set profile_id = '00000000-0000-0000-0000-000000000010'
where email = 'dev@financeos.local';

-- Usuario oculto de bootstrap (super_admin): nao aparece na tela de Usuarios e tem acesso total
-- independente de perfil. Credenciais informadas fora do repositorio.
insert into app_users (id, name, email, password_hash, super_admin)
values (
    '00000000-0000-0000-0000-000000000099',
    'System Owner',
    'owner@financeos.internal',
    '$2a$10$XkNvynD0Tr39JcSNBBMwjOXy6DZJZOdQ4LBFpAAC9yCqwHFWmWtBm',
    true
)
on conflict (email) do nothing;
