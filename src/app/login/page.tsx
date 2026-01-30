import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next ?? "/dashboard";

  return <LoginForm next={next} />;
}
