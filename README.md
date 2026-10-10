# katsina-pu-agent-registration
# Katsina State PU Agent Registration

A lightweight web app for registering polling unit (PU) agents across Katsina State, Nigeria. It replaces a very large Google Form that was slow to load with a fast, mobile-friendly page.

Built with Google Apps Script (JavaScript, V8), HTML and CSS.

## The problem

Registering agents for about 4,900 polling units across 34 LGAs and 361 wards is hard to do with a standard form. The dropdown lists are huge, so the form loads slowly on mobile data and is easy to get wrong. Agents need to find their own PU quickly and register with a photo.

## What it does

- **Cascading dropdowns (LGA > Ward > Polling Unit).** Only the 34 LGA names load up front. Wards and PUs are fetched from the server when the user picks each level, which keeps the first load small.
- **Photo upload.** The photo is read in the browser, sent as base64, decoded on the server and saved to a Google Drive folder.
- **Validation.** Required fields are checked on the server before anything is saved, and the user gets a clear error if something is missing.
- **Automatic storage.** On the first submission the app creates a Google Sheet for responses and a Drive folder for photos, and remembers their IDs in Script Properties.

## Project structure

| File | Purpose |
|------|---------|
| `Code.gs` | Server logic: serves the page, returns LGAs/wards/PUs, validates and saves registrations |
| `Index.html` | Front end: the registration form and client-side logic |
| `Data.gs` | The PU directory as a nested array (LGA > Ward > PUs with codes) |
| `appsscript.json` | Apps Script manifest (time zone, V8 runtime, web app settings) |

## The data

The PU directory was extracted from an official PDF (the Katsina PU Directory) into the nested structure in `src/Data.gs`: 34 LGAs, 361 wards and about 4,901 polling units.

## How to run it

1. Create a new project at [script.google.com](https://script.google.com).
2. Add three files with the same names: `Code.gs`, `Data.gs` and `Index` (an HTML file), and paste in the contents from this repo.
3. Replace the manifest contents with `appsscript.json` (enable "Show appsscript.json" in Project Settings).
4. Click **Deploy > New deployment > Web app**. Set "Execute as" to Me and choose who has access.
5. Open the web app URL. The first submission creates the Sheet and Drive folder.

## My contribution

I wrote the whole project myself: the data extraction, the backend, the front end and the deployment setup.

## Notes

No credentials or personal data are stored in this repository. Registrations and photos are saved only in the deployer's own Google account.
