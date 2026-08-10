export function HomePageVirtualTeacherSection() {
  return (
    <section
      id="home-virtual-teacher"
      className="bg-white py-16 sm:py-20 lg:py-24"
      aria-labelledby="home-virtual-teacher-heading"
    >
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        {/*
          GIF: PLANCK/public/images/homepage/profesor-virtual-planck.gif
        */}
        <div className="scroll-animate-scale relative z-10 h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56">
          {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF; next/image can drop frames */}
          <img
            src="/images/homepage/profesor-virtual-planck.gif"
            alt="Planck — profesorul tău virtual"
            className="relative z-10 h-full w-full object-contain"
            loading="lazy"
            decoding="async"
          />

          {/* Trail vertical sub GIF — trece pe sub titlu */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[18rem] w-[72%] -translate-x-1/2 sm:h-[20rem] sm:w-[68%] lg:h-[22rem]"
            style={{
              background:
                "linear-gradient(180deg, #F2F9F4 0%, #FBFDF8 100%)",
              maskImage:
                "linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%)",
            }}
          />
        </div>

        <h2
          id="home-virtual-teacher-heading"
          className="scroll-animate-fade-up animate-delay-200 relative z-10 mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:mt-6 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]"
        >
          Întâlnește profesorul tău virtual, Planck
        </h2>
      </div>
    </section>
  )
}
