package br.com.financeos.bootstrap;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import br.com.financeos.users.AppUser;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class ProductionBootstrap {

    public static final String PRODUCTION = "production";

    private static final int MIN_ADMIN_PASSWORD_LENGTH = 12;
    private static final String ADMIN_NAME = "Administrator";
    private static final String DEFAULT_PRIVATE_KEY_LOCATION = "privateKey.pem";
    private static final String DEFAULT_PUBLIC_KEY_LOCATION = "publicKey.pem";

    // Hashes bcrypt semeados pelas migrations V3/V6/V10. O repositorio e publico, entao
    // qualquer conta que ainda carregue um destes tem a senha exposta a ataque offline.
    private static final Set<String> SEEDED_PASSWORD_HASHES = Set.of(
            "$2a$10$l5OKDGieP4jtCxl4.uzGiuM2UedliE9LLi0StnlJKOU3.4sUcrwyW",
            "$2a$10$XkNvynD0Tr39JcSNBBMwjOXy6DZJZOdQ4LBFpAAC9yCqwHFWmWtBm",
            "$2a$10$fYofAmJbbdFeFRyOt/mnJ.2zWy0v3JAdlB44SUZYz5rkqu8WrhOqO");

    // Identificador simples do catalogo do Postgres: o unico formato que a checagem de
    // dados vinculados aceita concatenar na query nativa.
    private static final Pattern SQL_IDENTIFIER = Pattern.compile("[a-z_][a-z0-9_]*");

    private static final String FOREIGN_KEYS_TO_USERS = """
            select distinct kcu.table_name, kcu.column_name
            from information_schema.table_constraints tc
            join information_schema.key_column_usage kcu
              on kcu.constraint_name = tc.constraint_name
             and kcu.constraint_schema = tc.constraint_schema
            join information_schema.constraint_column_usage ccu
              on ccu.constraint_name = tc.constraint_name
             and ccu.constraint_schema = tc.constraint_schema
            where tc.constraint_type = 'FOREIGN KEY'
              and ccu.table_name = 'app_users'
              and tc.table_schema = current_schema()
            """;

    private static final Logger LOG = Logger.getLogger(ProductionBootstrap.class);

    private final AppUserRepository repository;
    private final String deployment;
    private final Optional<String> adminEmail;
    private final Optional<String> adminPassword;
    private final String privateKeyLocation;
    private final String publicKeyLocation;

    public ProductionBootstrap(
            AppUserRepository repository,
            @ConfigProperty(name = "financeos.deployment") String deployment,
            @ConfigProperty(name = "financeos.admin.email") Optional<String> adminEmail,
            @ConfigProperty(name = "financeos.admin.password") Optional<String> adminPassword,
            @ConfigProperty(name = "smallrye.jwt.sign.key.location") String privateKeyLocation,
            @ConfigProperty(name = "mp.jwt.verify.publickey.location") String publicKeyLocation) {
        this.repository = repository;
        this.deployment = deployment;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.privateKeyLocation = privateKeyLocation;
        this.publicKeyLocation = publicKeyLocation;
    }

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (!isProduction()) {
            return;
        }

        requireDedicatedSigningKeys();

        String email = requiredAdminEmail();
        String password = requiredAdminPassword();

        upsertAdmin(email, password);
        purgeSeededAccounts(email);
    }

    public boolean isProduction() {
        return PRODUCTION.equalsIgnoreCase(deployment.trim());
    }

    private void requireDedicatedSigningKeys() {
        requireKeyOutsideRepository("JWT_PRIVATE_KEY_LOCATION", privateKeyLocation, DEFAULT_PRIVATE_KEY_LOCATION);
        requireKeyOutsideRepository("JWT_PUBLIC_KEY_LOCATION", publicKeyLocation, DEFAULT_PUBLIC_KEY_LOCATION);
    }

    private void requireKeyOutsideRepository(String variable, String location, String repositoryDefault) {
        if (location == null || location.isBlank() || repositoryDefault.equals(location.trim())) {
            throw new IllegalStateException(
                    "Ambiente de produção: defina " + variable + " apontando para uma chave RSA própria."
                            + " A chave do classpath é a do build local e não deve assinar tokens em produção.");
        }

        Path file = Path.of(location.trim().replaceFirst("^file:", ""));
        if (!Files.isReadable(file)) {
            throw new IllegalStateException(
                    "Ambiente de produção: a chave indicada em " + variable + " não existe ou não pode ser lida ("
                            + file + ").");
        }
    }

    private String requiredAdminEmail() {
        String email = adminEmail.map(String::trim).map(String::toLowerCase).orElse("");
        if (email.isBlank()) {
            throw new IllegalStateException(
                    "Ambiente de produção: defina FINANCEOS_ADMIN_EMAIL com o e-mail do administrador do sistema.");
        }
        return email;
    }

    private String requiredAdminPassword() {
        String password = adminPassword.orElse("");
        if (password.isBlank()) {
            throw new IllegalStateException(
                    "Ambiente de produção: defina FINANCEOS_ADMIN_PASSWORD com a senha do administrador do sistema.");
        }
        if (password.length() < MIN_ADMIN_PASSWORD_LENGTH) {
            throw new IllegalStateException(
                    "Ambiente de produção: FINANCEOS_ADMIN_PASSWORD precisa ter pelo menos "
                            + MIN_ADMIN_PASSWORD_LENGTH + " caracteres.");
        }
        return password;
    }

    private void upsertAdmin(String email, String password) {
        Optional<AppUser> existing = repository.findByEmail(email);
        AppUser admin = existing.orElseGet(AppUser::new);

        admin.name = ADMIN_NAME;
        admin.email = email;
        admin.passwordHash = BcryptUtil.bcryptHash(password);
        admin.superAdmin = true;
        admin.active = true;

        if (existing.isEmpty()) {
            repository.persist(admin);
            LOG.infof("Administrador de produção criado: %s", email);
        }
    }

    private void purgeSeededAccounts(String adminEmail) {
        List<AppUser> exposed = repository.list("passwordHash in ?1 and email <> ?2",
                SEEDED_PASSWORD_HASHES, adminEmail);

        for (AppUser user : exposed) {
            if (hasRelatedRows(user.id)) {
                user.passwordHash = BcryptUtil.bcryptHash(UUID.randomUUID().toString());
                user.active = false;
                LOG.warnf("Conta semeada desativada em produção (senha publicada no repositório,"
                        + " mantida porque tem dados vinculados): %s", user.email);
            } else {
                repository.delete(user);
                LOG.warnf("Conta semeada removida em produção (senha publicada no repositório,"
                        + " sem dados vinculados): %s", user.email);
            }
        }
    }

    // Toda FK para app_users é `on delete cascade` ou `set null`, então remover a conta
    // levaria junto o que estivesse pendurado nela. As tabelas saem do catálogo, e não de uma
    // lista fixa aqui, para que uma migration futura não abra esse buraco silenciosamente.
    private boolean hasRelatedRows(UUID userId) {
        for (Object[] foreignKey : foreignKeysToUsers()) {
            String table = String.valueOf(foreignKey[0]);
            String column = String.valueOf(foreignKey[1]);

            if (!SQL_IDENTIFIER.matcher(table).matches() || !SQL_IDENTIFIER.matcher(column).matches()) {
                LOG.warnf("Referência a app_users em formato inesperado (%s.%s):"
                        + " a conta semeada será apenas desativada.", table, column);
                return true;
            }

            boolean found = !repository.getEntityManager()
                    .createNativeQuery("select 1 from " + table + " where " + column + " = ?1")
                    .setParameter(1, userId)
                    .setMaxResults(1)
                    .getResultList()
                    .isEmpty();

            if (found) {
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> foreignKeysToUsers() {
        return repository.getEntityManager()
                .createNativeQuery(FOREIGN_KEYS_TO_USERS)
                .getResultList();
    }
}
