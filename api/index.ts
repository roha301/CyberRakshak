import { createServer } from "../server/index";

const app = createServer();

// Diagnostic routes for Vercel
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is running on Vercel (serverless mode)",
    path: req.path,
    url: req.url
  });
});

export default app;
