import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { getPageSession } from "@/lib/auth";

export default function LoginPage({
  showGoogle
}: {
  showGoogle: boolean;
}) {
  const router = useRouter();
  const verified = typeof router.query.verified === "string" ? router.query.verified : null;

  return (
    <>
      {verified === "success" ? (
        <div className="floating-banner success-banner">Email verified. You can sign in now.</div>
      ) : null}
      {verified === "invalid" ? (
        <div className="floating-banner error-banner">That verification link is invalid or expired.</div>
      ) : null}
      {verified === "missing" ? (
        <div className="floating-banner error-banner">Verification token missing.</div>
      ) : null}
      <AuthForm mode="login" showGoogle={showGoogle} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);

  if (session?.user) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false
      }
    };
  }

  return {
    props: {
      showGoogle: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }
  };
};
