// app/resume-enhancer/page.tsx

import ResumeEnhancerForm from "../../../../components/ResumeEnhancerForm";



export default function ResumeEnhancerPage() {
  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">AI Resume Enhancer</h1>
      <ResumeEnhancerForm />
    </main>
  );
}
