"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { onboardingSchema } from "@/lib/validation/onboarding"

export function OnboardingForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const values = {
      orgName: String(formData.get("orgName") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      firstBranchName: String(formData.get("firstBranchName") ?? ""),
      firstBranchAddress: String(formData.get("firstBranchAddress") ?? ""),
      defaultTables: formData.get("defaultTables")
        ? Number(formData.get("defaultTables"))
        : undefined,
      ownerEmail: String(formData.get("ownerEmail") ?? ""),
      ownerPassword: String(formData.get("ownerPassword") ?? ""),
      planId: String(formData.get("planId") ?? ""),
    }

    const parsed = onboardingSchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      toast.error("Check the highlighted fields.")
      return
    }

    setErrors({})
    setPending(true)

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: parsed.data.orgName,
          slug: parsed.data.slug,
          planId: parsed.data.planId || undefined,
          firstBranch: {
            name: parsed.data.firstBranchName,
            address: parsed.data.firstBranchAddress || null,
          },
          defaultTables: parsed.data.defaultTables,
          owner: {
            email: parsed.data.ownerEmail,
            password: parsed.data.ownerPassword,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(
          Array.isArray(data.message)
            ? data.message.join(". ")
            : (data.message ?? "Onboarding failed")
        )
        return
      }

      toast.success("Workspace created. You can now sign in.")
      router.push("/login")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Organization name</Label>
        <Input name="orgName" aria-invalid={Boolean(errors.orgName)} />
        {errors.orgName ? (
          <p className="text-xs text-destructive">{errors.orgName}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label>Slug</Label>
        <Input name="slug" aria-invalid={Boolean(errors.slug)} />
        {errors.slug ? (
          <p className="text-xs text-destructive">{errors.slug}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label>First branch name</Label>
        <Input
          name="firstBranchName"
          aria-invalid={Boolean(errors.firstBranchName)}
        />
        {errors.firstBranchName ? (
          <p className="text-xs text-destructive">{errors.firstBranchName}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label>First branch address (optional)</Label>
        <Input name="firstBranchAddress" />
      </div>
      <div className="space-y-1.5">
        <Label>Default tables (0–50)</Label>
        <Input name="defaultTables" type="number" min={0} max={50} />
      </div>
      <div className="space-y-1.5">
        <Label>Owner email</Label>
        <Input
          name="ownerEmail"
          type="email"
          aria-invalid={Boolean(errors.ownerEmail)}
        />
        {errors.ownerEmail ? (
          <p className="text-xs text-destructive">{errors.ownerEmail}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label>Owner password</Label>
        <Input
          name="ownerPassword"
          type="password"
          aria-invalid={Boolean(errors.ownerPassword)}
        />
        {errors.ownerPassword ? (
          <p className="text-xs text-destructive">{errors.ownerPassword}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label>Plan ID (optional)</Label>
        <Input name="planId" placeholder="Leave blank for no subscription" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create workspace"}
      </Button>
    </form>
  )
}
