package br.com.financeos;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import javax.sql.DataSource;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/health")
public class HealthResource {

    @Inject
    DataSource dataSource;

    @ConfigProperty(name = "quarkus.application.version")
    String version;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public HealthResponse health() throws Exception {
        try (Connection connection = dataSource.getConnection();
                PreparedStatement statement = connection.prepareStatement("select current_database()");
                ResultSet resultSet = statement.executeQuery()) {
            resultSet.next();
            return new HealthResponse("UP", "FinanceOS API", version, resultSet.getString(1));
        }
    }

    public record HealthResponse(String status, String service, String version, String database) {
    }
}
