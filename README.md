# Jbalna

**Find your guide, conquer your mountain.**
Jbalna ("our mountains" in Tunisian Arabic) is a web platform that connects hikers with local mountain guides in Tunisia. Guides publish their routes and dated hikes; hikers search, book a spot and review the guide after the hike.

Projet Web, Objective 3 (development and integration of the main features)
Group 1: Mahmoud Chtourou and Mohamed Jeljli · Supervisor: Dr. Maroua Nouioua · SUP'COM 2025/2026

---

## 1. Technical choices

| Layer | Choice | Why |
|---|---|---|
| Front-end | **Angular 22** (standalone components, signals, reactive forms, SCSS) | A complete framework for a multi-page app with two kinds of accounts: routing with **guards per role** (hiker space, guide space), typed **reactive forms** for sign-up, booking, publishing and contact, and an HTTP client with **interceptors** for the login token. Everything is TypeScript, like the back-end. |
| Back-end | **Node.js + Express 5**, written in TypeScript | A light REST API in the same language as the front-end. Node 22.18+ runs the `.ts` files directly (type stripping), so there is no build step on the server. |
| Database | **MySQL 8** | The data is relational (users, routes, hikes, bookings, reviews), and SQL transactions guarantee that a hike is never overbooked. |
| Security | **JWT + bcrypt** | Stateless login token carrying the role; passwords stored as bcrypt hashes. |
| Design | Our own SCSS design system (no UI library) | Applies the charter of Objective 2 exactly: Oswald and Public Sans fonts, forest, sand, terracotta, ochre, moss and slate colours, 12 px cards, and difficulty badges written in words. |

State management: Angular **signals** (`signal`, `computed`, `linkedSignal`) hold the page state and the logged-in user. `AuthService` keeps the session in a signal and in `localStorage`; RxJS handles the HTTP calls and the search filters.

## 2. Features

The site follows the sitemap of Objective 2: one home page and four spaces. The admin space was planned as "Should have" and is not built yet.

| Page | URL | What you can do |
|---|---|---|
| Home | `/` | Quick search (mountain, date, level), "Popular this week" from the database (most booked upcoming hikes), "How it works" |
| Explore hikes | `/explore` | Text search and filters (mountain, level, date, max price), sort (date, price, guide rating, popularity). The filters are kept in the URL, so a search from the home page or a shared link opens the same results. |
| Hike details | `/hikes/:id` | Key facts, description, meeting point, guide card, and a **booking card**: choose a date of the same route, choose the number of spots, see the total, then book |
| Guides | `/guides` | All guides with rating, languages and verified badge, filtered by language spoken |
| Guide profile | `/guides/:id` | Bio, languages, upcoming hikes and reviews |
| Sign up / Log in | `/signup`, `/login` | Account with a role (hiker or guide), form validation, return to the page that asked for the login (e.g. booking) |
| My bookings (hikers only) | `/my-bookings` | Upcoming bookings (cancel before the day), past hikes with **Leave a review** (1 to 5 stars and a comment) |
| Guide dashboard (guides only) | `/dashboard` | Key figures (upcoming hikes, booked spots, rating), upcoming hikes table with spots filled and the **participants** list, **create a route**, **publish a hike** (date, price, spots, meeting point), latest reviews |
| About and FAQ | `/about`, `/about#faq` | Mission and frequently asked questions |
| Contact | `/contact` | Validated form; messages are stored in the database |

Across the site:
- **Notifications** (toasts) after each action: booked, cancelled, review sent, hike published, logged out.
- Loading skeletons, error messages with "Try again", and empty states with a next step.
- **Responsive** from 360 px phones to desktop: hamburger menu, filters folded behind "Show" on mobile, tables that scroll.
- **Accessibility**: semantic HTML (`header`, `nav`, `main`, `article`), labels on every field, keyboard focus outline, "Skip to content" link, status words never shown by colour alone, live regions for notifications and result counts, contrast at least WCAG AA.
- **Security**: role-protected pages (Angular guards) and endpoints (JWT checked on the server), validated inputs on both sides, parameterised SQL queries, and a booking transaction that locks the hike so the last spot cannot be sold twice.
- **Performance**: every page except Home is lazy-loaded; the illustrations are inline SVG (no images to download).

## 3. Running the project

### Prerequisites
- **Node.js 22.18 or later** (tested with Node 24) and npm
- **MySQL 8** running locally, with an account that can create a database

### Steps

```bash
# 1. Install the dependencies of the front-end and of the API
npm run setup

# 2. Configure the API: copy the example file and put your MySQL user and password in it
cp server/.env.example server/.env        # Windows PowerShell: Copy-Item server/.env.example server/.env

# 3. Create the database and load the demo data
#    (drops and recreates the "jbalna" database; hike dates are relative to today)
npm run db:setup

# 4. Start the API (http://localhost:3000), in a first terminal
npm run api

# 5. Start the Angular app (http://localhost:4200), in a second terminal
npm start
```

Open **http://localhost:4200**. In development the Angular server forwards `/api` calls to the API (`proxy.conf.json`).

**One-address mode:** run `npm run build`, then `npm run api`. The API also serves the built site, so everything is at http://localhost:3000.

### Demo accounts
Every demo account uses the password `jbalna123`.

| Role | Email | Has |
|---|---|---|
| Hiker | `sami@jbalna.tn` | 2 upcoming bookings and 1 past hike to review |
| Guide | `amira@jbalna.tn` | 2 routes, upcoming hikes with bookings, reviews |
| Hiker | `lina@jbalna.tn`, `tom@jbalna.tn` | Bookings and reviews |
| Guide | `karim@jbalna.tn`, `yosra@jbalna.tn` (not yet verified) | Routes and hikes |

The Log in page has buttons that fill in the hiker and guide demo accounts.

## 4. Project structure

```
jbalna/
├── src/app/                  Angular front-end
│   ├── core/                 models, services (API calls), auth (service, guard, interceptor), notifications
│   ├── layout/               header and footer
│   ├── shared/               reusable components: hike card, mountain illustration, star rating, notifications
│   └── pages/                one folder per page (home, explore, hike-detail, guides, guide-profile,
│                             login, signup, my-bookings, guide-dashboard, about, contact, not-found)
├── src/styles.scss           design tokens (colours, fonts) and shared styles (buttons, badges, forms)
├── proxy.conf.json           development proxy /api → http://localhost:3000
└── server/                   REST API
    ├── src/index.ts          Express app, error handling, serving the built site
    ├── src/api/              one router per resource: auth, hikes, routes, guides, bookings, contact
    ├── src/auth.ts           JWT sign and check, role restriction
    ├── src/db/schema.sql     MySQL tables
    └── src/db/setup.ts       creates the database and loads the demo data
```

Naming: one component per folder, named after the page (`pages/explore/explore.ts`, `.html`, `.scss`); services end in `.service.ts`.

## 5. REST API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create an account (hiker or guide), returns a token |
| POST | `/api/auth/login` | public | Log in, returns a token |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/hikes` | public | Upcoming hikes; `q`, `mountain`, `level`, `date`, `maxPrice`, `sort`, `limit` |
| GET | `/api/hikes/mountains` | public | Mountains for the filters |
| GET | `/api/hikes/:id` | public | One hike with its guide and the other dates of its route |
| POST | `/api/hikes` | guide | Publish a dated hike on one of your routes |
| GET | `/api/hikes/:id/participants` | guide (owner) | Hikers booked on your hike |
| GET | `/api/routes/mine` | guide | Your routes |
| POST | `/api/routes` | guide | Create a route |
| GET | `/api/guides` | public | All guides with rating |
| GET | `/api/guides/:id` | public | Guide profile, upcoming hikes, reviews |
| GET | `/api/guides/me/dashboard` | guide | Dashboard figures, upcoming hikes, latest reviews |
| POST | `/api/bookings` | hiker | Book spots on a hike (transaction, never overbooks) |
| GET | `/api/bookings/mine` | hiker | Your bookings |
| PATCH | `/api/bookings/:id/cancel` | hiker | Cancel before the hike |
| POST | `/api/bookings/:id/review` | hiker | Review the guide after the hike (once) |
| POST | `/api/contact` | public | Send a message to the team |

Errors come back as `{ "message": "..." }` with the right HTTP status (400, 401, 403, 404, 409, 503).

## 6. Next steps
- Admin space: verify guides, manage users, moderate content
- Interactive map of the trails and meeting points (Leaflet + OpenStreetMap)
- French and Arabic (right-to-left) versions; the language switch is already in the footer
- Favourites, messaging between hikers and guides, weather forecast for the hike day
