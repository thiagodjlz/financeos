# Relatorio de reinicio do Docker

## Status

REINICIADA COM SUCESSO

## Detalhes

### Containers verificados

Todos os containers FinanceOS foram recriados e estão rodando corretamente:

- **financeos-backend**: Up 4 seconds (recreado)
- **financeos-frontend**: Up 4 seconds (recreado)
- **financeos-postgres**: Up 2 hours (mantido, sem alterações de dados)

### Build e startup

O build dos containers foi bem-sucedido:
- Frontend: Bundle gerado sem erros (`npm run build` concluído)
- Backend: Jar do Quarkus compilado e empacotado sem erros

### Logs de startup do backend

Flyway executado com sucesso:
```
2026-07-10 02:15:57,455 INFO  [org.flywaydb.core.FlywayExecutor] (main) Database: jdbc:postgresql://postgres:5432/financeos (PostgreSQL 16.14)
2026-07-10 02:15:57,523 INFO  [org.flywaydb.core.internal.command.DbValidate] (main) Successfully validated 9 migrations (execution time 00:00.030s)
2026-07-10 02:15:57,558 INFO  [org.flywaydb.core.internal.command.DbMigrate] (main) Current version of schema "public": 9
2026-07-10 02:15:57,561 INFO  [org.flywaydb.core.internal.command.DbMigrate] (main) Schema "public" is up to date. No migration necessary.
```

Servidor iniciado com sucesso:
```
2026-07-10 02:15:58,138 INFO  [io.quarkus] (main) financeos-backend 1.0.0 on JVM (powered by Quarkus 3.37.0) started in 3.383s. Listening on: http://0.0.0.0:8080
```

Nenhum erro encontrado nos logs de startup.

### Conclusão

A stack foi reiniciada com sucesso. O codigo da feature 24 (mensagem de inconsistencia de usuarios) esta agora ativo na imagem atualizada, pronto para validacao.
