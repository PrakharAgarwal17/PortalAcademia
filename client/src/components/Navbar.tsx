import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  TrendingUp,
  Award,
  Briefcase,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Crown,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/context/theme";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    projectId?: string;
    contributionId?: string;
    prUrl?: string;
    companyName?: string;
    projectTitle?: string;
  };
  createdAt: string;
}

interface NavbarProps {
  userName?: string;
  userRole?: string;
  profileId?: string;
}

export default function Navbar({ profileId, userName, userRole }: NavbarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isIndustry =
    userRole === "industry" ||
    location.pathname.includes("/dashboard/industry");
  const isFaculty =
    userRole === "faculty" ||
    location.pathname.includes("/dashboard/faculty") ||
    location.pathname.includes("/trends/faculty");
  const isInstitution =
    userRole === "institution" ||
    location.pathname.includes("/dashboard/institution") ||
    location.pathname.includes("/trends/institution");

  const dashboardPath = isIndustry
    ? "/dashboard/industry"
    : isFaculty
    ? "/dashboard/faculty"
    : isInstitution
    ? "/dashboard/institution"
    : "/dashboard/student";
  const trendsPath = isFaculty
    ? "/trends/faculty"
    : isInstitution
    ? "/trends/institution"
    : "/trends/student";

  const navLinks = [
    {
      name: "Dashboard",
      path: dashboardPath,
      icon: LayoutDashboard,
      isActive: location.pathname.startsWith("/dashboard"),
    },
    {
      name: "Market Trends",
      path: trendsPath,
      icon: TrendingUp,
      isActive: location.pathname.startsWith("/trends"),
    },
    {
      name: "Test Your Skills",
      path: "/assessments",
      icon: Award,
      isActive: location.pathname === "/assessments",
    },
    {
      name: "Current Applications",
      path: "/applications",
      icon: Briefcase,
      isActive: location.pathname === "/applications",
    },
  ];

  // Fetch notifications
  useEffect(() => {
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications?limit=8`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        // silent catch
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // 30s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // silent
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      try {
        await fetch(`${API_BASE}/api/notifications/${n._id}/read`, {
          method: "PATCH",
          credentials: "include",
        });
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        // silent
      }
    }
    if (n.metadata?.prUrl) {
      window.open(n.metadata.prUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border px-4 lg:px-8 py-2.5 flex items-center justify-between shadow-xs">
      {/* Brand & Main Navigation Links */}
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
            Portal<span className="text-primary font-mono">Academia</span>
          </span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.isActive;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary-foreground" : "text-primary")} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile & Right Toolbar */}
      <div className="flex items-center gap-2">
        {/* Mobile Quick Links */}
        <div className="flex md:hidden items-center gap-1 pr-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.isActive;
            return (
              <Link
                key={link.path}
                to={link.path}
                title={link.name}
                className={cn(
                  "p-1.5 rounded-md border transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/40 border-border text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
              </Link>
            );
          })}
        </div>

        {/* AI HelpBOT Button */}
        <Link
          to="/ai-guide"
          className={cn(
            "p-1.5 rounded-md border transition-all cursor-pointer flex items-center justify-center shadow-xs",
            location.pathname === "/ai-guide"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          )}
          title="AI HelpBOT"
        >
          <Bot className="w-4 h-4" />
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white font-mono">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-border bg-card shadow-lg z-50 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-2 rounded-sm border border-border text-left text-xs transition-colors cursor-pointer hover:border-primary/40",
                        n.isRead ? "bg-background/50 opacity-80" : "bg-secondary/40 font-medium"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-[11px] text-foreground">
                        {n.type === "certificate_issued" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        {n.title}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                      <div className="flex items-center justify-between mt-1 pt-0.5">
                        <span className="text-[9px] text-muted-foreground/70 font-mono">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {n.metadata?.prUrl && (
                          <span className="text-[9px] text-primary font-mono hover:underline">
                            View PR →
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Premium Link */}
        <Link
          to="/premium"
          className={cn(
            "p-1.5 rounded-md border transition-all cursor-pointer flex items-center justify-center shadow-xs",
            location.pathname.startsWith("/premium")
              ? "bg-amber-400 text-amber-950 border-amber-400"
              : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800"
          )}
          title="Premium Dashboard"
        >
          <Crown className="w-4 h-4" />
        </Link>

        {/* Profile Link (Icon Only) */}
        <Link
          to={profileId ? `/profile/${profileId}` : "/profile"}
          className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer flex items-center justify-center"
          title={userName ? `Profile (${userName})` : "View Profile"}
        >
          <UserIcon className="w-4 h-4 text-primary" />
        </Link>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Sign Out */}
        <button
          type="button"
          onClick={() => dispatch(signOutThunk())}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
