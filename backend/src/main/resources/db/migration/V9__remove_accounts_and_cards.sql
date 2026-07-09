delete from profile_permissions where screen in ('ACCOUNTS', 'CARDS');

alter table profile_permissions drop constraint profile_permissions_screen_check;
alter table profile_permissions add constraint profile_permissions_screen_check
    check (screen in ('DASHBOARD','TRANSACTIONS','CATEGORIES','USERS','PROFILES'));

drop table cards;
drop table accounts;
