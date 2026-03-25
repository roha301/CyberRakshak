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

export default function handler(req: any, res: any) {
  // Ensure serverless environment compatibility
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
