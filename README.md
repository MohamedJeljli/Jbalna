# Jbalna

Jbalna ("our mountains" in Tunisian derja) is a website where hikers can find and book a local mountain guide in Tunisia. Guides post their routes and the dates of their hikes, hikers search, book a spot and leave a review after the hike.

This is our work for Objective 3 of the Projet Web course at SUP'COM (2025/2026).

Group 1: Mahmoud Chtourou and Mohamed Jeljli
Supervisor: Dr. Maroua Nouioua

## What we used

- Front-end: Angular 22 with SCSS
- Back-end: Node.js and Express 5, in TypeScript
- Database: MySQL 8
- Login: JWT tokens, passwords hashed with bcrypt

We chose Angular because the site has several pages and two kinds of accounts, so we needed routing with guards (a hiker must not open the guide dashboard) and proper forms with validation. It also lets us write TypeScript on both sides, since the API is in TypeScript too.

For the back-end we kept it small: an Express REST API. Node can run the `.ts` files directly, so the server has no build step.

We went with MySQL because the data is relational (users, routes, hikes, bookings, reviews). Booking uses a transaction so two people can't take the last spot at the same time.

We did not use a UI library. The styles are written by hand in SCSS to match the graphic charter from Objective 2 (same colours, Oswald and Public Sans fonts, difficulty badges).

## Pages

- Home (`/`): quick search and the most booked hikes of the week
- Explore (`/explore`): search with filters (mountain, level, date, max price) and sorting. The filters are saved in the URL so a search can be shared.
- Hike details (`/hikes/:id`): information about the hike, the guide, and the booking card (date, number of spots, total price)
- Guides (`/guides`) and guide profile (`/guides/:id`): list of guides with a language filter, then bio, upcoming hikes and reviews
- Sign up and log in (`/signup`, `/login`): the user picks a role, hiker or guide
- My bookings (`/my-bookings`, hikers only): upcoming bookings with cancel, past hikes with "Leave a review"
- Guide dashboard (`/dashboard`, guides only): numbers, upcoming hikes with the list of participants, create a route, publish a hike
- About and FAQ (`/about`)
- Contact (`/contact`): the messages are saved in the database

Other things we took care of:

- A notification shows up after each action (booking done, review sent, etc.)
- The site works on phone, tablet and desktop
- Every form field has a label, the site can be used with the keyboard, and the colours respect the contrast from our charter
- Pages are lazy-loaded, except the home page

The admin space from our sitemap is not done yet.

## How to run it

You need Node.js 22.18 or newer and MySQL 8 running on your machine.

1. Install the dependencies (front-end and API):

   ```bash
   npm run setup
   ```

2. Copy `server/.env.example` to `server/.env` and write your MySQL user and password in it.

3. Create the database with the demo data. Careful, this deletes the `jbalna` database if it already exists.

   ```bash
   npm run db:setup
   ```

4. Start the API in one terminal (port 3000):

   ```bash
   npm run api
   ```

5. Start the site in a second terminal (port 4200):

   ```bash
   npm start
   ```

Then open http://localhost:4200.

You can also run `npm run build` and then `npm run api` to get the whole site on http://localhost:3000 with a single terminal.

### Accounts for testing

The password is `jbalna123` for all of them.

- Hiker: `sami@jbalna.tn` (has bookings and one hike to review)
- Guide: `amira@jbalna.tn` (has routes, hikes and reviews)
- Other hikers: `lina@jbalna.tn`, `tom@jbalna.tn`
- Other guides: `karim@jbalna.tn`, `yosra@jbalna.tn`

There are two buttons on the login page that fill in the hiker and guide accounts.

## Folders

```
src/app/core/      models, services, login (guard and interceptor)
src/app/layout/    header and footer
src/app/shared/    components used in several pages (hike card, stars...)
src/app/pages/     one folder per page
src/styles.scss    colours, fonts, buttons, forms
server/src/api/    the API routes, one file per resource
server/src/db/     the SQL schema and the script that fills the database
```

## API

| Method | Route | Who | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | everyone | create an account |
| POST | `/api/auth/login` | everyone | log in |
| GET | `/api/auth/me` | logged in | current user |
| GET | `/api/hikes` | everyone | list of upcoming hikes, with filters |
| GET | `/api/hikes/mountains` | everyone | mountains for the filter |
| GET | `/api/hikes/:id` | everyone | one hike |
| POST | `/api/hikes` | guide | publish a hike |
| GET | `/api/hikes/:id/participants` | guide | hikers booked on the hike |
| GET | `/api/routes/mine` | guide | my routes |
| POST | `/api/routes` | guide | create a route |
| GET | `/api/guides` | everyone | list of guides |
| GET | `/api/guides/:id` | everyone | guide profile |
| GET | `/api/guides/me/dashboard` | guide | data for the dashboard |
| POST | `/api/bookings` | hiker | book a hike |
| GET | `/api/bookings/mine` | hiker | my bookings |
| PATCH | `/api/bookings/:id/cancel` | hiker | cancel a booking |
| POST | `/api/bookings/:id/review` | hiker | review the guide |
| POST | `/api/contact` | everyone | send a message |

## What is left to do

- Admin space (verify the guides, manage users)
- Map of the trails with Leaflet
- French and Arabic versions (the switch is already in the footer)
- Favourites and messages between hikers and guides
