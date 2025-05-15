"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Zap, Clock, Target, Lightbulb, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

const benefits = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "AI-Powered Matching",
    description: "Our intelligent algorithms find the perfect jobs for your unique skills and experience profile.",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Save Valuable Time",
    description: "Focus only on positions where you have the highest chance of success and skip the rest.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Personalized Insights",
    description: "Receive tailored feedback to optimize your resume and stand out from other applicants.",
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Discover Growth Opportunities",
    description: "Identify skill gaps and learning paths to qualify for your dream roles and advance your career.",
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Premium Job Listings",
    description: "Access exclusive opportunities from top companies looking for candidates just like you.",
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
    }, 7000) // Change every 7 seconds

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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={cn("absolute rounded-full opacity-10", isDark ? "bg-white" : "bg-white")}
            style={{
              width: `${Math.random() * 10 + 5}rem`,
              height: `${Math.random() * 10 + 5}rem`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
              animation: "float infinite linear",
            }}
          />
        ))}
      </div>

      <div className="container relative mx-auto px-4 text-white">
        {/* Main hero content */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Find Remote Jobs{" "}
            <span className="relative inline-block">
              Anywhere
              <span className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-70"></span>
            </span>
          </motion.h1>

          <motion.p
            className="mb-8 text-lg md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            DoMiJob is an AI-driven job board connecting job seekers and recruiters.
            <br className="hidden md:block" /> Find your next opportunity or hire top talent efficiently.
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="#job-listings">
              <Button
                size="lg"
                className="bg-white font-medium text-blue-700 hover:bg-gray-100 dark:bg-white dark:text-blue-700"
              >
                Find Jobs
              </Button>
            </Link>
            <Link href="/post-job">
              <Button size="lg" variant="outline" className="border-white font-medium text-white hover:bg-white/10">
                Post a Job
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Benefits carousel */}
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
            <button
              onClick={prevBenefit}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
              aria-label="Previous benefit"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={nextBenefit}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
              aria-label="Next benefit"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="h-[140px] md:h-[120px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400">
                    {benefits[currentIndex].icon}
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">{benefits[currentIndex].title}</h3>
                  <p className="mx-auto max-w-2xl text-white/90">{benefits[currentIndex].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex justify-center space-x-2">
              {benefits.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? "w-8 bg-gradient-to-r from-emerald-400 to-cyan-400" : "w-2 bg-white/40"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`View benefit ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
