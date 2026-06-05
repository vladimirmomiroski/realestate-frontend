import { ThemeToggle } from "@/components/shared/theme/theme-toggle";
import { defaultLocale, getDictionary } from "@/i18n";

export default function Home() {
  const dictionary = getDictionary(defaultLocale);

  return (
    <main className="bg-background font-text-foreground min-h-screen px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-3xl">
          <p className="border-border bg-card text-muted-foreground mb-4 inline-flex rounded-full border px-4 py-2 text-sm font-medium">
            {dictionary.home.eyebrow}
          </p>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            {dictionary.home.title}
          </h1>

          <p className="text-muted-foreground mt-6 text-lg leading-8">
            {dictionary.home.description}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Theme colors</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              These tokens will be reused later for buttons, cards, badges,
              forms, listings, dashboards, and admin screens.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                <span className="text-muted-foreground text-sm">
                  Background
                </span>
                <span className="font-mono text-sm">#F8FAFC</span>
              </div>

              <div className="bg-primary text-primary-foreground flex items-center justify-between rounded-lg p-3">
                <span className="text-sm">Primary</span>
                <span className="font-mono text-sm">#0F766E</span>
              </div>

              <div className="bg-accent text-accent-foreground flex items-center justify-between rounded-lg p-3">
                <span className="text-sm">Accent</span>
                <span className="font-mono text-sm">#D97706</span>
              </div>
            </div>
          </div>

          <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Buttons</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Main actions use primary. Secondary actions stay calm and neutral.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button className="bg-primary text-primary-foreground focus-visible:ring-ring rounded-lg px-5 py-3 text-sm font-medium transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
                Primary button
              </button>

              <button className="border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring rounded-lg border px-5 py-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
                Secondary button
              </button>

              <button className="bg-accent text-accent-foreground focus-visible:ring-ring rounded-lg px-5 py-3 text-sm font-medium transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
                Accent button
              </button>

              <button
                disabled
                className="bg-primary text-primary-foreground cursor-not-allowed rounded-lg px-5 py-3 text-sm font-medium opacity-50"
              >
                Disabled button
              </button>
            </div>
          </div>

          <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Status badges</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              These colors can later explain deal quality, warnings, and errors.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="bg-success rounded-full px-3 py-1 text-sm font-medium text-white">
                Good deal
              </span>

              <span className="bg-warning rounded-full px-3 py-1 text-sm font-medium text-white">
                Price warning
              </span>

              <span className="bg-danger rounded-full px-3 py-1 text-sm font-medium text-white">
                Overpriced
              </span>

              <span className="border-border bg-muted text-muted-foreground rounded-full border px-3 py-1 text-sm font-medium">
                Neutral
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Example listing insight</h2>

            <div className="border-border bg-background mt-6 rounded-lg border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">Modern apartment in Centar</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    72 m² · 3 rooms · 4th floor
                  </p>
                </div>

                <p className="text-right text-lg font-semibold">€125,000</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Price / m²</p>
                  <p className="mt-1 font-semibold">€1,736</p>
                </div>

                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Area average</p>
                  <p className="mt-1 font-semibold">€1,950</p>
                </div>

                <div className="bg-success rounded-lg p-3 text-white">
                  <p className="text-xs opacity-90">Status</p>
                  <p className="mt-1 font-semibold">Good value</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Form preview</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Inputs use border/input/ring tokens.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">City</span>
                <input
                  placeholder="Skopje"
                  className="border-input bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-ring rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Budget</span>
                <input
                  placeholder="€120,000"
                  className="border-input bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-ring rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <ThemeToggle />
        </div>
      </section>
    </main>
  );
}
