-- Rotaciona a senha do usuario de desenvolvimento. A senha anterior foi publicada
-- em texto puro no repositorio (README e comentario da V4) e passa a ser invalida.
-- A nova senha nao esta em lugar nenhum do repositorio: aqui vai so o hash bcrypt.
-- Para definir uma senha propria numa instalacao nova, ver secao "Autenticacao e
-- controle de acesso" do README.md.
update app_users
set password_hash = '$2a$10$fYofAmJbbdFeFRyOt/mnJ.2zWy0v3JAdlB44SUZYz5rkqu8WrhOqO',
    updated_at = now()
where email = 'dev@financeos.local';
