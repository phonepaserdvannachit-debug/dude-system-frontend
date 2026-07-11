const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function resolveFile(reqUrl) {
  const cleanUrl = decodeURIComponent((reqUrl || "/").split("?")[0]);
  const requested = cleanUrl === "/" ? "/index.html" : cleanUrl;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, normalized);

  if (!filePath.startsWith(root)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveFile(req.url);

  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(root, "index.html"), (fallbackError, fallbackData) => {
        if (fallbackError) {
          send(res, 404, "Not found");
          return;
        }

        send(res, 200, fallbackData, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        });
      });
      return;
    }

    send(res, 200, data, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=300",
    });
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`DUDE frontend running on port ${port}`);
});
