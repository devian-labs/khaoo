import { Check } from "lucide-react";

const tiers = [
  {
    name: "QR Menu Only",
    price: 29,
    description: "Perfect for fast-moving stalls and takeaways.",
    features: [
      "Custom QR Code generation",
      "Unlimited menu items",
      "Toggle Open/Close instantly",
      "Basic shop analytics"
    ],
    buttonText: "Start selling",
    popular: false
  },
  {
    name: "Table Ordering",
    price: 79,
    description: "Ideal for cafes and single-location dine-ins.",
    features: [
      "Everything in QR Menu",
      "Real-time order management",
      "Table-specific QR Codes",
      "Customer 'Call Waiter' alerts"
    ],
    buttonText: "Get Pro Features",
    popular: true
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32 bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Everything you need to digitize your shop&apos;s menu. No hidden fees, no percentage cuts on your orders.
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-2">
          {tiers.map((tier) => (
            <div 
              key={tier.name}
              className={`rounded-3xl p-8 xl:p-10 transition-all duration-300 transform hover:-translate-y-1 ${
                tier.popular 
                  ? "ring-2 ring-red-500 bg-white dark:bg-zinc-950 shadow-xl shadow-red-500/10" 
                  : "ring-1 ring-zinc-200 dark:ring-white/10 bg-white dark:bg-zinc-950 shadow-lg shadow-zinc-200/50 dark:shadow-none hover:ring-red-500/50 dark:hover:ring-red-500/50"
              }`}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3 className="text-lg font-semibold leading-8 text-zinc-900 dark:text-white">
                  {tier.name}
                </h3>
                {tier.popular && (
                  <span className="rounded-full bg-red-100 dark:bg-red-500/10 px-2.5 py-1 text-xs font-semibold leading-5 text-red-600 dark:text-red-400">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">₹{tier.price}</span>
                <span className="text-sm font-semibold leading-6 text-zinc-600 dark:text-zinc-400">/month</span>
              </p>
              
              <a
                href="#"
                className={`mt-6 block rounded-xl px-3 py-2 text-center text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors ${
                  tier.popular
                    ? "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tier.buttonText}
              </a>
              
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3 items-center">
                    <Check className="h-5 w-5 flex-none text-red-600 dark:text-red-400" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
