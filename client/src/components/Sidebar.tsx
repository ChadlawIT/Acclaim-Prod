import { Scale, Home, FolderOpen, MessageSquare, BarChart3, FileText, User, LogOut, Settings, Shield, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import logoImage from "@assets/cl-bg_1752271318153.png";
import acclaimRoseLogo from "@assets/acclaim_rose_transparent_1768474381340.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ activeSection, setActiveSection, collapsed, onToggleCollapse }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const { data: messages } = useQuery({
    queryKey: ["/api/messages"],
    retry: false,
  });

  const { data: seminars } = useQuery<Array<unknown>>({
    queryKey: ["/api/cl-seminars"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "cases", label: "Cases", icon: FolderOpen },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 },
    ...(user?.isAdmin ? [
      { id: "admin", label: "Admin Panel", icon: Shield, isRoute: true, route: "/admin" }
    ] : []),
  ];

  return (
    <div className={`${collapsed ? 'w-14' : 'w-64'} h-[100dvh] max-h-screen bg-acclaim-teal dark:bg-gray-900 shadow-lg flex flex-col overflow-hidden transition-all duration-200 ease-in-out flex-shrink-0`}>

      {/* Brand Header */}
      <div className="flex-shrink-0 flex items-center h-16 bg-acclaim-teal dark:bg-gray-900 border-b border-teal-700 dark:border-gray-700 px-2 overflow-hidden">
        {collapsed ? (
          <button
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center justify-center w-full hover:bg-teal-700 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
            title="Acclaim"
          >
            <img src={logoImage} alt="Acclaim Logo" className="w-7 h-7 filter brightness-0 invert opacity-80 dark:hidden flex-shrink-0" />
            <img src={acclaimRoseLogo} alt="Acclaim Logo" className="w-8 h-8 hidden dark:block flex-shrink-0" />
          </button>
        ) : (
          <button
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center hover:bg-teal-700 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors flex-1 min-w-0"
          >
            <img src={logoImage} alt="Acclaim Logo" className="w-8 h-8 mr-3 filter brightness-0 invert opacity-80 dark:hidden flex-shrink-0" />
            <img src={acclaimRoseLogo} alt="Acclaim Logo" className="w-10 h-10 mr-3 hidden dark:block flex-shrink-0" />
            <div className="text-white overflow-hidden">
              <div className="text-lg font-bold text-left truncate">Acclaim</div>
              <div className="text-xs opacity-80 text-left truncate">Credit Management & Recovery</div>
            </div>
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isRoute && item.route) {
                  setLocation(item.route);
                } else {
                  setActiveSection(item.id);
                }
              }}
              title={collapsed ? item.label : undefined}
              className={`flex items-center w-full px-3 py-3 text-white rounded-lg transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? "bg-teal-700 dark:bg-gray-700"
                  : "hover:bg-teal-700 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && (item as any).badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                  {(item as any).badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Chadwick Lawrence */}
        <div className="pt-3 mt-3 border-t border-teal-700/50 dark:border-gray-700">
          <button
            onClick={() => setActiveSection("chadwick-lawrence")}
            title={collapsed ? "Chadwick Lawrence" : undefined}
            className={`flex items-center w-full px-3 py-3 text-white rounded-lg transition-colors ${
              collapsed ? 'justify-center' : ''
            } ${
              activeSection === "chadwick-lawrence"
                ? "bg-teal-700 dark:bg-gray-700"
                : "hover:bg-teal-700 dark:hover:bg-gray-800"
            }`}
          >
            <Scale className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && <span className="truncate">Chadwick Lawrence</span>}
          </button>
          {!collapsed && seminars && seminars.length > 0 && (
            <div className="px-3 pt-1.5 pb-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#ba1b6e" }}>
                {seminars.length} seminar{seminars.length !== 1 ? 's' : ''} available
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="pt-3 mt-3 border-t border-teal-700/50 dark:border-gray-700">
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center w-full px-3 py-2.5 text-teal-200 hover:text-white rounded-lg transition-colors hover:bg-teal-700 dark:hover:bg-gray-800 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
              : <>
                  <ChevronLeft className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="text-sm truncate">Collapse</span>
                </>
            }
          </button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="flex-shrink-0 p-2 border-t border-teal-700 dark:border-gray-700">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white border-2 border-teal-300 flex-shrink-0">
              {user?.isAdmin
                ? <img src={acclaimRoseLogo} alt="Acclaim" className="w-6 h-6 object-contain" />
                : <User className="text-acclaim-teal h-4 w-4" />
              }
            </div>
            <button
              onClick={() => setLocation("/profile")}
              title="Profile"
              className="p-1.5 text-teal-200 hover:text-white hover:bg-teal-700 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <UserCog className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-teal-200 hover:text-white hover:bg-teal-700 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center mb-3 px-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white border-2 border-acclaim-teal flex-shrink-0">
                {user?.isAdmin
                  ? <img src={acclaimRoseLogo} alt="Acclaim" className="w-8 h-8 object-contain" />
                  : <User className="text-acclaim-teal h-5 w-5" />
                }
              </div>
              <div className="ml-3 min-w-0">
                <div className="text-white font-medium text-sm truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-teal-200 text-xs truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/profile")}
                className="flex-1 justify-start text-white hover:bg-teal-700 dark:hover:bg-gray-800"
              >
                <UserCog className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex-1 justify-start text-white hover:bg-teal-700 dark:hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
