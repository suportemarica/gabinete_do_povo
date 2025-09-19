import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings, 
  FileText, 
  Users, 
  Activity,
  PieChart,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral do sistema'
  },
  {
    id: 'tasks',
    label: 'Tarefas',
    icon: CheckSquare,
    description: 'Gerenciar tarefas'
  },
  {
    id: 'automation',
    label: 'Automação',
    icon: Zap,
    description: 'Configurar regras'
  },
  {
    id: 'forms',
    label: 'Formulários',
    icon: FileText,
    description: 'Configurar formulários'
  },
  {
    id: 'sectors',
    label: 'Setores',
    icon: Users,
    description: 'Gerenciar setores'
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: PieChart,
    description: 'Visualizar relatórios'
  },
  {
    id: 'monitoring',
    label: 'Monitoramento',
    icon: Activity,
    description: 'Monitorar sistema'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    description: 'Configurações gerais'
  },
];

export function Sidebar({ isOpen, activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4 border-b border-border">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GP</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm">Gabinete do Povo</h2>
              <p className="text-xs text-muted-foreground">v1.0</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GP</span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10",
                    !isOpen && "px-3",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className={cn("h-4 w-4", isOpen && "mr-3")} />
                  {isOpen && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{item.label}</span>
                      {!isActive && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        {isOpen ? (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              © 2024 Gabinete do Povo
            </p>
            <p className="text-xs text-muted-foreground">
              Sistema de Gestão Pública
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 bg-muted-foreground rounded-full" />
          </div>
        )}
      </div>
    </aside>
  );
}