package br.com.financeos.releasenotes;

import java.util.List;

public record ReleaseNoteVersion(String version, List<ReleaseNoteCategory> categories) {
}
