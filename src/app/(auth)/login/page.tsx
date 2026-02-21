export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email to receive a magic link.
        </p>
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-400">
          Magic link auth will be built in Session 3.
        </div>
      </div>
    </div>
  );
}
