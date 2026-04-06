import Link from "next/link";
import { QrCode, Smartphone, Apple } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-zinc-950 pt-24 pb-32 sm:pt-32 sm:pb-40">
      {/* Background decoration */}
      <div className="absolute inset-x-0 top-0 h-[50rem] overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-gradient-to-br from-red-400/20 via-red-200/5 to-transparent dark:from-red-900/30 dark:via-red-700/10 rounded-full blur-3xl opacity-70 animate-pulse-slow"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-5 py-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400 ring-1 ring-zinc-900/10 dark:ring-white/10 hover:ring-red-500/50 dark:hover:ring-red-500/50 hover:shadow-lg hover:shadow-red-500/10 transition-all cursor-pointer backdrop-blur-sm bg-white/50 dark:bg-black/50">
              Introducing <span className="font-bold text-red-600 dark:text-red-400">Khao</span> for Vendors {" "}
              <Link href="#pricing" className="font-semibold text-red-600 dark:text-red-400 ml-2 group">
                <span className="absolute inset-0" aria-hidden="true" />
                View Pricing <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-7xl mb-8 leading-tight">
            The Digital QR Menu for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-500 to-red-400 drop-shadow-sm">
              Modern Shops
            </span>
          </h1>
          
          <p className="mt-6 text-xl tracking-tight leading-8 text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
            Set up your digital menu in under 5 minutes. No complex POS, no learning curve. Just what you need to run your food stall, café, or street shop smoothly.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://play.google.com" target="_blank" rel="noreferrer"
              className="w-full sm:w-auto rounded-full bg-zinc-950 dark:bg-zinc-100 px-8 py-4 text-sm font-semibold text-white dark:text-zinc-900 shadow-xl hover:bg-zinc-800 dark:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-transparent dark:border-zinc-800"
            >
              <Smartphone className="w-5 h-5" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] opacity-80 uppercase tracking-wider">Get it on</span>
                <span className="text-base font-bold">Google Play</span>
              </div>
            </a>
            
            <a
              href="https://apple.com/app-store" target="_blank" rel="noreferrer"
              className="w-full sm:w-auto rounded-full bg-zinc-950 dark:bg-zinc-100 px-8 py-4 text-sm font-semibold text-white dark:text-zinc-900 shadow-xl hover:bg-zinc-800 dark:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-transparent dark:border-zinc-800"
            >
              <Apple className="w-5 h-5" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] opacity-80 uppercase tracking-wider">Download on the</span>
                <span className="text-base font-bold">App Store</span>
              </div>
            </a>
          </div>

          <div className="mt-8 flex justify-center">
             <Link
              href="/menu/demo"
              className="text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-400 flex items-center gap-2 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
            >
              <QrCode className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" /> Try the interactive menu demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
