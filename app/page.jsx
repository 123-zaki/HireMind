

import BentoCard from "@/components/BentoCard";
import { CodeDemo } from "@/components/demo-components-animate-code";
import { GravityStarsBackgroundDemo } from "@/components/demo-components-backgrounds-gravity-stars";
import { GoldTitle, GrayTitle, SectionHeading, SectionLabel } from "@/components/Reusables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AI_TAGS, AVATARS, LOGOS, ROLES, SLOTS } from "@/lib/data";
import { PricingTable } from "@clerk/nextjs";
import { BarChart4Icon, Bot, Calendar, Camera, Lock, MessageCircle, Terminal, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function MockUI({ rows = 3 }) {
  const widths = ["w-4/5", "w-3/5", "w-2/5", "w-4/5", "w-1/2"];
  const colors = [
    "bg-white/5",
    "bg-white/5",
    "bg-amber-400/15",
    "bg-white/5",
    "bg-white/5",
  ];

  return (
    <div className="mt-5 rounded-xl bg-[#141417] border border-white/10 overflow-hidden">
      <div className="h-9 bg-white/5 border-b border-white/10 flex items-center px-3.5 gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
        <span className="w-2 h-2 rounded-full bg-[#28c840]" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full ${widths[i]} ${colors[i]}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-black overflow-x-hidden">
      {/* Hero */}
      <section className="px-4 sm:px-8 pb-20 relative min-h-screen pt-28 sm:pt-32 overflow-hidden grid grid-cols-1 lg:grid-cols-5">
        <GravityStarsBackgroundDemo />

        <div className="col-span-full lg:col-span-3 flex justify-center items-center lg:-rotate-2 flex-col">
          <Badge variant="gold">Powered by AI - Now in beta</Badge>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-tighter max-w-4xl text-center">
            <GrayTitle>Ace your next interview</GrayTitle>
            <br />
            <GoldTitle>With real experts</GoldTitle>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-stone-400 max-w-xl mt-6 leading-relaxed">
            Book 1:1 mock interviews with senior engineers from top companies.
            Get AI-powered feedback, role specfc questions, and the confidence to land your dream job.
          </p>

          <div className="flex mt-10 justify-center gap-2 sm:gap-4 sm:w-auto">
            <Link href="/onboarding">
              <Button variant="gold" size="hero">Get Started</Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="hero" className="cursor-pointer hover:-translate-y-0.5">Browse Interviewers</Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4  mt-8 sm:mt-16">
            <div className="flex">
              {
                AVATARS.map((avt, i) => (
                  <div key={i} className={` ${i > 0 ? "-ml-2" : ""} border-2 border-[#0a0a0b] overflow-hidden rounded-full`}>
                    <Image src={avt.src} alt="user avatar" width={32} height={32} className={`w-full h-full object-cover`} />
                  </div>
                ))
              }
            </div>

            <p className="text-sm text-stone-500 sm:text-left">
              <strong className="text-stone-400 font-medium">2,400+ engineers</strong>{" "}
              cracked FAANG interviews va HireMind
            </p>
          </div>
        </div>

        <div className="col-span-full lg:col-span-2 mt-12 lg:mt-0 lg:rotate-3 flex items-center justify-center">
          <CodeDemo duration={30 * 1000} writing />
        </div>

      </section>

      <section className="border-y border-white/10 py-14">
        <p className="text-stone-600 traking-widest uppercase mb-8 font-medium text-xs text-center">Interviewees landed roles at</p>

        <div className="flex flex-wrap gap-24 justify-center items-center">
          {
            LOGOS.map((logo, i) => (
              <div key={i}>
                <Image src={logo.src} alt={logo.alt} width={50} height={50} className="h-6 w-auto opacity-60 grayscale" />
              </div>
            ))
          }
        </div>
      </section>

      <section className="max-w-5xl mx-auto py-28 px-6">
        <div className="text-center mb-16">
          <SectionLabel>Features</SectionLabel>
          <SectionHeading
            gold={"Everything you need,"}
            gray={"nothing you don't"}
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-7">
            <BentoCard
              icon={<Bot size={20} className="text-amber-400" />}
              title={<GrayTitle>AI Question Generator</GrayTitle>}
              description={"Interviewers get a live AI co-pilot generating role specific questions on demand - system design, behavioural, DSA - all tailored to the candidate's level"}
            >
              <div className="flex flex-wrap gap-2 mt-5">
                {
                  AI_TAGS.map((tag, i) => (
                    <Badge key={tag.label} variant={tag.active ? "gold" : "outline"}>
                      {tag.label}
                    </Badge>
                  ))
                }
              </div>
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-5">
            <BentoCard
              icon={<Wallet size={20} className="text-amber-400" />}
              title={<GrayTitle>Credit System</GrayTitle>}
              description={"Subscribe for monthly credits. Book sessions. Interviewers earn and withdraw anytime"}
            >
              <div className="mt-5 p-5 bg-[#141417] rounded-xl border border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-stone-600 text-xs mb-1">Your balance</p>
                  <p className="font-serif text-4xl leading-none bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
                    28
                  </p>
                  <p className="text-xs text-stone-600 mt-1">
                    credits remaining
                  </p>
                </div>
                <Badge variant="secondary">+10 this month</Badge>
              </div>
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <BentoCard
              icon={<Camera size={20} className="text-amber-400" />}
              title={<GrayTitle>HD Video Calls</GrayTitle>}
              description={"Powered by stream. Screen sharing, recording and instant playback links - all built in."}
            >
              <MockUI rows={3} />
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <BentoCard
              icon={<MessageCircle size={20} className="text-amber-400" />}
              title={<GrayTitle>Persistent Chat</GrayTitle>}
              description={"Manage your interviewer before and after the call. Share resources, prep notes, and follow-ups in one thread."}
            >
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <BentoCard
              icon={<Lock size={20} className="text-amber-400" />}
              title={<GrayTitle>Security by Arcjet</GrayTitle>}
              description={"Bot protection, rate limiting, and abuse prevention baked into every API route."}
            >
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-6">
            <BentoCard
              icon={<BarChart4Icon size={20} className="text-amber-400" />}
              title={<GrayTitle>AI feedback Reports</GrayTitle>}
              description={"Post interview analysis by Gemini with actionale insights."}
            >
              <MockUI rows={3} />
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-6">
            <BentoCard
              icon={<Calendar size={20} className="text-amber-400" />}
              title={<GoldTitle>Slot-based Scheduling</GoldTitle>}
              description={"Interviewer set availability once. Interviewers pick from open slots and confirm with one click -- no back-and-forth needed."}
            >
              <div className="flex flex-wrap gap-2 mt-5">
                {
                  SLOTS.map((s) => (
                    <span key={s.label} className={`text-xs px-3 py-1.5 rounded-lg border ${s.cls}`}>
                      {s.label}
                    </span>
                  ))
                }
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto pb-28 px-6">
        <div className="text-center mb-16">
          <SectionLabel>Who it's for</SectionLabel>
          <SectionHeading
            gold={"Built for both sides"}
            gray={"of the table"}
          />
        </div>


        <div className="grid md:grid-cols-2 gap-6">
          {
            ROLES.map(r => (
              <div key={r.label} className="bg-[#0f0f11] border border-white/10 hover:border-amber-400/20 rounded-2xl p-12 h-full transition duration-300 overflow-hidden">
                <span className="inline-block text-xs font-semibold text-amber-400 tracking-widest uppercase border border-amber-400/20 bg-amber-400/10 rounded-full px-3 py-1.5 mb-5">
                  {r.label}
                </span>

                <h3 className='font-serif tracking-tight text-xl mb-2'>
                  {r.title}
                </h3>

                <p className='text-sm text-stone-400 leading-relaxed mb-12'>
                  {r.desc}
                </p>

                <ul className="space-y-3">
                  {
                    r.perks.map(p => (
                      <li key={p} className="text-sm text-stone-400 flex gap-3">
                        <span className="mt-0.5 min-w-4 h-4 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                          ✓
                        </span>
                        {p}
                      </li>
                    ))
                  }
                </ul>
              </div>
            ))
          }
        </div>
      </section>

      {/* pricing */}
      <section className="max-w-5xl mx-auto pb-28 px-6">
        <div className="text-center mb-16">
          <SectionLabel>Pricing</SectionLabel>
          <SectionHeading
            gold={"Simple, transparent"}
            gray={"credit-based plans"}
          />
          <p className="text-stone-400 mt-3 text-sm">Each credit = one session. Unused credits roll over.</p>
        </div>

        <PricingTable checkoutProps={{
          appearance: {
            elements: {
              drawerRoot: {
                zIndex: 2000
              }
            }
          }
        }} />
      </section>

      <section className="relative z-10 pb-28 max-w-5xl mx-auto px-6">
        <div className="relative border border-amber-400/20 rounded-3xl px-3 sm:px-16 py-20 bg-linear-to-br from-amber-400/5 text-center overflow-hidden">
          <GravityStarsBackgroundDemo />

          <h2 className="relative z-10 font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-4">
            <GrayTitle>Your next interview</GrayTitle>
            <br />
            <GoldTitle>starts here</GoldTitle>
          </h2>

          <p className="text-stone-400 font-light text-sm mb-11">
            Join thousands of engineers already levelling up on HireMind
          </p>

          <div className="relative z-10 flex mt-10 justify-center gap-2 sm:gap-4 sm:w-auto">
            <Link href="/onboarding">
              <Button variant="gold" size="hero">Get Started</Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="hero" className="cursor-pointer hover:-translate-y-0.5">Browse Interviewers</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/7 py-12 mx-auto px-6 flex flex-wrap items-center justify-center text-stone-400">Made with ❤️ by Zaki</footer>
      {/* <section className="pt-28 sm:pt-32 flex flex-col">
        <GrayTitle>Welcome to HireMind!</GrayTitle>
        <GoldTitle>Welcome to HireMind</GoldTitle>
        <ScetionLabel>Welcome to HireMind</ScetionLabel>
      </section> */}
    </div>
  );
}
