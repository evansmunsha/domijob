"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CreditCard, Clock } from 'lucide-react';
import Link from "next/link";
import { getUserCreditStatus } from "@/app/actions/aiCredits";

export function CreditStatus() {
  const [creditData, setCreditData] = useState<{
    balance: number;
    isNewUser: boolean;
    transactions: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCreditData() {
      try {
        const data = await getUserCreditStatus();
        setCreditData(data);
      } catch (error) {
        console.error("Error loading credit data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCreditData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-20 flex items-center justify-center">
            <p>Loading credit information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creditData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-20 flex items-center justify-center">
            <p>Unable to load credit information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { balance, isNewUser, transactions } = creditData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Your AI Credits
        </CardTitle>
        {isNewUser && (
          <CardDescription>
            You have free credits to explore our AI tools!
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-3xl font-bold">{balance}</p>
            {isNewUser && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                Free Starter Credits
              </Badge>
            )}
          </div>
          <Button asChild>
            <Link href="/ai-credits">
              <CreditCard className="mr-2 h-4 w-4" />
              Get More Credits
            </Link>
          </Button>
        </div>

        {transactions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Recent Activity</h3>
            <div className="space-y-2">
              {transactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span>{tx.description}</span>
                  </div>
                  <span className={tx.amount > 0 ? "text-green-600" : "text-red-600"}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}