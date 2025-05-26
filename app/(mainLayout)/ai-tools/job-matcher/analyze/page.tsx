'use client'

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, Sparkles } from "lucide-react";

export default function AnalyzeJobMatchesPage() {
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleMatch = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text.");
      return;
    }

    setLoading(true);
    setError("");
    setMatches([]);

    try {
      const res = await fetch("/api/ai/match-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeText }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresSignup) {
          setError("You’ve used all your free credits. Please sign up to continue.");
        } else {
          setError(data.error || "Something went wrong.");
        }
        return;
      }

      setMatches(data.matches || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10 mx-auto">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Match Me With Jobs
      </h1>

      <Textarea
        placeholder="Paste your resume text here..."
        className="min-h-[200px] mb-4"
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
      />

      <Button onClick={handleMatch} disabled={loading || !resumeText.trim()} className="mb-6">
        {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Matching...</> : "Find Matching Jobs"}
      </Button>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {matches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Top Matches:</h2>
          {matches.map((match, i) => (
            <div key={i} className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold text-lg">{match.job?.title}</h3>
              <p className="text-sm text-muted-foreground">
                {match.job?.company} — {match.job?.location}
              </p>
              <p className="mt-1 text-sm"><strong>Match Score:</strong> {match.matchScore || match.score}%</p>
              <p className="text-sm mt-2"><strong>Why this match:</strong> {match.reasons?.join(", ") || match.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
