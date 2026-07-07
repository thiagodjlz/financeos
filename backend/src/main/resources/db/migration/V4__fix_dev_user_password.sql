-- Dev login: dev@financeos.local / financeos_dev_2026
update app_users
set password_hash = '$2a$10$l5OKDGieP4jtCxl4.uzGiuM2UedliE9LLi0StnlJKOU3.4sUcrwyW'
where email = 'dev@financeos.local';
