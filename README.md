# CHECK-IN STORAGE REPAIR 4

This build uses new JavaScript and stylesheet filenames, clears old service-worker caches, verifies each saved entry, and keeps a visible Saved confirmation on the check-in screen.

**You should see “Check-in repair 4” under the app title.** If you do not see that wording, the phone is still opening the old deployment.

# GENEVIEVE Safe Connection App

A private, phone-friendly progressive web app for:

- daily green / amber / red check-ins;
- grounding and a prominent STOP pathway;
- a personalised cream routine for arms, legs, torso and face;
- noticing early dissociation signs and stopping immediately;
- consent, boundaries, communication and relationship stages;
- a personal touch menu where “maybe” never means yes;
- local progress records and private JSON export.

## Privacy

The app has no account, analytics, advertising or server database. Entries are saved only in the browser's local storage. Exported backups are downloaded to the user's device.

## Run locally

Do not double-click `index.html`, because offline/PWA features require a local web server.

From this folder, run one of:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy to Cloudflare Pages

1. Keep the application files at the GitHub repository root.
2. In Cloudflare Pages, connect this GitHub repository.
3. Framework preset: none / static HTML.
4. Build command: leave blank.
5. Output directory: repository root.
6. No environment variables are required.
7. Deploy. The root `_headers` file preserves the no-cache and browser security headers previously supplied by the old Vercel configuration.

## Install on iPhone

Open the deployed site in Safari, tap **Share**, then **Add to Home Screen**.

## Important

This is a self-management aid, not emergency care, diagnosis or trauma therapy. It does not require exposure or touch. Emergency links are built into the interface.

## Check-in save repair (v2)

- Check-ins now save even when the user cannot choose a colour; they are recorded as **Not sure**.
- Text is automatically kept as a local draft while it is being typed.
- After saving, the app opens Progress and shows all written answers under **See everything I wrote**.
- The service-worker cache version was changed so deployed phones receive the repaired JavaScript.
