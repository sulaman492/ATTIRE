"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <div role="alert"><h1>Unable to load admin</h1><p>Please try again.</p><button onClick={reset}>Retry</button></div>;
}
