# AI API Testing Report for DomiJob

## 🔍 **Found AI APIs and Their Status**

### ✅ **Working APIs:**
1. **`/api/ai/match-jobs`** - ✅ WORKING (Job Matcher - Main)
2. **`/api/test-openai`** - ✅ WORKING (OpenAI Test)
3. **`/api/health`** - ✅ WORKING (Health Check)

### ❓ **APIs That Need Testing:**

#### **1. Resume Enhancer API**
- **Endpoint**: `/api/ai/resume-enhancer`
- **Method**: POST
- **Expected Input**: `{ resumeText: string, targetJobTitle?: string }`
- **Cost**: 15 credits
- **Issues Found**:
  - ❌ Uses `gpt-4.1-mini` model (should be `gpt-4o-mini`)
  - ❌ Streaming response format may cause parsing issues
  - ❌ High max_tokens (800) might cause timeouts

#### **2. Job Description Enhancer API**
- **Endpoint**: `/api/ai/enhance-job`
- **Method**: POST
- **Expected Input**: `{ jobTitle, jobDescription, industry?, location? }`
- **Cost**: 20 credits
- **Issues Found**:
  - ❌ Uses deprecated `generateAIResponse` utility
  - ❌ Complex timeout handling that might fail
  - ❌ Inconsistent error handling

#### **3. Alternative Job Matcher API**
- **Endpoint**: `/api/ai/job-match`
- **Method**: POST
- **Expected Input**: `{ resumeText: string, jobIds?: string[] }`
- **Cost**: 10 credits
- **Issues Found**:
  - ❌ Uses deprecated `generateAIResponse` utility
  - ❌ Different from the working `/api/ai/match-jobs`
  - ❌ May conflict with main job matcher

#### **4. Resume Parser API**
- **Endpoint**: `/api/ai/resume-parse`
- **Method**: POST (FormData)
- **Expected Input**: File upload (DOCX only)
- **Cost**: 5 credits
- **Issues Found**:
  - ❌ Uses `gpt-4` model (expensive)
  - ❌ Only supports DOCX files
  - ❌ Streaming response format

#### **5. Admin AI Settings API**
- **Endpoint**: `/api/admin/settings/ai`
- **Method**: GET/POST
- **Purpose**: Configure AI settings
- **Issues Found**:
  - ❌ References `gpt-4.1-mini` (invalid model name)
  - ❌ Admin-only access

## 🚨 **Critical Issues Found:**

### **1. Model Name Issues**
- **Resume Enhancer**: Uses `gpt-4.1-mini` (invalid)
- **Admin Settings**: References `gpt-4.1-mini` (invalid)
- **Resume Parser**: Uses expensive `gpt-4` model

### **2. Deprecated Utility Usage**
- **Job Match API**: Uses `generateAIResponse` from `/app/utils/openai.ts`
- **Job Enhancer API**: Uses `generateAIResponse` with complex timeout handling

### **3. Inconsistent Response Formats**
- **Resume Enhancer**: Streaming response
- **Resume Parser**: Streaming response
- **Job Matcher**: JSON response
- **Job Enhancer**: JSON response

### **4. Credit Cost Inconsistencies**
- **Job Match**: 10 credits (old API)
- **Match Jobs**: 1 credit (new API)
- **Resume Enhancement**: 15 credits
- **Job Enhancement**: 20 credits
- **File Parsing**: 5 credits

## 🔧 **Recommended Fixes:**

### **Priority 1: Fix Model Names**
```typescript
// Change from:
model: "gpt-4.1-mini"
// To:
model: "gpt-4o-mini"
```

### **Priority 2: Standardize APIs**
- Remove duplicate `/api/ai/job-match` (keep `/api/ai/match-jobs`)
- Standardize all APIs to use direct OpenAI calls
- Use consistent JSON response format

### **Priority 3: Fix Resume Enhancer**
- Change to JSON response instead of streaming
- Fix model name
- Add proper timeout handling

### **Priority 4: Fix Job Enhancer**
- Simplify to direct OpenAI call
- Remove complex timeout handling
- Standardize response format

## 🧪 **Test Commands:**

### Test Resume Enhancer:
```bash
curl -X POST https://domijob.vercel.app/api/ai/resume-enhancer \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"Software engineer with 5 years experience in React and Node.js","targetJobTitle":"Senior Developer"}'
```

### Test Job Enhancer:
```bash
curl -X POST https://domijob.vercel.app/api/ai/enhance-job \
  -H "Content-Type: application/json" \
  -d '{"jobTitle":"Software Engineer","jobDescription":"We need a developer","industry":"Technology"}'
```

### Test Resume Parser:
```bash
curl -X POST https://domijob.vercel.app/api/ai/resume-parse \
  -F "file=@resume.docx"
```

## 📊 **Pages That May Be Broken:**

1. **`/ai-tools/resume-enhancer`** - May not parse streaming response correctly
2. **Job posting forms** - AI enhancement button may fail
3. **Document upload features** - Resume parser may timeout
4. **Admin AI settings** - Invalid model references

## 🎯 **Next Steps:**

1. **Test each API endpoint** with the provided curl commands
2. **Fix model name issues** in resume enhancer and admin settings
3. **Standardize response formats** across all AI APIs
4. **Remove deprecated APIs** and utilities
5. **Update UI components** to handle new response formats
