# Moodboard-Export aus der Selektion – Konzept und Paket für bolt.new

## Was die Funktion macht

Auf der Selektionsseite gibt es einen Button "Moodboard". Er öffnet einen Dialog mit drei Schritten:

1. **Typ wählen.** Drei Moodboards nach den enea-Vorlagen stehen zur Wahl.
2. **Pflanzen wählen.** Die Pflanzen der Selektion erscheinen als Liste mit Häkchen und der Zahl ihrer Bilder in der Bildersuche. Je nach Typ gilt eine Mindestzahl. Erst wenn sie erreicht ist, lässt sich generieren.
3. **Vorschau und Export.** Das Moodboard wird automatisch befüllt. Jedes Bild lässt sich per Klick durch ein anderes passendes ersetzen. "Neu mischen" verteilt die Bilder neu. Kopfzeile und Format sind einstellbar. Danach wird ein PDF erzeugt.

## Die drei Typen

| Typ | Vorlage | Bilder | Spalten | Mindestens | Empfohlen |
|---|---|---|---|---|---|
| Saisonalität | G | 19 | Frühling, Sommer, Herbst, Winter | 4 Pflanzen | 8 bis 12 |
| Pflanzenauswahl | F | 19 | Bäume, Sträucher, Gräser + Stauden, Kletterpflanzen + Bodendecker | 4 Pflanzen | 8 bis 12, je Spalte 2 |
| Pflanzenportrait | J | 5 | eine Seite | 1 Pflanze | 1 pro Seite |

**Warum diese Mindestzahlen:** Saisonalität und Pflanzenauswahl haben je Spalte 4 bis 6 Felder. Mit weniger als 4 Pflanzen wiederholt sich fast jedes Bild derselben Pflanze, das Moodboard wirkt dann leer. Das Pflanzenportrait ist wie im Glasenberg-Beispiel für eine Pflanze gedacht. Wer mehrere Pflanzen wählt, bekommt eine Seite pro Pflanze. Schaltet man das aus, landen bis zu 5 Pflanzen zu einem Thema auf einer Seite, wie bei "weiss blühend" auf Seite 3 des Beispiels.

Die Zahlen stehen in `src/lib/moodboard/layouts.ts` bei `minPlants` und lassen sich dort ändern.

## Wie die Bilder gewählt werden

- **Saisonalität:** Ein Bild kommt nur in eine Spalte, wenn es den passenden Jahreszeiten-Tag hat.
- **Pflanzenauswahl:** Ein Bild kommt in die Spalte, zu der seine Pflanze gehört.
- **Pflanzenportrait:** Nur Bilder der gewählten Pflanze.
- **Grosse Felder** bekommen bevorzugt Bilder mit Tags wie "Garten" oder "Situation". **Kleine Felder** bekommen bevorzugt Detailbilder wie "Blüte" oder "Blatt". So steht wie im Beispiel die Gartenszene in der Mitte.
- **Abwechslung:** Die Pflanzen kommen reihum dran. Kein Bild erscheint zweimal im selben Export.
- **Fehlen Bilder,** bleibt das Feld grau. Der Dialog warnt vorher, welche Spalte oder Pflanze zu wenige Bilder hat.

## Aussehen des PDF

Das Layout ist aus den drei Vorlagen und dem Glasenberg-Beispiel vermessen: 8.5 mm Rand, 4 Spalten zu 68.7 mm, 1.8 mm Abstand. Standard ist A3 quer wie im Beispiel, A4 quer ist wählbar. Oben rechts stehen das Logo und die Zeile "Projekt | Konzept | Bereich". Unten links steht die Seitenzahl, unten rechts "© Jahr enea". Logo und Fusszeichen sind aus deinem PDF ausgeschnitten.

`BEISPIEL-vergleich.png` zeigt oben dein Original und darunter einen Test-Export mit denselben Fotos.

**Unterschied zum Original:** Die Kopfzeile ist in Helvetica gesetzt, weil das PDF-Werkzeug Myriad Pro nicht mitbringt. Das Logo selbst ist das Original.

## Inhalt des Pakets

| Datei | Zweck |
|---|---|
| `src/lib/moodboard/types.ts` | Datentypen |
| `src/lib/moodboard/layouts.ts` | Die drei Layouts in Millimetern, Mindestzahlen, Tag-Listen |
| `src/lib/moodboard/fill.ts` | Befüllen, Prüfen, Alternativen, Ersetzen |
| `src/lib/moodboard/pdf.ts` | PDF-Erzeugung mit jsPDF |
| `src/components/Moodboard/MoodboardExportDialog.tsx` | Der Dialog mit den drei Schritten |
| `src/components/Moodboard/MoodboardPreview.tsx` | Massstabsgetreue Vorschau einer Seite |
| `public/moodboard/enea-logo.png`, `enea-mark.png` | Logo und Fusszeichen |
| `PROMPT-fuer-bolt.txt` | Der Text für den Bolt-Chat |

**Geprüft:** TypeScript im Strict-Modus ohne Fehler. 18 Tests der Befüll-Logik laufen durch. Ein Export im echten Browser hat ein A3-PDF erzeugt, das dem Original entspricht.

## Schritte in bolt.new

1. **Dateien hochladen.** Den Inhalt des Pakets per Drag & Drop in den Dateibaum ziehen, mit gleicher Ordnerstruktur: `src/lib/moodboard/…`, `src/components/Moodboard/…`, `public/moodboard/…`.
2. **Kontrollieren,** dass `public/moodboard/enea-logo.png` im Dateibaum sichtbar ist.
3. **Prompt einfügen.** Den Text aus `PROMPT-fuer-bolt.txt` in den Bolt-Chat kopieren und absenden.
4. **Antwort lesen.** Bolt nennt die Tabellen der Bildersuche und die ergänzten Tags. Prüfen, ob das stimmt.
5. **Testen.** Eine Selektion öffnen, "Moodboard" klicken, Pflanzenportrait mit einer Pflanze wählen und exportieren.

## Falls etwas nicht klappt

- **Keine Bilder gefunden:** Bolt hat die falschen Tabellen der Bildersuche erwischt. Im Chat die richtigen Tabellennamen nennen.
- **Spalten bei Saisonalität bleiben leer:** Die Jahreszeiten heissen in der Bildersuche anders. Die Schreibweise in `SEASON_TAGS` ergänzen.
- **In der Vorschau sind Bilder da, im PDF fehlen sie:** Die Bilder liegen auf einem fremden Server, der das Kopieren ins PDF blockiert (CORS). Bilder in Supabase Storage funktionieren. Für andere Server muss dort CORS erlaubt werden.
- **PDF zu gross:** In `pdf.ts` den Wert `dpi` von 200 auf 150 senken.

## Mögliche Erweiterungen

- Die Vorlage J ist auch für das Möblierungskonzept gedacht. Mit Bildern von Möbeln statt Pflanzen liesse sich dasselbe Layout dafür nutzen.
- Mehrere Moodboards in einem PDF hintereinander, zum Beispiel Pflanzenauswahl plus ein Portrait pro Baum.
