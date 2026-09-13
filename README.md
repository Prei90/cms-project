# CMS Project — Fase 1, 2, 3 & 4

Fase 1: databaseschema (Prisma) + authenticatie-API (Express).
Fase 2: CRUD voor pagina's, posts, categorieën en media-uploads.
Fase 3: thema-systeem (thema's + templates) en de Public Renderer die de daadwerkelijke bezoekerspagina's toont.
Fase 4: WYSIWYG theme-editor (GrapesJS) in een apart React admin-paneel (map `admin/`).

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

# 6. Migraties/schema toepassen (kies wat bij jouw situatie past)
npx prisma db push          # snel, zonder migratiegeschiedenis (prima voor een solo-project)
# of: npx prisma migrate dev --name init   # met migratiegeschiedenis

# 7. Basisthema + voorbeeldpagina inladen
npm run prisma:seed

# 8. Server starten (met auto-reload tijdens ontwikkelen)
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

## Endpoints (fase 3) — thema's en templates

| Methode | Endpoint | Omschrijving | Auth nodig |
|---|---|---|---|
| GET | `/api/themes` | Lijst van thema's | Nee |
| GET | `/api/themes/:id` | Eén thema incl. templates | Nee |
| POST | `/api/themes` | Nieuw thema aanmaken | ADMIN/EDITOR |
| PUT | `/api/themes/:id` | Thema bijwerken | ADMIN/EDITOR |
| POST | `/api/themes/:id/activate` | Dit thema actief maken (deactiveert de rest) | ADMIN/EDITOR |
| DELETE | `/api/themes/:id` | Thema verwijderen | ADMIN/EDITOR |
| GET | `/api/themes/:id/templates` | Templates van dit thema | Nee |
| POST | `/api/themes/:id/templates` | Nieuwe template toevoegen (type: HEADER/FOOTER/PAGE/POST/ARCHIVE) | ADMIN/EDITOR |
| PUT | `/api/templates/:id` | HTML/CSS van een template bijwerken | ADMIN/EDITOR |
| DELETE | `/api/templates/:id` | Template verwijderen | ADMIN/EDITOR |

### Hoe de publieke site werkt

Zodra er een actief thema is (via de seed, of via `/api/themes/:id/activate`), toont de server automatisch:

| URL | Toont |
|---|---|
| `/` | De pagina met slug `home`, of een welkomstbericht als die niet bestaat |
| `/blog` | Overzicht van gepubliceerde posts (ARCHIVE-template) |
| `/blog/mijn-artikel` | Eén post (POST-template) |
| `/over-ons` | Een pagina met die slug (PAGE-template), of 404 als niet gevonden/gepubliceerd |

Templates gebruiken Handlebars-placeholders: `{{title}}`, `{{{content}}}`, `{{siteName}}`, `{{year}}`. De drievoudige accolades (`{{{ }}}`) zorgen dat HTML niet wordt "escaped" — nodig voor de content zelf.

### Voorbeeld: een tweede pagina aanmaken en meteen zien

```bash
curl -X POST http://localhost:4000/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_HIER>" \
  -d '{"title":"Over ons","status":"PUBLISHED","content":{"html":"<p>Wij zijn een bedrijf dat...</p>"}}'
```

Open daarna `http://localhost:4000/over-ons` in je browser.

## Fase 4 — Admin-paneel met WYSIWYG-editor (GrapesJS)

Het admin-paneel staat in de map `admin/` en is een apart React-project (eigen `package.json`, draait op een andere poort). Het praat met dezelfde backend-API.

### Installatie (lokaal ontwikkelen)

```bash
cd admin
npm install
cp .env.example .env
# Pas VITE_API_URL aan als je API niet op localhost:4000 draait
npm run dev
```

Open `http://localhost:5173`, log in met het account dat je bij fase 1 hebt geregistreerd (de eerste registratie is ADMIN).

### Wat je ermee kunt

| Onderdeel | Wat je kunt doen |
|---|---|
| Thema's | Nieuw thema aanmaken, activeren |
| Templates | Per thema een HEADER/FOOTER/PAGE/POST/ARCHIVE-template toevoegen, en de HTML/CSS visueel bewerken met slepen-en-neerzetten |
| Pagina's | Nieuwe pagina aanmaken, content visueel bewerken, publiceren/naar concept zetten, verwijderen |

Wijzigingen die je in de editor opslaat, zijn **direct zichtbaar** op de publieke site (fase 3) — de editor slaat gewoon HTML/CSS op via dezelfde `/api/templates/:id` en `/api/pages/:id`-endpoints die je al had.

### Bouwen voor productie

```bash
cd admin
npm run build
```

Dit levert een map `admin/dist/` op met statische bestanden (HTML/CSS/JS) — geen Node.js nodig om dit te hosten, alleen een webserver die bestanden serveert.

### Live zetten naast je bestaande site

De eenvoudigste aanpak: serveer het admin-paneel op een subdomein (bv. `admin.reitsema.tech`), met een eigen Nginx-server-block die naar `admin/dist` wijst, terwijl je API gewoon op het hoofddomein blijft draaien. Zie `DEPLOY.md` voor de volledige Nginx-configuratie hiervoor.

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
│   ├── renderer/
│   │   ├── render.js        # Combineert thema-templates + content tot HTML (Handlebars)
│   │   └── publicRouter.js  # Publieke routes: /, /blog, /blog/:slug, /:slug
│   └── routes/
│       ├── index.js        # Bundelt alle routes
│       ├── auth.js          # Registreren / inloggen / eigen profiel
│       ├── pages.js         # CRUD pagina's
│       ├── posts.js         # CRUD posts (incl. categorie & tags)
│       ├── categories.js    # CRUD categorieën
│       ├── media.js         # Bestand-uploads (Multer)
│       ├── themes.js        # CRUD thema's + templates
│       └── templates.js     # Ophalen/bijwerken/verwijderen van één template
└── uploads/                 # Geüploade bestanden (lokaal, wordt automatisch aangemaakt)

admin/                        # Apart React-project: het beheerpaneel met GrapesJS
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx               # Routing
    ├── styles.css
    ├── lib/api.js            # Fetch-wrapper naar de backend-API
    ├── context/AuthContext.jsx
    ├── components/
    │   ├── Layout.jsx         # Zijbalk-navigatie
    │   ├── ProtectedRoute.jsx # Vereist login
    │   └── GrapesEditor.jsx   # Herbruikbare WYSIWYG-editor
    └── pages/
        ├── LoginPage.jsx
        ├── DashboardPage.jsx
        ├── ThemesPage.jsx
        ├── ThemeDetailPage.jsx
        ├── TemplateEditorPage.jsx
        ├── PagesPage.jsx
        └── PageEditorPage.jsx
```

## Rollen

- `ADMIN` — volledige toegang (wordt automatisch toegekend aan de eerste registratie)
- `EDITOR` — kan content en thema's beheren
- `AUTHOR` — kan eigen posts beheren

Gebruik `requireRole("ADMIN")` of `requireRole("ADMIN", "EDITOR")` in nieuwe routes om acties te beperken tot bepaalde rollen — zie `src/middleware/auth.js`.

## Volgende fase

Het CMS is nu functioneel compleet volgens het oorspronkelijke ontwerp: authenticatie, content (pagina's/posts/media), een thema-systeem, een publieke renderer, én een visuele editor. Mogelijke vervolgstappen naar keuze:

- Een editor voor **posts** toevoegen aan het admin-paneel (zelfde patroon als pagina's).
- Een instellingenpagina (site-naam, logo) gekoppeld aan de `settings`-tabel.
- Een menu-builder gekoppeld aan de `menus`/`menu_items`-tabellen.
- SEO-velden, media-bibliotheek en gebruikersbeheer in het admin-paneel.
