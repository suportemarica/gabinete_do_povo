import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/types';

interface TasksPriorityChartProps {
  stats: DashboardStats;
}

const COLORS = {
  low: '#22c55e',      // green
  medium: '#3b82f6',   // blue  
  high: '#f59e0b',     // amber
  urgent: '#ef4444',   // red
};

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export function TasksPriorityChart({ stats }: TasksPriorityChartProps) {
  const data = Object.entries(stats.tasksByPriority).map(([priority, count]) => ({
    name: PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS],
    value: count,
    color: COLORS[priority as keyof typeof COLORS],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tarefas por Prioridade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} tarefas`, 'Quantidade']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}