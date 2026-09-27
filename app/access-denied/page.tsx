import Link from "next/link";
export default function AccessDenied() {
  return <main className="min-h-screen bg-[#EDE4DD] text-black p-10 flex flex-col justify-center items-start gap-6">
    <p className="text-[#ff1a0a] font-bold">ATTIRE / RESTRICTED ACCESS</p>
    <h1 className="text-5xl font-bold">Admin access required.</h1>
    <p>Your account does not have permission to manage products.</p>
    <Link className="underline" href="/">Return to store</Link><Link className="underline" href="/login?next=/admin">Log in with an admin account</Link>
  </main>;
}
