package br.com.financeos.audit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;

// Garante o mecanismo transversal: endpoint de escrita novo sem @Audited quebra a suíte. As exceções
// são os endpoints que gravam evento (e não Alteração) pelo AuditWriter.
class AuditCoverageTest {

    private static final Path CLASSES = Path.of("target", "classes");

    private static final Set<String> EVENT_ENDPOINTS = Set.of(
            "AuthResource.login",
            "AuthResource.logout",
            "AuditResource.screenAccess");

    private static final List<Class<? extends Annotation>> WRITE_METHODS =
            List.of(POST.class, PUT.class, DELETE.class, PATCH.class);

    @Test
    void everyWriteEndpointIsAudited() throws IOException {
        List<Class<?>> resources = resourceClasses();

        assertTrue(resources.size() >= 10, "esperava encontrar os *Resource em " + CLASSES.toAbsolutePath());
        assertEquals(List.of(), unauditedWrites(resources));
    }

    @Test
    void reportsWriteEndpointWithoutAudit() {
        assertEquals(List.of("UnauditedResource.create", "UnauditedResource.remove"),
                unauditedWrites(List.of(UnauditedResource.class)));
        assertFalse(unauditedWrites(List.of(UnauditedResource.class)).contains("UnauditedResource.list"));
    }

    static List<String> unauditedWrites(List<Class<?>> resources) {
        List<String> missing = new ArrayList<>();

        for (Class<?> resource : resources) {
            for (Method method : resource.getDeclaredMethods()) {
                String name = resource.getSimpleName() + "." + method.getName();
                boolean write = WRITE_METHODS.stream().anyMatch(method::isAnnotationPresent);

                if (write && !method.isAnnotationPresent(Audited.class) && !EVENT_ENDPOINTS.contains(name)) {
                    missing.add(name);
                }
            }
        }

        missing.sort(String::compareTo);
        return missing;
    }

    private static List<Class<?>> resourceClasses() throws IOException {
        try (Stream<Path> files = Files.walk(CLASSES)) {
            return files
                    .filter(file -> file.getFileName().toString().endsWith("Resource.class"))
                    .map(file -> CLASSES.relativize(file).toString()
                            .replace('\\', '.')
                            .replace('/', '.')
                            .replaceAll("\\.class$", ""))
                    .map(AuditCoverageTest::load)
                    .toList();
        }
    }

    private static Class<?> load(String className) {
        try {
            return Class.forName(className);
        } catch (ClassNotFoundException ex) {
            throw new IllegalStateException(ex);
        }
    }

    static class UnauditedResource {

        @jakarta.ws.rs.GET
        public void list() {
        }

        @POST
        public void create() {
        }

        @PUT
        @Audited
        public void update() {
        }

        @DELETE
        public void remove() {
        }
    }
}
