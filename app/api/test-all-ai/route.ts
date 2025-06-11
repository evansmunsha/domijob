import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  const testResults = {
    timestamp: new Date().toISOString(),
    baseUrl,
    tests: [] as any[]
  };

  // Test data
  const testResume = "Experienced software engineer with 5+ years in React, TypeScript, and Node.js. Built scalable web applications for fintech companies. Strong background in agile development and team leadership.";
  const testJobDescription = "We are looking for a senior software engineer to join our team. Must have experience with React, Node.js, and cloud technologies.";

  // Test 1: OpenAI Connection
  try {
    const response = await fetch(`${baseUrl}/api/test-openai`);
    const data = await response.json();
    testResults.tests.push({
      name: "OpenAI Connection",
      endpoint: "/api/test-openai",
      status: response.ok ? "✅ PASS" : "❌ FAIL",
      response: data,
      error: response.ok ? null : data.error
    });
  } catch (error) {
    testResults.tests.push({
      name: "OpenAI Connection",
      endpoint: "/api/test-openai",
      status: "❌ ERROR",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  // Test 2: Health Check
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();
    testResults.tests.push({
      name: "Health Check",
      endpoint: "/api/health",
      status: response.ok ? "✅ PASS" : "❌ FAIL",
      response: data
    });
  } catch (error) {
    testResults.tests.push({
      name: "Health Check",
      endpoint: "/api/health",
      status: "❌ ERROR",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  // Test 3: Job Matcher (Main)
  try {
    const response = await fetch(`${baseUrl}/api/ai/match-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: testResume })
    });
    const data = await response.json();
    testResults.tests.push({
      name: "Job Matcher (Main)",
      endpoint: "/api/ai/match-jobs",
      status: response.ok ? "✅ PASS" : "❌ FAIL",
      response: {
        matchesFound: data.matches?.length || 0,
        creditsUsed: data.creditsUsed,
        remainingCredits: data.remainingCredits
      },
      error: response.ok ? null : data.error
    });
  } catch (error) {
    testResults.tests.push({
      name: "Job Matcher (Main)",
      endpoint: "/api/ai/match-jobs",
      status: "❌ ERROR",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  // Test 4: Resume Enhancer
  try {
    const response = await fetch(`${baseUrl}/api/ai/resume-enhancer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        resumeText: testResume,
        targetJobTitle: "Senior Software Engineer"
      })
    });
    
    // Handle streaming response
    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value);
        }
        
        testResults.tests.push({
          name: "Resume Enhancer",
          endpoint: "/api/ai/resume-enhancer",
          status: "✅ PASS",
          response: {
            hasContent: result.length > 0,
            contentLength: result.length,
            preview: result.substring(0, 200) + "..."
          }
        });
      } catch (streamError) {
        testResults.tests.push({
          name: "Resume Enhancer",
          endpoint: "/api/ai/resume-enhancer",
          status: "❌ STREAM_ERROR",
          error: streamError instanceof Error ? streamError.message : "Stream reading failed"
        });
      }
    } else {
      const data = await response.json();
      testResults.tests.push({
        name: "Resume Enhancer",
        endpoint: "/api/ai/resume-enhancer",
        status: "❌ FAIL",
        error: data.error || "Request failed"
      });
    }
  } catch (error) {
    testResults.tests.push({
      name: "Resume Enhancer",
      endpoint: "/api/ai/resume-enhancer",
      status: "❌ ERROR",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  // Test 5: Job Description Enhancer
  try {
    const response = await fetch(`${baseUrl}/api/ai/enhance-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: "Software Engineer",
        jobDescription: testJobDescription,
        industry: "Technology",
        location: "Remote"
      })
    });
    const data = await response.json();
    testResults.tests.push({
      name: "Job Description Enhancer",
      endpoint: "/api/ai/enhance-job",
      status: response.ok ? "✅ PASS" : "❌ FAIL",
      response: response.ok ? {
        hasEnhancedDescription: !!data.enhancedDescription,
        hasTitleSuggestion: !!data.titleSuggestion,
        creditsUsed: data.creditsUsed
      } : null,
      error: response.ok ? null : data.error
    });
  } catch (error) {
    testResults.tests.push({
      name: "Job Description Enhancer",
      endpoint: "/api/ai/enhance-job",
      status: "❌ ERROR",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  // Test 6: Alternative Job Matcher
  try {
    const response = await fetch(`${baseUrl}/api/ai/job-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: testResume })
    });
    const data = await response.json();
    testResults.tests.push({
      name: "Job Matcher (Alternative)",
      endpoint: "/api/ai/job-match",
      status: response.ok ? "✅ PASS" : "❌ FAIL",
      response: response.ok ? {
        matchesFound: data.matches?.length || 0,
        creditsUsed: data.creditsUsed
      } : null,
      error: response.ok ? null : data.error
    });
  } catch (error) {
    testResults.tests.push({
      name: "Job Matcher (Alternative)",
      endpoint: "/api/ai/job-match",
      status: "❌ ERROR",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  // Summary
  const passCount = testResults.tests.filter(t => t.status === "✅ PASS").length;
  const failCount = testResults.tests.filter(t => t.status.includes("❌")).length;
  
  testResults.summary = {
    total: testResults.tests.length,
    passed: passCount,
    failed: failCount,
    success_rate: `${Math.round((passCount / testResults.tests.length) * 100)}%`
  };

  return NextResponse.json(testResults, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
