# DUDE Frontend

Static frontend for the DUDE Payment System.

## Railway

Railway can deploy this folder as a Node service.

Start command:

```bash
npm start
```

The app serves `index.html` through `server.js` and uses Railway's `PORT` automatically.

Backend API:

```text
https://dudesystem-production.up.railway.app
```

After Railway gives this frontend a public URL, add that URL to the backend service variable:

```env
BACKEND_CORS_ORIGINS=https://your-frontend.up.railway.app
```
