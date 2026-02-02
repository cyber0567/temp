import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WebSocketStatus } from "@/components/websocket-status";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <main className="w-full max-w-4xl space-y-10">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            NextJS Frontend Starter
          </h1>
          <p className="text-muted-foreground">
            TailwindCSS + shadcn/ui with a live WebSocket connection to the backend.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Status</CardTitle>
              <CardDescription>Connects to the backend WebSocket server.</CardDescription>
            </CardHeader>
            <CardContent>
              <WebSocketStatus />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>OAuth Ready</CardTitle>
              <CardDescription>NextAuth + GitHub OAuth configured on backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Set <span className="text-foreground">GITHUB_CLIENT_ID</span> and{" "}
                <span className="text-foreground">GITHUB_CLIENT_SECRET</span> in
                the backend environment.
              </p>
              <p>
                After connecting your database, run{" "}
                <span className="text-foreground">npx prisma migrate dev</span>{" "}
                in the backend to create auth tables.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
