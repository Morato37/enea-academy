import { Lang } from './types';

/** PDF report strings. */
export interface PdfStrings {
  report: string; date: string; method: string; by: string;
  overview: string; valueSplit: string; polByType: string; bySpecies: string; perTree: string; params: string; notes: string;
  trees: string; storage: string; storageU: string; seq: string; seqU: string; pol: string; polU: string; run: string; runU: string;
  o2: string; o2U: string; value: string; valueU: string; storageValue: string;
  species: string; count: string; cSeq: string; air: string; runoff: string;
  hdr: string[]; total: string; ev: string; dec: string; page: string;
  pAir: string; pClim: string; pSite: string; pPrice: string;
  precip: string; raindays: string; ffd: string; leafon: string; landuse: string; surface: string; runoffP: string;
  sizeClasses: string; sizeClass: string; noteTxt: string;
}

type Dict = { [k: string]: string | PdfStrings } & { P: PdfStrings };

const de: Dict = {
  title: 'Baumleistungen', subtitle: 'Ökosystemleistungen je Baum nach i-Tree-Eco-Methodik',
  nav: 'Baumleistungen',
  s1: 'Standort & Parameter', s2: 'Baumliste', s3: 'Ergebnisse je Baum',
  gAir: 'Luftschadstoffe, Jahresmittel', gClim: 'Klima', gSite: 'Standortverhältnisse', gPrice: 'Bewertung CHF', gProj: 'Projektion',
  precip: 'Niederschlag', raindays: 'Regentage ≥ 1 mm', ffd: 'Frostfreie Tage', leafon: 'Belaubung Laubbäume',
  landuse: 'Wuchsumfeld', lu1: 'Park / offen', lu2: 'Strasse', lu3: 'Bestand / Wald', surface: 'Untergrund', sf1: 'versiegelt', sf2: 'gemischt', sf3: 'Rasen / Beet',
  runoffP: 'Abfluss', yA: 'Horizont A', yB: 'Horizont B', yC: 'Horizont C', years: 'Jahre',
  pfoot: 'Standortwerte aus Voreinstellung oder Live-Abruf; alle Felder bleiben editierbar. Änderungen rechnen sofort neu.',
  gLoc: 'Standort', geoPh: 'Ort oder PLZ suchen …', geoBtn: 'Abrufen', custom: 'Eigene Werte',
  geoBusy: 'Suche Standort und lade Klima- und Luftdaten …', geoNone: 'Kein Ort gefunden – anders schreiben oder Voreinstellung wählen.',
  geoBlocked: 'Live-Abruf nicht möglich (Netzwerk). Voreinstellung wählen oder später erneut versuchen.',
  geoOk: '{0} · {1} m ü. M. · Klima 2015–2024 (Open-Meteo/ERA5), Luft 2024 (CAMS). Werte übernommen.',
  presetNote: 'Voreinstellung {0}: Jahresmittel gerundet (Ostluft/NABEL, MeteoSchweiz 1991–2020).',
  fbClimate: 'Klimaarchiv nicht erreichbar – Klimawerte von Voreinstellung {0} übernommen.', fbAir: 'Luftdaten nicht erreichbar – Luftwerte von Voreinstellung {0} übernommen.',
  geoOffline: 'Klima- und Luftdienste momentan nicht erreichbar – Voreinstellung wählen oder später erneut versuchen.',
  inputHint: 'Aus Excel kopieren und einfügen (Tab, Semikolon oder Komma; Dezimalkomma wird erkannt). Spalten: Art · ID · DBH cm · DBH-Höhe · Höhe m · Kronenoberkante m · Kronenansatz m · Kronenbreite N/S m · Kronenbreite E/W m · Krone fehlend % · Absterben %. Zeilen ohne DBH oder Höhe werden übersprungen.',
  calc: 'Berechnen', copy: 'Ergebnis für Excel kopieren', pdf: 'PDF-Bericht exportieren', mTitle: 'Methodik, Annahmen und Quellen',
  pdfBusy: 'PDF wird erstellt …', pdfSaved: 'PDF gespeichert', pdfErr: 'PDF-Fehler',
  kTrees: 'Bäume gerechnet', kSkip: 'ohne Messwerte übersprungen', kC: 'Kohlenstoffspeicher', kCs: '≙ {0} t CO₂', kSeq: 'Sequestrierung',
  kPol: 'Schadstoffentzug', kRun: 'Vermiedener Abfluss', kRunS: 'Kronenfläche {0} m²', kVal: 'Jahreswert', kValS: 'ohne Speicherwert',
  kO2: 'O₂-Produktion', kO2S: '≈ Atembedarf von {0} Personen',
  shC: 'CO₂-Sequestrierung', shAir: 'Luftschadstoffe', shRun: 'Abfluss',
  hSpecies: 'Art', hId: 'ID', hType: 'Typ', hDbh: 'DBH', hH: 'Höhe', hGround: 'Kronenfläche', hLA: 'Blattfläche', hLAI: 'LAI', hC: 'C-Speicher', hSeq: 'C-Sequestr.',
  hRun: 'Verm. Abfluss', hO2: 'O₂-Produktion', hVal: 'Wert', hFlags: 'Hinweise', hSize: 'Klasse',
  gTree: 'Baum', gCarbon: 'Kohlenstoff', gAirG: 'Schadstoffentzug g/a', gWater: 'Wasser', gValue: 'Bewertung',
  ev: 'immergrün', dec: 'laubabwerfend', sum: 'Summe ({0} Bäume)', none: 'Keine Bäume mit DBH und Höhe gefunden.',
  nSkip: 'Übersprungen (kein DBH/Höhe): {0}', nUnits: 'Kohlenstoff in kg, Sequestrierung und O₂ in kg/Jahr, Schadstoffe in g/Jahr. Jahreswert = Sequestrierung + Schadstoffe + Abfluss, ohne den einmaligen Speicherwert.',
  status: '{0} Bäume gerechnet · {1}', tCopied: 'Tabelle kopiert – in Excel einfügen', tFirst: 'Zuerst berechnen',
  projTitle: 'Projektion mit Wachstum', projSub: 'DBH-Zuwachs nach Wuchsumfeld und Vitalität; Höhe und Krone folgen dem Stamm (Stadtbaum-Allometrie), Zuwachs flacht gegen die Arthöhe ab. Preise konstant, keine Diskontierung.',
  yr: 'Jahr {0}', pDbh: 'DBH', pC: 'C-Speicher', pChf: 'Jahreswert', pCum: 'kumuliert', gProjT: 'Projektion Jahr {0}',
  chartCum: 'Kumulierter Wert CHF', chartC: 'Kohlenstoffspeicher kg', chartX: 'Jahre ab heute', chartO2: 'O₂-Produktion kg/Jahr', chartPers: 'Personen versorgt', today: 'Heute',
  hzC: 'Kohlenstoffspeicher kg', hzO2: 'O₂-Produktion kg/a', hzSeq: 'Sequestrierung kg C/a', hzRun: 'Verm. Abfluss m³/a', hzPol: 'Schadstoffentzug g/a', hzVal: 'Jahreswert CHF', hzCum: 'Kumuliert CHF', hzPers: 'Atembedarf Personen',
  o2Note: 'O₂-Produktion = 32/12 × Kohlenstoff-Sequestrierung (Nowak et al. 2007). Ein erwachsener Mensch atmet rund 300 kg O₂ pro Jahr.',
  dbhUnit: 'Stammmass in der Liste', uCm: 'Durchmesser cm', uMm: 'Durchmesser mm', uCirc: 'Stammumfang cm',
  fUnit: 'Unplausibel: Stamm dicker als 1/8 der Baumhöhe – Einheit prüfen (mm? Umfang?)',
  fUnknown: 'Art unbekannt – Standard Laubbaum', fGenus: 'Gattungswerte', fPalm: 'Palme/Nicht-Baum: Biomasse aus Höhe', fBase: 'Kronenansatz geschätzt', fWidth: 'Kronenbreite geschätzt', fBeer: 'Blattfläche: Beer-Lambert (>15 m)', fDbh: 'DBH > 100 cm: extrapoliert',
  // input modes & project handover
  modePaste: 'Liste einfügen', modeProject: 'Aus Projekt', modeProjectSub: 'Bäume aus der Projektauswahl mit Grössenklassen',
  projFrom: 'Übernommen aus', projNoTrees: 'Die Projektauswahl enthält keine Bäume oder Palmen. Bäume in „My Selections" hinzufügen und erneut übergeben, oder eine Liste einfügen.',
  projEmpty: 'Noch keine Bäume übergeben. Auf der Seite „My Selections" den Button „Tree Benefits" verwenden.',
  projHint: 'Je Art die Anzahl und die Grössenklasse wählen. Die Standardmasse der Klassen können unten angepasst werden.',
  qty: 'Anzahl', sizeClass: 'Grössenklasse', small: 'Klein', medium: 'Mittel', large: 'Gross',
  scTitle: 'Grössenklassen – Standardmasse', scSub: 'Voreinstellung: Baumschul-Pflanzqualität nach Stammumfang (StU). Werte editierbar, werden im Browser gespeichert.',
  scLabel: 'Bezeichnung', scDbh: 'DBH cm', scHeight: 'Höhe m', scCrown: 'Kronenbreite m', scBase: 'Kronenansatz m', scReset: 'Zurücksetzen',
  allSmall: 'alle Klein', allMedium: 'alle Mittel', allLarge: 'alle Gross', remove: 'Entfernen', addSpecies: 'Art hinzufügen', speciesPh: 'Botanischer Name …',
  common: 'Deutscher Name', treesTotal: '{0} Bäume in {1} Arten',
  P: {
    report: 'Baumleistungsbericht', date: 'Berechnet am', method: 'Methodik: i-Tree Eco (vereinfacht, Jahresmittel)', by: 'Enea',
    overview: 'Übersicht', valueSplit: 'Jahreswert nach Leistung', polByType: 'Schadstoffentzug nach Schadstoff (g/Jahr)', bySpecies: 'Leistungen nach Art', perTree: 'Ergebnisse je Baum', params: 'Verwendete Parameter', notes: 'Hinweise und Annahmen',
    trees: 'Bäume', storage: 'Kohlenstoffspeicher', storageU: 'kg C', seq: 'Sequestrierung', seqU: 'kg C/Jahr', pol: 'Schadstoffentzug', polU: 'g/Jahr', run: 'Vermiedener Abfluss', runU: 'm³/Jahr', o2: 'O2-Produktion', o2U: 'kg/Jahr', value: 'Jahreswert', valueU: 'CHF/Jahr', storageValue: 'Speicherwert (einmalig)',
    species: 'Art', count: 'Anzahl', cSeq: 'CO2-Sequestrierung', air: 'Luftschadstoffe', runoff: 'Abfluss',
    hdr: ['Art', 'ID', 'Typ', 'DBH cm', 'Höhe m', 'Krone m²', 'Blattfl. m²', 'LAI', 'C kg', 'C-Seq. kg/a', 'O2 kg/a', 'CO g/a', 'O3 g/a', 'NO2 g/a', 'SO2 g/a', 'PM2.5 g/a', 'Abfluss m³/a', 'CHF/a', 'Hinweise'],
    total: 'Summe', ev: 'immergrün', dec: 'laubabwerfend', page: 'Seite',
    pAir: 'Luftschadstoffe (µg/m³, Jahresmittel)', pClim: 'Klima', pSite: 'Standort', pPrice: 'Bewertung (CHF/t bzw. CHF/m³)',
    precip: 'Niederschlag mm/a', raindays: 'Regentage', ffd: 'Frostfreie Tage', leafon: 'Belaubungstage', landuse: 'Wuchsumfeld', surface: 'Untergrund', runoffP: 'Abfluss CHF/m³',
    sizeClasses: 'Grössenklassen (DBH cm / Höhe m / Krone m / Ansatz m)', sizeClass: 'Klasse',
    noteTxt: 'Die Berechnung folgt der i-Tree-Eco-Methodik in vereinfachter Form mit Jahresmitteln statt Stundenwerten (Blattfläche: Nowak 1996; Biomasse: Chojnacky et al. 2014; Deposition: Nowak et al. 2006/2013; Interzeption: Wang et al. 2008). Erwartete Abweichung zu i-Tree Eco ±20–30 %. Der Jahreswert umfasst Sequestrierung, Schadstoffentzug und vermiedenen Abfluss; der Kohlenstoffspeicher ist als einmaliger Wert separat ausgewiesen. Bäume mit DBH über 100 cm liegen ausserhalb des Gültigkeitsbereichs der Biomassegleichungen und sind entsprechend markiert. Standort- und Preisdaten sind editierbare Annahmen und in der Parametertabelle dokumentiert.',
  },
  method: `<h4>Blattfläche</h4><p>Nowak (1996), i-Tree Eco: <code>ln LA = −4.3309 + 0.2942·H + 0.7312·D + 5.7217·S − 0.0148·C</code> mit Kronenhöhe H (m), mittlerem Kronendurchmesser D (m), artspezifischem Beschattungsfaktor S und Kronenmantelfläche <code>C = π·D·(H+D)/2</code>. Liegt H/D ausserhalb 0.5–2, sind H oder D grösser als 15 m oder ergibt sich ein LAI ausserhalb 0.5–8, wird <code>LA = Kronengrundfläche · (−ln(1−S)/0.5)</code> verwendet (Beer-Lambert, wie i-Tree ausserhalb des Regressionsbereichs). Fehlende Kronenanteile reduzieren LA proportional.</p>
<h4>Kohlenstoffspeicher</h4><p>Oberirdische Trockenbiomasse nach Chojnacky, Heath &amp; Jenkins (2014), Gattungs-/Familiengruppen: <code>ln B = β₀ + β₁·ln DBH</code>. Wurzelanteil +26 % (Cairns et al. 1997), Faktor 0.8 für freistehende Stadtbäume (Nowak 1994), Kohlenstoff = 50 % der Biomasse. DBH über 100 cm wird als Extrapolation markiert.</p>
<h4>Jährliche Sequestrierung</h4><p>Basiszuwachs nach Wuchsumfeld (i-Tree: Strasse 0.83, Park 0.61, Bestand 0.38 cm DBH/Jahr), skaliert mit frostfreien Tagen ÷ 153, multipliziert mit Vitalitätsfaktor aus Kronen-Absterben (≤10 %: 1.0 · 11–25 %: 0.76 · 26–50 %: 0.42 · 51–75 %: 0.15 · &gt;75 %: 0). Sequestrierung = C(DBH+Zuwachs) − C(DBH). O₂-Produktion = 32/12 · C-Sequestrierung.</p>
<h4>Schadstoffentzug</h4><p>Trockene Deposition <code>F = v_d · c · A_Krone · t</code> nach Nowak et al. (2006, 2013) mit mittleren Depositionsgeschwindigkeiten je Kronengrundfläche (in Belaubung, Tag/Nacht-Mittel): O₃ 0.35, NO₂ 0.20, SO₂ 0.30, PM₂.₅ 0.10 cm/s (50 % Resuspension abgezogen), CO 0.003 cm/s. Skalierung mit LAI über <code>(1−e^(−0.5·LAI))/(1−e^(−0.5·4))</code>. Laubbäume ausserhalb der Belaubung: 15 % (kahle Äste). Immergrüne ganzjährig.</p>
<h4>Vermiedener Abfluss</h4><p>Kronenspeicher je Regenereignis <code>S = 0.2 mm·LAI + 0.1 mm</code> (Wang et al. 2008, i-Tree Hydro). Interzeption je Ereignis = Erwartungswert von min(P, S) bei exponentiell verteilter Ereignistiefe, × 1.8 für Verdunstung während des Ereignisses; Laubbäume ausserhalb der Belaubung mit LAI 0.5. Vermiedener Abfluss = Interzeption · Kronengrundfläche · Abflussbeiwert des Untergrunds (versiegelt 0.9, gemischt 0.5, Rasen 0.25).</p>
<h4>Bewertung</h4><p>CO₂ 130 CHF/t (ARE, Klimakosten); NO₂, SO₂, PM₂.₅ nach ARE-Schadenskosten Luftschadstoffe (Grössenordnung suburban); O₃ und CO nach i-Tree-Eco-Bandbreite umgerechnet; Abfluss nach schweizerischer Regenwassergebühr. Alle Preise editierbar. Der Jahreswert enthält keinen Speicherwert; dieser wäre Kohlenstoffspeicher × 3.667 × CO₂-Preis als Einmalgrösse.</p>
<h4>Grössenklassen</h4><p>Bäume aus einer Projektauswahl haben keine Messwerte. Sie werden über drei Grössenklassen (Klein, Mittel, Gross) mit Standardmassen gerechnet, voreingestellt auf Baumschul-Pflanzqualitäten nach Stammumfang StU 16–18, 25–30 und 40–45 cm (DBH ≈ StU/π). Die Standardmasse sind editierbar; immergrün/laubabwerfend wird bei unbekannten Arten aus der Pflanzendatenbank übernommen.</p>
<h4>Projektion</h4><p>Der DBH wächst jährlich um den Basiszuwachs × Vitalität, gedämpft mit <code>1 − 0.9·(H/H_max)²</code> gegen die artspezifische Maximalhöhe. Höhe und Krone folgen dem Stamm nach Stadtbaum-Allometrie (McPherson et al. 2016, Urban Tree Database): Höhe ∝ DBH^0.6, Kronenbreite ∝ DBH^0.7, Kronentiefe ∝ DBH^0.5. Für jedes Jahr werden alle Leistungen neu berechnet; „kumuliert" ist die Summe der Jahreswerte ab heute, ohne Diskontierung, bei konstanten Preisen und Konzentrationen. Mortalität und Pflegeeingriffe sind nicht enthalten.</p>
<h4>Abweichung zu i-Tree Eco</h4><p>i-Tree rechnet stündlich mit Wetter- und Messstationsdaten; hier werden Jahresmittel verwendet. Erwartete Abweichung bei den Hauptleistungen ±20–30 %. Voreinstellungen: Ostluft/NABEL Jahresmittel (gerundet), MeteoSchweiz Normperiode 1991–2020 – bitte mit aktuellen Werten abgleichen oder den Live-Abruf nutzen.</p>`,
};

const en: Dict = {
  title: 'Tree Benefits', subtitle: 'Ecosystem services per tree, i-Tree Eco methodology',
  nav: 'Tree Benefits',
  s1: 'Site & parameters', s2: 'Tree list', s3: 'Results per tree',
  gAir: 'Air pollutants, annual mean', gClim: 'Climate', gSite: 'Site conditions', gPrice: 'Valuation CHF', gProj: 'Projection',
  precip: 'Precipitation', raindays: 'Rain days ≥ 1 mm', ffd: 'Frost-free days', leafon: 'Leaf-on period, deciduous',
  landuse: 'Growing environment', lu1: 'Park / open', lu2: 'Street', lu3: 'Stand / forest', surface: 'Ground surface', sf1: 'impervious', sf2: 'mixed', sf3: 'lawn / bed',
  runoffP: 'Runoff', yA: 'Horizon A', yB: 'Horizon B', yC: 'Horizon C', years: 'years',
  pfoot: 'Site values from preset or live lookup; every field stays editable. Changes recalculate immediately.',
  gLoc: 'Site', geoPh: 'Search town or postcode …', geoBtn: 'Fetch', custom: 'Custom values',
  geoBusy: 'Locating site and loading climate and air-quality data …', geoNone: 'No place found – try another spelling or pick a preset.',
  geoBlocked: 'Live lookup failed (network). Pick a preset or retry later.',
  geoOk: '{0} · {1} m a.s.l. · climate 2015–2024 (Open-Meteo/ERA5), air 2024 (CAMS). Values applied.',
  presetNote: 'Preset {0}: rounded annual means (Ostluft/NABEL, MeteoSwiss 1991–2020).',
  fbClimate: 'Climate archive unavailable – climate values taken from preset {0}.', fbAir: 'Air-quality data unavailable – air values taken from preset {0}.',
  geoOffline: 'Climate and air-quality services are currently unreachable – pick a preset or retry later.',
  inputHint: 'Copy from Excel and paste (tab, semicolon or comma; decimal comma detected). Columns: species · ID · DBH cm · DBH height · height m · crown top m · crown base m · crown width N/S m · crown width E/W m · crown missing % · dieback %. Rows without DBH or height are skipped.',
  calc: 'Calculate', copy: 'Copy results for Excel', pdf: 'Export PDF report', mTitle: 'Methodology, assumptions and sources',
  pdfBusy: 'Building PDF …', pdfSaved: 'PDF saved', pdfErr: 'PDF error',
  kTrees: 'Trees calculated', kSkip: 'skipped without measurements', kC: 'Carbon storage', kCs: '≙ {0} t CO₂', kSeq: 'Sequestration',
  kPol: 'Pollution removal', kRun: 'Avoided runoff', kRunS: 'Crown area {0} m²', kVal: 'Annual value', kValS: 'excl. storage value',
  kO2: 'O₂ production', kO2S: '≈ breathing needs of {0} people',
  shC: 'CO₂ sequestration', shAir: 'Air pollutants', shRun: 'Runoff',
  hSpecies: 'Species', hId: 'ID', hType: 'Type', hDbh: 'DBH', hH: 'Height', hGround: 'Crown area', hLA: 'Leaf area', hLAI: 'LAI', hC: 'C storage', hSeq: 'C sequestr.',
  hRun: 'Avoided runoff', hO2: 'O₂ production', hVal: 'Value', hFlags: 'Notes', hSize: 'Class',
  gTree: 'Tree', gCarbon: 'Carbon', gAirG: 'Pollution removal g/yr', gWater: 'Water', gValue: 'Valuation',
  ev: 'evergreen', dec: 'deciduous', sum: 'Total ({0} trees)', none: 'No trees with DBH and height found.',
  nSkip: 'Skipped (no DBH/height): {0}', nUnits: 'Carbon in kg, sequestration and O₂ in kg/yr, pollutants in g/yr. Annual value = sequestration + pollutants + runoff, excluding the one-off storage value.',
  status: '{0} trees calculated · {1}', tCopied: 'Table copied – paste into Excel', tFirst: 'Calculate first',
  projTitle: 'Projection with growth', projSub: 'DBH increment by growing environment and condition; height and crown follow the stem (urban tree allometry), growth tapers towards the species’ max height. Constant prices, no discounting.',
  yr: 'Year {0}', pDbh: 'DBH', pC: 'C storage', pChf: 'Annual value', pCum: 'cumulative', gProjT: 'Projection year {0}',
  chartCum: 'Cumulative value CHF', chartC: 'Carbon storage kg', chartX: 'Years from today', chartO2: 'O₂ production kg/yr', chartPers: 'People supplied', today: 'Today',
  hzC: 'Carbon storage kg', hzO2: 'O₂ production kg/yr', hzSeq: 'Sequestration kg C/yr', hzRun: 'Avoided runoff m³/yr', hzPol: 'Pollution removal g/yr', hzVal: 'Annual value CHF', hzCum: 'Cumulative CHF', hzPers: 'People (O₂ needs)',
  o2Note: 'O₂ production = 32/12 × carbon sequestration (Nowak et al. 2007). An adult breathes about 300 kg O₂ per year.',
  dbhUnit: 'Stem measure in the list', uCm: 'Diameter cm', uMm: 'Diameter mm', uCirc: 'Circumference cm',
  fUnit: 'Implausible: stem thicker than 1/8 of tree height – check unit (mm? circumference?)',
  fUnknown: 'Unknown species – default broadleaf', fGenus: 'Genus-level values', fPalm: 'Palm/non-tree: biomass from height', fBase: 'Crown base estimated', fWidth: 'Crown width estimated', fBeer: 'Leaf area: Beer-Lambert (>15 m)', fDbh: 'DBH > 100 cm: extrapolated',
  modePaste: 'Paste list', modeProject: 'From project', modeProjectSub: 'Trees from the project selection with size classes',
  projFrom: 'Taken from', projNoTrees: 'The project selection contains no trees or palms. Add trees in “My Selections” and hand over again, or paste a list.',
  projEmpty: 'No trees handed over yet. Use the “Tree Benefits” button on the “My Selections” page.',
  projHint: 'Choose quantity and size class per species. The standard dimensions of the classes can be edited below.',
  qty: 'Quantity', sizeClass: 'Size class', small: 'Small', medium: 'Medium', large: 'Large',
  scTitle: 'Size classes – standard dimensions', scSub: 'Default: nursery planting stock by stem circumference (StU). Values editable, stored in your browser.',
  scLabel: 'Label', scDbh: 'DBH cm', scHeight: 'Height m', scCrown: 'Crown width m', scBase: 'Crown base m', scReset: 'Reset',
  allSmall: 'all Small', allMedium: 'all Medium', allLarge: 'all Large', remove: 'Remove', addSpecies: 'Add species', speciesPh: 'Botanical name …',
  common: 'Common name', treesTotal: '{0} trees in {1} species',
  P: {
    report: 'Tree Benefits Report', date: 'Calculated on', method: 'Method: i-Tree Eco (simplified, annual means)', by: 'Enea',
    overview: 'Overview', valueSplit: 'Annual value by service', polByType: 'Pollution removal by pollutant (g/yr)', bySpecies: 'Benefits by species', perTree: 'Results per tree', params: 'Parameters used', notes: 'Notes and assumptions',
    trees: 'Trees', storage: 'Carbon storage', storageU: 'kg C', seq: 'Sequestration', seqU: 'kg C/yr', pol: 'Pollution removal', polU: 'g/yr', run: 'Avoided runoff', runU: 'm³/yr', o2: 'O2 production', o2U: 'kg/yr', value: 'Annual value', valueU: 'CHF/yr', storageValue: 'Storage value (one-off)',
    species: 'Species', count: 'Count', cSeq: 'CO2 sequestration', air: 'Air pollutants', runoff: 'Runoff',
    hdr: ['Species', 'ID', 'Type', 'DBH cm', 'Height m', 'Crown m²', 'Leaf area m²', 'LAI', 'C kg', 'C seq. kg/yr', 'O2 kg/yr', 'CO g/yr', 'O3 g/yr', 'NO2 g/yr', 'SO2 g/yr', 'PM2.5 g/yr', 'Runoff m³/yr', 'CHF/yr', 'Notes'],
    total: 'Total', ev: 'evergreen', dec: 'deciduous', page: 'Page',
    pAir: 'Air pollutants (µg/m³, annual mean)', pClim: 'Climate', pSite: 'Site', pPrice: 'Valuation (CHF/t or CHF/m³)',
    precip: 'Precipitation mm/yr', raindays: 'Rain days', ffd: 'Frost-free days', leafon: 'Leaf-on days', landuse: 'Growing environment', surface: 'Ground surface', runoffP: 'Runoff CHF/m³',
    sizeClasses: 'Size classes (DBH cm / height m / crown m / base m)', sizeClass: 'Class',
    noteTxt: 'The calculation follows the i-Tree Eco methodology in simplified form, using annual means instead of hourly data (leaf area: Nowak 1996; biomass: Chojnacky et al. 2014; deposition: Nowak et al. 2006/2013; interception: Wang et al. 2008). Expected deviation from i-Tree Eco ±20–30 %. The annual value covers sequestration, pollution removal and avoided runoff; carbon storage is reported separately as a one-off value. Trees with DBH above 100 cm lie outside the validity range of the biomass equations and are flagged accordingly. Site and price data are editable assumptions documented in the parameter table.',
  },
  method: `<h4>Leaf area</h4><p>Nowak (1996), i-Tree Eco: <code>ln LA = −4.3309 + 0.2942·H + 0.7312·D + 5.7217·S − 0.0148·C</code> with crown height H (m), mean crown diameter D (m), species shading factor S and crown envelope area <code>C = π·D·(H+D)/2</code>. If H/D is outside 0.5–2, H or D exceed 15 m, or LAI falls outside 0.5–8, <code>LA = crown ground area · (−ln(1−S)/0.5)</code> is used instead (Beer-Lambert, as i-Tree does outside the regression range). Missing crown reduces LA proportionally.</p>
<h4>Carbon storage</h4><p>Above-ground dry biomass after Chojnacky, Heath &amp; Jenkins (2014) genus/family groups: <code>ln B = β₀ + β₁·ln DBH</code>. Roots +26 % (Cairns et al. 1997), factor 0.8 for open-grown urban trees (Nowak 1994), carbon = 50 % of biomass. DBH above 100 cm is flagged as extrapolation.</p>
<h4>Annual sequestration</h4><p>Base growth by growing environment (i-Tree: street 0.83, park 0.61, stand 0.38 cm DBH/yr), scaled by frost-free days ÷ 153, multiplied by a condition factor from crown dieback (≤10 %: 1.0 · 11–25 %: 0.76 · 26–50 %: 0.42 · 51–75 %: 0.15 · &gt;75 %: 0). Sequestration = C(DBH+growth) − C(DBH). O₂ production = 32/12 · C sequestration.</p>
<h4>Pollution removal</h4><p>Dry deposition <code>F = v_d · c · A_crown · t</code> after Nowak et al. (2006, 2013) with mean deposition velocities per crown ground area (in-leaf, day/night mean): O₃ 0.35, NO₂ 0.20, SO₂ 0.30, PM₂.₅ 0.10 cm/s (50 % resuspension deducted), CO 0.003 cm/s. Scaled by LAI via <code>(1−e^(−0.5·LAI))/(1−e^(−0.5·4))</code>. Deciduous trees out of leaf: 15 % (bare branches). Evergreens year-round.</p>
<h4>Avoided runoff</h4><p>Canopy storage per rain event <code>S = 0.2 mm·LAI + 0.1 mm</code> (Wang et al. 2008, i-Tree Hydro). Interception per event = expected value of min(P, S) for exponentially distributed event depth, × 1.8 for within-event evaporation; deciduous trees out of leaf with LAI 0.5. Avoided runoff = interception · crown ground area · surface runoff coefficient (impervious 0.9, mixed 0.5, lawn 0.25).</p>
<h4>Valuation</h4><p>CO₂ 130 CHF/t (ARE climate cost); NO₂, SO₂, PM₂.₅ after ARE air-pollution damage costs (suburban order of magnitude); O₃ and CO converted from i-Tree Eco ranges; runoff after typical Swiss stormwater fees. All prices editable. The annual value excludes the storage value, which would be carbon storage × 3.667 × CO₂ price as a one-off figure.</p>
<h4>Size classes</h4><p>Trees taken from a project selection have no measurements. They are calculated via three size classes (small, medium, large) with standard dimensions, preset to nursery planting stock by stem circumference StU 16–18, 25–30 and 40–45 cm (DBH ≈ StU/π). The standard dimensions are editable; for unknown species the evergreen/deciduous flag is taken from the plant database.</p>
<h4>Projection</h4><p>DBH grows each year by base growth × condition, damped by <code>1 − 0.9·(H/H_max)²</code> towards the species’ maximum height. Height and crown follow the stem by urban tree allometry (McPherson et al. 2016, Urban Tree Database): height ∝ DBH^0.6, crown width ∝ DBH^0.7, crown depth ∝ DBH^0.5. All services are recalculated for every year; “cumulative” is the sum of annual values from today, undiscounted, at constant prices and concentrations. Mortality and pruning are not included.</p>
<h4>Deviation from i-Tree Eco</h4><p>i-Tree runs hourly on weather and monitoring-station data; annual means are used here. Expected deviation for the main services ±20–30 %. Presets: Ostluft/NABEL annual means (rounded), MeteoSwiss norm period 1991–2020 – please check against current values or use the live lookup.</p>`,
};

export const I18N: Record<Lang, Dict> = { de, en };

/** Translate a key with positional placeholders {0}, {1}, … */
export function makeT(lang: Lang) {
  return (k: string, ...a: (string | number)[]): string => {
    let s: string | PdfStrings = I18N[lang][k] ?? I18N.de[k] ?? k;
    if (typeof s !== 'string') return k;
    a.forEach((v, i) => { s = (s as string).replace(`{${i}}`, String(v)); });
    return s;
  };
}

export type TFn = ReturnType<typeof makeT>;

export const pdfStrings = (lang: Lang): PdfStrings => I18N[lang].P;

export const locale = (lang: Lang) => (lang === 'de' ? 'de-CH' : 'en-GB');

/** Number format like the original tool: locale grouping, fixed decimals, en dash for non-finite. */
export function fmt(lang: Lang, v: number, d = 1): string {
  return Number.isFinite(v) ? v.toLocaleString(locale(lang), { minimumFractionDigits: d, maximumFractionDigits: d }) : '–';
}

const LANG_KEY = 'tree-benefits-lang';
export function loadLang(): Lang {
  try { const l = localStorage.getItem(LANG_KEY); return l === 'en' ? 'en' : 'de'; } catch { return 'de'; }
}
export function saveLang(l: Lang): void {
  try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ }
}
