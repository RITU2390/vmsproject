import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Image */}
      <div className="relative w-full max-w-md h-64 mb-8">
        <Image
          src="/vehicle.jpg" // 👉 place your vehicle service illustration in public/
          alt="Vehicle Services Management System"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Text Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Vehicle Services Management System
        </h1>
        <p className="text-base text-gray-300 max-w-lg mx-auto">
          Streamline your vehicle maintenance, track service history, and manage technicians—all in one place.
        </p>

        {/* CTA Button */}
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 mt-4 rounded-xl bg-primary text-white font-medium shadow-md hover:shadow-lg hover:bg-primary/90 transition"
        >
          🚀 Open Dashboard
        </Link>
      </div>
    </section>
  )
}
