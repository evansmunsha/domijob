"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles } from "lucide-react"

const benefits = [
  {
    title: "AI-Powered Job Matching",
    description:
      "Our AI analyzes your skills and experience to find the perfect job opportunities tailored just for you.",
  },
  {
    title: "Save Valuable Time",
    description: "Focus your job search on positions where you have the highest chance of success.",
  },
  {
    title: "Optimize Your Resume",
    description: "Get personalized suggestions to improve your resume and increase your chances of landing interviews.",
  },
  {
    title: "Identify Skill Gaps",
    description: "Discover which skills you need to develop to qualify for your desired roles.",
  },
  {
    title: "Create Better Job Descriptions",
    description: "Recruiters can craft compelling job postings that attract the most qualified candidates.",
  },
]

export function BenefitsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % benefits.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-32 md:h-24 flex items-center justify-center overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg px-6 py-4">
      <Sparkles className="absolute left-6 h-6 w-6 opacity-70" />
      <Sparkles className="absolute right-6 h-6 w-6 opacity-70" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <h3 className="text-xl font-bold mb-2">{benefits[currentIndex].title}</h3>
          <p className="text-sm md:text-base">{benefits[currentIndex].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
        {benefits.map((_, index) => (
          <button
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50"
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`View benefit ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
