export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <main className="w-full max-w-2xl space-y-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          NextJS Backend Ready
        </h1>
        <p className="text-muted-foreground">
          This app provides NextAuth routes and a WebSocket server.
        </p>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <p>
            Auth endpoint:{" "}
            <span className="text-foreground">/api/auth/[...nextauth]</span>
          </p>
          <p>
            WebSocket endpoint:{" "}
            <span className="text-foreground">/ws</span>
          </p>
        </div>
      </main>
    </div>
  );
}
