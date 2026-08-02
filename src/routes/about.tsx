import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Privacy — Ishq-e-Shayari" },
      {
        name: "description",
        content:
          "About Ishq-e-Shayari, community rules for shayari and reels, and the privacy policy covering the data we store.",
      },
      { property: "og:title", content: "About & Privacy — Ishq-e-Shayari" },
      {
        property: "og:description",
        content: "Community guidelines and privacy policy for Ishq-e-Shayari.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <PageHeader title="About" subtitle="Ishq-e-Shayari" />
      <div className="space-y-8 px-5 pb-12 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg text-gold">The mehfil</h2>
          <p>
            Ishq-e-Shayari is a home for original poetry in Hindi, Urdu, Roman and Punjabi. Write a
            couplet, recite it on camera, and let the words find the people who need them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-gold">Community rules</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Post only shayari you wrote, or credit the poet clearly.</li>
            <li>Reels must be poetry recitations — no vulgar, obscene or unrelated video.</li>
            <li>No promotional links, spam, hate speech or harassment.</li>
            <li>Anything reported is reviewed by moderators and removed if it breaks these rules.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-gold">Privacy policy</h2>
          <p>
            We store only what the app needs: your email (for sign-in), your pen name, optional bio
            and avatar, and the shayari, reels, likes, saves and comments you create. Videos and
            avatars are kept in private storage and served through short-lived signed links.
          </p>
          <p className="mt-2">
            We never sell your data. Advertising, when enabled, may use anonymised device
            identifiers provided by the ad network. You can delete any of your posts at any time
            from your profile, and requesting account deletion removes your profile and content.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-gold">Premium</h2>
          <p>
            Premium removes ads, adds a gold ✦ beside your name and unlocks longer reels. Free
            members keep full access to writing, reading and saving shayari.
          </p>
        </section>

        <Link to="/" className="inline-block font-ui text-gold underline-offset-4 hover:underline">
          Back to the mehfil
        </Link>

        <p className="pt-4 text-center font-ui text-[0.7rem] tracking-widest uppercase">
          Made by Shayar Peehu
        </p>
      </div>
    </div>
  );
}