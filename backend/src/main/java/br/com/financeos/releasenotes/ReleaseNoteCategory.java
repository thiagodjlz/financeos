package br.com.financeos.releasenotes;

import java.util.List;

public record ReleaseNoteCategory(Kind kind, List<String> items) {

    public enum Kind {
        NEW,
        IMPROVEMENT,
        FIX
    }
}
