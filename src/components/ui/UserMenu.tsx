import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { connectedReview } from "@/features/portfolio/releaseProfile";

export default function UserMenu() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const name = user?.user_metadata?.full_name || user?.email || "Account";

  const signOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut(connectedReview ? { scope: "local" } : undefined);
    setSigningOut(false);
    if (error) toast({ variant: "destructive", title: "Could not sign out", description: "Try again." });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Account menu" className="flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ring">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="" />
            <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={6} align="end">
        <DropdownMenuLabel>{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onSelect={() => void signOut()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
