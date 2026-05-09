import Link from 'next/link'
import Image from 'next/image'

interface Location {
  name: string
  image: string
  href: string
}

const locations: Location[] = [
  {
    name: 'Las Vegas, Nevada',
    image: '/images/locations/las-vegas-city.webp',
    href: '/',
  },
  {
    name: 'Henderson, Nevada',
    image: '/images/locations/henderson.webp',
    href: '/henderson/',
  },
  {
    name: 'Summerlin, Nevada',
    image: '/images/locations/summerlin.webp',
    href: '/we-buy-houses-summerlin/',
  },
  {
    name: 'Boulder City, Nevada',
    image: '/images/locations/boulder-city-new.jpg',
    href: '/we-buy-houses-boulder-city/',
  },
  {
    name: 'Pahrump, Nevada',
    image: '/images/locations/pahrump-new.webp',
    href: '/we-buy-houses-pahrump/',
  },
  {
    name: 'Whitney, Nevada',
    image: '/images/locations/henderson.webp',
    href: '/we-buy-houses-whitney/',
  },
]

interface LocationsGridProps {
  title?: string
  subtitle?: string
}

export function LocationsGrid({
  title = 'Las Vegas Cash Home Buyers',
  subtitle = 'We buy houses for cash in these Las Vegas metro areas',
}: LocationsGridProps) {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {locations.map((location) => (
            <Link
              key={location.name}
              href={location.href}
              className="group relative overflow-hidden rounded-xl shadow-lg"
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src={location.image}
                  alt={`Cash home buyers ${location.name}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white">
                    {location.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
