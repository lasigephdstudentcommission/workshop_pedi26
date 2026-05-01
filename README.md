# Workshop PediPaper GO

A GitHub Pages friendly web app for a location-based team quiz. Teams use one phone, choose a team name, answer 18 questions in 6 batches of 3, and unlock the next batch only when they reach the next checkpoint area.

## What this project does

- Hosts the website on GitHub Pages.
- Stores team names, answers, stage progress, and scores online in Supabase.
- Stores start time, finish time, and elapsed seconds online for score tie-breaks.
- Shows the next checkpoint only after each batch is submitted.
- Uses browser geolocation to unlock each next batch when the team is within a configurable radius, default 80 m.
- Includes a quizmaster dashboard with a password gate and CSV export.