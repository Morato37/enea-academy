# Schnittform in der Projekt-Selektion – Paket für bolt.new

Mit diesem Paket kann ein User in der Selektion für jeden Baum eine Schnittform wählen, zum Beispiel Hochstamm, Mehrstämmig, Hecke oder Spalier. Er sieht dabei die passende enea-Skizze. Die Wahl erscheint in einer Übersicht für Sales und, falls vorhanden, im PDF- und Excel-Export.

Klickbarer Entwurf zum Anschauen: https://claude.ai/artifact/9PZhB4ip6PkJeMQWcDVBBk

## Inhalt

| Datei / Ordner | Zweck |
|---|---|
| `public/schnittformen/` | 40 Skizzen als PNG mit transparentem Hintergrund |
| `src/lib/pruningForms.ts` | Katalog der 15 Schnittformen (DE/EN/IT) und welche Skizzen zu welcher Gattung gehören |
| `src/lib/pruningFormPdf.ts` | Lädt eine Skizze als Bild für den PDF-Export |
| `src/components/PruningForm/` | `PruningFormPicker` (Auswahl), `PruningFormBadge` (Anzeige), `PruningFormSummary` (Übersicht für Sales) |
| `supabase/migrations/20261029120000_add_pruning_form_to_selection_items.sql` | Neue Spalte `pruning_form` an der Selektionsposition |
| `PROMPT-fuer-bolt.txt` | Der Text, den du in Bolt einfügst |
| `UEBERSICHT-skizzen.png` | Alle Skizzen mit Dateinamen auf einen Blick |

Der Code wurde mit TypeScript im Strict-Modus geprüft. Ein Test-Rendering der drei Komponenten lief fehlerfrei. Die Komponenten nutzen nur React und Tailwind, es kommen keine neuen npm-Pakete dazu.

## Schritte in bolt.new

1. **Projekt in Bolt öffnen** und in die Code-Ansicht wechseln.
2. **Dateien hochladen.** Den Inhalt dieses Pakets per Drag & Drop in den Dateibaum ziehen, so dass die Ordner genau so liegen wie hier: `public/schnittformen/…`, `src/lib/…`, `src/components/PruningForm/…`, `supabase/migrations/…`.
3. **Kontrollieren**, dass `public/schnittformen/acer_bonsai.png` im Dateibaum sichtbar ist.
4. **Prompt einfügen.** Den ganzen Text aus `PROMPT-fuer-bolt.txt` in den Bolt-Chat kopieren und absenden.
5. **Ergebnis prüfen.** Bolt nennt am Ende den Tabellennamen, den es in der Migration eingesetzt hat. Dieser muss die Tabelle mit den Positionen einer Selektion sein.
6. **Testen.** Eine Selektion öffnen, bei einem Baum auf "Schnittform wählen" klicken, eine Skizze wählen, Seite neu laden. Die Wahl muss erhalten bleiben.

## Falls etwas nicht klappt

- **Bolt lässt keine Dateien hochladen:** Die Code-Dateien sind kurz. Du kannst Bolt bitten, die Dateien anzulegen, und den Inhalt jeweils in den Chat kopieren. Die Bilder lädst du dann im Supabase-Dashboard in den Bucket `plant-images` in einen Ordner `schnittformen` hoch. Danach in `src/lib/pruningForms.ts` die Konstante `PRUNING_SKETCH_BASE` auf die Supabase-Adresse umstellen, die im Kommentar darüber steht.
- **Skizzen erscheinen nicht:** Im Browser `/schnittformen/acer_bonsai.png` aufrufen. Kommt ein Fehler, liegen die Bilder nicht in `public/schnittformen`.
- **Speichern schlägt fehl:** Meist wurde die Migration nicht angewendet oder der falsche Tabellenname eingesetzt. Im Supabase-Dashboard prüfen, ob die Spalte `pruning_form` existiert.
- **Bolt baut zu viel um:** Mit "Nur die Punkte aus dem Prompt, sonst nichts ändern" zurückweisen oder die Version in Bolt zurücksetzen.

## Gattungen und Skizzen

Die Skizzen gelten pro Gattung, also für das erste Wort des botanischen Namens.

| Blatt | Gilt für | Formen |
|---|---|---|
| Acer | Acer | Gartenbonsai, Kuppelform, Mehrstämmig, Etagenform, Hochstamm |
| Amelanchier | Amelanchier | Mehrstämmig, Etagenform, Hochstamm |
| Betula | Betula | Mehrstämmig, Hängeform, Hochstamm |
| Carpinus & Fagus | Carpinus, Fagus | Hecke, Dachform, Hochstamm, Kuppelform |
| Cornus | Cornus | Strauch, Etagenform, Hochstamm, Hecke |
| Magnolia | Magnolia | Etagenform, Mehrstämmig, Solitär |
| Obst | Malus, Pyrus, Prunus | Spalier U-Form, Spalier waagrecht, Etagenform, Halbstamm, Hochstamm, Solitär |
| Parrotia | Parrotia | Etagenform, Mehrstämmig, Kuppelform |
| Pinus | Pinus | Mehrstämmig, Natürlicher Wuchs, Gartenbonsai, Hochstamm, Schirmform |
| Platanus | Platanus | Dachform, Mehrstämmig, Hochstamm, Solitär |

Alle anderen Bäume, zum Beispiel Tilia oder Quercus, bekommen ein Standard-Set mit Hochstamm, Mehrstämmig, Etagenform, Dachform, Kuppelform, Hecke und Solitär. Dafür werden vorläufig Skizzen von Platanus, Magnolia, Parrotia und Carpinus verwendet.

## Später anpassen

- **Formnamen ändern:** in `src/lib/pruningForms.ts` im Block `PRUNING_FORMS`. Die Codes wie `hochstamm` bitte nicht ändern, sie stehen in der Datenbank.
- **Neue Gattung mit eigenen Skizzen:** Bilder als `<gattung>_<form>.png` nach `public/schnittformen/` legen und in `PRUNING_GENUS_GROUPS` eine Zeile ergänzen.
- **Neue Schnittform:** in `PRUNING_FORMS` ergänzen und den Code zusätzlich im CHECK-Constraint der Datenbank erlauben.
