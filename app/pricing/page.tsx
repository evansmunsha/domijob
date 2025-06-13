import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Sparkles,
  Crown,
  Zap,
  Users,
  TrendingUp,
  Shield,
  Headphones
} from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with job searching",
    credits: "50 credits/month",
    badge: null,
    icon: <Sparkles className="h-6 w-6" />,
    features: [
      "Basic job matching",
      "Resume enhancement (2/month)",
      "Standard support",
      "Basic analytics",
      "Community access"
    ],
    limitations: [
      "Limited AI features",
      "Basic job alerts",
      "Standard processing speed"
    ],
    cta: "Get Started Free",
    href: "/register",
    popular: false
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    description: "For serious job seekers who want more opportunities",
    credits: "500 credits/month",
    badge: "Most Popular",
    icon: <Zap className="h-6 w-6" />,
    features: [
      "Advanced job matching",
      "Unlimited resume enhancements",
      "Priority support",
      "Application tracking",
      "Salary insights",
      "Interview preparation",
      "Custom job alerts",
      "Advanced analytics"
    ],
    limitations: [],
    cta: "Start Pro Trial",
    href: "/register?plan=pro",
    popular: true
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "per month",
    description: "For professionals who want the complete career toolkit",
    credits: "2000 credits/month",
    badge: "Best Value",
    icon: <Crown className="h-6 w-6" />,
    features: [
      "Everything in Pro",
      "Personal AI career coach",
      "Salary negotiation tools",
      "Direct recruiter contact",
      "Industry insights",
      "Career path planning",
      "White-glove onboarding",
      "Priority feature access"
    ],
    limitations: [],
    cta: "Start Premium Trial",
    href: "/register?plan=premium",
    popular: false
  }
]

const features = [
  {
    icon: <TrendingUp className="h-5 w-5 text-green-500" />,
    title: "AI-Powered Matching",
    description: "Our advanced AI analyzes your skills and matches you with the perfect opportunities."
  },
  {
    icon: <Shield className="h-5 w-5 text-blue-500" />,
    title: "ATS Optimization",
    description: "Ensure your resume passes through Applicant Tracking Systems with our optimization tools."
  },
  {
    icon: <Users className="h-5 w-5 text-purple-500" />,
    title: "Career Community",
    description: "Connect with other job seekers and share experiences in our supportive community."
  },
  {
    icon: <Headphones className="h-5 w-5 text-amber-500" />,
    title: "Expert Support",
    description: "Get help from our career experts and technical support team whenever you need it."
  }
]

const faqs = [
  {
    question: "How do credits work?",
    answer: "Credits are used for AI-powered features. Resume enhancement costs 15 credits, job matching costs 1 credit, and file parsing costs 5 credits. Credits reset monthly."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! Pro and Premium plans come with a 7-day free trial. No credit card required to start."
  },
  {
    question: "What if I need more credits?",
    answer: "You can upgrade your plan or purchase additional credit packs. We also offer custom enterprise solutions for high-volume users."
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          Pricing Plans
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Choose Your Career
          <span className="text-primary"> Success Plan</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          From free tools to premium career coaching, we have the right plan to accelerate your job search.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.badge && (
                <Badge 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground"
                >
                  {plan.badge}
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-base font-normal text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {plan.credits}
                  </Badge>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  asChild 
                  className={`w-full ${plan.popular ? 'bg-primary' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <Link href={plan.href}>
                    {plan.cta}
                  </Link>
                </Button>

                {plan.name === 'Free' && (
                  <p className="text-xs text-center text-muted-foreground">
                    No credit card required
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose DomiJob?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with career expertise to give you the best chance of landing your dream job.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of job seekers who have found success with DomiJob.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">
                Start Free Trial
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/demo">
                Watch Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
