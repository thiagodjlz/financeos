package br.com.financeos.releasenotes;

import java.util.List;

public record ReleaseNotesResponse(String currentVersion, List<ReleaseNoteVersion> versions) {
}
