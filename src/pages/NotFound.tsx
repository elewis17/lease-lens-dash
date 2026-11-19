import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-md space-y-4 px-6 py-10">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="underline">Return to DealStack</Link>
    </section>
  );
}
