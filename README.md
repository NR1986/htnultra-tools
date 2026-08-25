# HTNUltra Tools

Eine Sammlung praktischer Userscripts für **HTN Ultra**, die verschiedene Bereiche des Spiels komfortabler und übersichtlicher machen.

Die Scripts erweitern ausschließlich die Darstellung und Bedienung im Browser und können beispielsweise mit **Tampermonkey** oder einem vergleichbaren Userscript-Manager verwendet werden.

> **Hinweis:** Dieses Projekt ist ein privates Community-Projekt und steht in keiner offiziellen Verbindung zu HTN Ultra bzw. den Betreibern von htnultra.de.

---

## 📦 Enthaltene Scripts

### 🧹 HTN Ultra Upgrade-Ausblender

**Datei:**  
`HTN-Ultra-Upgrade-Ausblender.user.js`

Blendet bestimmte Einträge aus der Upgrade-Liste aus, die man beispielsweise bei der täglichen Verwaltung vieler Computer nicht ständig sehen möchte.

Aktuell ausgeblendet werden:

- Malware Kit
- Trojaner
- SDK
- Remote Hijack

### Funktionen

- automatisches Ausblenden der definierten Upgrades
- über das Tampermonkey-Menü aktivierbar/deaktivierbar
- Einstellung wird lokal im Browser gespeichert
- reagiert auch auf dynamisch neu geladene Inhalte
- automatische Update-Unterstützung über GitHub

---

### 🖥️ Computerliste gruppieren und ausblenden

**Datei:**  
`HTN.ultra Computerliste gruppieren und ausblenden-2.0.0.user.js`

Eine umfangreiche Erweiterung für die Liste aller Computer.

Besonders bei vielen eigenen bzw. übernommenen Computern kann die Standardliste schnell unübersichtlich werden. Das Script ergänzt deshalb verschiedene Möglichkeiten zum Gruppieren, Filtern und Ausblenden.

### Gruppierungsmöglichkeiten

Unter anderem nach:

- Land
- Land + Subnetz
- IP-Subnetz
- erstem IP-Block
- letztem IP-Block
- Status
- Punkten
- Geld
- Upgrade-Status
- Anzahl laufender Upgrades
- Upgrade-Endzeit
- Angriffsmöglichkeit
- Hijack-Status
- Hijack-Level
- Betriebssystem
- Namenspräfix
- PC-Nummer
- eigenem regulären Ausdruck

Gruppen können außerdem ein- und ausgeklappt werden.

### Computer ausblenden

Einzelne Computer können manuell ausgeblendet werden.

Zusätzlich können automatische Regeln verwendet werden, beispielsweise:

- Name enthält bestimmten Text
- Land entspricht einem Filter
- bestimmte IP
- Status
- Punkte unter/über einem Grenzwert
- Geld unter/über einem Grenzwert
- Angriff möglich/nicht möglich
- Hijack verfügbar/nicht verfügbar
- Upgrade läuft
- kein Upgrade läuft
- Computer ist offline

Auch komplette Gruppen können ausgeblendet werden.

Die Einstellungen werden lokal im Browser gespeichert.

---

### 🌍 ISO-3166-1 PC-Namengenerator

**Datei:**  
`ISO-3166-1_Namengenerator.user.js`

Dieses Script unterstützt beim automatischen Benennen vieler Computer.

HTN verwendet im dritten Oktett der Spiel-IP eine Länderkennung auf Basis internationaler Telefonvorwahlen.

Beispiel:

```text
10.47.61.31
```

`61` entspricht der internationalen Telefonvorwahl von Australien.

Das Script erkennt daraus:

```text
AU
```

und kombiniert den ISO-Ländercode mit dem letzten Oktett:

```text
AU31
```

### Beispiel

```text
10.47.49.15 → DE15
10.47.61.31 → AU31
10.47.81.7  → JP7
10.47.44.22 → GB22
```

### Funktionen

- automatische Erkennung des Landes anhand der HTN-IP
- ISO-3166-1-Ländercodes
- Kombination aus Länderkennung und letztem IP-Oktett
- Button direkt auf der Seite zum Umbenennen aller Computer
- zusätzlich über das Userscript-Menü ausführbar
- ausführliches Aktionslog
- unbekannte Länderkennungen werden übersprungen
- Änderungen werden zunächst nur in die Eingabefelder eingetragen

> Die Namen werden **nicht automatisch gespeichert**.  
> Nach der Kontrolle muss weiterhin manuell auf **Speichern** geklickt werden.

---

# 🚀 Installation

## 1. Userscript-Manager installieren

Benötigt wird ein Browser-Addon wie:

**Tampermonkey**

Unterstützte Browser sind beispielsweise:

- Firefox
- Chrome
- Edge
- Chromium-basierte Browser

Andere kompatible Userscript-Manager können ebenfalls funktionieren.

---

## 2. Gewünschtes Script installieren

Im Repository die gewünschte `.user.js`-Datei öffnen.

Anschließend auf:

**Raw**

klicken.

Der Userscript-Manager sollte das Script automatisch erkennen und die Installation anbieten.

Repository:

```text
https://github.com/NR1986/htnultra-tools
```

---

# 🔄 Updates

Scripts, die eine `@updateURL` und `@downloadURL` besitzen, können von kompatiblen Userscript-Managern automatisch über dieses GitHub-Repository aktualisiert werden.

Dadurch müssen neue Versionen nicht jedes Mal manuell installiert werden.

---

# 💾 Einstellungen

Die Scripts speichern ihre Einstellungen ausschließlich lokal im Browser.

Dazu wird je nach Script unter anderem verwendet:

```text
localStorage
```

Dadurch bleiben beispielsweise folgende Einstellungen erhalten:

- gewählte Gruppierung
- eingeklappte Gruppen
- ausgeblendete Computer
- ausgeblendete Gruppen
- Filterregeln
- Aktivierungsstatus einzelner Funktionen

Die Daten werden nicht an einen externen Server dieses Projekts übertragen.

---

# ⚠️ Voraussetzungen

Die Scripts sind für folgende Webseite vorgesehen:

```text
https://www.htnultra.de/
```

Sie greifen auf die aktuelle HTML-Struktur von HTN Ultra zu.

Ändert sich die Webseite, können einzelne Funktionen vorübergehend nicht mehr funktionieren und müssen entsprechend angepasst werden.

---

# 🐛 Fehler melden

Sollte ein Script nicht mehr funktionieren, kann über GitHub ein Issue erstellt werden.

Bitte möglichst folgende Informationen angeben:

- betroffenes Script
- Script-Version
- verwendeter Browser
- verwendeter Userscript-Manager
- Beschreibung des Fehlers
- Browser-Konsole bzw. Fehlermeldung, sofern vorhanden
- Screenshot, falls hilfreich

Issues:

```text
https://github.com/NR1986/htnultra-tools/issues
```

---

# 💡 Ideen und Erweiterungen

Neue Ideen für HTN-Ultra-Helfer sind willkommen.

Mögliche zukünftige Erweiterungen könnten beispielsweise sein:

- zusätzliche Filter für die Computerliste
- weitere Gruppierungsarten
- komfortablere Massenverwaltung
- Statistikfunktionen
- zusätzliche Namensschemata
- Export-/Import-Funktionen
- gemeinsame Einstellungsoberfläche für mehrere Tools

---

# 🔐 Datenschutz

Die Scripts laufen lokal im Browser.

Es werden durch dieses Projekt keine:

- Passwörter
- Login-Daten
- HTN-Accounts
- persönlichen Daten

an einen externen Server übertragen.

---

# ⚖️ Haftungsausschluss

Die Verwendung der Scripts erfolgt auf eigene Verantwortung.

Es wird keine Garantie dafür übernommen, dass:

- die Scripts jederzeit funktionieren
- Änderungen an HTN Ultra nicht zu Fehlern führen
- durch die Verwendung keine unerwarteten Auswirkungen auftreten

Vor Massenänderungen – insbesondere beim Umbenennen vieler Computer – sollten die erzeugten Werte kontrolliert werden.

---

# 🤝 Community-Projekt

**HTNUltra Tools** ist ein inoffizielles Community-Projekt.

Es besteht keine offizielle Verbindung oder Partnerschaft mit **HTN Ultra** oder dessen Betreibern.

---

## 👤 Autor

**NinoRossi**

GitHub:  
`NR1986`

---

## ⭐ Repository

Wenn dir die Tools helfen, kannst du dem Repository gerne einen ⭐ geben.

Weitere Scripts und Verbesserungen können hier ergänzt werden:

```text
https://github.com/NR1986/htnultra-tools
```
