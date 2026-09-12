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
} from "lucide-react";
import { useTheme } from "@/context/theme";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  profileId?: string;
}

export default function Navbar({ profileId, userName, userRole }: NavbarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();

  const isFaculty =
    userRole === "faculty" ||
    location.pathname.includes("/dashboard/faculty") ||
    location.pathname.includes("/trends/faculty");
  const isInstitution =
    userRole === "institution" ||
    location.pathname.includes("/dashboard/institution");

  const dashboardPath = isFaculty
    ? "/dashboard/faculty"
    : isInstitution
    ? "/dashboard/institution"
    : "/dashboard/student";
  const trendsPath = isFaculty ? "/trends/faculty" : "/trends/student";

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

        {/* AI HelpBOT Button (Left-most of Toolbar Action Icons) */}
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
