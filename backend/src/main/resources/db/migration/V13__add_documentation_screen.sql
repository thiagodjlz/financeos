alter table profile_permissions drop constraint profile_permissions_screen_check;
alter table profile_permissions add constraint profile_permissions_screen_check
    check (screen in ('DASHBOARD','TRANSACTIONS','CATEGORIES','USERS','PROFILES','DOCUMENTATION'));

insert into profile_permissions (profile_id, screen, can_view, can_create, can_edit, can_delete)
select p.id, 'DOCUMENTATION', true, false, false, false
from profiles p
on conflict on constraint profile_permissions_profile_screen_uk do nothing;
