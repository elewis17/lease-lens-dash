import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name;
  const email = user?.email;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // simplest and cleanest way to reset to demo mode
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar trigger */}
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{(fullName || email)?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-popover shadow-md z-[9999]">
          <div className="px-3 py-2 text-sm font-medium">{fullName || email}</div>

          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
            onClick={() => alert("Profile coming soon")}
          >
            Profile
          </button>

          <button
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-muted"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
