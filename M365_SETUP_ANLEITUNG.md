# Microsoft 365 Single Sign-On Einrichtungsanleitung

Diese Anleitung erklärt, wie Sie die Microsoft 365 (Azure AD) Authentifizierung in Ihre Enea Academy Anwendung integrieren.

## Übersicht

Benutzer können sich mit ihrem M365-Firmenkonto über den "Sign in with Microsoft 365" Button auf der Login-Seite anmelden. Die Integration nutzt Azure AD OAuth 2.0 und wird von Supabase verwaltet.

## Schritt 1: Informationen vom M365 Administrator

Ihr M365-Administrator muss folgende Schritte im Azure Portal durchführen:

### 1.1 App-Registrierung erstellen

1. Öffnen Sie das [Azure Portal](https://portal.azure.com)
2. Navigieren Sie zu **Azure Active Directory** > **App-Registrierungen**
3. Klicken Sie auf **Neue Registrierung**
4. Konfigurieren Sie:
   - **Name**: `Enea Academy`
   - **Unterstützte Kontotypen**: Wählen Sie `Nur Konten in diesem Organisationsverzeichnis (Einzelner Mandant)`
   - **Umleitungs-URI**: Vorerst leer lassen (wird in Schritt 2 hinzugefügt)
5. Klicken Sie auf **Registrieren**

### 1.2 Anwendungsdetails notieren

Nach der Registrierung sehen Sie die App-Übersichtsseite. **Kopieren und speichern Sie diese Werte**:

- **Anwendungs-ID (Client)**: z.B. `12345678-1234-1234-1234-123456789abc`
- **Verzeichnis-ID (Mandant)**: z.B. `87654321-4321-4321-4321-cba987654321`

### 1.3 Client-Geheimnis erstellen

1. Gehen Sie in Ihrer App-Registrierung zu **Zertifikate & Geheimnisse**
2. Klicken Sie auf **Neuer geheimer Clientschlüssel**
3. Fügen Sie eine Beschreibung hinzu (z.B. "Enea Academy Produktion")
4. Wählen Sie eine Ablaufzeit (empfohlen: 24 Monate)
5. Klicken Sie auf **Hinzufügen**
6. **Kopieren Sie sofort den Wert** (er wird nicht erneut angezeigt!)
7. Speichern Sie ihn sicher

### 1.4 API-Berechtigungen konfigurieren

1. Gehen Sie in Ihrer App-Registrierung zu **API-Berechtigungen**
2. Klicken Sie auf **Berechtigung hinzufügen**
3. Wählen Sie **Microsoft Graph**
4. Wählen Sie **Delegierte Berechtigungen**
5. Fügen Sie diese Berechtigungen hinzu:
   - `email`
   - `openid`
   - `profile`
   - `User.Read`
6. Klicken Sie auf **Berechtigungen hinzufügen**
7. Klicken Sie auf **Administratoreinwilligung erteilen** (erfordert Admin-Rechte)

## Schritt 2: Supabase-Konfiguration

### 2.1 Azure-Provider in Supabase aktivieren

1. Melden Sie sich in Ihrem [Supabase Dashboard](https://app.supabase.com) an
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu **Authentication** > **Providers**
4. Suchen Sie **Azure** in der Provider-Liste
5. Schalten Sie es auf **Enabled**

### 2.2 Azure-Einstellungen konfigurieren

Geben Sie die Werte aus Schritt 1.2 und 1.3 ein:

- **Azure Client ID**: Fügen Sie die Anwendungs-ID (Client) ein
- **Azure Secret**: Fügen Sie den Client-Geheimnis-Wert ein
- **Azure Tenant ID**: Fügen Sie die Verzeichnis-ID (Mandant) ein

### 2.3 Callback-URL kopieren

Supabase zeigt Ihnen eine **Callback-URL** (Umleitungs-URI). Sie sieht so aus:
```
https://[ihre-projekt-ref].supabase.co/auth/v1/callback
```

**Kopieren Sie diese URL** - Sie benötigen sie im nächsten Schritt.

### 2.4 Optional: Auf E-Mail-Domain beschränken

Um nur Benutzer Ihrer Firmen-Domain zuzulassen:

1. In den Azure-Provider-Einstellungen finden Sie **Email Allowlist**
2. Fügen Sie Ihre Firmen-Domain hinzu, z.B. `@ihre-firma.com`
3. Klicken Sie auf **Save**

## Schritt 3: Azure AD Umleitungs-URI aktualisieren

Zurück zum Azure Portal:

1. Navigieren Sie zu Ihrer App-Registrierung
2. Gehen Sie zu **Authentifizierung**
3. Klicken Sie auf **Plattform hinzufügen**
4. Wählen Sie **Web**
5. Fügen Sie die Callback-URL aus Schritt 2.3 ein
6. Unter **Implizite Genehmigung und Hybridflows**, aktivieren Sie:
   - ✓ ID-Token (für implizite und Hybridflows verwendet)
7. Klicken Sie auf **Konfigurieren**

## Schritt 4: Integration testen

### 4.1 Login-Flow testen

1. Öffnen Sie die Login-Seite Ihrer Anwendung
2. Klicken Sie auf **Sign in with Microsoft 365**
3. Sie sollten zu Microsoft Login weitergeleitet werden
4. Geben Sie Ihre M365-Anmeldedaten ein
5. Bestätigen Sie die Berechtigungsanfrage
6. Sie sollten zurück zur Anwendung weitergeleitet und angemeldet sein

### 4.2 Benutzerprofil überprüfen

Nach erfolgreicher Anmeldung:
- Ein Benutzerprofil wird automatisch in der Datenbank erstellt
- Name und E-Mail des Benutzers werden von M365 übernommen
- Die Standardrolle ist auf `user` gesetzt
- Keine Passwortänderung erforderlich

## Benötigte Informationen - Zusammenfassung

**Was Sie vom M365 Administrator benötigen:**

| Benötigte Information | Beispiel | Wo eintragen |
|----------------------|---------|--------------|
| Anwendungs-ID (Client) | `12345678-1234-...` | Supabase Dashboard |
| Verzeichnis-ID (Mandant) | `87654321-4321-...` | Supabase Dashboard |
| Client-Geheimnis | `abc123~xyz...` | Supabase Dashboard |

**Was der M365 Administrator vom Supabase Dashboard benötigt:**

| Benötigte Information | Wo zu finden | Wo eintragen |
|----------------------|--------------|--------------|
| Callback URL | Supabase Dashboard unter Authentication > Providers > Azure | Azure Portal in App-Registrierung > Authentifizierung |

## Code-Änderungen (bereits implementiert)

Die folgenden Änderungen wurden bereits in Ihrer Anwendung vorgenommen:

### 1. AuthContext erweitert
- Neue Funktion `signInWithAzure()` hinzugefügt
- OAuth-Flow-Handler implementiert
- Fehlerbehandlung für OAuth-spezifische Fehler

### 2. LoginForm aktualisiert
- Microsoft Login Button hinzugefügt
- Visuelle Trennung zwischen Email/Password und M365 Login
- Ladeindikator für OAuth-Redirect
- Microsoft-Branding (Logo, Farben, Text)

### 3. Datenbank-Migration
- `handle_new_user()` Funktion aktualisiert für OAuth-Benutzer
- Automatische Profilerstellung bei Erstanmeldung
- Name-Synchronisation aus M365
- Keine Passwortänderung für OAuth-Benutzer erforderlich

## Sicherheitshinweise

- **Client-Geheimnis-Ablauf**: Azure Client-Geheimnisse laufen ab. Setzen Sie eine Kalendererinnerung, um das Geheimnis vor Ablauf zu erneuern
- **Prinzip der geringsten Rechte**: Erteilen Sie nur die minimal erforderlichen API-Berechtigungen
- **Regelmäßige Audits**: Überprüfen Sie regelmäßig, wer Zugriff auf die Anwendung hat
- **MFA**: Erzwingen Sie Multi-Faktor-Authentifizierung in M365 für alle Benutzer

## Nächste Schritte

Sobald M365-Login funktioniert:

1. Testen Sie mit mehreren Benutzern aus Ihrer Organisation
2. Dokumentieren Sie den Login-Prozess für Ihre Endbenutzer
3. Optional: Deaktivieren Sie Email/Password-Login, wenn nur M365 verwendet werden soll
4. Admin-Rollen für bestimmte Benutzer in der `user_profiles` Tabelle setzen

## Support

Bei Problemen:

1. Prüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Überprüfen Sie die Supabase Auth-Logs im Dashboard
3. Stellen Sie sicher, dass alle Konfigurationswerte korrekt sind
4. Stellen Sie sicher, dass die Azure-App die richtigen Berechtigungen hat

---

**Vollständige englische Anleitung:** Siehe `M365_SETUP_GUIDE.md` für detaillierte Anweisungen und Fehlerbehebung.
