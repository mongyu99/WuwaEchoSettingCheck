# Echo Setting Check

```
.
├── index.html
├── admin.html
├── Dockerfile
├── nginx.conf
├── package.json
├── vite.config.js
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── admin/
│   │   ├── main.jsx
│   │   ├── AdminApp.jsx
│   │   └── admin.css
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── CharacterSelectPage.jsx
│   │   ├── CapturePage.jsx
│   │   ├── EditPage.jsx
│   │   ├── StatsPage.jsx
│   │   ├── PatchNotesPage.jsx
│   │   └── EventCalendarPage.jsx
│   ├── components/
│   │   ├── TopNav.jsx
│   │   ├── SideNav.jsx
│   │   ├── SiteLayout.jsx
│   │   ├── SiteFooter.jsx
│   │   ├── SidePanel.jsx
│   │   ├── VersionBanner.jsx
│   │   ├── VersionTimer.jsx
│   │   ├── PatchNotesList.jsx
│   │   ├── ImageUploader.jsx
│   │   ├── EchoPanel.jsx
│   │   ├── ProcessingOverlay.jsx
│   │   ├── Modal.jsx
│   │   ├── ConfirmDialog.jsx
│   │   └── AuthPanel.jsx
│   ├── config/
│   │   ├── characters.js
│   │   ├── characterBaseStats.js
│   │   ├── characterValidOptions.js
│   │   ├── characterWeapons.js
│   │   ├── characterEchoSets.js
│   │   ├── characterMainEchoBonus.js
│   │   ├── characterRecommendations.js
│   │   ├── weapons.js
│   │   ├── echoSets.js
│   │   ├── mainEchoes.js
│   │   ├── echoSetMainEchoes.js
│   │   ├── subStatOptions.js
│   │   ├── subStatProbabilities.js
│   │   ├── mainStatBonusNames.js
│   │   ├── regions.js
│   │   ├── versionBanner.js
│   │   ├── legalNotices.js
│   │   └── assetPath.js
│   ├── context/
│   │   └── AuthContext.jsx
│   └── utils/
│       ├── api.js
│       ├── ocr.js
│       ├── image.js
│       ├── pipeline.js
│       ├── highlight.js
│       ├── probability.js
│       ├── probability.test.js
│       ├── optimizer.js
│       ├── optimizer.test.js
│       ├── scoreCalculator.js
│       ├── persist.js
│       └── theme.js
│
├── public/
│   ├── banners/
│   ├── characters/
│   ├── weapons/
│   ├── echo-sets/
│   └── main-echoes/
│
├── scripts/
│   ├── prepare-banner-images.mjs
│   ├── prepare-character-images.mjs
│   ├── prepare-weapon-images.mjs
│   ├── prepare-echo-set-images.mjs
│   ├── prepare-main-echo-images.mjs
│   └── generate-placeholder-images.mjs
│
└── backend/
    ├── Dockerfile
    ├── docker-compose.yml
    ├── build.gradle
    └── src/
        ├── main/
        │   ├── java/com/wuwaecho/backend/
        │   │   ├── BackendApplication.java
        │   │   ├── admin/
        │   │   ├── auth/
        │   │   ├── build/
        │   │   ├── config/
        │   │   ├── event/
        │   │   ├── patchnote/
        │   │   └── user/
        │   └── resources/
        │       ├── application.yml
        │       ├── application-admin.yml
        │       ├── application-google.yml
        │       └── db/migration/
        └── test/
            └── java/com/wuwaecho/backend/
                ├── auth/
                ├── build/
                └── config/
```
