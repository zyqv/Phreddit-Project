Phreddit

## Instructions to setup and run project
1. Start MongoDB locally.

```bash
brew services start mongodb/brew/mongodb-community
```

2. Install server dependencies.

```bash
cd server
npm install
```

3. Create initial database data. The required admin email, display name, and password are command-line arguments.

```bash
node init.js admin@example.com admin AdminPass123!
```

4. Start the server. It runs at `http://localhost:8000`.

```bash
node server.js
```

5. In a second terminal, install and run the client. It runs at `http://localhost:5173`.

```bash
cd client
npm install
npm run dev
```

## Notes

The server connects to `mongodb://127.0.0.1:27017/phreddit`.

The UML diagrams are saved in the `image` directory.

## Team Member Contribution
Blerina Lleshi

