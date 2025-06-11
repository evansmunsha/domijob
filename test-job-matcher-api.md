# Job Matcher API Test Guide

## API Endpoint
`POST /api/ai/match-jobs`

## Request Format
```json
{
  "resumeText": "Your resume content here..."
}
```

## Expected Response Format
```json
{
  "matches": [
    {
      "jobId": "job_id_here",
      "score": 85,
      "reasons": [
        "Strong background in React and TypeScript",
        "5+ years of experience matches requirements"
      ],
      "missingSkills": ["AWS", "Docker"],
      "job": {
        "title": "Senior Frontend Developer",
        "company": "Tech Company Inc",
        "location": "San Francisco, CA",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "salaryRange": "$120,000 - $150,000"
      }
    }
  ],
  "creditsUsed": 1,
  "remainingCredits": 49,
  "totalJobsAnalyzed": 15,
  "matchesFound": 3
}
```

## Error Responses

### Insufficient Credits (402)
```json
{
  "error": "Insufficient credits. Please purchase more credits to continue."
}
```

### Guest Credits Exhausted (403)
```json
{
  "error": "You've used all your free credits. Sign up to get 50 more!",
  "requiresSignup": true
}
```

### Invalid Input (400)
```json
{
  "error": "Please provide a valid resume text (minimum 50 characters)."
}
```

## Test Cases

### 1. Valid Resume Test
```bash
curl -X POST http://localhost:3000/api/ai/match-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Experienced software engineer with 5 years in React, TypeScript, and Node.js. Built scalable web applications for fintech companies. Strong background in agile development and team leadership."
  }'
```

### 2. Short Resume Test (Should fail)
```bash
curl -X POST http://localhost:3000/api/ai/match-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Short resume"
  }'
```

### 3. Missing Resume Test (Should fail)
```bash
curl -X POST http://localhost:3000/api/ai/match-jobs \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Features Implemented

✅ **Credit Management**
- Supports both authenticated users and guests
- Proper credit deduction and tracking
- Guest credit cookie management

✅ **Job Matching**
- Fetches active jobs from database
- AI-powered matching with OpenAI GPT-4
- Realistic scoring (50-100%)
- Detailed match reasons and missing skills

✅ **Error Handling**
- Input validation
- Credit insufficient handling
- AI response parsing errors
- Database connection issues

✅ **Response Enhancement**
- Job details from database
- Sorted by match score
- Usage analytics logging
- Comprehensive metadata

## Database Requirements

The API requires these tables:
- `JobPost` (with status "ACTIVE")
- `Company` (linked to jobs)
- `UserCredits` (for authenticated users)
- `CreditTransaction` (for logging)
- `AIUsageLog` (for analytics)

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key
- Database connection (Prisma)
