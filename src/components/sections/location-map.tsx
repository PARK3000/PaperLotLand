import { BUSINESS } from '@/lib/constants'
import { MapFacade } from '@/components/ui/map-facade'

interface LocationMapProps {
  title?: string
  description?: string
}

export function LocationMap({
  title = 'Avoid Foreclosure and Stressful Situations',
  description = "If you're facing financial challenges, selling to a cash buyer can help you avoid foreclosure and other stressful situations. Cash buyers offer a quick, hassle-free solution when you're unable to meet your mortgage payments. Best of all, they purchase homes in any condition, so you won't have to spend time or money on repairs or upkeep. No need to worry about costly renovations or keeping your home in perfect condition—cash buyers take care of it all, making the process easy and stress-free.",
}: LocationMapProps) {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="container-custom">
        {/* Title and Description */}
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">
            {title}
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            {description}
          </p>
        </div>

        {/* Google Map — facade pattern: placeholder until clicked */}
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="overflow-hidden rounded-xl shadow-lg">
            <MapFacade
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6446.247502570708!2d-115.29125768485073!3d36.114842733845215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c8b8a0fb9aaaab%3A0x3c9e734f4005e256!2sWe%20Buy%20Any%20Vegas%20House!5e0!3m2!1sen!2sus!4v1743786127713!5m2!1sen!2sus"
              title="We Buy Any Vegas House Location"
            />
          </div>

          {/* Location Info */}
          <div className="mt-6">
            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="font-bold text-primary">Las Vegas Office</h3>
              <p className="mt-2 text-gray-600">9159 W Flamingo Rd #110</p>
              <p className="text-gray-600">Las Vegas, NV 89147</p>
              <a
                href={`tel:${BUSINESS.phone}`}
                className="mt-2 inline-block font-semibold text-[var(--color-accent)] hover:underline"
              >
                {BUSINESS.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
