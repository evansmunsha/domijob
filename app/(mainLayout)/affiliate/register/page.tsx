import { AffiliateRegistration } from "@/components/affiliate/AffiliateRegistration"

export default function AffiliateRegisterPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Affiliate Program</h1>
        <div className="grid gap-8">
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
            <ol className="list-decimal list-inside space-y-3">
              <li>Register as an affiliate using the form below</li>
              <li>Get your unique referral link</li>
              <li>Share your link with friends, colleagues, and your audience</li>
              <li>Earn commissions when referred users sign up and convert</li>
              <li>Track your earnings and referrals in your affiliate dashboard</li>
            </ol>
          </div>
          
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Commission Structure</h2>
            <div className="space-y-3">
              <p>Our affiliate program offers generous commissions:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><span className="font-semibold">10%</span> commission on each referred user</li>
                <li>Commission is paid when the referred user completes registration</li>
                <li>Payments are processed monthly for amounts over $50</li>
                <li>Multiple payment methods available</li>
              </ul>
            </div>
          </div>
          
          <AffiliateRegistration />
        </div>
      </div>
    </div>
  )
} 