import RegistrationForm from "@/components/registration-form";
import Image from "next/image";

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 text-foreground">
      {/* Modern Navigation */}
      <nav className="fixed top-0 z-50 w-full glass-effect border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="SIH 2025"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-lg font-bold text-gradient">SIH 2025</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#about" className="transition-colors hover:text-primary">
              About
            </a>
            <a href="#process" className="transition-colors hover:text-primary">
              Process
            </a>
            <a
              href="#register"
              className="transition-colors hover:text-primary"
            >
              Register
            </a>
            <a href="#contact" className="transition-colors hover:text-primary">
              Contact
            </a>
          </div>
          <button className="btn-primary">Get Started</button>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
        {/* Animated Background Elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 animate-float rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 animate-float delay-1000 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 animate-glow rounded-full bg-gradient-to-r from-cyan-400/10 to-blue-400/10 blur-2xl" />
        </div>

        {/* Geometric Grid Pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
          <div className="animate-grid-move h-full w-full bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
          {/* Logo Banner */}
          <div className="mb-8 transform transition-transform hover:scale-105">
            <Image
              src="/banner2.png"
              alt="SIH 2025"
              width={600}
              height={140}
              priority
              className="drop-shadow-lg"
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-balance text-gradient text-5xl font-bold leading-tight tracking-tight md:text-7xl lg:text-8xl">
            Smart India
            <span className="block">Hackathon 2025</span>
          </h1>

          {/* Subtitle */}
          <h2 className="mt-4 text-xl font-semibold text-muted-foreground md:text-2xl">
            Malabar College of Advanced Studies
          </h2>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            Internal Selection Process
          </div>

          {/* Description */}
          <p className="mt-8 max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            Join India's biggest innovation marathon. Form diverse teams, solve
            real-world challenges, and showcase your creativity to secure your
            spot in the nationwide competition.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
            <a
              href="#register"
              className="btn-primary group px-8 py-4 text-base"
            >
              Start Registration
              <svg
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <a href="#process" className="btn-secondary px-8 py-4 text-base">
              Learn Process
            </a>
          </div>

          {/* Partner Logos */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-60">
            <span className="text-sm font-medium text-muted-foreground">
              Powered by
            </span>
            {PARTNERS.map((p) => (
              <div
                key={p.name}
                className="flex items-center transition-transform hover:scale-110"
              >
                <Image
                  src={p.logo}
                  alt={p.name}
                  width={60}
                  height={60}
                  className="h-16 w-16 object-contain grayscale transition-all hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Scroll to explore
            </span>
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="relative py-24 px-6 flex justify-center items-center"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-4xl font-bold text-gradient lg:text-5xl">
                Innovation Meets
                <span className="block">Opportunity</span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Smart India Hackathon is the world's biggest hackathon, bringing
                together brilliant minds to solve pressing challenges facing our
                nation. This is your chance to make a real impact while
                competing for recognition and rewards.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-effect rounded-xl p-6 card-hover"
                  >
                    <div className="text-2xl font-bold text-primary">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* <div className="relative">
              <div className="glass-effect rounded-2xl p-8">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <svg
                        className="h-8 w-8 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold">
                      Innovation Showcase
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Watch previous year highlights
                    </p>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section
        id="process"
        className="relative py-24 px-6 bg-gradient-to-br from-slate-50/50 to-blue-50/30"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gradient lg:text-5xl">
              Your Journey to Innovation
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
              Follow our structured process to maximize your chances of success
              in the Smart India Hackathon
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {PROCESS_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="glass-effect rounded-2xl p-8 card-hover relative"
              >
                <div className="absolute -top-4 -left-4 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                <div className="mt-4 text-sm font-medium text-primary">
                  {step.timeline}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Section - Enhanced */}
      <section id="register" className="relative py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
            {/* Registration Form */}
            <div className="order-2 lg:order-1">
              <div className="glass-effect rounded-2xl p-8">
                <RegistrationForm />
              </div>
            </div>

            {/* Process Info */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-24">
              <h2 className="text-3xl font-bold text-gradient mb-6">
                Ready to Begin?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start your SIH 2025 journey by completing your registration.
                Join thousands of innovators working towards building a better
                India.
              </p>

              {/* Timeline */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Important Dates</h3>
                {TIMELINE.map((item) => (
                  <div key={item.date} className="flex gap-4">
                    <div className="flex-shrink-0 w-20 text-sm font-medium text-primary">
                      {item.date}
                    </div>
                    <div>
                      <div className="font-medium">{item.event}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="mt-12 space-y-4">
                <h3 className="text-xl font-semibold">Why Participate?</h3>
                <div className="grid gap-3">
                  {BENEFITS.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="glass-effect border-t border-border/50 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="SIH 2025"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-gradient">
                  SIH 2025 Internals
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Join the biggest innovation marathon in India. Transform ideas
                into reality and be part of building a better tomorrow.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <a
                  href="#about"
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  About SIH
                </a>
                <a
                  href="#process"
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Process
                </a>
                <a
                  href="#register"
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Register
                </a>
                <a
                  href="#contact"
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Malabar College of Advanced Studies</div>
                <div>Malappuram, Kerala</div>
                <div>faheemcp241@gmail.com</div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 Smart India Hackathon Internals. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground">
              Credit Goes to{" "}
              <a
                href="https://mulearn.uck.ac.in"
                className="text-primary hover:underline"
              >
                μlearn UCEK
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Data Constants
const PARTNERS = [
  { name: "IEDC", logo: "/IEDC.png" },
  { name: "μlearn UCEK", logo: "/MulearnMALMD.png" },
  { name: "ICC", logo: "/IIC.png" },
];

const STATS = [
  { value: "10+", label: "Teams Expected" },
  { value: "60+", label: "Participants" },
  { value: "6", label: "Team Size" },
  { value: "23 Sept", label: "Registration Deadline" },
];

const PROCESS_STEPS = [
  {
    icon: "👤",
    title: "Individual Registration",
    description:
      "Complete your personal registration with all required details",
    timeline: "Closes 18 Sept",
  },
  {
    icon: "👥",
    title: "Team Formation",
    description:
      "Form a diverse team of 6 members (min 1 female) using our team discovery feature",
    timeline: "18-20 Sept",
  },
  {
    icon: "🎯",
    title: "Problem Selection",
    description:
      "Choose from available SIH problem statements that match your team's expertise",
    timeline: "20-23 Sept",
  },
  {
    icon: "🏆",
    title: "Internal Hackathon",
    description:
      "Present your solution in the internal hackathon and get shortlisted for SIH nationals",
    timeline: "25 Sept",
  },
];

const TIMELINE = [
  {
    date: "18 Sept",
    event: "Registration Closes",
    description: "Last day for individual registration",
  },
  {
    date: "18-20 Sept",
    event: "Team Formation",
    description: "Complete your team of 6 members",
  },
  {
    date: "20-23 Sept",
    event: "Problem Selection",
    description: "Choose your problem statement",
  },
  {
    date: "25 Sept",
    event: "Internal Hackathon",
    description: "Present your solution to judges",
  },
];

const BENEFITS = [
  "Direct entry to Smart India Hackathon 2025",
  "Mentorship from industry experts",
  "Cash prizes and recognition",
  "Networking with innovators nationwide",
  "Certificate of participation",
  "Real-world problem solving experience",
];
