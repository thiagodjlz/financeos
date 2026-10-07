package br.com.financeos.audit;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.CurrentUser;
import br.com.financeos.users.AppUser;
import br.com.financeos.users.AppUserRepository;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

// Ponto único por onde os endpoints de escrita registram a Alteração. Os valores chegam como
// rótulo -> texto legível do momento (AuditValues); senha e hash nunca entram num snapshot.
@RequestScoped
public class AuditTrail {

    @Inject
    AuditWriter writer;

    @Inject
    CurrentUser currentUser;

    @Inject
    AppUserRepository userRepository;

    private AuditActor actor;
    private boolean recorded;

    // Chamado pelo interceptor antes do método: o nome e o e-mail ficam como estavam antes da
    // operação, mesmo quando ela edita o próprio usuário.
    void begin() {
        recorded = false;
        actor = loadActor();
    }

    boolean recorded() {
        return recorded;
    }

    public void created(Screen screen, UUID recordId, String recordLabel, AuditValues values) {
        List<AuditChange> changes = new ArrayList<>();
        values.asMap().forEach((field, value) -> {
            if (value != null) {
                changes.add(new AuditChange(field, null, value));
            }
        });

        write(AuditAction.CREATE, screen, recordId, recordLabel, changes);
    }

    public void updated(Screen screen, UUID recordId, String recordLabel, AuditValues before, AuditValues after) {
        Map<String, String> oldValues = before.asMap();
        Map<String, String> newValues = after.asMap();
        Set<String> fields = new LinkedHashSet<>(newValues.keySet());
        fields.addAll(oldValues.keySet());

        List<AuditChange> changes = new ArrayList<>();
        for (String field : fields) {
            String oldValue = oldValues.get(field);
            String newValue = newValues.get(field);
            if (!Objects.equals(oldValue, newValue)) {
                changes.add(new AuditChange(field, oldValue, newValue));
            }
        }

        write(AuditAction.UPDATE, screen, recordId, recordLabel, changes);
    }

    public void deleted(Screen screen, UUID recordId, String recordLabel, AuditValues values) {
        List<AuditChange> changes = new ArrayList<>();
        values.asMap().forEach((field, value) -> {
            if (value != null) {
                changes.add(new AuditChange(field, value, null));
            }
        });

        write(AuditAction.DELETE, screen, recordId, recordLabel, changes);
    }

    private void write(AuditAction action, Screen screen, UUID recordId, String recordLabel,
            List<AuditChange> changes) {
        if (actor == null) {
            actor = loadActor();
        }

        writer.writeChange(actor, action, screen, recordId, recordLabel, changes);
        recorded = true;
    }

    private AuditActor loadActor() {
        UUID id = currentUser.id();
        AppUser user = userRepository.findById(id);
        return user == null ? new AuditActor(id, null, null, false) : AuditActor.of(user);
    }
}
