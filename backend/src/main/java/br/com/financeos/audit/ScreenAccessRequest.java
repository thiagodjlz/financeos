package br.com.financeos.audit;

import br.com.financeos.profiles.Screen;
import jakarta.validation.constraints.NotNull;

public record ScreenAccessRequest(@NotNull(message = "A tela é obrigatória.") Screen screen) {
}
