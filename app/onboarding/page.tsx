import { OnboardingForm } from "./onboarding-form"

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md items-center px-4 py-10">
      <div className="w-full space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Onboard your cafe
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your workspace, first branch, and owner account.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  )
}
