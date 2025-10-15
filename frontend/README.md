# Frontend

We are using the following:
- [Expo](https://docs.expo.dev/) - React Native framework
- [Tamagui](https://tamagui.dev/ui/intro) - React Native UI library
- [Tanstack Query](https://tanstack.com/query/latest) - Formerly known as React Query. This is a data fetching and mutation library that allows us to sync with server-state.
- [Clerk](https://clerk.com/docs) - Authentication library

## Development & Local Testing

### Prerequisites
1. Install [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

### Installation
1. Create `.env` file and put your variables there. Use `.env.example` as reference.
2. Run `npm install` to install all the Node packages we're using
3. Run `npx expo start` to start the Expo server. In the output, use [Expo Go](https://expo.dev/go) to run the app on your phone (can be either iOS or Android).
   > Tip: Pass in `-- --tunnel` to the command if you want to expose the Expo server. it uses ngrok under the hood.