"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

import Link from "next/link"

import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    blurb: "For a single cafe getting off the spreadsheet.",
    features: [
      "1 branch",
      "Up to 15 staff",
      "POS + KDS",
      "Tables & bills",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "$79",
    period: "/mo",
    blurb: "Multi-branch operators who want the full Ops + CRM picture.",
    features: [
      "Up to 3 branches",
      "Up to 60 staff",
      "Inventory, recipes, payroll",
      "CRM, promotions, loyalty",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    blurb: "Enterprises and franchises.",
    features: [
      "Unlimited branches",
      "Unlimited staff",
      "SSO & audit log",
      "Dedicated success manager",
      "Custom SLA",
    ],
  },
]

const features = [
  {
    title: "Orders & KDS",
    body: "POS builder with modifiers and notes, live ticket board with websocket updates, transition graph enforced end to end.",
  },
  {
    title: "Tables & billing",
    body: "Occupancy derived from active orders. One combined bill per table; late orders merge and totals recompute.",
  },
  {
    title: "Menu & modifiers",
    body: "Org-wide template plus branch overrides. Availability toggles, price editing, modifier variants.",
  },
  {
    title: "Inventory",
    body: "Suppliers, stock-in, adjustments, movements, reorder thresholds, recipe ingredients, discrepancy reviews.",
  },
  {
    title: "Staff",
    body: "Shifts, roster calendar, clock-in/out windows, payroll export, wage rates.",
  },
  {
    title: "CRM",
    body: "Customers with loyalty points and tiers, promotions with apply-at-till, birthday and promotion announcements.",
  },
]

const faqs = [
  {
    q: "Is this a website builder for my cafe's customer menu?",
    a: "No. Bliss is the staff dashboard for running the cafe: orders, KDS, POS, inventory, staff, and CRM. Your customer-facing menu is a separate app.",
  },
  {
    q: "How do I add my first branch?",
    a: "Sign up or onboard; the first branch is created during onboarding. You can add more from the Branches screen.",
  },
  {
    q: "Can a branch manager manage more than one branch?",
    a: "Org-wide roles (owner, super admin) see everything. Branch managers are confined to their branch by both UI and API.",
  },
  {
    q: "Does it work offline?",
    a: "Tablets need a connection to submit orders and print. KDS reconnects automatically on reconnect.",
  },
  {
    q: "How is billing handled?",
    a: "Bliss is your SaaS subscription. Guest payments go through your configured provider (Stripe, etc.).",
  },
  {
    q: "Is there an API?",
    a: "The dashboard talks to the Bliss NestJS API. Reverse proxies are supported via X-Tenant-Id.",
  },
]

export function LandingContent() {
  const root = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!root.current) return
      const ctx = gsap.context(() => {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
        if (!reduced) {
          gsap.from(".hero-kicker", { y: -12, opacity: 0, duration: 0.5 })
          gsap.from(".hero-line", {
            y: 40,
            opacity: 0,
            stagger: 0.12,
            duration: 0.7,
            ease: "power3.out",
            delay: 0.1,
          })
          gsap.from(".hero-sub", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            delay: 0.5,
          })
          gsap.from(".hero-cta", {
            y: 20,
            opacity: 0,
            stagger: 0.08,
            duration: 0.5,
            delay: 0.7,
          })

          gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
            gsap.from(el, {
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none none",
              },
              y: 32,
              opacity: 0,
              duration: 0.7,
              ease: "power2.out",
            })
          })

          gsap.utils.toArray<HTMLElement>(".feature-card").forEach((el, i) => {
            gsap.from(el, {
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none none",
              },
              y: 24,
              opacity: 0,
              duration: 0.5,
              delay: (i % 3) * 0.08,
              ease: "power2.out",
            })
          })

          gsap.utils.toArray<HTMLElement>(".plan-card").forEach((el, i) => {
            gsap.from(el, {
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none none",
              },
              y: 24,
              opacity: 0,
              duration: 0.5,
              delay: i * 0.1,
              ease: "power2.out",
            })
          })

          gsap.to(".ticket-float", {
            y: -8,
            duration: 2.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            stagger: 0.3,
          })
        }
      }, root)
      return () => ctx.revert()
    },
    { scope: root }
  )

  return (
    <div ref={root} className="relative min-h-[100dvh] overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              B
            </span>
            <span className="text-base font-semibold">Bliss</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#kds"
              className="text-muted-foreground hover:text-foreground"
            >
              KDS
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground"
            >
              Plans
            </a>
            <a
              href="#faq"
              className="text-muted-foreground hover:text-foreground"
            >
              FAQ
            </a>
            <a
              href="#about"
              className="text-muted-foreground hover:text-foreground"
            >
              About
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Sign in
            </a>
            <a
              href="/onboarding"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create workspace
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <div className="hero-kicker inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Live in
          production
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
          <span className="hero-line block">Run your cafe,</span>
          <span className="hero-line block text-primary">
            not the paperwork.
          </span>
        </h1>
        <p className="hero-sub mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Bliss is the tenant dashboard for multi-branch cafes. Orders and KDS,
          POS, tables and bills, inventory, staff, CRM, and reports — everything
          your team needs on the floor and in the back office.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="/onboarding"
            className="hero-cta rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get started free
          </a>
          <a
            href="/login"
            className="hero-cta rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Sign in
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="reveal text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need on the floor
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            From the first order to the last bill, every role gets the tools they actually need. Watch a
            short demo of each module below.
          </p>
        </div>

        <div className="mt-14 space-y-24">
          {/* Orders & KDS */}
          <div className="grid items-center gap-10 md:grid-cols-2 reveal">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Orders &amp; KDS</h3>
              <p className="mt-3 text-muted-foreground">
                The POS builds orders with modifiers, notes, and a table picker. Orders stream to a KDS
                board with confirmed, preparing, and ready lanes. Ticket age, modifiers, and notes are
                visible at a glance; the socket channel keeps everyone in sync and reconnects
                automatically on drop.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>· Transition graph enforced end to end</li>
                <li>· Role-gated access per branch</li>
                <li>· Sound toggle &amp; connection indicator</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3">
              <video
                className="w-full rounded-xl"
                autoPlay
                muted
                loop
                playsInline
                src="/demo/create-order.webm"
              />
            </div>
          </div>

          {/* Tables & billing */}
          <div className="grid items-center gap-10 md:grid-cols-2 reveal">
            <div className="order-2 md:order-1 rounded-2xl bg-muted/30 p-3">
              <img
                src="/screenshots/checkout.png"
                alt="Combined bill sheet"
                className="w-full rounded-xl"
                loading="lazy"
              />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-2xl font-semibold tracking-tight">Tables &amp; billing</h3>
              <p className="mt-3 text-muted-foreground">
                Occupancy is derived from active orders — a table becomes occupied the moment an order
                is placed and frees itself when the bill is checked out. Late orders merge into the same
                bill and totals recompute.
              </p>
              <p className="mt-3 text-muted-foreground">
                Print a clean 80&nbsp;mm receipt from any browser. Save-as-PDF names itself with the bill
                id, and reprinting is one click away.
              </p>
            </div>
          </div>

          {/* Inventory */}
          <div className="grid items-center gap-10 md:grid-cols-2 reveal">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Inventory</h3>
              <p className="mt-3 text-muted-foreground">
                Suppliers, items with reorder thresholds, stock-in and adjustment movements, recipe
                ingredients attached to menu items, and discrepancy reviews for failed or partial
                deductions.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>· Low-stock highlighting</li>
                <li>· Full movement audit trail</li>
                <li>· Recipe-driven stock deduction</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3">
              <img
                src="/screenshots/inventory.png"
                alt="Inventory screen"
                className="w-full rounded-xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Staff */}
          <div className="reveal max-w-3xl">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Staff</h3>
              <p className="mt-3 text-muted-foreground">
                Shifts with clock-in windows, roster calendar, hours worked, payroll export, and wage
                rates. Clock-in/out uses the signed-in token so a worker can only stamp for themselves.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>· Roster Monday–Sunday, per branch</li>
                <li>· Payroll CSV export</li>
                <li>· Permission split for money views</li>
              </ul>
            </div>
          </div>

          {/* Menu */}
          <div className="grid items-center gap-10 md:grid-cols-2 reveal">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Menu &amp; modifiers</h3>
              <p className="mt-3 text-muted-foreground">
                An org-wide template every branch inherits, with branch overrides that win on name, price,
                and availability. Categories, items, prices, availability toggles, and modifier variants.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>· Org-wide vs branch scope tabs</li>
                <li>· Inline availability toggle</li>
                <li>· Modifier variants with extra price</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3">
              <img
                src="/screenshots/menu.png"
                alt="Menu screen"
                className="w-full rounded-xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* CRM */}
          <div className="reveal max-w-3xl">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">CRM &amp; promotions</h3>
              <p className="mt-3 text-muted-foreground">
                Customers with phone lookup, loyalty points and tiers, birthdays, and promotions you can
                apply at the till. Announce promotions or birthdays to the notification queue with one
                click.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>· Find-or-create by phone</li>
                <li>· Loyalty tier &amp; points</li>
                <li>· Promotions with apply-at-till totals</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* KDS deep dive */}
      <section id="kds" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="reveal">
            <h2 className="text-3xl font-semibold tracking-tight">
              A kitchen that knows what to do next
            </h2>
            <p className="mt-3 text-muted-foreground">
              Confirmed, preparing, and ready lanes keep the line moving. Ticket
              age, modifiers, and notes are visible at a glance. A live socket
              channel means no refresh; a reconnect falls back to the
              active-orders query automatically.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>· Sound toggle and connection indicator</li>
              <li>· Branch-scoped, role-gated access</li>
              <li>· Late orders merge into the open bill</li>
            </ul>
          </div>
          <div className="reveal rounded-2xl bg-muted/30 p-3">
            <img
              src="/screenshots/kitchen.png"
              alt="Kitchen board (KDS)"
              className="w-full rounded-xl"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Tables deep dive */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="reveal order-2 rounded-2xl bg-muted/30 p-3 md:order-1">
            <img
              src="/screenshots/tables.png"
              alt="Tables"
              className="w-full rounded-xl"
              loading="lazy"
            />
          </div>
          <div className="reveal order-1 md:order-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              Tables that know their own status
            </h2>
            <p className="mt-3 text-muted-foreground">
              No manual status buttons. Occupancy is derived from active orders,
              so a table becomes occupied the moment an order is placed and
              frees itself when the bill is checked out. Add orders to a table
              later and they merge into the same bill with recomputed totals.
            </p>
            <p className="mt-3 text-muted-foreground">
              Print a clean 80&nbsp;mm receipt from any browser. Save-as-PDF
              names itself with the bill id, and reprinting is one click away.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="reveal text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Simple, honest pricing
          </h2>
          <p className="mt-2 text-muted-foreground">
            Pick a plan for your workspace. Change it anytime from the billing
            screen.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`plan-card rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-primary bg-primary/5"
                  : "bg-background"
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
              <p className="mt-4 text-3xl font-semibold">
                {plan.price}
                {plan.period ? (
                  <span className="text-base font-normal text-muted-foreground">
                    {plan.period}
                  </span>
                ) : null}
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 size-1.5 rounded-full bg-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/onboarding"
                className={`mt-6 block rounded-lg px-4 py-2 text-center text-sm font-medium ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border hover:bg-muted"
                }`}
              >
                {plan.price === "Custom" ? "Talk to us" : "Get started"}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="reveal rounded-2xl border bg-muted/30 p-8">
          <h2 className="text-3xl font-semibold tracking-tight">About Bliss</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Bliss started from a simple frustration: the people running a cafe
            deserve software that matches how a kitchen actually moves. We built
            a tenant dashboard that keeps the counter, the kitchen, and the back
            office in one place, without forcing a single workflow on to every
            team.
          </p>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Multi-tenant from day one, role-aware, and built on the
            brands&rsquo; own hardware. You bring the coffee, we bring the ops.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="reveal">
          <h2 className="text-3xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-6 divide-y rounded-2xl border">
          {faqs.map((faq) => (
            <details key={faq.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                {faq.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bliss Cafe. All rights reserved.
          </span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="/login" className="hover:text-foreground">
              Sign in
            </a>
            <a href="/onboarding" className="hover:text-foreground">
              Create workspace
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
