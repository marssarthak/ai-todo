import { Profile } from "@/components/auth/Profile";
import MainLayout from "@/components/layout/MainLayout";

export default function ProfilePage() {
  // This page should be protected by middleware
  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <Profile />
    </MainLayout>
  );
}
