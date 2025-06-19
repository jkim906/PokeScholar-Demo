**Note**

> This repository is a public showcase version of the original PokeScholar project/repository, where the main repository is private due to it being a univeristy project. PokeScholar was developed from scratch as a group project, demonstrating our skills in full-stack development, teamwork, and software engineering best practices.
>
> If you have any questions or would like further details, please contact me.

# PokeScholar - Gamified Study Productivity App

PokeScholar is a mobile application designed to enhance student productivity through gamification. By combining the Pomodoro technique with Pokémon card collection mechanics, PokeScholar helps students maintain focus during study sessions while making the learning process more engaging and rewarding.

## Technologies Used

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- Zustand for state management
- Expo Router for navigation
- React Native Elements for UI components

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Clerk for authentication
- Pokemon TCG SDK for card data
- RESTful API architecture

## Prerequisites

1. Install Xcode from the App Store (For MacOS only)
   - Open Xcode and install the iOS simulator
2. Install Homebrew (if not already installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Install Watchman
   ```bash
   brew install watchman
   ```
4. Install Node.js and npm (if not already installed)

## Installation and Setup

1. Clone the repository:
```bash
git clone https://github.com/UOA-CS732-S1-2025/group-project-team-ginger.git
cd group-project-team-ginger
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
npx expo install expo-dev-client
```

4. Set up environment variables:

Create a .env file in the backend directory using the values provided separately.
Create a .env file in the frontend directory using the values provided separately.

Note: The `CLERK_WEBHOOK_SIGNING_SECRET` is commented out by default. The app will run normally without it, but user sign-up and authentication features will not be available.
If you want to use the sign-up functionality follow the ngrok set up instructions below and then:
1. Once you sign up with ngrok, when a team member adds your ngrok static domain URL to Clerk, they will provide you with a signing secret for that URL.
2. Uncomment the `CLERK_WEBHOOK_SIGNING_SECRET` line in your .env file.
3. Paste your webhook signing secret from the Clerk dashboard after the equals sign.

## Running the Application

### Option 1: Development Build (Recommended for MacOS)

1. In the backend directory, start the backend server:
```bash
cd backend
npm run dev
```

2. Open a new terminal window, navigate to the frontend directory and run:
```bash
cd frontend
npx expo run:ios
```
- Press 'i' to open the build in the iOS simulator
- Press 'r' to reload the simulator when changes are made

### Option 2: Using Expo Go (Recommended for non-MacOS Devices)

1. Install the Expo Go app:
   - For iOS: Download from the [App Store](https://apps.apple.com/app/apple-store/id982107779)
   - For Android: Download from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Make sure your mobile device and development machine are on the same network

3. In the backend directory, start the backend server:
```bash
cd backend
npm run dev
```

4. Open a new terminal window, navigate to the frontend directory and run:
```bash
cd frontend
npx expo start
```

4. Connect to the app:
   - When you run the command above, you'll see a QR code in your terminal
   - On your mobile device:
     - iOS: Open your iPhone's camera app and point it at the QR code
     - Android: Open the Expo Go app, tap "Scan QR Code" and point it at the QR code
   - A notification will appear on your device - tap it to open the app in Expo Go
   - Any changes you make to the code will automatically reload in the app

Note: Some features may require a development build. If you encounter any issues, please use Option 1 (Development Build) instead.

## Setting up ngrok for Clerk Authentication

ngrok is required to receive Clerk user events (such as user creation, deletion, and updates) on your local backend and sync them with our MongoDB database. For testing purposes use the username and password down below or follow these steps to set up ngrok:

1. Install ngrok:
```bash
brew install ngrok
```

2. Create an account at [ngrok dashboard](https://dashboard.ngrok.com/get-started/setup/macos)

3. Run the add-authtoken command provided in your ngrok dashboard

4. In Static Domain, copy the generated command and change the port from 80 to 3000:
```bash
ngrok http 3000
```
6. Copy and paste the ngrok http 3000 command into a terminal window from the root directory of the repository, and run it.

7. Keep this terminal window open while running the application for Clerk to sync with MongoDB

8. Send your generated ngrok URL to one of the team members to add it to the Clerk Dashboard

## Testing Credentials

For testing purposes, you can use the following credentials:
- Username: demo
- Password: password

## Project Structure

```
group-project-team-ginger/
├── frontend/           # Frontend folder
│   ├── src/           # Source code
│   │   ├── app/       # Expo Router pages
│   │   ├── components/# React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── stores/    # State management
│   │   ├── api/       # API integration
│   │   └── types/     # TypeScript types
│   └── assets/        # Images and other static assets
├── backend/           # Backend server folder
│   ├── src/          # Source code
│   │   ├── app.ts    # Main application entry
│   │   ├── config/   # Configuration files
│   │   ├── models/   # Database models
│   │   ├── routes/   # API routes
│   │   ├── scripts/  # Utility scripts
│   │   └── services/ # Business logic
│   └── public/       # Static files
└── README.md         # Project documentation
```

## Testing

Run tests for the frontend:
```bash
cd frontend
npm test
```

Run tests for the backend:
```bash
cd backend
npm test
```

## Team

Team Ginger - University of Auckland COMPSCI 732 Members:

- Melissa Sieu _(msie081@aucklanduni.ac.nz)_
- Jacky Kim _(jkim805@aucklanduni.ac.nz)_
- Jaewon Kim _(jkim906@aucklanduni.ac.nz)_
- Jonathon Lee _(jlee842@aucklanduni.ac.nz)_
- Hailey Zhang _(bzha807@aucklanduni.ac.nz)_
