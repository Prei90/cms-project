# CMS installeren op een Ubuntu 24.04 VPS

Deze handleiding gaat ervan uit dat je een verse Ubuntu 24.04 VPS hebt (bv. bij Hetzner, DigitalOcean, etc.) en toegang via SSH als root of een sudo-gebruiker.

## 1. Server bijwerken en basis-firewall instellen

```bash
sudo apt update && sudo apt upgrade -y

# Firewall: alleen SSH, HTTP en HTTPS toestaan
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 2. Node.js installeren (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Controleren
node -v   # moet v20.x tonen
npm -v
```

## 3. PostgreSQL installeren en database aanmaken

```bash
sudo apt install -y postgresql postgresql-contrib

# Inloggen als de postgres-systeemgebruiker
sudo -u postgres psql
```

Voer in de psql-prompt uit (pas het wachtwoord aan):

```sql
CREATE USER cms_user WITH PASSWORD 'kies-hier-een-sterk-wachtwoord';
CREATE DATABASE cms_db OWNER cms_user;
\q
```

## 4. Projectbestanden naar de server krijgen

Als je project in Git staat (aanbevolen):

```bash
sudo apt install -y git
cd /var/www
sudo git clone <jouw-repository-url> cms-project
sudo chown -R $USER:$USER /var/www/cms-project
```

Geen Git? Upload de map dan vanaf je eigen computer met `scp`:

```bash
scp -r cms-project jouw-gebruiker@jouw-server-ip:/var/www/
```

## 5. Dependencies installeren en configureren

```bash
cd /var/www/cms-project
npm install --omit=dev

cp .env.example .env
nano .env
```

Vul in `.env` in:

```
DATABASE_URL="postgresql://cms_user:kies-hier-een-sterk-wachtwoord@localhost:5432/cms_db?schema=public"
JWT_SECRET="genereer-een-lange-willekeurige-string"
JWT_EXPIRES_IN="7d"
PORT=4000
```

Tip om een veilige `JWT_SECRET` te genereren:

```bash
openssl rand -hex 32
```

## 6. Database-migraties uitvoeren

```bash
npx prisma migrate deploy
npx prisma generate
```

## 7. App draaiend houden met PM2

PM2 zorgt dat de app blijft draaien, ook na een crash of server-herstart.

```bash
sudo npm install -g pm2

pm2 start src/index.js --name cms-api
pm2 save

# Zorgt dat PM2 automatisch start bij een server-herstart
pm2 startup
# Voer de commando die PM2 nu toont exact uit (begint met "sudo env PATH=...")
```

Handige PM2-commando's:

```bash
pm2 status              # overzicht van draaiende processen
pm2 logs cms-api        # live logs bekijken
pm2 restart cms-api     # app herstarten na een update
```

## 8. Nginx als reverse proxy instellen

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/cms
```

Zet hierin (vervang `jouwdomein.nl`):

```nginx
server {
    listen 80;
    server_name jouwdomein.nl www.jouwdomein.nl;

    client_max_body_size 15M;  # ruimte voor media-uploads

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activeren:

```bash
sudo ln -s /etc/nginx/sites-available/cms /etc/nginx/sites-enabled/
sudo nginx -t          # test de configuratie
sudo systemctl reload nginx
```

Zorg dat je domein (A-record) al naar het IP-adres van je VPS wijst voordat je verdergaat naar SSL.

## 9. Gratis SSL-certificaat met Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d jouwdomein.nl -d www.jouwdomein.nl
```

Certbot past de Nginx-configuratie automatisch aan voor HTTPS en zet vernieuwing op een cronjob. Test de auto-vernieuwing met:

```bash
sudo certbot renew --dry-run
```

## 10. Testen

```bash
curl https://jouwdomein.nl/health
# verwacht: {"status":"ok"}
```

## Updates uitrollen (later)

Bij nieuwe code op de server:

```bash
cd /var/www/cms-project
git pull
npm install --omit=dev
npx prisma migrate deploy
pm2 restart cms-api
```

> **Let op bij de overstap naar fase 5 (multi-site):** het databaseschema is fundamenteel veranderd (elke tabel kreeg een verplichte site-koppeling). Bestaande data past niet meer in het nieuwe schema. Draai daarom eenmalig `npx prisma db push --force-reset` in plaats van de gewone migratie-commando's — dit **verwijdert alle bestaande data** en zet de database opnieuw op volgens het nieuwe schema. Maak daarna via het admin-paneel opnieuw je site(s) aan.

## Het admin-paneel (fase 4) live zetten

Het admin-paneel (`admin/`) is een apart React-project dat je als statische bestanden bouwt en via Nginx serveert — er is geen aparte Node-server voor nodig.

```bash
cd /var/www/cms-project/admin
npm install
cp .env.example .env
nano .env   # zet VITE_API_URL op https://jouwdomein.nl/api
npm run build
```

Dit levert `admin/dist/` op. Maak een los Nginx server-block voor een subdomein, bv. `admin.jouwdomein.nl`:

```bash
sudo nano /etc/nginx/sites-available/cms-admin
```

```nginx
server {
    listen 80;
    server_name admin.jouwdomein.nl;

    root /var/www/cms-project/admin/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

Activeren en SSL regelen, net als bij de hoofdsite:

```bash
sudo ln -s /etc/nginx/sites-available/cms-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d admin.jouwdomein.nl
```

Zorg dat je een DNS A-record voor `admin.jouwdomein.nl` naar hetzelfde IP hebt staan voordat je Certbot draait.

Na een update van de admin-code: `git pull`, `npm install`, `npm run build` — de nieuwe `dist/`-bestanden zijn direct live, een herstart is niet nodig omdat Nginx alleen statische bestanden serveert.

## Checklist samengevat

| Onderdeel | Doel |
|---|---|
| Node.js 20.x | Runtime voor de app |
| PostgreSQL | Database |
| PM2 | Houdt de app draaiend, herstart automatisch |
| Nginx | Reverse proxy, verdeelt verkeer naar poort 4000 |
| Certbot | Gratis SSL/HTTPS |
| ufw | Firewall, alleen 22/80/443 open |

## Een extra website (domein) toevoegen (fase 5, multi-site)

Vanaf fase 5 draait er nog steeds maar **één** Node-app en **één** database op je VPS — die bedient alle sites tegelijk, want de app herkent per binnenkomend verzoek welke site het is aan de hand van het domein. Voor elk nieuw domein moet je wel:

1. **DNS**: een A-record voor het nieuwe domein naar het IP van je VPS.
2. **Nginx**: een nieuw server-block, identiek aan je bestaande config maar met een ander `server_name`, dat naar dezelfde poort 4000 proxyt:

```bash
sudo nano /etc/nginx/sites-available/klant-a
```

```nginx
server {
    listen 80;
    server_name klant-a.nl www.klant-a.nl;

    client_max_body_size 15M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/klant-a /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d klant-a.nl -d www.klant-a.nl
```

3. **In het admin-paneel**: maak de site aan (`SitesPage`) met exact hetzelfde domein (`klant-a.nl`, zonder `www.` en zonder `https://`) als bij `server_name` hierboven.

Dat is alles — geen herstart van de Node-app nodig, want de site-herkenning gebeurt live per verzoek op basis van het domein.
