"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Target,
  Lightbulb,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

const benefits = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "AI-Powered Matching",
    description: "Our intelligent algorithms find jobs that align perfectly with your resume and skills.",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Save Valuable Time",
    description: "Skip irrelevant listings. Get matched only with roles you're likely to land.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Smart Resume Insights",
    description: "Instant suggestions to optimize your resume for each opportunity.",
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Upskill Suggestions",
    description: "Identify growth areas and stay competitive with AI-backed insights.",
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Premium Job Access",
    description: "Get visibility into exclusive openings from top remote-first companies.",
  },
]

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % benefits.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [isPaused])

  const nextBenefit = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % benefits.length)
  }

  const prevBenefit = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + benefits.length) % benefits.length)
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden py-16 md:py-24",
        isDark
          ? "bg-gradient-to-br from-indigo-950 via-blue-900 to-violet-900"
          : "bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600",
      )}
    >
      {/* Floating background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={cn("absolute rounded-full opacity-10", isDark ? "bg-white" : "bg-white")}
            style={{
              width: `${Math.random() * 10 + 5}rem`,
              height: `${Math.random() * 10 + 5}rem`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 10}s infinite linear`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="container relative mx-auto px-4 text-white">
        {/* Hero content */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your Smartest Job Search Ever
            <br />
            <span className="text-emerald-300">AI-Matched Remote Jobs</span>
          </motion.h1>

          <motion.p
            className="mb-8 text-lg md:text-xl text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Domijob reads your resume, matches you to real jobs instantly,
            and shows how to improve. Skip the search — let AI do the heavy lifting.
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/ai-tools">
              <Button
                size="lg"
                className="bg-white font-semibold text-blue-700 hover:bg-gray-100 dark:bg-white dark:text-blue-700"
              >
                Start Matching Now
              </Button>
            </Link>
            <Link href="/post-job">
              <Button size="lg" variant="outline" className="border-white font-medium  text-red-700 hover:bg-white/10">
                Post a Job
              </Button>
            </Link>
          </motion.div>

          {/* Trust Stats */}
          <div className="mt-6 text-sm text-white/80 flex justify-center gap-6 flex-wrap">
            <span>✅ 2,000+ Job Seekers Helped</span>
            <span>✅ 50+ Hiring Companies</span>
            <span>✅ Built-in Resume Enhancer</span>
          </div>
        </div>

        {/* Benefits Carousel */}
        <div
          className="mx-auto mt-16 max-w-3xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={cn(
              "relative rounded-xl p-6 backdrop-blur-sm",
              isDark
                ? "bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                : "bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]",
            )}
          >
            {/* Arrows */}
            <button
              onClick={prevBenefit}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30 transition-all"
              aria-label="Previous benefit"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={nextBenefit}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30 transition-all"
              aria-label="Next benefit"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Benefit content */}
            <div className="h-[140px] md:h-[120px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400">
                    {benefits[currentIndex].icon}
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">{benefits[currentIndex].title}</h3>
                  <p className="mx-auto max-w-2xl text-white/90">
                    {benefits[currentIndex].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Benefit tab buttons on desktop */}
            <div className="mt-6 hidden md:flex justify-center gap-4">
              {benefits.map((benefit, index) => (
                <button
                  key={index}
                  className={`flex flex-col items-center transition-all ${
                    index === currentIndex ? "text-white" : "text-white/50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <div
                    className={`h-10 w-10 flex items-center justify-center rounded-full
                      ${index === currentIndex
                        ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                        : "bg-white/20"}`}
                  >
                    {benefit.icon}
                  </div>
                  <span className="mt-2 text-xs text-center">{benefit.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
