# Solana Explorer

A simple block explorer interface for the Solana blockchain, built with React, TypeScript, and Tailwind CSS.

## Features

*   **View Latest Blocks:** Displays the most recent blocks confirmed on the network.
*   **View Block Details:** Shows the list of transactions included in a specific block.
*   **View Transaction Details:** Provides detailed information for a specific transaction, including:
    *   Involved accounts
    *   Program instructions
    *   Program execution logs
*   **Search:** Allows searching by:
    *   Block slot number
    *   Transaction signature

## Architecture

*   **Frontend Framework:** React with TypeScript
*   **Styling:** Tailwind CSS with Shadcn UI components
*   **Routing:** React Router
*   **Solana Interaction:** `@solana/web3.js` library connecting directly to a Solana RPC endpoint.
*   **State Management:** React Hooks (`useState`, `useEffect`, custom hooks).
*   **Structure:** Component-based (`components`, `pages`), custom hooks (`hooks`), utility functions (`lib`).

## Requirements

*   Node.js (v16 or later recommended)
*   npm or yarn

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/tastymooncakes/solana-explorer.git
    ```
2.  Navigate into the project directory:
    ```bash
    cd solana-explorer
    ```
3.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

## Configuration

The application connects to a Solana RPC endpoint. By default, it uses the public Solana Devnet RPC. You can configure a different endpoint (e.g., Mainnet-beta, Testnet, or a custom/private RPC) by creating a `.env` file in the project root:

```.env
# Example using the public Mainnet-beta RPC
REACT_APP_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Example using the public Devnet RPC (default if not set)
# REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
```

*(Note: This requires applying the suggested code change in `src/hooks/useSolana.ts` mentioned in the analysis)*

## How to Run (Development)

1.  Make sure you have completed the Installation and Configuration steps.
2.  Start the development server:
    ```bash
    npm start
    # or
    yarn start
    ```
3.  Open your browser and navigate to `http://localhost:3000`.

## How to Build (Production)

1.  Run the build script:
    ```bash
    npm run build
    # or
    yarn build
    ```
2.  This command creates an optimized static build of the application in the `build/` directory. You can then deploy the contents of this directory to any static file hosting service.