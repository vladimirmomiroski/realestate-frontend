import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Real Estate Frontend
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Initial Next.js setup for the real estate apartment platform.
        </p>
      </section>
    </main>
  );
}
