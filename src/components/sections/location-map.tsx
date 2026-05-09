import { BUSINESS } from '@/lib/constants'
import { MapFacade } from '@/components/ui/map-facade'

interface LocationMapProps {
  title?: string
  description?: string
}

export function LocationMap({
  title = 'Serving the Las Vegas Valley Land Market',
  description = "PaperLotLand connects developers, investors, and brokers with off-market land opportunities throughout the Las Vegas Valley. From Clark County infill lots to larger development parcels, our network gives you early access to deals before they hit the open market.",
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6446.247502570708!2d-115.29125768485073!3d36.114842733845215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c8b8a0fb9aaaab%3A0x3c9e734f4005e256!2sLas%20Vegas%2C%20NV!5e0!3m2!1sen!2sus!4v1743786127713!5m2!1sen!2sus"
              title="PaperLotLand Office"
            />
          </div>

          {/* Location Info */}
          <div className="mt-6">
            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="font-bold text-primary">Las Vegas Office</h3>
              <p className="mt-2 text-gray-600">Las Vegas, NV</p>
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
