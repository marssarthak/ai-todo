import { Profile } from "@/components/auth/Profile";

export default function ProfilePage() {
  return (
    <main className="flex min-h-screen flex-col items-center pt-24 sm:pt-32 px-4">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile information and preferences.
          </p>
        </header>

        <section className="w-full">
          {/* The Profile component renders its own Card */}
          <Profile />
        </section>
      </div>
    </main>
  );
}
