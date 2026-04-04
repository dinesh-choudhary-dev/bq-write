"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-zinc-500 text-sm">Loading...</span>
      </div>
    );
  }

  if (!session) return <LoginView />;
  return <TestView email={session.user?.email ?? ""} />;
}

function LoginView() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm space-y-6 px-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">bq-write</h1>
          <p className="text-zinc-400 text-sm">Natural language BigQuery queries</p>
        </div>
        <button
          onClick={() => signIn("google")}
          className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function TestView({ email }: { email: string }) {
  const [projectId, setProjectId] = useState("");
  const [query, setQuery] = useState("SELECT 1 AS connected");
  const [result, setResult] = useState<{ rows?: Record<string, unknown>[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function runTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/bq-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, query }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-sm">bq-write</span>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{email}</span>
          <button
            onClick={() => signOut()}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center pt-20 px-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-1">
            <h2 className="font-semibold">Test BigQuery access</h2>
            <p className="text-zinc-400 text-sm">
              Verify your Google account can reach BigQuery before setup.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">
                GCP Project ID
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-gcp-project"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">
                Test query
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
              />
            </div>

            <button
              onClick={runTest}
              disabled={!projectId || loading}
              className="w-full bg-zinc-100 text-zinc-900 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Running..." : "Run test"}
            </button>
          </div>

          {result && (
            <div
              className={`rounded-lg border p-4 space-y-2 ${
                result.error
                  ? "border-red-900 bg-red-950/30"
                  : "border-green-900 bg-green-950/30"
              }`}
            >
              {result.error ? (
                <>
                  <p className="text-red-400 text-sm font-medium">Connection failed</p>
                  <p className="text-red-300 text-sm font-mono break-all">{result.error}</p>
                </>
              ) : (
                <>
                  <p className="text-green-400 text-sm font-medium">
                    Connected — {result.rows?.length ?? 0} row(s) returned
                  </p>
                  <pre className="text-zinc-300 text-xs font-mono overflow-auto max-h-48">
                    {JSON.stringify(result.rows, null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
