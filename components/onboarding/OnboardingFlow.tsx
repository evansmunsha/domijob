"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  FileText,
  Search,
  CreditCard,
  X,
  Play
} from "lucide-react"
import { trackEvents } from "@/app/utils/analytics"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: string
  href?: string
  completed?: boolean
}

interface OnboardingFlowProps {
  isOpen: boolean
  onClose: () => void
  userType: 'new' | 'returning'
}

export function OnboardingFlow({ isOpen, onClose, userType }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DomiJob!',
      description: 'Your AI-powered career companion that helps you land your dream job.',
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      action: 'Get Started'
    },
    {
      id: 'resume-enhance',
      title: 'Enhance Your Resume',
      description: 'Get AI-powered suggestions to optimize your resume for ATS systems.',
      icon: <FileText className="h-8 w-8 text-blue-500" />,
      action: 'Try Resume Enhancer',
      href: '/ai-tools/resume-enhancer'
    },
    {
      id: 'job-matching',
      title: 'Find Perfect Jobs',
      description: 'Our AI matches you with jobs that fit your skills and experience.',
      icon: <Target className="h-8 w-8 text-green-500" />,
      action: 'Start Job Matching',
      href: '/jobs'
    },
    {
      id: 'explore-tools',
      title: 'Explore AI Tools',
      description: 'Discover all our career tools designed to boost your job search.',
      icon: <Search className="h-8 w-8 text-purple-500" />,
      action: 'Explore Tools',
      href: '/ai-tools'
    },
    {
      id: 'credits',
      title: 'Understanding Credits',
      description: 'Learn how our credit system works and get the most out of your free credits.',
      icon: <CreditCard className="h-8 w-8 text-amber-500" />,
      action: 'Learn More'
    }
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  useEffect(() => {
    if (isOpen) {
      trackEvents.funnelStep('onboarding_started', 'user_onboarding')
    }
  }, [isOpen])

  const handleNext = () => {
    const current = steps[currentStep]
    
    // Mark current step as completed
    setCompletedSteps(prev => [...prev, current.id])
    
    // Track step completion
    trackEvents.funnelStep(`step_${current.id}_completed`, 'user_onboarding')
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Onboarding completed
      trackEvents.funnelStep('onboarding_completed', 'user_onboarding')
      onClose()
    }
  }

  const handleSkip = () => {
    trackEvents.funnelStep('onboarding_skipped', 'user_onboarding')
    onClose()
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
    trackEvents.funnelStep(`step_${steps[stepIndex].id}_clicked`, 'user_onboarding')
  }

  const handleActionClick = () => {
    const current = steps[currentStep]
    
    if (current.href) {
      trackEvents.featureUsed(`onboarding_${current.id}`)
      window.location.href = current.href
    } else {
      handleNext()
    }
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {userType === 'new' ? 'Welcome!' : 'Welcome Back!'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {steps.length}
              </span>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-center space-x-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep || completedSteps.includes(step.id)
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current step content */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {currentStepData.icon}
            </div>
            
            <div>
              <CardTitle className="text-2xl mb-2">
                {currentStepData.title}
              </CardTitle>
              <CardDescription className="text-base">
                {currentStepData.description}
              </CardDescription>
            </div>
          </div>

          {/* Step-specific content */}
          {currentStepData.id === 'welcome' && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What you'll get:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  AI-powered resume optimization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Smart job matching
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  50 free credits to get started
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Career guidance and tips
                </li>
              </ul>
            </div>
          )}

          {currentStepData.id === 'credits' && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Credit System:</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Resume Enhancement:</strong> 15 credits</li>
                <li>• <strong>Job Matching:</strong> 1 credit</li>
                <li>• <strong>File Parsing:</strong> 5 credits</li>
                <li>• <strong>Free Users:</strong> 50 credits to start</li>
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip Tour
            </Button>
            
            <Button
              onClick={handleActionClick}
              className="flex-1 gap-2"
            >
              {currentStepData.href ? (
                <>
                  <Play className="h-4 w-4" />
                  {currentStepData.action}
                </>
              ) : (
                <>
                  {currentStepData.action}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Quick tips */}
          {currentStep === 0 && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                💡 Tip: Complete this tour to learn how to maximize your job search success
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
