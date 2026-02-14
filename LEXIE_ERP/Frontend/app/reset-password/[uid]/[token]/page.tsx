import ResetPasswordClient from "@/components/auth/ResetPasswordClient";

export async function generateStaticParams() {
    return [];
}

export default function ResetPasswordPage() {
    return <ResetPasswordClient />;
}
