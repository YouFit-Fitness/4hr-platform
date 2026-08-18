import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center mb-4">4HR Transformation System</p>
        <SignIn fallbackRedirectUrl="/" />
      </div>
    </main>
  );
}
