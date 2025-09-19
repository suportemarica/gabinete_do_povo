import { useState, useEffect } from 'react';
import { 
  Task, 
  FormResponse, 
  TaskRule, 
  Notification, 
  FormConfig, 
  Sector, 
  DashboardStats 
} from '@/types';
import { useLocalStorage } from './useLocalStorage';
import { mockTasks, mockFormResponses, mockTaskRules, mockNotifications, mockFormConfigs, mockSectors } from '@/data/mockData';

export function useGabineteData() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('gabinete_tasks', mockTasks);
  const [formResponses, setFormResponses] = useLocalStorage<FormResponse[]>('gabinete_responses', mockFormResponses);
  const [taskRules, setTaskRules] = useLocalStorage<TaskRule[]>('gabinete_rules', mockTaskRules);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('gabinete_notifications', mockNotifications);
  const [formConfigs, setFormConfigs] = useLocalStorage<FormConfig[]>('gabinete_configs', mockFormConfigs);
  const [sectors, setSectors] = useLocalStorage<Sector[]>('gabinete_sectors', mockSectors);
  
  const [loading, setLoading] = useState(false);

  // Calculate dashboard statistics
  const getDashboardStats = (): DashboardStats => {
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    const tasksByPriority = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
    };

    const tasksBySector = tasks.reduce((acc, task) => {
      acc[task.sector] = (acc[task.sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedOnTime = tasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt && 
      new Date(t.completedAt) <= new Date(t.dueDate)
    ).length;
    
    const slaCompliance = completedTasks > 0 ? (completedOnTime / completedTasks) * 100 : 100;

    return {
      totalTasks,
      pendingTasks,
      overdueTasks,
      completedTasks,
      tasksByPriority,
      tasksBySector,
      slaCompliance,
    };
  };

  // API simulation functions
  const fetchFormData = async (configId: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock new responses (in real app, this would be an actual API call)
      const newResponses: FormResponse[] = [
        {
          id: `resp_${Date.now()}`,
          questionId: 'q1',
          answer: 'Novo problema relatado',
          timestamp: new Date().toISOString(),
          formId: configId,
        },
      ];
      
      setFormResponses(prev => [...prev, ...newResponses]);
      return newResponses;
    } finally {
      setLoading(false);
    }
  };

  const processResponses = (responses: FormResponse[]) => {
    const newTasks: Task[] = [];
    
    responses.forEach(response => {
      const matchingRules = taskRules.filter(rule => 
        rule.questionId === response.questionId &&
        (Array.isArray(rule.triggerValue) 
          ? rule.triggerValue.includes(response.answer as string)
          : rule.triggerValue === response.answer
        )
      );

      matchingRules.forEach(rule => {
        const now = new Date();
        const startDate = new Date(now.getTime() + rule.sla.startOffset * 60 * 60 * 1000);
        const dueDate = new Date(startDate.getTime() + rule.sla.duration * 60 * 60 * 1000);

        const newTask: Task = {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: rule.action.title,
          description: rule.action.description,
          status: 'pending',
          priority: rule.priority,
          sector: rule.sector,
          createdAt: now.toISOString(),
          startDate: startDate.toISOString(),
          dueDate: dueDate.toISOString(),
          formResponseId: response.id,
          ruleId: rule.id,
          relatedResponses: [response],
        };

        newTasks.push(newTask);

        // Create notification
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'task_created',
          title: 'Nova Tarefa Criada',
          message: `Tarefa "${newTask.title}" foi criada automaticamente`,
          timestamp: now.toISOString(),
          read: false,
          taskId: newTask.id,
          severity: 'info',
        };

        setNotifications(prev => [notification, ...prev]);
      });
    });

    if (newTasks.length > 0) {
      setTasks(prev => [...prev, ...newTasks]);
    }

    return newTasks;
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status, 
            completedAt: status === 'completed' ? new Date().toISOString() : undefined 
          }
        : task
    ));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const addTaskRule = (rule: Omit<TaskRule, 'id'>) => {
    const newRule: TaskRule = {
      ...rule,
      id: `rule_${Date.now()}`,
    };
    setTaskRules(prev => [...prev, newRule]);
    return newRule;
  };

  const updateTaskRule = (ruleId: string, updates: Partial<TaskRule>) => {
    setTaskRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const deleteTaskRule = (ruleId: string) => {
    setTaskRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  return {
    // Data
    tasks,
    formResponses,
    taskRules,
    notifications,
    formConfigs,
    sectors,
    loading,
    
    // Stats
    dashboardStats: getDashboardStats(),
    
    // Actions
    fetchFormData,
    processResponses,
    updateTaskStatus,
    markNotificationAsRead,
    addTaskRule,
    updateTaskRule,
    deleteTaskRule,
    
    // Setters for direct manipulation if needed
    setTasks,
    setFormResponses,
    setTaskRules,
    setNotifications,
    setFormConfigs,
    setSectors,
  };
}