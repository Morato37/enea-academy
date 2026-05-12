# Database Backup & Restore Guide

## 📦 Backup erstellt am: 2026-01-08

### Gesicherte Daten:
- **plants_flat**: 609 Pflanzen
- **plant_images**: 1000 Bilder
- **geocode_cache**: 51 Einträge
- **user_selections**: Benutzerauswahlen
- **projects**: Benutzerprojekte

### Backup-Dateien:
1. `database_backup_2026-01-08.json` - Vollständiges JSON-Backup (1.10 MB)
2. `database_backup_2026-01-08.sql` - Partial SQL-Backup (nur Metadaten)

---

## 🔄 Wiederherstellung

### Option 1: Automatische Wiederherstellung (Empfohlen)

```bash
node restore_backup.mjs database_backup_2026-01-08.json
```

Dieses Skript:
- Liest die Backup-Datei
- Stellt alle Tabellen wieder her
- Verwendet `upsert` um Konflikte zu vermeiden (bestehende Daten werden überschrieben)
- Zeigt Fortschritt für jeden Schritt

### Option 2: Manuelles SQL-Backup

Wenn du nur die Metadaten (user_selections, projects, geocode_cache) wiederherstellen möchtest:

```sql
-- Führe den Inhalt von database_backup_2026-01-08.sql aus
```

---

## 🛡️ Sicherheitshinweise

1. **Vor Änderungen**: Erstelle immer ein Backup
2. **Backup testen**: Teste die Wiederherstellung in einer Testumgebung
3. **Versionierung**: Behalte mehrere Backups mit Datum
4. **Speicherort**: Speichere Backups außerhalb des Projekts

---

## 🔧 Neues Backup erstellen

Führe jederzeit ein neues Backup aus:

```bash
node create_full_backup.mjs
```

Dies erstellt eine neue Datei: `database_backup_YYYY-MM-DD.json`

---

## 📋 Was wird NICHT gesichert

- **Auth-Daten** (Benutzer, Passwörter) - in auth.users Schema
- **Storage-Dateien** (Bilder im Storage) - nur URLs werden gesichert
- **Stones-Tabelle** - aktuell leer
- **Climate-Daten** - große Datensätze, separat sichern falls nötig

---

## ⚠️ Wichtige Hinweise

1. **IDs bleiben erhalten**: Die Wiederherstellung verwendet die Original-IDs
2. **Konflikte werden überschrieben**: Bei `upsert` werden bestehende Einträge mit gleicher ID überschrieben
3. **Reihenfolge**: Das Restore-Skript stellt Daten in der richtigen Reihenfolge wieder her (Foreign Keys)
4. **Keine Löschung**: Bestehende Daten, die nicht im Backup sind, werden NICHT gelöscht

---

## 🚨 Notfall-Wiederherstellung

Falls das Restore-Skript nicht funktioniert:

1. Öffne `database_backup_2026-01-08.json`
2. Kopiere die Daten für die benötigte Tabelle
3. Führe manuelle INSERT-Statements aus
4. Oder kontaktiere den Support

---

## 📞 Support

Bei Problemen:
1. Prüfe die Logs des Restore-Skripts
2. Stelle sicher, dass die .env-Datei korrekt konfiguriert ist
3. Prüfe die Supabase-Verbindung
