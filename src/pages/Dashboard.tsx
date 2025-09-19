import { StatsCards } from '@/components/dashboard/StatsCards';
import { TasksPriorityChart } from '@/components/dashboard/TasksPriorityChart';
import { TasksBySectorChart } from '@/components/dashboard/TasksBySectorChart';
import { RecentTasksList } from '@/components/dashboard/RecentTasksList';
import { useGabineteData } from '@/hooks/useGabineteData';

export function Dashboard() {
  const { dashboardStats, tasks } = useGabineteData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema Gabinete do Povo
        </p>
      </div>

      <StatsCards stats={dashboardStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksPriorityChart stats={dashboardStats} />
        <TasksBySectorChart stats={dashboardStats} />
      </div>

      <RecentTasksList tasks={tasks} />
    </div>
  );
}