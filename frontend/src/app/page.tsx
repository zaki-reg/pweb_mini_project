import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif font-semibold text-slate-900">
          Quiz Platform
        </h1>
        <p className="text-lg text-slate-600 font-sans">
          Test your knowledge
        </p>
        <div className="pt-8">
          <Button>Get Started</Button>
        </div>
      </div>
    </main>
  )
}