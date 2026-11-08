# Deploy to Cloudflare Pages

This package uses Astro to generate separate static HTML pages. Cloudflare Pages builds Astro with `npm run build` and serves the `dist` directory. The CMS API uses Cloudflare Pages Functions and D1.

## 1. Put the project in a Git repository

Commit the contents of this folder to a Git repository. If you commit the whole Codex workspace instead, set the Pages project root directory to `outputs/sal-education-cloudflare-site`.

## 2. Create and seed the D1 database

From this project directory, run:

```sh
npm install
npm run db:create
npm run db:seed:generate
npm run db:migrate:remote
```

`db:create` creates `sal-education-content` and updates `wrangler.jsonc` with the new D1 UUID. Confirm the `SAL_CONTENT` binding has a real database ID before creating the Pages deployment. The seed migration loads the program catalog, current homepage notices, recent news and events, and official resource directory.

For later site content edits, use the CMS. To change the starter seed for a fresh database, update `content/*.json`, regenerate `0002_seed.sql`, and commit it. For an existing database, make persistent data changes through the CMS or add a new numbered migration; an already-applied seed migration will not run again.

## 3. Create the Pages project

In Cloudflare, create a Pages project from the Git repository with:

- Production branch: `main` (or your chosen production branch)
- Build command: `npm run build`
- Build output directory: `dist`

The `wrangler.jsonc` D1 binding is included in the deployment. Pages deploys the static pages, assets and `functions/` directory. Generated content remains visible if the database temporarily cannot be reached.

If you configure the database through the Cloudflare dashboard instead, add a D1 binding named `SAL_CONTENT` for `sal-education-content` and redeploy.

## 4. Protect the CMS with Cloudflare Access

In Cloudflare Zero Trust, create a self-hosted Access application restricted to the chosen site hostname and admin paths. Protect both:

- `/admin*`
- `/api/admin*`

Use an Allow policy for specific administrator email addresses. The API independently validates the signed `CF-Access-JWT-Assertion` token and checks its email against `ADMIN_EMAILS`; the browser cannot write to D1 without a valid Access token and allowlisted identity.

Set these Pages environment variables for production and preview environments:

- `CF_ACCESS_TEAM_DOMAIN`: your Access team host, such as `example.cloudflareaccess.com` (without `https://`)
- `CF_ACCESS_AUD`: the Application Audience (AUD) tag from the protected Access application. If you use separate Access applications for the page and API paths, provide both AUD tags as a comma-separated list.
- `ADMIN_EMAILS`: comma-separated administrator email addresses, for example `admin@example.com,webmaster@example.com`

Protect the CMS on preview hostnames too, or disable preview deployment access to it. The API fails closed if the Access settings or D1 binding are missing.

## 5. Attach your custom domain

After the first deployment, go to **Workers & Pages → your Pages project → Custom domains → Set up a domain** and enter the domain. For an apex domain, the zone must be on Cloudflare with its nameservers pointed at Cloudflare. A subdomain can use a CNAME to the Pages `*.pages.dev` hostname, but it must still be attached through the Pages Custom domains workflow.

The package does not change DNS. After the custom domain is attached and the Pages build is ready, switch the domain’s existing production records. Review the current DNS and mail records before the cutover so email continues to work.

## Local Pages Functions preview

After binding D1 and building the public pages:

```sh
npm run build
npm run cf:dev
```

For local CMS development, apply the migrations to a local D1 database. Wrangler’s local Pages Functions runtime uses local D1 state unless you explicitly request remote access.
