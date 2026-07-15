"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui";

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return (
    <Button variant="danger" size="sm" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
