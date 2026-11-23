# Baumleistungen: Vergleich mit i-Tree MyTree

Automatisch erzeugt von `npm run validate:itree`. Ziel: Abweichung höchstens 15 % (🟢 ≤ 15 %, 🟡 ≤ 30 %, 🔴 > 30 %).
Referenz: i-Tree MyTree, synthetische Testbäume, Zustand gut, volle Sonne. Höhe für den Rechner aus der Urban Tree Database, Krone nicht gemessen.

## Zusammenfassung

| Kennzahl | Median | Median der Beträge | innerhalb ±15 % | Budget | Status |
|---|---|---|---|---|---|
| Vermiedener Abfluss | -6 % | +24 % | 11/38 | +30 % | ok |
| Regenrückhalt | -6 % | +24 % | 11/38 | +30 % | ok |
| Kohlenstoffspeicher | +8 % | +8 % | 29/38 | +15 % | ok |
| Sequestrierung | +4 % | +16 % | 18/38 | +20 % | ok |
| Schadstoffentzug | -21 % | +29 % | 9/38 | +35 % | ok |

## Je Baum

| Test | Art | DBH cm | Standort | Abfluss | Regenrückhalt | Speicher | Sequestrierung | Schadstoffe |
|---|---|---|---|---|---|---|---|---|
| acpl20 | *Acer platanoides* | 20 | Rapperswil-Jona SG | 🔴 +77 % | 🔴 +77 % | 🟢 +13 % | 🟢 +3 % | 🔴 +35 % |
| acpl45 | *Acer platanoides* | 45 | Rapperswil-Jona SG | 🔴 +152 % | 🔴 +152 % | 🟢 +8 % | 🟢 -3 % | 🔴 +83 % |
| acca25 | *Acer campestre* | 25 | Rapperswil-Jona SG | 🟡 -17 % | 🟡 -17 % | 🟢 +7 % | 🟡 +19 % | 🔴 -40 % |
| tico15 | *Tilia cordata* | 15 | Rapperswil-Jona SG | 🔴 -37 % | 🔴 -37 % | 🟢 +2 % | 🟢 +4 % | 🔴 -49 % |
| tico70 | *Tilia cordata* | 70 | Rapperswil-Jona SG | 🟡 +28 % | 🟡 +28 % | 🟢 -15 % | 🟢 -12 % | 🟡 -19 % |
| fasy25 | *Fagus sylvatica* | 25 | Rapperswil-Jona SG | 🟢 +6 % | 🟢 +6 % | 🟢 -9 % | 🟢 +2 % | 🟡 -29 % |
| quro35 | *Quercus robur* | 35 | Rapperswil-Jona SG | 🟢 -1 % | 🟢 -1 % | 🟢 +6 % | 🟢 +14 % | 🟡 -25 % |
| quro70 | *Quercus robur* | 70 | Rapperswil-Jona SG | 🔴 +35 % | 🔴 +35 % | 🟡 +28 % | 🔴 +37 % | 🟢 -8 % |
| cabe20 | *Carpinus betulus* | 20 | Rapperswil-Jona SG | 🔴 -50 % | 🔴 -50 % | 🟢 -12 % | 🟢 -6 % | 🔴 -68 % |
| cabe40 | *Carpinus betulus* | 40 | Rapperswil-Jona SG | 🟢 -7 % | 🟢 -7 % | 🟡 -16 % | 🔴 +95 % | 🔴 -53 % |
| bepe25 | *Betula pendula* | 25 | Rapperswil-Jona SG | 🟢 -5 % | 🟢 -5 % | 🟢 -2 % | 🟡 -16 % | 🔴 -40 % |
| frex40 | *Fraxinus excelsior* | 40 | Rapperswil-Jona SG | 🟡 +17 % | 🟡 +17 % | 🟢 +7 % | 🟢 -5 % | 🟡 -20 % |
| pisy15 | *Pinus sylvestris* | 15 | Rapperswil-Jona SG | 🟡 -20 % | 🟡 -20 % | 🟢 -1 % | 🟢 -7 % | 🔴 -44 % |
| pisy50 | *Pinus sylvestris* | 50 | Rapperswil-Jona SG | 🟢 +2 % | 🟢 +2 % | 🟡 +16 % | 🟡 +24 % | 🟡 -20 % |
| piab40 | *Picea abies* | 40 | Rapperswil-Jona SG | 🔴 +63 % | 🔴 +63 % | 🟡 -28 % | 🟡 -18 % | 🟢 -12 % |
| aehi45 | *Aesculus hippocastanum* | 45 | Rapperswil-Jona SG | 🔴 -46 % | 🔴 -46 % | 🔴 -39 % | 🔴 -40 % | 🔴 -62 % |
| prav25 | *Prunus avium* | 25 | Rapperswil-Jona SG | 🟡 -25 % | 🟡 -25 % | 🟡 -24 % | 🟡 -25 % | 🔴 -39 % |
| gibi30 | *Ginkgo biloba* | 30 | Rapperswil-Jona SG | 🔴 -54 % | 🔴 -54 % | 🔴 +131 % | 🔴 +135 % | 🔴 -62 % |
| taba20 | *Taxus baccata* | 20 | Rapperswil-Jona SG | 🔴 +40 % | 🔴 +40 % | 🟡 -21 % | 🔴 -37 % | 🔴 -32 % |
| plac50 | *Platanus x hybrida* | 50 | Rapperswil-Jona SG | 🟡 +24 % | 🟡 +24 % | 🔴 +31 % | 🟡 +28 % | 🟢 -5 % |
| acps15 | *Acer pseudoplatanus* | 15 | Rapperswil-Jona SG | 🔴 -39 % | 🔴 -39 % | 🟢 +13 % | 🟡 +18 % | 🔴 -53 % |
| acps60 | *Acer pseudoplatanus* | 60 | Rapperswil-Jona SG | 🟢 +9 % | 🟢 +9 % | 🟢 +2 % | 🟢 +7 % | 🟡 -23 % |
| acps30_ge | *Acer pseudoplatanus* | 30 | Genève | 🟡 +22 % | 🟡 +22 % | 🟢 +8 % | 🟢 +9 % | 🟢 +1 % |
| acps30 | *Acer pseudoplatanus* | 30 | Rapperswil-Jona SG | 🟢 -12 % | 🟢 -12 % | 🟢 +8 % | 🟢 +13 % | 🔴 -34 % |
| tico40 | *Tilia cordata* | 40 | Rapperswil-Jona SG | 🟡 +18 % | 🟡 +18 % | 🟢 -9 % | 🟢 -7 % | 🟢 -15 % |
| pisy30 | *Pinus sylvestris* | 30 | Rapperswil-Jona SG | 🟢 -7 % | 🟢 -7 % | 🟢 +3 % | 🟢 +4 % | 🔴 -34 % |
| fasy50 | *Fagus sylvatica* | 50 | Rapperswil-Jona SG | 🔴 +39 % | 🔴 +39 % | 🟢 -13 % | 🟢 -2 % | 🟡 -16 % |
| acps30_zh | *Acer pseudoplatanus* | 30 | Zürich | 🔴 -33 % | 🔴 -33 % | 🟢 +8 % | 🟡 +19 % | 🟡 +17 % |
| acps30_lu | *Acer pseudoplatanus* | 30 | Lugano | 🟢 -6 % | 🟢 -6 % | 🟢 +8 % | 🟢 +12 % | 🟡 +24 % |
| site_Winterthur | *Acer pseudoplatanus* | 30 | Winterthur | 🔴 -34 % | 🔴 -34 % | 🟢 +8 % | 🟢 +13 % | 🟢 +12 % |
| site_StGallen | *Acer pseudoplatanus* | 30 | St. Gallen | 🟡 -15 % | 🟡 -15 % | 🟢 +8 % | 🔴 -42 % | 🔴 -38 % |
| site_Luzern | *Acer pseudoplatanus* | 30 | Luzern | 🔴 -36 % | 🔴 -36 % | 🟢 +8 % | 🟡 +16 % | 🟡 +18 % |
| site_Basel | *Acer pseudoplatanus* | 30 | Basel | 🔴 +72 % | 🔴 +72 % | 🟢 +8 % | 🔴 +83 % | 🔴 +39 % |
| site_Bern | *Acer pseudoplatanus* | 30 | Bern | 🟢 +5 % | 🟢 +6 % | 🟢 +8 % | 🟢 0 % | 🟢 -1 % |
| site_Chur | *Acer pseudoplatanus* | 30 | Chur | 🟡 -24 % | 🟡 -24 % | 🟢 +8 % | 🔴 -37 % | 🟡 -29 % |
| site_Lausanne | *Acer pseudoplatanus* | 30 | Lausanne | 🟢 +8 % | 🟢 +8 % | 🟢 +8 % | 🟡 +24 % | 🟢 -2 % |
| site_Davos | *Acer pseudoplatanus* | 30 | Davos (alpin) | 🟡 -28 % | 🟡 -27 % | 🟢 +8 % | 🔴 -64 % | 🔴 -43 % |
| site_Milano | *Acer pseudoplatanus* | 30 | Milano (IT) | 🟡 -15 % | 🟡 -15 % | 🟢 +8 % | 🔴 +77 % | 🟢 +14 % |
