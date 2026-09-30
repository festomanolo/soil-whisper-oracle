**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

Run npm install to install dependencies
Run npx cap add android to add the Android platform
Run npm run build to build the web app
Run npx cap sync to sync the build with the Android project
Run npx cap open android to open in Android Studio or npx cap run android to run directly on a connected device
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


## Mbolea Sahihi – Tanzanian data

The fertilizer planner (`/mbolea`) and crop ranking (`/recommendations`) run fully offline on bundled data in `src/data/tz/`:

| File | Source |
|---|---|
| `regions.json` | NASA POWER 30-yr climatology + ISRIC SoilGrids topsoil for 28 regions |
| `market-prices.json` | WFP VAM wholesale prices via HDX (last 12 months) |
| `crops.ts` | FAO ECOCROP limits, Ministry of Agriculture R&D fertilizer rates, TARI |
| `fertilizers.ts` | TFRA indicative prices 2024/25 (editable in the app) |

Refresh the scraped data with `python3 scripts/tz-data/fetch_tz_data.py` (stdlib only; the soil step takes ~10 min).
After adding native plugins run `npx cap sync android` before building the APK.
