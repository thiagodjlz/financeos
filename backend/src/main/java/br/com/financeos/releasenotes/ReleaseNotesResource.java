package br.com.financeos.releasenotes;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import br.com.financeos.profiles.Screen;
import br.com.financeos.releasenotes.content.ReleaseNotesContent;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/release-notes")
@Produces(MediaType.APPLICATION_JSON)
@Authenticated
public class ReleaseNotesResource {

    private final AccessControl accessControl;

    // Mesma fonte de versao do GET /api/health: quarkus.application.version, espelhado de VERSION
    // via pom.xml. Nunca criar uma constante paralela para o numero da versao corrente.
    @ConfigProperty(name = "quarkus.application.version")
    String version;

    public ReleaseNotesResource(AccessControl accessControl) {
        this.accessControl = accessControl;
    }

    @GET
    public ReleaseNotesResponse get() {
        accessControl.require(Screen.RELEASE_NOTES, Action.VIEW);
        return new ReleaseNotesResponse(currentVersion(), ReleaseNotesContent.build());
    }

    private String currentVersion() {
        int dashIndex = version.indexOf('-');
        return dashIndex < 0 ? version : version.substring(0, dashIndex);
    }
}
