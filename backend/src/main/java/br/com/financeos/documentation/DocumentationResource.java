package br.com.financeos.documentation;

import br.com.financeos.documentation.content.DocumentationContent;
import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/documentation")
@Produces(MediaType.APPLICATION_JSON)
@Authenticated
public class DocumentationResource {

    private final AccessControl accessControl;

    public DocumentationResource(AccessControl accessControl) {
        this.accessControl = accessControl;
    }

    @GET
    public DocumentationResponse get() {
        accessControl.require(Screen.DOCUMENTATION, Action.VIEW);
        return DocumentationContent.build();
    }
}
