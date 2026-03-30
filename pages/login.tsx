import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { getPageSession, googleAuthReady } from "@/lib/auth";

export default function LoginPage({
  showGoogle
}: {
  showGoogle: boolean;
}) {
  return <AuthForm mode="login" showGoogle={showGoogle} />;
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
      showGoogle: googleAuthReady
    }
  };
};
