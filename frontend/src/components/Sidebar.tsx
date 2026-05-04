import logo from "@/assets/logo.jpeg";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboardIcon,
  PackageIcon,
  UsersIcon,
  MapIcon,
  StoreIcon,
  BarChart3Icon,
  SettingsIcon,
  BuildingIcon,
  TruckIcon,
  BellIcon,
  ChevronRightIcon,
  LogOutIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { label: `Dashboard`, icon: LayoutDashboardIcon, path: `/` },
  { label: `Orders & Dispatch`, icon: PackageIcon, path: `/orders` },
  { label: `Drivers`, icon: TruckIcon, path: `/drivers` },
  { label: `Live Map`, icon: MapIcon, path: `/map` },
  { label: `Merchants`, icon: StoreIcon, path: `/merchants` },
  { label: `Reports`, icon: BarChart3Icon, path: `/reports` },
  { label: `HQ Master`, icon: BuildingIcon, path: `/hq` },
  { label: `Notifications`, icon: BellIcon, path: `/notifications` },
  { label: `Settings`, icon: SettingsIcon, path: `/settings` },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      data-cmp="Sidebar"
      className="w-60 min-h-screen flex flex-col bg-sidebar border-r border-sidebar-border shadow-custom flex-shrink-0"
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-custom">
  <img
    src={logo}
    alt="Wolan Logo"
    className="w-full h-full object-contain"
  />
</div>
          <div>
            <p className="text-xs font-bold text-white leading-tight tracking-widest uppercase">Wolan</p>
            <p className="text-[10px] text-muted-foreground tracking-wider">Logistics Admin</p>
          </div>
        </div>
      </div>

      {/* Hub selector */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 cursor-pointer hover:bg-accent transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success status-pulse" />
            <span className="text-xs text-foreground font-medium">Pioneer Mall Hub</span>
          </div>
          <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-left ${
                active
                  ? `bg-accent text-primary font-medium`
                  : `text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? `text-primary` : ``}`} />
              <span>{item.label}</span>
              <div className={`ml-auto w-1 h-4 rounded-full bg-primary transition-opacity ${active ? `opacity-100` : `opacity-0`}`} />
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-orange rounded-full flex items-center justify-center text-white text-xs font-bold">HM</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">Hub Manager</p>
            <p className="text-[10px] text-muted-foreground truncate">Pioneer Mall, Kampala</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-success status-pulse" />
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 pb-6 pt-2 border-t border-sidebar-border">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOutIcon className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
