import Image from 'next/image'
import Link from 'next/link'

const reasons = [
  { icon: '👥', label: 'Inherited House' },
  { icon: '🏠', label: 'Foreclosure' },
  { icon: '😤', label: 'Bad Tenants' },
  { icon: '💼', label: 'Job Loss' },
  { icon: '🔧', label: 'Repairs' },
  { icon: '🚚', label: 'Relocating' },
  { icon: '🏚️', label: 'Damage' },
  { icon: '📉', label: 'Downsizing' },
  { icon: '🎯', label: 'Retirement' },
  { icon: '💔', label: 'Divorce' },
  { icon: '📋', label: 'Bankruptcy' },
  { icon: '🏥', label: 'Health Issues' },
]

export function AboutSection() {
  return (
    <section className="bg-[#0369a1] py-16 lg:py-20">
      <div className="container-custom">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left - Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="overflow-hidden rounded-lg bg-[#0891b2]/50 p-4">
                <Image
                  src="/images/team/parker-gibbons.jpg"
                  alt="Parker Gibbons, PaperLotLand"
                  width={400}
                  height={300}
                  className="rounded-lg object-cover"
                />
              </div>
              <p className="mt-4 text-center text-xl font-bold italic text-white">
                Sell Your Las Vegas House Fast!
              </p>
            </div>
          </div>

          {/* Right - Content */}
          <div className="text-white">
            <h2 className="text-3xl font-bold lg:text-4xl">
              We are the largest cash home buyers in Las Vegas Nevada.
            </h2>
            <p className="mt-2 text-lg font-semibold">
              Sell Your Las Vegas Home Fast – No Hassles, No Hidden Fees
            </p>

            <p className="mt-6 text-white">
              At We Buy Any Vegas House, we specialize in buying homes across Las Vegas, NV. Over the past year alone, we&apos;ve purchased hundreds of properties, thanks to our extensive network of cash buyers. When you work with us, you can be confident that our cash offers are straightforward, with no hidden fees, inspections, appraisals, or contingencies.
            </p>

            <p className="mt-4 text-white">
              We streamline the entire process, ensuring a hassle-free experience from start to finish. Whether your home needs repairs or you&apos;re simply looking to sell quickly, we provide a reliable solution. In fact, you can have cash in hand in as little as 7 days.
            </p>

            <p className="mt-6 font-semibold">
              Some reasons our clients have sold their house as-is for a cash offer:
            </p>

            {/* Reasons Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {reasons.map((reason) => (
                <div key={reason.label} className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm">
                    {reason.icon}
                  </span>
                  <span className="text-sm">{reason.label}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <Link
                href="/get-your-cash-today/"
                className="inline-block rounded-full bg-[var(--color-accent)] px-8 py-4 font-bold uppercase text-white transition-colors hover:bg-[var(--color-accent-dark)]"
              >
                Get Your Cash Offer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
