import Link from "next/link";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card className="p-8">
        <h1 className="text-2xl font-bold">Link Page MVP</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create a public profile page with links, like Linktree.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">Demo URL format</p>
          <p className="mt-1">
            <span className="rounded-lg bg-zinc-100 px-2 py-1 font-mono dark:bg-zinc-900">
              /your_username
            </span>
          </p>
        </div>
      </Card>
    </main>
  );
}
