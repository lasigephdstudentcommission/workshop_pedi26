# Workshop PediPaper GO

A GitHub Pages friendly web app for a location-based team quiz. Teams use one phone, choose a team name, answer 18 questions in 6 batches of 3, and unlock the next batch only when they reach the next checkpoint area.

## What this project does

- Hosts the website on GitHub Pages.
- Stores team names, answers, stage progress, and scores online in Supabase.
- Stores start time, finish time, and elapsed seconds online for score tie-breaks.
- Shows the next checkpoint only after each batch is submitted.
- Uses browser geolocation to unlock each next batch when the team is within a configurable radius, default 80 m.
- Includes a quizmaster dashboard with a password gate and CSV export.

## Important security note

Because GitHub Pages is a static hosting service, it cannot keep real secrets on the server side. GitHub says Pages publishes static files from a repository, and GitHub Pages itself is a static site hosting service.
That means the password in `admin.html` is only a front-end lock for convenience. It is **not secure** against a technical user who opens the browser developer tools.

If you want real protection for the quizmaster data, move the admin view to a backend or add Supabase Auth / Edge Functions so only authenticated quizmasters can read the full table. Supabase's JavaScript client supports database access and auth flows from browser apps.

GitHub Pages works well here for the public interface, but shared online data needs a backend. Supabase provides a hosted Postgres database and JavaScript client that works directly from the browser. Also, browser geolocation requires a secure context. MDN documents the Geolocation API as available only in secure contexts, such as HTTPS, which GitHub Pages provides.

## Files

- `index.html` — team interface
- `admin.html` — quizmaster dashboard
- `style.css` — styling
- `app.js` — game logic and location gating
- `admin.js` — dashboard logic
- `config.example.js` — fill in your real Supabase keys, password, questions, and coordinates
- `schema.sql` — starter database table and MVP policies

## Setup steps

### 1. Create a Supabase project
Create a new Supabase project and copy:
- Project URL
- Public anon key

Supabase documents the browser JavaScript client and installation here.

### 2. Create the database table
Run the SQL from `schema.sql` in the Supabase SQL Editor.

### 3. Configure the quiz
Edit `config.js` and fill in:
- `supabaseUrl`
- `supabaseAnonKey`
- `quizmasterPassword`
- all 6 checkpoints with real `lat`, `lng`, `description`
- all 18 questions and `correctAnswer`

The template is already split into 6 checkpoints × 3 questions.

### 4. Push to GitHub
Create a repo, add these files, and push.

### 5. Enable GitHub Pages
In the repo settings, enable GitHub Pages and publish from the branch/folder you prefer. GitHub documents the publishing source configuration in their Pages docs.

## How the flow works

1. Team enters a team name.
2. The team row is created online in Supabase.
3. The first 3 questions are shown immediately.
4. After submitting, the next checkpoint clue and map link appear.
5. The team taps **Check my location**.
6. If they are within `unlockRadiusMeters` of the checkpoint, the next 3 questions unlock.
7. Repeat until checkpoint 6.
8. After the final submit, the total score is shown and also stored online.


## Recommended secure upgrade

For a production event, I recommend this architecture:
- Public team page on GitHub Pages.
- Supabase Edge Functions for submissions and admin data access.
- A hidden admin page protected with Supabase Auth or magic-link login.
- Database policies that prevent teams from reading other teams' answers.
- Optionally generate a unique private token per team at registration.

## Customization ideas
- Add multiple-choice questions.
- Show a live leaderboard after the event ends.
- Add checkpoint images.
- Add time bonuses or penalties.
- Add a countdown time limit.
