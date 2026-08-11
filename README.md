# FoodFriend

FoodFriend is a local-first Expo/React Native MVP for making healthy food decisions feel easier.

## Included in this first build

- Home dashboard with food pulse, quick actions, and personalized recommendations.
- Pantry, fridge, freezer, and spices inventory with search, filters, health scores, nutrition facts, avoid-list alternatives, and manual add.
- Shelf snapshot/OCR entry point with a simulated scan result ready for camera and recognition APIs.
- Discover flow that considers inventory, allergens, avoid-list items, and sensory preferences.
- Restaurant and recommendation review tracking with ratings and sensory context tags.
- Settings with sensory-friendly mode for parking, low lighting, loudness, and atmosphere.
- Allergen customization with a 30-item starter list.
- FoodFriend logo and iPhone-ready app icon wired into Expo configuration.

## Run it

```bash
npm install
npm start
```

For the browser, run:

```bash
npm run web
```

Then open the local URL Expo prints. On iPhone, open it in Expo Go. The current scan and recommendation data are local demo data; the next build can connect them to a camera/OCR service, nutrition database, user accounts, and shared reviews.

## GitHub Pages

The repository includes a GitHub Actions workflow that exports and deploys the web app whenever `main` is pushed. After the repository is connected and the workflow runs once, enable **Settings → Pages → Source: GitHub Actions**. The site will be available at:

`https://sheldonite.github.io/FoodFriend/`
