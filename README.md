# CMS Project — Fase 1 & 2

Fase 1: databaseschema (Prisma) + authenticatie-API (Express).
Fase 2: CRUD voor pagina's, posts, categorieën en media-uploads.

## Vereisten

- Node.js 18+
- PostgreSQL (lokaal, of via Docker — zie hieronder)

## Installatie

```bash
# 1. Dependencies installeren
npm install

# 2. .env aanmaken op basis van het voorbeeld
cp .env.example .env
# Vul DATABASE_URL en JWT_SECRET in .env in

# 3. Geen PostgreSQL lokaal? Snel opstarten met Docker:
docker run --name cms-postgres -e POSTGRES_USER=cms_user \
  -e POSTGRES_PASSWORD=cms_password -e POSTGRES_DB=cms_db \
  -p 5432:5432 -d postgres:16

# 4. Database-tabellen aanmaken op basis van het Prisma-schema
npx prisma migrate dev --name init

# 5. Server starten (met auto-reload tijdens ontwikkelen)
npm run dev
```

De API draait daarna op `http://localhost:4000`.

## Endpoints (fase 1)

| Methode | Endpoint | Omschrijving | Auth nodig |
|---|---|---|---|
| GET | `/health` | Controleren of de server draait | Nee |
| POST | `/api/auth/register` | Nieuwe gebruiker registreren. De eerste registratie wordt automatisch ADMIN | Nee |
| POST | `/api/auth/login` | Inloggen, retourneert een JWT | Nee |
| GET | `/api/auth/me` | Gegevens van de ingelogde gebruiker | Ja (Bearer token) |

### Voorbeeld: registreren

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jij@example.com","password":"wachtwoord123","name":"Jij"}'
```

Antwoord bevat een `token` — gebruik die als volgt bij vervolgverzoeken:

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <TOKEN_HIER>"
```

## Endpoints (fase 2)

Alle schrijf-acties vereisen een `Authorization: Bearer <token>` header (zie fase 1 voor hoe je een token krijgt).

### Pagina's — alleen ADMIN/EDITOR mogen schrijven

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET | `/api/pages` | Lijst van pagina's, optioneel `?status=PUBLISHED` |
| GET | `/api/pages/:id` | Eén pagina ophalen |
| POST | `/api/pages` | Nieuwe pagina aanmaken (slug wordt automatisch gegenereerd) |
| PUT | `/api/pages/:id` | Pagina bijwerken |
| DELETE | `/api/pages/:id` | Pagina verwijderen |

### Posts — elke ingelogde gebruiker mag eigen posts beheren, ADMIN/EDITOR mag alles

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET | `/api/posts` | Lijst van posts, optioneel `?status=` en `?categoryId=` |
| GET | `/api/posts/:id` | Eén post ophalen (incl. auteur, categorie, tags) |
| POST | `/api/posts` | Nieuwe post aanmaken (auteur = ingelogde gebruiker) |
| PUT | `/api/posts/:id` | Post bijwerken (alleen eigen post, tenzij ADMIN/EDITOR) |
| DELETE | `/api/posts/:id` | Post verwijderen (alleen eigen post, tenzij ADMIN/EDITOR) |

### Categorieën — alleen ADMIN/EDITOR mogen schrijven

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET | `/api/categories` | Lijst van categorieën |
| POST | `/api/categories` | Nieuwe categorie aanmaken |
| PUT | `/api/categories/:id` | Categorie bijwerken |
| DELETE | `/api/categories/:id` | Categorie verwijderen |

### Media

| Methode | Endpoint | Omschrijving |
|---|---|---|
| POST | `/api/media/upload` | Bestand uploaden (multipart form, veldnaam `file`) |
| GET | `/api/media` | Lijst van geüploade bestanden |
| DELETE | `/api/media/:id` | Bestand verwijderen (eigen bestand, of ADMIN) |

Geüploade bestanden zijn direct publiek bereikbaar via `http://localhost:4000/uploads/<bestandsnaam>`.
Toegestane bestandstypen: jpeg, png, gif, webp, svg, pdf — max. 10 MB per bestand.

### Voorbeeld: pagina aanmaken

```bash
curl -X POST http://localhost:4000/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_HIER>" \
  -d '{"title":"Over ons","status":"PUBLISHED"}'
```

### Voorbeeld: bestand uploaden

```bash
curl -X POST http://localhost:4000/api/media/upload \
  -H "Authorization: Bearer <TOKEN_HIER>" \
  -F "file=@/pad/naar/foto.jpg"
```

## Database bekijken

Prisma heeft een ingebouwde gui om je database te inspecteren:

```bash
npm run prisma:studio
```

## Projectstructuur

```
cms-project/
├── prisma/
│   └── schema.prisma       # Volledig databaseschema (users, thema's, pagina's, posts, media, ...)
├── src/
│   ├── index.js            # Express app entrypoint
│   ├── lib/
│   │   ├── prisma.js       # Gedeelde Prisma-client
│   │   ├── slugify.js      # Titel -> URL-vriendelijke slug
│   │   └── uniqueSlug.js   # Zorgt dat een slug uniek is in de tabel
│   ├── middleware/auth.js  # JWT-verificatie en rolcontrole
│   └── routes/
│       ├── index.js        # Bundelt alle routes
│       ├── auth.js          # Registreren / inloggen / eigen profiel
│       ├── pages.js         # CRUD pagina's
│       ├── posts.js         # CRUD posts (incl. categorie & tags)
│       ├── categories.js    # CRUD categorieën
│       └── media.js         # Bestand-uploads (Multer)
└── uploads/                 # Geüploade bestanden (lokaal, wordt automatisch aangemaakt)
```

## Rollen

- `ADMIN` — volledige toegang (wordt automatisch toegekend aan de eerste registratie)
- `EDITOR` — kan content en thema's beheren
- `AUTHOR` — kan eigen posts beheren

Gebruik `requireRole("ADMIN")` of `requireRole("ADMIN", "EDITOR")` in nieuwe routes om acties te beperken tot bepaalde rollen — zie `src/middleware/auth.js`.

## Volgende fase

Fase 3: het thema-systeem — `themes` en `theme_templates` beheren, en de Public Renderer die thema + content samenvoegt tot de HTML die bezoekers te zien krijgen.
