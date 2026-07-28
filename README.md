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

## Deploy to Vercel

1. Create one GitHub repository containing the files in this folder at the repository root.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Framework Preset: **Other**.
4. Root Directory: leave blank.
5. Build Command: leave blank.
6. Output Directory: leave blank.
7. Environment variables: none required.
8. Deploy.

## Install on iPhone

Open the deployed site in Safari, tap **Share**, then **Add to Home Screen**.

## Important

This is a self-management aid, not emergency care, diagnosis or trauma therapy. It does not require exposure or touch. Emergency links are built into the interface.
