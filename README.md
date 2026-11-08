# SAL Education Cloudflare site

A full, multi-page redesign of the SAL Education public site, with a protected content studio for maintaining programs, admission notices, news, events and resource links. It is built with Astro as a static multi-page site and uses Cloudflare Pages Functions plus D1 for the CMS API.

## Local preview

```sh
npm install
npm run dev
```

The Astro development server previews the public pages. The CMS needs the Cloudflare Pages Functions runtime and a D1 database; use `npm run build` then `npm run cf:dev` after configuring a local or remote D1 binding.

## Included

- Separate pages for home, About, programs, institutes, admissions, campus life, placements, international, events, news, contact, resources, alumni and student grievance.
- Ten institute summary pages with each institute’s official site and associated programs.
- Searchable programs with published intake values, 2026–27 admission circulars, current contacts and original SAL-hosted photos.
- `/admin/` content studio for creating, editing, publishing, hiding, ordering and deleting programs, notices, news, events and resources.
- Cloudflare Access JWT verification and an email allowlist in the admin API; Cloudflare Access also needs to protect the `/admin*` and `/api/admin*` paths on the deployed hostname.
- D1 seed content generated from `content/*.json` and loaded through versioned migrations.
- Responsive layouts, keyboard-accessible navigation, reduced-motion support and search/filter interactions.

See [Cloudflare deployment](DEPLOY-CLOUDFLARE.md) for D1, Access, Pages and custom-domain setup. See [site research](SITE-RESEARCH.md) for source notes.

## Current architecture boundary

This is a deployable website package, but it has not been connected to a Cloudflare account or a custom domain. The public site works as generated static pages. The CMS becomes writable after the owner creates and binds D1, applies the migrations, sets the Access variables and protects the admin paths.

Inquiry forms prepare an email draft to `admission@sal.edu.in`; they do not collect visitor data on a server. Institute pages, campus details and official circular PDFs link to SAL’s existing sites. Campus imagery currently loads from SAL-hosted image URLs.
