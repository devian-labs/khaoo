import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black font-sans">
      <main className="flex-1">
        <HeroSection />
        <PricingSection />
      </main>
      
      <footer className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 border-solid">
        <p>
          © 2026 A product of{" "}
          <a
            href="https://devian.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 transition-colors"
          >
            Devian Labs
          </a>
          . Designed for small vendors.
        </p>
      </footer>
    </div>
  );
}
