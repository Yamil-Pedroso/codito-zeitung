# Codito Zeitung

Codito Zeitung ist eine Webanwendung, die Nachrichten aus verschiedenen Schweizer Medien und Institutionen an einem Ort zusammenführt. Die Benutzeroberfläche ist auf Deutsch (`de-CH`) und verbindet eine moderne Nachrichtenstruktur mit dem visuellen Stil einer historischen Schweizer Zeitung.

Die Inhalte sollen künftig automatisch aus diesen Quellen bezogen werden:

- SRF News
- ETH Zürich
- NZZ
- WOZ

> Derzeit verwendet das Frontend Platzhaltertexte. Die echten Titel, Zusammenfassungen und Artikeltexte werden später durch den auf dem VPS laufenden Dienst eingefügt.

## Funktionen

- Responsive Vintage-Benutzeroberfläche für Desktop, Tablet und Mobilgeräte
- Nachrichtenfilter nach Kategorie
- Suche nach Titel, Beschreibung und Quelle
- Eigene Illustration für jede Nachrichtenkategorie
- Detailansicht über `#/nachricht/:id`
- Speichern-Schaltfläche für Nachrichten
- Bereich für verwandte Beiträge
- Strukturierte TypeScript-Datenmodelle für die spätere Backend-Anbindung

## Nachrichtenkategorien

- Politik, Abstimmungen & Recht
- Wirtschaft, Arbeit & Unternehmen
- Wissenschaft, Technologie & KI
- Gesundheit, Bildung & Gesellschaft
- Verkehr, SBB & Zürich
- Kultur
- Sport

## Projektstruktur

```text
codito-zeitung/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── Components/
│   │   ├── Data/
│   │   ├── Pages/
│   │   └── Types/
│   └── package.json
└── README.md
```

## Technologien

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Icons

### Backend

- Node.js
- Express 5
- TypeScript
- CORS
- dotenv

## Voraussetzungen

- Node.js 20.19 oder neuer
- npm

Frontend und Backend besitzen getrennte Abhängigkeiten und müssen daher separat installiert werden.

## Installation

Repository klonen und anschließend die Abhängigkeiten installieren:

```bash
cd codito-zeitung/frontend
npm install

cd ../backend
npm install
```

## Frontend starten

```bash
cd frontend
npm run dev
```

Vite zeigt anschließend die lokale Adresse im Terminal an.

Weitere Frontend-Befehle:

```bash
npm run build    # Produktions-Build erstellen
npm run lint     # Quellcode prüfen
npm run preview  # Produktions-Build lokal anzeigen
```

## Backend starten

```bash
cd backend
npm run dev
```

Der Express-Server verwendet standardmäßig Port `3000`. Über die Umgebungsvariable `PORT` kann ein anderer Port gesetzt werden.

```bash
PORT=4000 npm run dev
```

Der aktuelle Backend-Endpunkt ist:

```text
GET /
```

Das Backend befindet sich noch in der Grundstruktur. Die Aggregation, Normalisierung und Speicherung echter Nachrichten wird später ergänzt.

## Zentrale Frontend-Dateien

- `frontend/src/Data/news.ts` – temporäre Nachrichtendaten
- `frontend/src/Data/categoryImages.ts` – Zuordnung der Kategorien zu Bildern
- `frontend/src/Types/news.ts` – TypeScript-Modelle
- `frontend/src/Pages/HomePage.tsx` – Titelseite
- `frontend/src/Pages/NewsDetailsPage.tsx` – vollständige Nachrichtenansicht
- `frontend/src/assets/index.ts` – zentraler Export aller Bildressourcen

## Geplante Datenanbindung

Für den Produktivbetrieb auf dem VPS sollte das Backend:

1. Inhalte aus den erlaubten Quellen abrufen.
2. Artikel einer der sieben Kategorien zuordnen.
3. Titel, Zusammenfassung, Inhalt, Quelle und Veröffentlichungszeit normalisieren.
4. Doppelte Artikel erkennen und entfernen.
5. Die Daten über eine API an das Frontend liefern.
6. Auf den Originalartikel verlinken und die jeweilige Quelle klar kennzeichnen.

Beim Abruf und Anzeigen fremder Inhalte müssen die Nutzungsbedingungen, robots-Regeln und Urheberrechte der jeweiligen Quelle beachtet werden.

## Deployment auf einem VPS

Frontend für die Produktion erstellen:

```bash
cd frontend
npm ci
npm run build
```

Der fertige Build befindet sich anschließend unter `frontend/dist` und kann beispielsweise über Nginx ausgeliefert werden.

Backend installieren und starten:

```bash
cd backend
npm ci
npm run dev
```

Für den dauerhaften Produktivbetrieb sollte der Backend-Prozess über einen Process Manager oder einen systemd-Service verwaltet und hinter einem Reverse Proxy betrieben werden.

## Status

- [x] Responsive Frontend-Grundstruktur
- [x] Vintage-Designsystem
- [x] Kategorien und Filter
- [x] Kategoriespezifische Bilder
- [x] Nachrichtendetailseite
- [ ] Verbindung zwischen Frontend und Backend
- [ ] Automatischer Import echter Nachrichten
- [ ] Datenbank und Duplikaterkennung
- [ ] Produktionskonfiguration für den VPS
