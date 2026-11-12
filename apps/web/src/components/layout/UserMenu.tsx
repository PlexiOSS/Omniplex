"use client";

import { STAFF_URL } from "@omniplex/core/api/config";
import type { AuthSession } from "@omniplex/core/api/types";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { Avatar } from "@omniplex/ui/Avatar";
import { Dropdown, DropdownItem } from "@omniplex/ui/Dropdown";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Repeat,
  Settings,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserMenuProps {
  session: AuthSession;
  isStaff: boolean;
  onLogout: () => void;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
      {children}
    </p>
  );
}

export function UserMenu({ session, isStaff, onLogout }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const avatar = mirroredAvatarUrl("users", session.user_id, session.avatar);
  const displayName =
    session.display_name || session.username || "Your account";

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dropdown
      open={open}
      onClose={() => setOpen(false)}
      panelClassName="w-64"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-transparent transition-colors hover:ring-zinc-300 dark:hover:ring-zinc-600"
          aria-label="Account menu"
          aria-expanded={open}
        >
          <Avatar
            src={avatar}
            alt={session.username ?? "Your profile"}
            size={32}
            className="cursor-pointer"
          />
        </button>
      }
    >
      <Link
        href={`/user/${session.user_id}`}
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 border-b border-zinc-100 px-3 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
      >
        <Avatar src={avatar} alt={displayName} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {displayName}
          </span>
          {session.username && (
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
              @{session.username}
            </span>
          )}
        </span>
      </Link>

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
          Your profile
        </DropdownItem>
        <DropdownItem
          icon={<Bell size={14} />}
          onClick={() => go("/dashboard?tab=notifications")}
        >
          Notifications
        </DropdownItem>
        <DropdownItem
          icon={<Repeat size={14} />}
          onClick={() => go("/dashboard?tab=auto-vote")}
        >
          Auto-vote
        </DropdownItem>
        <DropdownItem
          icon={<Settings size={14} />}
          onClick={() => go("/dashboard?tab=profile")}
        >
          Settings
        </DropdownItem>
      </div>

      <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
        <SectionLabel>Help</SectionLabel>
        <DropdownItem
          icon={<LifeBuoy size={14} />}
          onClick={() => go("/tickets")}
        >
          Support tickets
        </DropdownItem>
        <DropdownItem
          icon={<ClipboardList size={14} />}
          onClick={() => go("/dashboard?tab=applications")}
        >
          Your applications
        </DropdownItem>
      </div>

      {isStaff && (
        <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
          <DropdownItem
            icon={<Shield size={14} />}
            onClick={() => {
              setOpen(false);
              window.location.href = STAFF_URL;
            }}
          >
            Staff panel
          </DropdownItem>
        </div>
      )}

      <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
        <DropdownItem
          icon={<LogOut size={14} />}
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
          danger
        >
          Sign out
        </DropdownItem>
      </div>
    </Dropdown>
  );
}
