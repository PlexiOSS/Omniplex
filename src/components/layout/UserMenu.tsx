"use client";

import {
  Gift,
  LayoutDashboard,
  LogOut,
  Shield,
  ShoppingBag,
  Ticket,
  TicketIcon,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import type { AuthSession } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { GiPaper } from "react-icons/gi";

interface UserMenuProps {
  session: AuthSession;
  isStaff: boolean;
  onLogout: () => void;
}

/** Avatar-triggered dropdown replacing the old bare avatar + inline "Sign out"
 * button — houses every account-level link (dashboard, profile, premium,
 * shop, tickets, staff panel) in one place instead of the avatar being a
 * dead-end that only linked to the dashboard. */
export function UserMenu({ session, isStaff, onLogout }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleLogout() {
    setOpen(false);
    onLogout();
  }

  return (
    <Dropdown
      open={open}
      onClose={() => setOpen(false)}
      panelClassName="w-56"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-transparent transition-colors hover:ring-zinc-300 dark:hover:ring-zinc-600"
          aria-label="Account menu"
          aria-expanded={open}
        >
          <Avatar
            src={mirroredAvatarUrl("users", session.user_id, session.avatar)}
            alt={session.username ?? "Your profile"}
            size={32}
            className="cursor-pointer"
          />
        </button>
      }
    >
      <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {session.username ?? "Your account"}
        </p>
      </div>
      <div className="py-1">
        <DropdownItem
          icon={<LayoutDashboard size={14} />}
          onClick={() => go("/dashboard")}
        >
          Dashboard
        </DropdownItem>
        <DropdownItem
          icon={<User size={14} />}
          onClick={() => go(`/user/${session.user_id}`)}
        >
          View Profile
        </DropdownItem>
        <DropdownItem
          icon={<GiPaper size={14} />}
          onClick={() => go("/apps")}
        >
          Applications
        </DropdownItem>
        <DropdownItem
          icon={<Ticket size={14} />}
          onClick={() => go("/tickets")}
        >
          Support Tickets
        </DropdownItem>
        {isStaff && (
          <DropdownItem
            icon={<Shield size={14} />}
            onClick={() => go("/admin")}
          >
            Staff Panel
          </DropdownItem>
        )}
        <DropdownItem
          icon={<Gift size={14} />}
          onClick={() => go("/premium")}
        >
          Premium
        </DropdownItem>
        <DropdownItem
          icon={<ShoppingBag size={14} />}
          onClick={() => go("/shop")}
        >
          Shop
        </DropdownItem>
      </div>
      <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
        <DropdownItem
          icon={<LogOut size={14} />}
          onClick={handleLogout}
          danger
        >
          Sign out
        </DropdownItem>
      </div>
    </Dropdown>
  );
}
