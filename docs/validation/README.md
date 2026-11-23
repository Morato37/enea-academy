# Baumleistungen: Abgleich mit i-Tree MyTree

Der Rechner unter `src/lib/treeBenefits` ist an i-Tree MyTree kalibriert. Dieser Ordner enthält die Referenzdaten und den Vergleich.

- `itree-mytree-*.json`: Ergebnisse aus i-Tree MyTree (https://mytree.itreetools.org) für synthetische Testbäume. In MyTree als „Testing/Imaginary Tree“ erfasst, Zustand gut, volle Sonne, metrische Einheiten, Werte „Now“.
- `report.md`: Abweichung je Baum und Kennzahl. Wird von `npm run validate:itree` neu geschrieben.

## Vergleich ausführen

```bash
npm run validate:itree
```

Das Skript rechnet jeden Referenzbaum mit dem echten Rechnercode, schreibt `report.md` und bricht mit Fehler ab, wenn eine Kennzahl ihr Budget überschreitet (Median der Beträge, siehe `BUDGETS` in `scripts/validate-tree-benefits.mjs`). Ziel ist höchstens 15 % Abweichung. Die Budgets nur senken, wenn der Rechner näher an i-Tree kommt, nie anheben, damit eine Änderung durchkommt.

## Neue Referenzbäume

Eine weitere Datei `itree-mytree-<Datum>.json` im gleichen Format ablegen (`trees` mit `species`, `dbh`, `location` wie von MyTree angezeigt, `seqC`, `storageC`, `runoffL`, `interceptL`, `CO`, `O3`, `NO2`, `SO2`, `PM`). Der Standort muss einem Preset des Rechners zugeordnet sein (`PLACE_TO_PRESET` im Skript).

## Kalibrierte Grössen

| Grösse | Ort im Code | Grundlage |
|---|---|---|
| Abflussanteil je Standort | `presets.ts` (`runoffShare`) | Verhältnis Abfluss ÷ Rückhalt in MyTree je Kanton |
| Verdunstungsfaktor Rückhalt 1.45 | `calc.ts` (`INTERCEPT_FACTOR`) | Median aller Referenzbäume |
| Speicherkorrektur `e^0.475 · DBH^−0.173` | `calc.ts` (`C_CAL`) | Regression über 26 Art-/DBH-Kombinationen |
| Wachstumsklassen langsam/mittel/schnell × 1.15/1.55/1.75 | `calc.ts` (`GROWTH_FACTOR`), `growthRates.ts` | i-Tree-Artendatenbank, Median je Klasse in Rapperswil-Jona |
| Depositionsgeschwindigkeiten | `calc.ts` (`VD`) | Literaturwerte × Median-Verhältnis über 13 Standorte |

`growthRates.ts` wird mit `python3 scripts/build-growth-rates.py <Ordner>` aus den CSV-Exporten der i-Tree-Artendatenbank (https://database.itreetools.org, eine Datei `db_species_<Gattung>.csv` je Gattung) erzeugt.
