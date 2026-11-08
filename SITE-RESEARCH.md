# SAL Education site research

Source review checked on 8 November 2026. The redesign retains the main public site’s information architecture while giving it separate page routes and a structured content store.

## Official source pages

- [SAL Education home](https://sal.edu.in/) — brand language, image assets, navigation, 2026–27 notices, contact and homepage sections.
- [Courses](https://sal.edu.in/courses) — diploma, bachelor, master and doctoral programs with published intake values.
- [Contact](https://sal.edu.in/contact) — postal address, contact numbers, email addresses and social accounts.
- [Facilities](https://sal.edu.in/facilities) — campus facilities.
- [All events](https://sal.edu.in/all-events) — event archive and event summaries.
- [News & articles](https://sal.edu.in/news-article) — news archive headlines.
- [Placement overview](https://sal.edu.in/overview) — Training & Placement Cell vision and mission.
- [International student information](https://sal.edu.in/incoming-students-study-in-india) — international student support and processes.
- [Student grievance](https://sal.edu.in/student-grievance) — grievance information and submission form.
- [SAL Education brochure](https://sal.edu.in/storage/sal-education-2026-final-c.pdf) — linked from the home page.
- [SAL Education videos](https://sal.edu.in/videos) — linked from the current site navigation.

## Carried-over information

- Contact details: SAL Education Campus, Opp. Science City, Sola Bhadaj Road, Ahmedabad – 380060, Gujarat, India; `info@sal.edu.in`; `admission@sal.edu.in`; `+91 079 67129000`; and `+91 9925195966/5536`. The home page footer separately displays `079 - 67129001 To 16`; the replacement retains both phone presentations.
- Facebook: `facebook.com/saleducationsal/`. Instagram: `instagram.com/saleducation`.
- Program titles and intake values in `content/programs.json` follow the public course list. Each program links to its relevant institute’s website for current eligibility, admissions, and course-specific details.
- The site links to ten institute and school destinations named in SAL navigation and the course list. The home page says “group of seven”; the current institute/course navigation names ten entities. The replacement lists destinations individually rather than repeating a conflicting total.
- All ten admission notices linked from the current homepage are in `content/notices.json`. Several notice schedules have passed as of the research date, so the admissions page asks students to verify current availability with the relevant institute.
- The news and events cards use headlines published on the official homepage and archives. They are presented as dated archive items, not real-time integrations.
- The resource directory preserves governance, disclosure, facilities, campus activity, media, placement, international, alumni, grievance, brochure and contact destinations.

## Proposed visual identity and assets

- `public/assets/sal-mark.svg` is an original mark concept for this redesign. It retains the SAL initials but uses a green, lime and coral web palette. SAL has not announced this as its official institutional logo.
- The hero and campus cards use image URLs already published by SAL under `/storage/banners/`. Production hosting should move approved images to the site’s own media storage once usage rights are confirmed.

## Content management

- JSON files in `content/` are the source of truth for the generated pages and the first D1 seed migration.
- The admin studio manages programs, notices, news, events and resource links. D1 public API reads hydrate those sections after deployment; generated page content remains visible if the API or database is not yet available.
- The admin area uses Cloudflare Access with signed JWT validation and an email allowlist. The Cloudflare owner still needs to create the database, apply migrations, configure Access paths and add the production domain.
