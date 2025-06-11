"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function AffiliateFAQ() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const faqItems = [
    {
      question: "How does the affiliate program work?",
      answer: "Our affiliate program allows you to earn commissions by referring customers to our platform. You'll receive a unique affiliate link to share with your audience. When someone clicks on your link and completes a conversion, you earn a commission based on your rate."
    },
    {
      question: "How much can I earn as an affiliate?",
      answer: "Commission rates typically range from 10-20% based on your performance and volume. As you refer more customers and generate more conversions, your commission rate may increase. You can view your current rate in your affiliate dashboard."
    },
    {
      question: "When and how do I get paid?",
      answer: "Payments are processed monthly for all earnings that have cleared the 30-day holding period. You can request a payment once your balance reaches the minimum threshold ($50). We support payments via PayPal and bank transfer. Payment requests submitted before 5PM UK time on Fridays will be processed the following week."
    },
    {
      question: "What is the payment threshold?",
      answer: "The minimum payment threshold is $50. Once your pending earnings reach this amount, you can request a payment through your dashboard."
    },
    {
      question: "What is the cookie duration?",
      answer: "Our affiliate cookies last for 30 days. This means if someone clicks your link, you'll receive credit for any conversion they complete within 30 days of that click."
    },
    {
      question: "How do I track my performance?",
      answer: "Your affiliate dashboard provides real-time statistics on clicks, conversions, and earnings. You can view detailed reports and track your performance over time to optimize your marketing efforts."
    },
    {
      question: "What counts as a conversion?",
      answer: "A conversion occurs when a user you referred completes a signup and makes a payment on our platform. Each successful conversion earns you a commission based on your commission rate."
    },
    {
      question: "Can I promote the affiliate program on social media?",
      answer: "Yes! Social media is an excellent channel for affiliate promotion. You can share your affiliate link on platforms like Twitter, Facebook, LinkedIn, and Instagram. We also provide marketing materials that you can use in your campaigns."
    },
    {
      question: "Is there a limit to how much I can earn?",
      answer: "There's no cap on your earning potential. The more conversions you generate, the more you earn. Top affiliates can earn significant recurring income through our program."
    },
    {
      question: "What marketing materials do you provide?",
      answer: "We provide a range of marketing materials including banners, email templates, landing page templates, and social media images. You can access these from your affiliate dashboard."
    },
    {
      question: "How do I get my affiliate link?",
      answer: "Your unique affiliate link is available in your dashboard once you've registered as an affiliate. You can copy it with one click and start sharing it immediately."
    },
    {
      question: "Can I have multiple affiliate accounts?",
      answer: "No, each person is limited to one affiliate account. Multiple accounts from the same person will be terminated and may result in forfeiture of commissions."
    },
    {
      question: "What happens if someone uses my link but completes the purchase later?",
      answer: "As long as they convert within the 30-day cookie period after clicking your link, you'll receive the commission, even if they don't complete the purchase immediately."
    },
    {
      question: "How long is the holding period for commissions?",
      answer: "Commissions have a 30-day holding period to account for potential refunds or chargebacks. After this period, they become available for withdrawal."
    },
    {
      question: "Can I be an affiliate if I'm also a customer?",
      answer: "Yes! Many of our best affiliates are also customers. Your firsthand experience with our platform can make your recommendations more authentic and effective."
    }
  ]
  
  const filteredFaqs = faqItems.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search questions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <p className="text-center py-4 text-muted-foreground">No questions found matching your search.</p>
          )}
        </Accordion>
      </CardContent>
    </Card>
  )
} 