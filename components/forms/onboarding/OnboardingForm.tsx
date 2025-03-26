"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import CompanyForm from "./CompanyForm"
import Image from "next/image"
import Logo from "@/public/logo.png"
import UserTypeSelection from "./UserTypeSelection"
import JobSeekerForm from "./JobSeekerForm"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

type UserType = "company" | "jobSeeker" | null

export default function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<UserType>(null)

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type)
    setStep(2)
  }

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1)
      if (step === 2) {
        setUserType(null)
      }
    }
  }

  const totalSteps = 2
  const progress = (step / totalSteps) * 100

  const renderStep = () => {
    switch (step) {
      case 1:
        return <UserTypeSelection onSelect={handleUserTypeSelect} />
      case 2:
        return userType === "company" ? <CompanyForm /> : <JobSeekerForm />
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Image src={Logo || "/placeholder.svg"} alt="JobMarshal Logo" width={50} height={50} />
        <span className="text-4xl font-bold">
          Mi<span className="text-primary">Job</span>
        </span>
      </div>

      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>
          <span className="text-sm font-medium">{Math.round(progress)}% complete</span>
        </div>

        <Progress value={progress} className="h-2" />

        <Card className="w-full">
          <CardContent className="p-6">{renderStep()}</CardContent>
        </Card>
      </div>
    </>
  )
}

