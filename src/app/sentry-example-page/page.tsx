"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-950 text-white">
      <div className="max-w-md w-full space-y-8 p-10 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Sentry Test Page
          </h1>
          <p className="mt-4 text-slate-400">
            Use this page to verify that RetainVault is correctly reporting errors to Sentry.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              throw new Error("Sentry Test Error from RetainVault");
            }}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            Trigger Frontend Error
          </button>

          <button
            onClick={async () => {
              try {
                // Simulate a failed API call
                const response = await fetch("/api/non-existent-endpoint");
                if (!response.ok) {
                  throw new Error(`API Error: ${response.status}`);
                }
              } catch (err) {
                Sentry.captureException(err);
                alert("Exception captured and sent to Sentry!");
              }
            }}
            className="w-full flex justify-center py-3 px-4 border border-slate-700 rounded-lg shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
          >
            Capture Manual Exception
          </button>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            Verification: If configured correctly, these errors will appear in your 
            <span className="text-indigo-400"> martin-vasko </span> 
            Sentry dashboard under project 
            <span className="text-indigo-400"> javascript-nextjs</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
