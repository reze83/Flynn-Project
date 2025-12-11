/**
 * AI Skills - LLM/Prompt Engineering patterns
 *
 * Skills for working with Large Language Models,
 * prompt engineering, and AI-powered development.
 */

import type { Skill } from "../types.js";

export const promptEngineering: Skill = {
  id: "prompt-engineering",
  name: "Prompt Engineering Patterns",
  description:
    "Comprehensive prompt patterns for LLM interactions: Chain-of-Thought, Few-Shot, Role-Based prompting, System Prompts, and task-specific templates. Includes both provider-agnostic techniques and Claude-specific best practices.",
  category: "ai",
  triggers: [
    "prompt",
    "prompting",
    "llm",
    "system prompt",
    "few-shot",
    "chain-of-thought",
    "cot",
    "instruction",
    "template",
    "claude",
    "gpt",
    "anthropic",
    "openai",
    "gemini",
    "zero-shot",
    "role",
    "persona",
    "context window",
  ],
  tier1TokenEstimate: 60,
  tier2TokenEstimate: 3500,
  instructions: `# Prompt Engineering Patterns

## 1. Grundprinzipien

### Klarheit & Spezifität
- Explizite Anweisungen statt implizite Erwartungen
- Gewünschtes Format vorab definieren
- Scope klar eingrenzen

### Kontextbereitstellung
- Relevanten Hintergrund liefern
- Rolle/Persona definieren
- Constraints explizit machen

### Iterative Verfeinerung
- Mit einfachen Prompts starten
- Basierend auf Output optimieren
- Edge Cases testen

---

## 2. Pattern-Bibliothek

### 2.1 Chain-of-Thought (CoT)

**Zero-Shot CoT:**
\`\`\`
Löse dieses Problem Schritt für Schritt:
[Problem]

Denke laut nach und zeige jeden Schritt.
\`\`\`

**Explicit CoT:**
\`\`\`
1. Analysiere die Anforderungen
2. Identifiziere die Hauptkomponenten
3. Plane die Lösung
4. Implementiere schrittweise
5. Validiere das Ergebnis
\`\`\`

**Self-Consistency:**
- Mehrere Reasoning-Pfade generieren
- Konsistente Antworten identifizieren
- Majority-Voting für finale Antwort

### 2.2 Few-Shot Prompting

**Struktur:**
\`\`\`
Hier sind Beispiele für [Task]:

Beispiel 1:
Input: [example_input_1]
Output: [example_output_1]

Beispiel 2:
Input: [example_input_2]
Output: [example_output_2]

Jetzt bearbeite:
Input: [actual_input]
Output:
\`\`\`

**Best Practices:**
- 2-5 diverse Beispiele
- Format konsistent halten
- Negative Beispiele bei Bedarf
- Reihenfolge: einfach → komplex

### 2.3 Role-Based Prompting

**System Prompt Pattern:**
\`\`\`
Du bist ein [Rolle] mit Expertise in [Bereich].

Deine Aufgaben:
- [Aufgabe 1]
- [Aufgabe 2]

Constraints:
- [Constraint 1]
- [Constraint 2]

Ausgabeformat: [Format]
\`\`\`

**Effektive Rollen:**
- "Senior Software Engineer mit 10+ Jahren Erfahrung"
- "Security Auditor spezialisiert auf OWASP Top 10"
- "Technical Writer für API-Dokumentation"

### 2.4 Strukturierte Ausgaben

**JSON Output:**
\`\`\`
Analysiere den Code und gib das Ergebnis als JSON zurück:

{
  "issues": [{"type": "...", "severity": "...", "line": ...}],
  "suggestions": ["..."],
  "score": 0-100
}
\`\`\`

**XML für Komplexe Strukturen:**
\`\`\`xml
<analysis>
  <summary>...</summary>
  <details>
    <item priority="high">...</item>
  </details>
</analysis>
\`\`\`

---

## 3. Task-spezifische Templates

### Code-Generierung
\`\`\`
Schreibe eine [Sprache] Funktion die [Aufgabe].

Requirements:
- [Req 1]
- [Req 2]

Constraints:
- Keine externen Dependencies
- TypeScript strict mode
- Error handling inkludieren

Output: Nur Code mit JSDoc Kommentaren
\`\`\`

### Code-Review
\`\`\`
Reviewe den folgenden Code auf:
1. Bugs und potentielle Fehler
2. Performance-Probleme
3. Security-Vulnerabilities
4. Code-Stil und Best Practices

Für jedes Problem:
- Zeile identifizieren
- Severity (critical/high/medium/low)
- Konkreten Fix vorschlagen

Code:
\`\`\`[code]\`\`\`
\`\`\`

### Debugging
\`\`\`
Der folgende Code produziert [Fehler/unerwartetes Verhalten].

Expected: [erwartetes Verhalten]
Actual: [tatsächliches Verhalten]

Code:
\`\`\`[code]\`\`\`

Analysiere:
1. Root Cause
2. Warum tritt der Fehler auf?
3. Wie kann er behoben werden?
\`\`\`

---

## 4. Claude-spezifische Patterns

### XML-Tags für Struktur
Claude verarbeitet XML-Tags besonders gut:
\`\`\`xml
<context>
Projektbeschreibung und Hintergrund
</context>

<task>
Konkrete Aufgabenstellung
</task>

<constraints>
- Constraint 1
- Constraint 2
</constraints>

<output_format>
Gewünschtes Ausgabeformat
</output_format>
\`\`\`

### Artifacts für Code
Nutze Artifacts für längere Code-Outputs:
- Separate Darstellung
- Bessere Lesbarkeit
- Einfaches Kopieren

### Extended Thinking
Für komplexe Probleme:
\`\`\`
Bevor du antwortest, analysiere das Problem gründlich.
Zeige deinen Denkprozess.
\`\`\`

### Claude's Stärken nutzen
- Lange Kontextfenster (200K tokens)
- Multi-Turn Conversations
- Code-Verständnis
- Strukturierte Outputs

---

## 5. Anti-Patterns vermeiden

### ❌ Zu vage
"Mach den Code besser"

### ✅ Spezifisch
"Refactore die Funktion für bessere Lesbarkeit: extrahiere Magic Numbers als Konstanten, füge TypeScript Types hinzu, und benenne Variablen aussagekräftiger."

### ❌ Widersprüchliche Anweisungen
"Sei ausführlich aber halte dich kurz"

### ✅ Klare Priorisierung
"Priorisiere Kürze. Maximal 3 Sätze pro Punkt."

### ❌ Fehlender Kontext
"Was ist das Problem hier?"

### ✅ Mit Kontext
"Im Kontext einer React-App mit Redux: Was ist das Problem mit diesem useEffect Hook?"

---

## 6. Optimierungstechniken

### Token-Effizienz
- Komprimiere repetitive Patterns
- Nutze Referenzen statt Wiederholung
- Entferne unnötige Füllwörter

### Prompt Chaining
1. Prompt 1: Analyse
2. Prompt 2: Basierend auf Analyse → Plan
3. Prompt 3: Basierend auf Plan → Implementierung

### Self-Correction
\`\`\`
Nach deiner initialen Antwort:
1. Überprüfe auf Fehler
2. Verifiziere Vollständigkeit
3. Korrigiere falls nötig
\`\`\`

---

## 7. Checkliste

### Vor dem Prompt
- [ ] Klare Aufgabenstellung definiert
- [ ] Relevanten Kontext gesammelt
- [ ] Gewünschtes Format überlegt
- [ ] Constraints identifiziert

### Im Prompt
- [ ] Rolle/Persona definiert
- [ ] Aufgabe klar formuliert
- [ ] Beispiele (falls nötig)
- [ ] Output-Format spezifiziert
- [ ] Constraints genannt

### Nach dem Prompt
- [ ] Output validieren
- [ ] Edge Cases testen
- [ ] Prompt iterativ verbessern
`,
  resources: [
    "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering",
    "https://platform.openai.com/docs/guides/prompt-engineering",
    "https://www.promptingguide.ai/",
    "https://learnprompting.org/",
  ],
};

/**
 * Combined AI Skills registry
 */
export const AI_SKILLS: Record<string, Skill> = {
  "prompt-engineering": promptEngineering,
};
