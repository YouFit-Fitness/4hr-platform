import { SignUp } from "@clerk/nextjs";

/**
 * Invited clients land here from the Clerk invitation email (the ticket is read
 * automatically). Sign-ups are Restricted in Clerk, so only invited emails work.
 */
export default function SignUpPage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center mb-4">Welcome to 4HR</p>
        <SignUp fallbackRedirectUrl="/" />
      </div>
    </main>
  );
}
