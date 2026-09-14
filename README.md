# CMS Project — Fase 1 t/m 5 (multi-site)

Fase 1: databaseschema (Prisma) + authenticatie-API (Express).
Fase 2: CRUD voor pagina's, posts, categorieën en media-uploads.
Fase 3: thema-systeem (thema's + templates) en de Public Renderer die de daadwerkelijke bezoekerspagina's toont.
Fase 4: WYSIWYG theme-editor (GrapesJS) in een apart React admin-paneel (map `admin/`).
Fase 5: **multi-site** — je kunt meerdere websites beheren vanuit één installatie, elk met een eigen domein, eigen thema, content, menu, instellingen en gebruikers.

## Hoe multi-site werkt

- Elke **Site** heeft een eigen `domain` (bv. `klant-a.nl`). De publieke renderer bepaalt aan de hand van het domein waarmee bezocht wordt welke site getoond moet worden.
- Een gebruiker die een nieuwe site aanmaakt, wordt daar automatisch **ADMIN** van.
- Andere gebruikers voeg je per site toe met een rol (ADMIN/EDITOR/AUTHOR) — zij moeten wel al zelf een account hebben geregistreerd.
- De allereerste geregistreerde gebruiker op het platform wordt **SUPERADMIN** en heeft altijd toegang tot alle sites (handig als platformbeheerder).

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

## Endpoints — authenticatie

| Methode | Endpoint | Omschrijving | Auth nodig |
|---|---|---|---|
| GET | `/health` | Controleren of de server draait | Nee |
| POST | `/api/auth/register` | Nieuwe gebruiker registreren. De eerste registratie wordt automatisch SUPERADMIN, alle volgende zijn gewone USER | Nee |
| POST | `/api/auth/login` | Inloggen, retourneert een JWT | Nee |
| GET | `/api/auth/me` | Gegevens van de ingelogde gebruiker | Ja (Bearer token) |

### Voorbeeld: registreren

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jij@example.com","password":"wachtwoord123","name":"Jij"}'
```

## Endpoints — sites

| Methode | Endpoint | Omschrijving | Wie |
|---|---|---|---|
| GET | `/api/sites` | Sites waar je lid van bent (SUPERADMIN ziet alles) | Ingelogd |
| POST | `/api/sites` | Nieuwe site aanmaken — jij wordt automatisch ADMIN | Ingelogd |
| GET | `/api/sites/:siteId` | Detail van één site | Lid van die site |
| PUT | `/api/sites/:siteId` | Naam/domein bijwerken | ADMIN van die site |
| DELETE | `/api/sites/:siteId` | Site verwijderen | ADMIN van die site |
| GET | `/api/sites/:siteId/users` | Leden van deze site | ADMIN van die site |
| POST | `/api/sites/:siteId/users` | Bestaande gebruiker (op e-mail) toevoegen met een rol | ADMIN van die site |
| PUT | `/api/sites/:siteId/users/:userId` | Rol van een lid wijzigen | ADMIN van die site |
| DELETE | `/api/sites/:siteId/users/:userId` | Lid verwijderen | ADMIN van die site |

### Voorbeeld: site aanmaken

```bash
curl -X POST http://localhost:4000/api/sites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_HIER>" \
  -d '{"name":"Klant A","domain":"klant-a.nl"}'
```

Alle onderstaande endpoints hangen onder `/api/sites/:siteId/...` en vereisen dat je lid bent van die site.

## Endpoints — pagina's, posts, categorieën, media

### Pagina's — ADMIN/EDITOR van de site mogen schrijven

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET | `/api/sites/:siteId/pages` | Lijst, optioneel `?status=PUBLISHED` |
| GET | `/api/sites/:siteId/pages/:id` | Eén pagina ophalen |
| POST | `/api/sites/:siteId/pages` | Nieuwe pagina aanmaken |
| PUT | `/api/sites/:siteId/pages/:id` | Pagina bijwerken |
| DELETE | `/api/sites/:siteId/pages/:id` | Pagina verwijderen |

### Posts — elk site-lid mag eigen posts beheren, ADMIN/EDITOR mag alles

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET | `/api/sites/:siteId/posts` | Lijst, optioneel `?status=` en `?categoryId=` |
| GET | `/api/sites/:siteId/posts/:id` | Eén post ophalen |
| POST | `/api/sites/:siteId/posts` | Nieuwe post aanmaken (auteur = ingelogde gebruiker) |
| PUT | `/api/sites/:siteId/posts/:id` | Post bijwerken (eigen post, tenzij ADMIN/EDITOR) |
| DELETE | `/api/sites/:siteId/posts/:id` | Post verwijderen (eigen post, tenzij ADMIN/EDITOR) |

### Categorieën

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET | `/api/sites/:siteId/categories` | Lijst van categorieën |
| POST | `/api/sites/:siteId/categories` | Nieuwe categorie aanmaken |
| PUT | `/api/sites/:siteId/categories/:id` | Categorie bijwerken |
| DELETE | `/api/sites/:siteId/categories/:id` | Categorie verwijderen |

### Media

| Methode | Endpoint | Omschrijving |
|---|---|---|
| POST | `/api/sites/:siteId/media/upload` | Bestand uploaden (multipart form, veldnaam `file`) |
| GET | `/api/sites/:siteId/media` | Lijst van geüploade bestanden |
| DELETE | `/api/sites/:siteId/media/:id` | Bestand verwijderen (eigen bestand, of site-ADMIN) |

Geüploade bestanden zijn publiek bereikbaar via `http://localhost:4000/uploads/<bestandsnaam>` (gedeelde map, alle sites).

## Endpoints — thema's en templates

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET | `/api/sites/:siteId/themes` | Lijst van thema's van deze site |
| GET | `/api/sites/:siteId/themes/:id` | Eén thema incl. templates |
| POST | `/api/sites/:siteId/themes` | Nieuw thema aanmaken |
| PUT | `/api/sites/:siteId/themes/:id` | Thema bijwerken |
| POST | `/api/sites/:siteId/themes/:id/activate` | Dit thema actief maken |
| DELETE | `/api/sites/:siteId/themes/:id` | Thema verwijderen |
| GET | `/api/sites/:siteId/themes/:id/templates` | Templates van dit thema |
| POST | `/api/sites/:siteId/themes/:id/templates` | Nieuwe template toevoegen |
| GET/PUT/DELETE | `/api/sites/:siteId/templates/:id` | Eén template ophalen/bijwerken/verwijderen |

## Endpoints — menu's

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET/POST | `/api/sites/:siteId/menus` | Menu's van deze site |
| GET/PUT/DELETE | `/api/sites/:siteId/menus/:id` | Eén menu |
| POST | `/api/sites/:siteId/menus/:id/items` | Item toevoegen (label + pagina of losse URL) |
| PUT/DELETE | `/api/sites/:siteId/menus/:menuId/items/:itemId` | Item bijwerken/verwijderen |
| POST | `/api/sites/:siteId/menus/:menuId/items/:itemId/move` | `{"direction":"up"\|"down"}` — item één plek verschuiven |

De publieke site gebruikt automatisch het eerst aangemaakte menu van een site als hoofdnavigatie.

## Endpoints — instellingen

| Methode | Endpoint | Omschrijving |
|---|---|---|
| GET | `/api/sites/:siteId/settings` | Huidige instellingen (`siteName`, `logoUrl`) |
| PUT | `/api/sites/:siteId/settings` | Instellingen bijwerken |

## Hoe de publieke site werkt

De server bepaalt aan de hand van het domein (`req.hostname`) welke site getoond moet worden, en toont dan:

| URL | Toont |
|---|---|
| `/` | De pagina met slug `home` van die site, of een welkomstbericht |
| `/blog` | Overzicht van gepubliceerde posts (ARCHIVE-template) |
| `/blog/mijn-artikel` | Eén post (POST-template) |
| `/over-ons` | Een pagina met die slug (PAGE-template), of 404 |

Templates gebruiken Handlebars: `{{title}}`, `{{{content}}}`, `{{siteName}}`, `{{logoUrl}}`, `{{year}}`, en `{{#each menuItems}}...{{/each}}` voor de navigatie. Drievoudige accolades (`{{{ }}}`) zorgen dat HTML niet wordt "escaped".

**Belangrijk voor lokaal testen:** de publieke renderer matcht op het exacte domein. Lokaal werkt dit alleen goed als je site is aangemaakt met `domain: "localhost"` (zie het seed-script) en je de site bezoekt via `http://localhost:4000`. Op je VPS gebruik je het echte domein van de site.

## Admin-paneel (fase 4 & 5)

Het admin-paneel staat in de map `admin/` en is een apart React-project. Het praat met dezelfde backend-API.

### Installatie (lokaal ontwikkelen)

```bash
cd admin
npm install
cp .env.example .env
# Pas VITE_API_URL aan als je API niet op localhost:4000 draait
npm run dev
```

Open `http://localhost:5173` en log in. Na inloggen zie je een lijst van je websites (leeg bij de eerste keer) met een formulier om er één aan te maken.

### Wat je ermee kunt, per site

| Onderdeel | Wat je kunt doen |
|---|---|
| Thema's | Aanmaken, activeren, templates visueel bewerken met GrapesJS |
| Pagina's | Aanmaken, content visueel bewerken, publiceren, verwijderen |
| Posts | Aanmaken, categorie toekennen, content visueel bewerken, publiceren, verwijderen |
| Menu's | Menu's aanmaken, items toevoegen (naar een pagina of een losse URL), herordenen met ↑/↓ |
| Instellingen | Sitenaam en logo-URL |
| Gebruikers | Bestaande gebruikers (op e-mail) toevoegen aan de site met een rol, rol wijzigen, verwijderen |

Wijzigingen zijn **direct zichtbaar** op de publieke site van die specifieke website.

### Bouwen voor productie

```bash
cd admin
npm run build
```

Dit levert `admin/dist/` op — statische bestanden, geen Node.js nodig om te hosten.

### Live zetten

Serveer het admin-paneel op een apart (sub)domein, bv. `admin.jouwbedrijf.nl`, met een eigen Nginx-server-block. Zie `DEPLOY.md` voor de configuratie. Eén admin-installatie kan alle klantsites beheren — je hoeft het admin-paneel niet per site te installeren.

## Database bekijken

Prisma heeft een ingebouwde gui om je database te inspecteren:

```bash
npm run prisma:studio
```

## Projectstructuur

```
cms-project/
├── prisma/
│   ├── schema.prisma        # Volledig multi-site databaseschema
│   └── seed.js               # Optioneel: testsite "localhost" met basisthema
├── src/
│   ├── index.js              # Express app entrypoint
│   ├── lib/
│   │   ├── prisma.js
│   │   ├── slugify.js
│   │   └── uniqueSlug.js
│   ├── middleware/
│   │   ├── auth.js            # JWT-verificatie
│   │   └── site.js            # Site-lidmaatschap + site-rol-controle
│   ├── renderer/
│   │   ├── render.js          # Handlebars-rendering
│   │   └── publicRouter.js    # Herkent site via domein, rendert /, /blog, /:slug
│   └── routes/
│       ├── index.js
│       ├── auth.js
│       ├── sites.js           # CRUD sites + site-gebruikers
│       ├── siteResources.js   # Bundelt onderstaande routes onder /sites/:siteId
│       ├── pages.js
│       ├── posts.js
│       ├── categories.js
│       ├── media.js
│       ├── themes.js
│       ├── templates.js
│       ├── menus.js
│       └── settings.js
└── uploads/

admin/                         # Apart React-project: het beheerpaneel
└── src/
    ├── App.jsx                # Routing (incl. /sites/:siteId/...)
    ├── lib/api.js
    ├── context/AuthContext.jsx
    ├── components/
    │   ├── Layout.jsx          # Toplaag (sitelijst)
    │   ├── SiteLayout.jsx      # Zijbalk binnen een geselecteerde site
    │   ├── ProtectedRoute.jsx
    │   └── GrapesEditor.jsx
    └── pages/
        ├── LoginPage.jsx
        ├── SitesPage.jsx           # Sites overzicht/aanmaken
        ├── SiteDashboardPage.jsx
        ├── ThemesPage.jsx / ThemeDetailPage.jsx / TemplateEditorPage.jsx
        ├── PagesPage.jsx / PageEditorPage.jsx
        ├── PostsPage.jsx / PostEditorPage.jsx
        ├── MenusPage.jsx / MenuDetailPage.jsx
        ├── SettingsPage.jsx
        └── SiteUsersPage.jsx
```

## Rollen

**Platformbreed** (op de `User`):
- `SUPERADMIN` — automatisch de eerste geregistreerde gebruiker, heeft toegang tot alle sites
- `USER` — moet per site worden toegevoegd om iets te kunnen doen

**Per site** (op het lidmaatschap):
- `ADMIN` — volledige controle over die website, inclusief gebruikersbeheer
- `EDITOR` — kan content, thema's en menu's beheren
- `AUTHOR` — kan eigen posts beheren

## Mogelijke vervolgstappen

- Media-bibliotheek in het admin-paneel (nu alleen via de API)
- Tags-beheer in de posts-editor (backend ondersteunt dit al)
- E-mailuitnodigingen zodat je iemand kunt toevoegen die nog geen account heeft
- SEO-velden voor posts (pagina's hebben dit al)
