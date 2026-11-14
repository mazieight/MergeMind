import Link from "next/link";
export default function NotFound() {
  return (
    <section className="panel login">
      <h2>This workspace isn’t available.</h2>
      <p className="muted">
        It may not exist, or your account may not have access.
      </p>
      <Link className="button" href="/">
        Back to workspace ↗
      </Link>
    </section>
  );
}
