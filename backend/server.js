const { createServer } = require("node:http");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const port = Number.parseInt(process.env.PORT || "3001", 10);
const wsPath = process.env.WS_PATH || "/ws";

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      handle(req, res);
    });

    const wss = new WebSocketServer({ noServer: true });

    wss.on("connection", (socket) => {
      socket.send(
        JSON.stringify({ type: "connected", message: "WebSocket connected" })
      );

      socket.on("message", (data) => {
        const message = data.toString();
        socket.send(JSON.stringify({ type: "echo", message }));
      });
    });

    server.on("upgrade", (request, socket, head) => {
      const { url } = request;
      if (url && url.startsWith(wsPath)) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
        return;
      }

      socket.destroy();
    });

    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend ready on http://localhost:${port}`);
      // eslint-disable-next-line no-console
      console.log(`WebSocket ready on ws://localhost:${port}${wsPath}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
