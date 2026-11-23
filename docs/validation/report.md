# Baumleistungen: Vergleich mit i-Tree MyTree

Automatisch erzeugt von `npm run validate:itree`. Ziel: Abweichung höchstens 15 % (🟢 ≤ 15 %, 🟡 ≤ 30 %, 🔴 > 30 %).
Referenz: i-Tree MyTree, synthetische Testbäume, Zustand gut, volle Sonne. Höhe für den Rechner aus der Urban Tree Database, Krone nicht gemessen.

## Zusammenfassung

| Kennzahl | Median | Median der Beträge | innerhalb ±15 % | Budget | Status |
|---|---|---|---|---|---|
| Vermiedener Abfluss | 0 % | +0 % | 364/373 | +15 % | ok |
| Regenrückhalt | +0 % | +0 % | 364/373 | +15 % | ok |
| Kohlenstoffspeicher | +0 % | +0 % | 369/373 | +15 % | ok |
| Sequestrierung | +0 % | +0 % | 343/373 | +15 % | ok |
| Schadstoffentzug | +1 % | +4 % | 343/373 | +15 % | ok |

### Referenzbäume (nicht für die Artkalibrierung verwendet)

| Kennzahl | Median | Median der Beträge | innerhalb ±15 % | Budget | Status |
|---|---|---|---|---|---|
| Vermiedener Abfluss | 0 % | +3 % | 29/38 | +15 % | ok |
| Regenrückhalt | 0 % | +3 % | 29/38 | +15 % | ok |
| Kohlenstoffspeicher | +0 % | +0 % | 38/38 | +15 % | ok |
| Sequestrierung | +0 % | +0 % | 32/38 | +15 % | ok |
| Schadstoffentzug | 0 % | +2 % | 32/38 | +15 % | ok |

### Academy-Arten (Grundlage der Artkalibrierung)

| Kennzahl | Median | Median der Beträge | innerhalb ±15 % | Budget | Status |
|---|---|---|---|---|---|
| Vermiedener Abfluss | 0 % | +0 % | 335/335 | +15 % | ok |
| Regenrückhalt | +0 % | +0 % | 335/335 | +15 % | ok |
| Kohlenstoffspeicher | 0 % | +0 % | 331/335 | +15 % | ok |
| Sequestrierung | +0 % | +0 % | 311/335 | +15 % | ok |
| Schadstoffentzug | +2 % | +4 % | 311/335 | +15 % | ok |

## Je Baum

| Test | Art | DBH cm | Standort | Abfluss | Regenrückhalt | Speicher | Sequestrierung | Schadstoffe |
|---|---|---|---|---|---|---|---|---|
| acpl20 | *Acer platanoides* | 20 | Rapperswil-Jona SG | 🟢 -3 % | 🟢 -3 % | 🟢 0 % | 🟢 +0 % | 🟢 -11 % |
| acpl45 | *Acer platanoides* | 45 | Rapperswil-Jona SG | 🟢 +1 % | 🟢 +1 % | 🟢 +0 % | 🟢 0 % | 🟢 -4 % |
| acca25 | *Acer campestre* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -4 % |
| tico15 | *Tilia cordata* | 15 | Rapperswil-Jona SG | 🟢 -14 % | 🟢 -14 % | 🟢 +0 % | 🟢 0 % | 🟡 -26 % |
| tico70 | *Tilia cordata* | 70 | Rapperswil-Jona SG | 🟢 -12 % | 🟢 -12 % | 🟢 0 % | 🟢 0 % | 🟢 -11 % |
| fasy25 | *Fagus sylvatica* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % |
| quro35 | *Quercus robur* | 35 | Rapperswil-Jona SG | 🟢 +1 % | 🟢 +1 % | 🟢 +0 % | 🟢 +0 % | 🟢 -6 % |
| quro70 | *Quercus robur* | 70 | Rapperswil-Jona SG | 🟢 -1 % | 🟢 -1 % | 🟢 0 % | 🟢 -1 % | 🟢 -2 % |
| cabe20 | *Carpinus betulus* | 20 | Rapperswil-Jona SG | 🟢 -2 % | 🟢 -2 % | 🟢 -2 % | 🟢 +0 % | 🟢 -1 % |
| cabe40 | *Carpinus betulus* | 40 | Rapperswil-Jona SG | 🟢 +10 % | 🟢 +10 % | 🟢 +1 % | 🔴 +123 % | 🟡 +20 % |
| bepe25 | *Betula pendula* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +2 % |
| frex40 | *Fraxinus excelsior* | 40 | Rapperswil-Jona SG | 🟢 +3 % | 🟢 +3 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % |
| pisy15 | *Pinus sylvestris* | 15 | Rapperswil-Jona SG | 🟢 -3 % | 🟢 -3 % | 🟢 +9 % | 🟢 0 % | 🟢 +0 % |
| pisy50 | *Pinus sylvestris* | 50 | Rapperswil-Jona SG | 🟢 -1 % | 🟢 -1 % | 🟢 -1 % | 🟢 +4 % | 🟢 +0 % |
| piab40 | *Picea abies* | 40 | Rapperswil-Jona SG | 🟢 +2 % | 🟢 +2 % | 🟢 0 % | 🟢 +0 % | 🟢 +9 % |
| aehi45 | *Aesculus hippocastanum* | 45 | Rapperswil-Jona SG | 🟢 +1 % | 🟢 +1 % | 🟢 +0 % | 🟢 0 % | 🟢 -2 % |
| prav25 | *Prunus avium* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟡 -19 % |
| gibi30 | *Ginkgo biloba* | 30 | Rapperswil-Jona SG | 🟢 +2 % | 🟢 +2 % | 🟢 +0 % | 🟢 +0 % | 🟡 -19 % |
| taba20 | *Taxus baccata* | 20 | Rapperswil-Jona SG | 🔴 +55 % | 🔴 +55 % | 🟢 +1 % | 🟢 -1 % | 🔴 +67 % |
| plac50 | *Platanus x hybrida* | 50 | Rapperswil-Jona SG | 🟢 +2 % | 🟢 +2 % | 🟢 +0 % | 🟢 0 % | 🟢 -7 % |
| acps15 | *Acer pseudoplatanus* | 15 | Rapperswil-Jona SG | 🟢 -10 % | 🟢 -10 % | 🟢 -1 % | 🟢 0 % | 🟡 -19 % |
| acps60 | *Acer pseudoplatanus* | 60 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -4 % |
| acps30_ge | *Acer pseudoplatanus* | 30 | Genève | 🔴 +41 % | 🔴 +41 % | 🟢 +0 % | 🟢 -3 % | 🟢 0 % |
| acps30 | *Acer pseudoplatanus* | 30 | Rapperswil-Jona SG | 🟢 +1 % | 🟢 +1 % | 🟢 +0 % | 🟢 +0 % | 🟢 -6 % |
| tico40 | *Tilia cordata* | 40 | Rapperswil-Jona SG | 🟢 +4 % | 🟢 +4 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % |
| pisy30 | *Pinus sylvestris* | 30 | Rapperswil-Jona SG | 🟢 -1 % | 🟢 -1 % | 🟢 -2 % | 🟢 -3 % | 🟢 +3 % |
| fasy50 | *Fagus sylvatica* | 50 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +3 % |
| acps30_zh | *Acer pseudoplatanus* | 30 | Zürich | 🟡 -22 % | 🟡 -22 % | 🟢 +0 % | 🟢 +5 % | 🟢 0 % |
| acps30_lu | *Acer pseudoplatanus* | 30 | Lugano | 🟢 +9 % | 🟢 +9 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % |
| site_Winterthur | *Acer pseudoplatanus* | 30 | Winterthur | 🟡 -24 % | 🟡 -24 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % |
| site_StGallen | *Acer pseudoplatanus* | 30 | St. Gallen | 🟢 -2 % | 🟢 -2 % | 🟢 +0 % | 🔴 -48 % | 🟢 +0 % |
| site_Luzern | *Acer pseudoplatanus* | 30 | Luzern | 🟡 -26 % | 🟡 -26 % | 🟢 +0 % | 🟢 +3 % | 🟢 0 % |
| site_Basel | *Acer pseudoplatanus* | 30 | Basel | 🔴 +99 % | 🔴 +99 % | 🟢 +0 % | 🔴 +63 % | 🟢 +0 % |
| site_Bern | *Acer pseudoplatanus* | 30 | Bern | 🟡 +22 % | 🟡 +22 % | 🟢 +0 % | 🟢 -11 % | 🟢 0 % |
| site_Chur | *Acer pseudoplatanus* | 30 | Chur | 🟢 -12 % | 🟢 -12 % | 🟢 +0 % | 🔴 -44 % | 🟢 0 % |
| site_Lausanne | *Acer pseudoplatanus* | 30 | Lausanne | 🟡 +25 % | 🟡 +25 % | 🟢 +0 % | 🟢 +10 % | 🟢 0 % |
| site_Davos | *Acer pseudoplatanus* | 30 | Davos (alpin) | 🟡 -16 % | 🟡 -16 % | 🟢 +0 % | 🔴 -68 % | 🟢 +0 % |
| site_Milano | *Acer pseudoplatanus* | 30 | Milano (IT) | 🟢 -2 % | 🟢 -2 % | 🟢 +0 % | 🔴 +57 % | 🟢 -1 % |
| acerplat25 | *Acer platanoides* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -8 % |
| acerpseu25 | *Acer pseudoplatanus* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -8 % |
| acersacc25 | *Acer saccharinum* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -2 % |
| acerrubr25 | *Acer rubrum* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -8 % |
| acercamp25 | *Acer campestre* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -4 % |
| acercapp25 | *Acer cappadocicum* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -4 % |
| acerfree25 | *Acer x freemanii* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -4 % |
| acernegu25 | *Acer negundo* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟡 -16 % |
| aceropal25 | *Acer opalus* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -4 % |
| acermons15 | *Acer monspessulanum* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -7 % |
| acerpalm15 | *Acer palmatum* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -7 % |
| acershir15 | *Acer shirasawanum* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -7 % |
| acergris15 | *Acer griseum* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -7 % |
| acerbuer25 | *Acer buergerianum* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -4 % |
| acerginn15 | *Acer ginnala* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -7 % |
| acertata15 | *Acer tataricum* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -7 % |
| aeschipp25 | *Aesculus hippocastanum* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +1 % | 🟢 -13 % |
| aesccarn25 | *Aesculus x carnea* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % | 🟢 -13 % |
| alnuglut25 | *Alnus glutinosa* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +3 % |
| alnuspae25 | *Alnus x spaethii* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +3 % |
| alnucord25 | *Alnus cordata* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +3 % |
| alnuinca25 | *Alnus incana* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +3 % |
| betupend25 | *Betula pendula* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +2 % |
| betuutil25 | *Betula utilis* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +2 % |
| betunigr25 | *Betula nigra* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % |
| betupapy25 | *Betula papyrifera* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +2 % |
| carpbetu25 | *Carpinus betulus* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +4 % |
| castsati25 | *Castanea sativa* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +5 % |
| catabign25 | *Catalpa bignonioides* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -4 % |
| celtaust25 | *Celtis australis* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🔴 +31 % | 🟢 0 % | 🟢 -7 % |
| celtocci25 | *Celtis occidentalis* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🔴 +47 % | 🟢 0 % | 🟢 -7 % |
| cercjapo25 | *Cercidiphyllum japonicum* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +4 % |
| corycolu25 | *Corylus colurna* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +8 % |
| fagusylv25 | *Fagus sylvatica* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % |
| fraxexce25 | *Fraxinus excelsior* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -5 % |
| fraxornu25 | *Fraxinus ornus* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -5 % |
| fraxangu25 | *Fraxinus angustifolia* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -5 % |
| fraxpenn25 | *Fraxinus pennsylvanica* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -11 % |
| fraxamer25 | *Fraxinus americana* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -7 % |
| ginkbilo25 | *Ginkgo biloba* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟡 -21 % |
| gledtria25 | *Gleditsia triacanthos* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % | 🟢 -14 % |
| gymndioi25 | *Gymnocladus dioicus* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +1 % | 🟢 -9 % |
| juglregi25 | *Juglans regia* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -3 % |
| juglnigr25 | *Juglans nigra* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -3 % |
| liqustyr25 | *Liquidambar styraciflua* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -1 % |
| lirituli25 | *Liriodendron tulipifera* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +5 % |
| metaglyp25 | *Metasequoia glyptostroboides* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -1 % | 🟢 +4 % |
| morualba25 | *Morus alba* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +2 % |
| morunigr25 | *Morus nigra* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % |
| nothanta25 | *Nothofagus antarctica* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +3 % |
| nysssylv25 | *Nyssa sylvatica* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +5 % |
| ostrcarp25 | *Ostrya carpinifolia* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +4 % |
| parrpers15 | *Parrotia persica* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +1 % |
| paultome25 | *Paulownia tomentosa* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +4 % |
| plathybr25 | *Platanus x hybrida* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -12 % |
| platorie25 | *Platanus orientalis* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -8 % |
| popunigr25 | *Populus nigra* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +3 % |
| popualba25 | *Populus alba* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +3 % |
| poputrem25 | *Populus tremula* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +3 % |
| popucane25 | *Populus x canescens* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +3 % |
| querrobu25 | *Quercus robur* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -10 % |
| querpetr25 | *Quercus petraea* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -10 % |
| quercerr25 | *Quercus cerris* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -10 % |
| querfrai25 | *Quercus frainetto* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -10 % |
| querpube25 | *Quercus pubescens* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -10 % |
| querrubr25 | *Quercus rubra* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -9 % |
| querpalu25 | *Quercus palustris* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟡 -22 % |
| quercocc25 | *Quercus coccinea* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -10 % |
| querphel25 | *Quercus phellos* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -8 % |
| querilex25 | *Quercus ilex* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +1 % | 🟢 -1 % |
| quersube25 | *Quercus suber* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +1 % | 🟢 -1 % |
| querhisp25 | *Quercus x hispanica* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -10 % |
| robipseu25 | *Robinia pseudoacacia* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % | 🟢 -5 % |
| salialba25 | *Salix alba* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +3 % |
| salisepu25 | *Salix x sepulcralis* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +3 % |
| sophjapo25 | *Sophora japonica* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % | 🟢 +0 % |
| stypjapo25 | *Styphnolobium japonicum* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % | 🟢 +0 % |
| tilicord25 | *Tilia cordata* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -9 % |
| tiliplat25 | *Tilia platyphyllos* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -9 % |
| tilitome25 | *Tilia tomentosa* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -7 % |
| tilieuro25 | *Tilia x europaea* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -9 % |
| tiliamer25 | *Tilia americana* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % |
| ulmuglab25 | *Ulmus glabra* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % |
| ulmumino25 | *Ulmus minor* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % |
| ulmulaev25 | *Ulmus laevis* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % |
| zelkserr25 | *Zelkova serrata* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % | 🟢 -12 % |
| zelkcarp25 | *Zelkova carpinifolia* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % | 🟢 -12 % |
| ailaalti25 | *Ailanthus altissima* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % |
| daviinvo25 | *Davidia involucrata* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +4 % |
| koelpani25 | *Koelreuteria paniculata* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % | 🟢 +2 % |
| albijuli15 | *Albizia julibrissin* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -11 % |
| phelamur25 | *Phellodendron amurense* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % | 🟢 +4 % |
| tetrdani25 | *Tetradium daniellii* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +4 % |
| pterfrax25 | *Pterocarya fraxinifolia* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +4 % |
| sorbaria25 | *Sorbus aria* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +3 % |
| sorbaucu25 | *Sorbus aucuparia* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +3 % |
| sorbinte25 | *Sorbus intermedia* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +3 % |
| sorbtorm25 | *Sorbus torminalis* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +3 % |
| sorbdome25 | *Sorbus domestica* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +3 % |
| amelarbo15 | *Amelanchier arborea* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 -2 % |
| cercsili15 | *Cercis siliquastrum* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟡 -20 % |
| cerccana15 | *Cercis canadensis* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟡 -20 % |
| cornmas15 | *Cornus mas* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % |
| cornkous15 | *Cornus kousa* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % |
| cornflor15 | *Cornus florida* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % |
| corncont15 | *Cornus controversa* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % |
| cratlaev15 | *Crataegus laevigata* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟡 -18 % |
| cratmono15 | *Crataegus monogyna* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟡 -18 % |
| cydooblo15 | *Cydonia oblonga* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % |
| dioskaki15 | *Diospyros kaki* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % |
| elaeangu15 | *Elaeagnus angustifolia* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -7 % |
| ficucari15 | *Ficus carica* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % |
| hipprham15 | *Hippophae rhamnoides* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -11 % |
| lageindi15 | *Lagerstroemia indica* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -2 % |
| magnkobu15 | *Magnolia kobus* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +3 % |
| magnsoul15 | *Magnolia x soulangeana* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +3 % |
| magnstel15 | *Magnolia stellata* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +3 % |
| magngran25 | *Magnolia grandiflora* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % | 🟢 +8 % |
| maludome15 | *Malus domestica* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟡 -20 % |
| malusylv15 | *Malus sylvestris* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟡 -20 % |
| malutori15 | *Malus toringo* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟡 -20 % |
| meliazed25 | *Melia azedarach* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +1 % | 🟢 +2 % |
| mespgerm15 | *Mespilus germanica* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % |
| prunaviu25 | *Prunus avium* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟡 -19 % |
| prunpadu25 | *Prunus padus* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟡 -19 % |
| prunserr15 | *Prunus serrulata* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🔴 -36 % |
| prunsubh15 | *Prunus x subhirtella* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟡 -16 % |
| prunyedo15 | *Prunus x yedoensis* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟡 -16 % |
| prunsarg15 | *Prunus sargentii* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟡 -16 % |
| pruncera15 | *Prunus cerasifera* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -6 % |
| prundome15 | *Prunus domestica* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟡 -16 % |
| prunpers15 | *Prunus persica* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟡 -16 % |
| prundulc15 | *Prunus dulcis* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟡 -16 % |
| prunarme15 | *Prunus armeniaca* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟡 -16 % |
| prunmaha15 | *Prunus mahaleb* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟡 -16 % |
| prunlusi15 | *Prunus lusitanica* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -4 % |
| punigran15 | *Punica granatum* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -5 % |
| pyrucomm25 | *Pyrus communis* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -10 % |
| pyrucall25 | *Pyrus calleryana* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -13 % |
| pyrusali15 | *Pyrus salicifolia* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -10 % |
| pyrupyra25 | *Pyrus pyraster* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -10 % |
| sambnigr15 | *Sambucus nigra* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % |
| syrireti15 | *Syringa reticulata* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % |
| viteagnu15 | *Vitex agnus-castus* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -8 % |
| arbuuned15 | *Arbutus unedo* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +5 % |
| eriojapo15 | *Eriobotrya japonica* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +6 % |
| laurnobi15 | *Laurus nobilis* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +6 % |
| liguluci15 | *Ligustrum lucidum* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +5 % |
| oleaeuro15 | *Olea europaea* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +3 % |
| ilexaqui15 | *Ilex aquifolium* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +6 % |
| cerasili25 | *Ceratonia siliqua* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +7 % |
| cinncamp25 | *Cinnamomum camphora* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +8 % |
| tiputipu25 | *Tipuana tipu* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +1 % | 🟢 +2 % |
| chorspec25 | *Chorisia speciosa* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -2 % |
| abiealba25 | *Abies alba* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -2 % | 🟢 +8 % |
| abienord25 | *Abies nordmanniana* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -2 % | 🟢 +8 % |
| abiekore25 | *Abies koreana* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +8 % |
| cedratla25 | *Cedrus atlantica* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -2 % | 🟢 +7 % |
| cedrdeod25 | *Cedrus deodara* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -2 % | 🟢 +7 % |
| cedrliba25 | *Cedrus libani* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -2 % | 🟢 +7 % |
| cuprsemp25 | *Cupressus sempervirens* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +8 % |
| larideci25 | *Larix decidua* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -2 % | 🟢 +5 % |
| larikaem25 | *Larix kaempferi* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -2 % | 🟢 +5 % |
| piceabie25 | *Picea abies* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +6 % |
| piceomor25 | *Picea omorika* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -2 % | 🟢 +6 % |
| picepung25 | *Picea pungens* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -3 % | 🟢 +6 % |
| piceorie25 | *Picea orientalis* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -2 % | 🟢 +6 % |
| pinusylv25 | *Pinus sylvestris* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -4 % | 🟢 +4 % |
| pinunigr25 | *Pinus nigra* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -2 % | 🟢 +3 % |
| pinustro25 | *Pinus strobus* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % | 🟢 +4 % |
| pinucemb25 | *Pinus cembra* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -3 % | 🟢 +4 % |
| pinumugo15 | *Pinus mugo* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +3 % |
| pinupine25 | *Pinus pinea* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -3 % | 🟢 +4 % |
| pinuwall25 | *Pinus wallichiana* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -4 % | 🟢 +4 % |
| pinuheld25 | *Pinus heldreichii* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +4 % |
| pinuthun25 | *Pinus thunbergii* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +4 % |
| pinuparv25 | *Pinus parviflora* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -4 % | 🟢 +4 % |
| pseumenz25 | *Pseudotsuga menziesii* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -9 % | 🟢 +5 % |
| sequgiga25 | *Sequoiadendron giganteum* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -1 % | 🟢 +8 % |
| sequsemp25 | *Sequoia sempervirens* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -2 % | 🟢 +4 % |
| taxodist25 | *Taxodium distichum* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % | 🟢 +0 % |
| taxubacc25 | *Taxus baccata* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -2 % | 🟢 +5 % |
| thujocci25 | *Thuja occidentalis* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -2 % | 🟢 +8 % |
| thujplic25 | *Thuja plicata* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -1 % | 🟢 +8 % |
| tsugcana25 | *Tsuga canadensis* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % | 🟢 +8 % |
| arauarau25 | *Araucaria araucana* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -2 % | 🟢 +4 % |
| crypjapo25 | *Cryptomeria japonica* | 25 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % | 🟢 +4 % |
| neriolea15 | *Nerium oleander* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % |
| coticogg15 | *Cotinus coggygria* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % |
| xantsorb15 | *Xanthoceras sorbifolium* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % |
| aralelat15 | *Aralia elata* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % |
| acacdeal25 | *Acacia dealbata* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % | 🟢 +4 % |
| maacamur25 | *Maackia amurensis* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +4 % |
| cladkent25 | *Cladrastis kentukea* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +1 % | 🟢 +4 % |
| toonsine25 | *Toona sinensis* | 25 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % | 🟢 +4 % |
| halecaro15 | *Halesia carolina* | 15 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % |
| labuanag15 | *Laburnum anagyroides* | 15 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % |
| acerplat55 | *Acer platanoides* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -4 % |
| acerpseu55 | *Acer pseudoplatanus* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -4 % |
| acersacc55 | *Acer saccharinum* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -3 % |
| acerrubr55 | *Acer rubrum* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -3 % |
| acercamp55 | *Acer campestre* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🔴 +4410 % | 🟢 0 % |
| acercapp55 | *Acer cappadocicum* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🔴 +4439 % | 🟢 0 % |
| acerfree55 | *Acer x freemanii* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % |
| acernegu55 | *Acer negundo* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -3 % |
| aceropal55 | *Acer opalus* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🔴 +4442 % | 🟢 0 % |
| acerbuer55 | *Acer buergerianum* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🔴 +4424 % | 🟢 0 % |
| aeschipp55 | *Aesculus hippocastanum* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -1 % | 🟢 -1 % |
| aesccarn55 | *Aesculus x carnea* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % | 🟢 -1 % |
| alnuglut55 | *Alnus glutinosa* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +8 % |
| alnuspae55 | *Alnus x spaethii* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +8 % |
| alnucord55 | *Alnus cordata* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +8 % |
| alnuinca55 | *Alnus incana* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +8 % |
| betupend55 | *Betula pendula* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +9 % |
| betuutil55 | *Betula utilis* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +9 % |
| betunigr55 | *Betula nigra* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +9 % |
| betupapy55 | *Betula papyrifera* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +9 % |
| carpbetu55 | *Carpinus betulus* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🔴 +4294 % | 🟢 +9 % |
| castsati55 | *Castanea sativa* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +10 % |
| catabign55 | *Catalpa bignonioides* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -1 % |
| celtaust55 | *Celtis australis* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🔴 +31 % | 🟢 +0 % | 🟢 +1 % |
| celtocci55 | *Celtis occidentalis* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🔴 +47 % | 🟢 +0 % | 🟢 +1 % |
| cercjapo55 | *Cercidiphyllum japonicum* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +9 % |
| corycolu55 | *Corylus colurna* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -2 % | 🟢 -2 % |
| fagusylv55 | *Fagus sylvatica* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +4 % |
| fraxexce55 | *Fraxinus excelsior* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % |
| fraxornu55 | *Fraxinus ornus* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🔴 +4452 % | 🟢 +1 % |
| fraxangu55 | *Fraxinus angustifolia* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % |
| fraxpenn55 | *Fraxinus pennsylvanica* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -4 % |
| fraxamer55 | *Fraxinus americana* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -1 % |
| ginkbilo55 | *Ginkgo biloba* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟡 -20 % |
| gledtria55 | *Gleditsia triacanthos* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -1 % | 🟢 -8 % |
| gymndioi55 | *Gymnocladus dioicus* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -1 % | 🟢 +4 % |
| juglregi55 | *Juglans regia* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -5 % |
| juglnigr55 | *Juglans nigra* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -5 % |
| liqustyr55 | *Liquidambar styraciflua* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +2 % |
| lirituli55 | *Liriodendron tulipifera* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +10 % |
| metaglyp55 | *Metasequoia glyptostroboides* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +1 % | 🟢 +9 % |
| morualba55 | *Morus alba* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +1 % |
| morunigr55 | *Morus nigra* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🔴 +4480 % | 🟢 -1 % |
| nothanta55 | *Nothofagus antarctica* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🔴 +4477 % | 🟢 +8 % |
| nysssylv55 | *Nyssa sylvatica* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +10 % |
| ostrcarp55 | *Ostrya carpinifolia* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +9 % |
| paultome55 | *Paulownia tomentosa* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +9 % |
| plathybr55 | *Platanus x hybrida* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -8 % |
| platorie55 | *Platanus orientalis* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -5 % |
| popunigr55 | *Populus nigra* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +8 % |
| popualba55 | *Populus alba* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +8 % |
| poputrem55 | *Populus tremula* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +8 % |
| popucane55 | *Populus x canescens* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +8 % |
| querrobu55 | *Quercus robur* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -4 % |
| querpetr55 | *Quercus petraea* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -4 % |
| quercerr55 | *Quercus cerris* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -4 % |
| querfrai55 | *Quercus frainetto* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🔴 +4410 % | 🟢 -4 % |
| querpube55 | *Quercus pubescens* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -4 % |
| querrubr55 | *Quercus rubra* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -2 % |
| querpalu55 | *Quercus palustris* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -12 % |
| quercocc55 | *Quercus coccinea* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -4 % |
| querphel55 | *Quercus phellos* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -12 % |
| querilex55 | *Quercus ilex* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % | 🟢 +2 % |
| quersube55 | *Quercus suber* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +2 % |
| querhisp55 | *Quercus x hispanica* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -4 % |
| robipseu55 | *Robinia pseudoacacia* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -1 % | 🟢 -4 % |
| salialba55 | *Salix alba* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +8 % |
| salisepu55 | *Salix x sepulcralis* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +8 % |
| sophjapo55 | *Sophora japonica* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -1 % | 🟢 +6 % |
| stypjapo55 | *Styphnolobium japonicum* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -1 % | 🟢 +6 % |
| tilicord55 | *Tilia cordata* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % |
| tiliplat55 | *Tilia platyphyllos* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +0 % |
| tilitome55 | *Tilia tomentosa* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -4 % |
| tilieuro55 | *Tilia x europaea* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % |
| tiliamer55 | *Tilia americana* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +5 % |
| ulmuglab55 | *Ulmus glabra* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % |
| ulmumino55 | *Ulmus minor* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % |
| ulmulaev55 | *Ulmus laevis* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🔴 +4504 % | 🟢 0 % |
| zelkserr55 | *Zelkova serrata* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % | 🟢 -8 % |
| zelkcarp55 | *Zelkova carpinifolia* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -1 % | 🟢 -8 % |
| ailaalti55 | *Ailanthus altissima* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +6 % |
| daviinvo55 | *Davidia involucrata* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +9 % |
| koelpani55 | *Koelreuteria paniculata* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -1 % | 🟢 +7 % |
| phelamur55 | *Phellodendron amurense* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -1 % | 🟢 +9 % |
| tetrdani55 | *Tetradium daniellii* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🔴 +4389 % | 🟢 +9 % |
| pterfrax55 | *Pterocarya fraxinifolia* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +9 % |
| sorbaria55 | *Sorbus aria* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🔴 +4446 % | 🟢 +8 % |
| sorbaucu55 | *Sorbus aucuparia* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +8 % |
| sorbinte55 | *Sorbus intermedia* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🔴 +4472 % | 🟢 +8 % |
| sorbtorm55 | *Sorbus torminalis* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🔴 +4473 % | 🟢 +8 % |
| sorbdome55 | *Sorbus domestica* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +8 % |
| magngran55 | *Magnolia grandiflora* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 -1 % | 🟢 +4 % |
| meliazed55 | *Melia azedarach* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -1 % | 🟢 +7 % |
| prunaviu55 | *Prunus avium* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🔴 +4452 % | 🟡 -17 % |
| prunpadu55 | *Prunus padus* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🔴 +4470 % | 🟡 -17 % |
| pyrucomm55 | *Pyrus communis* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🔴 +4472 % | 🟢 -3 % |
| pyrucall55 | *Pyrus calleryana* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 -4 % |
| pyrupyra55 | *Pyrus pyraster* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🔴 +4481 % | 🟢 -3 % |
| cerasili55 | *Ceratonia siliqua* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🔴 +4351 % | 🟢 +3 % |
| cinncamp55 | *Cinnamomum camphora* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +4 % |
| tiputipu55 | *Tipuana tipu* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 -1 % | 🟢 +7 % |
| chorspec55 | *Chorisia speciosa* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 0 % | 🟢 +3 % |
| abiealba55 | *Abies alba* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +4 % |
| abienord55 | *Abies nordmanniana* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +2 % | 🟢 +4 % |
| abiekore55 | *Abies koreana* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🔴 +4631 % | 🟢 +4 % |
| cedratla55 | *Cedrus atlantica* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +3 % |
| cedrdeod55 | *Cedrus deodara* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +3 % |
| cedrliba55 | *Cedrus libani* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +3 % |
| cuprsemp55 | *Cupressus sempervirens* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🔴 +4469 % | 🟢 +4 % |
| larideci55 | *Larix decidua* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +2 % | 🟢 +10 % |
| larikaem55 | *Larix kaempferi* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +10 % |
| piceabie55 | *Picea abies* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +5 % |
| piceomor55 | *Picea omorika* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +5 % |
| picepung55 | *Picea pungens* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +3 % | 🟢 +5 % |
| piceorie55 | *Picea orientalis* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +5 % |
| pinusylv55 | *Pinus sylvestris* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +5 % | 🟢 +1 % |
| pinunigr55 | *Pinus nigra* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +3 % |
| pinustro55 | *Pinus strobus* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +1 % | 🟢 +2 % |
| pinucemb55 | *Pinus cembra* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +4 % | 🟢 +3 % |
| pinupine55 | *Pinus pinea* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +3 % | 🟢 +3 % |
| pinuwall55 | *Pinus wallichiana* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +4 % | 🟢 +3 % |
| pinuheld55 | *Pinus heldreichii* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🔴 +4744 % | 🟢 +3 % |
| pinuthun55 | *Pinus thunbergii* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🔴 +4699 % | 🟢 +3 % |
| pinuparv55 | *Pinus parviflora* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +4 % | 🟢 +3 % |
| pseumenz55 | *Pseudotsuga menziesii* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +10 % | 🟢 +9 % |
| sequgiga55 | *Sequoiadendron giganteum* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +1 % | 🟢 +4 % |
| sequsemp55 | *Sequoia sempervirens* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +9 % |
| taxodist55 | *Taxodium distichum* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % | 🟢 +6 % |
| taxubacc55 | *Taxus baccata* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +5 % |
| thujocci55 | *Thuja occidentalis* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +2 % | 🟢 +4 % |
| thujplic55 | *Thuja plicata* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 +1 % | 🟢 +4 % |
| tsugcana55 | *Tsuga canadensis* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 +1 % | 🟢 +4 % |
| arauarau55 | *Araucaria araucana* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +2 % | 🟢 +9 % |
| crypjapo55 | *Cryptomeria japonica* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 +0 % | 🟢 +1 % | 🟢 +9 % |
| acacdeal55 | *Acacia dealbata* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 +0 % | 🟢 0 % | 🟢 +9 % |
| maacamur55 | *Maackia amurensis* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🔴 +4332 % | 🟢 +9 % |
| cladkent55 | *Cladrastis kentukea* | 55 | Rapperswil-Jona SG | 🟢 +0 % | 🟢 +0 % | 🟢 0 % | 🟢 -1 % | 🟢 +9 % |
| toonsine55 | *Toona sinensis* | 55 | Rapperswil-Jona SG | 🟢 0 % | 🟢 0 % | 🟢 0 % | 🟢 -1 % | 🟢 +9 % |
