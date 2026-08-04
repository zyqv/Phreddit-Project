[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/FhRnU_lR)
# Term Project

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

## Team Member 1 Contribution
Blerina Lleshi

## Team Member 2 Contribution
I was given permission by Professor Kane to work on this assignment on my own.
