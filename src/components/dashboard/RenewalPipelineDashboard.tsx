'use client';

import { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Shield,
  AlertOctagon,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import { RenewalPipelineItem, RenewalStats } from '@/lib/renewals';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface RenewalPipelineDashboardProps {
  initialPipeline: RenewalPipelineItem[];
  initialStats: RenewalStats;
  onSendNotification: (renewalId: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (renewalId: string, status: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
}

export function RenewalPipelineDashboard({
  initialPipeline,
  initialStats,
  onSendNotification,
  onUpdateStatus,
}: RenewalPipelineDashboardProps) {
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [stats, setStats] = useState(initialStats);
  const [filter, setFilter] = useState<'all' | '30' | '60' | '90' | 'overdue'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Group pipeline by status for drag-and-drop
  const groupedPipeline = {
    '90_days': filteredPipeline.filter(item => item.daysUntilRenewal > 60 && item.daysUntilRenewal <= 90),
    '60_days': filteredPipeline.filter(item => item.daysUntilRenewal > 30 && item.daysUntilRenewal <= 60),
    '30_days': filteredPipeline.filter(item => item.daysUntilRenewal > 0 && item.daysUntilRenewal <= 30),
    'overdue': filteredPipeline.filter(item => item.daysUntilRenewal < 0),
    'completed': filteredPipeline.filter(item => item.status === 'completed'),
  };

  const filteredPipeline = pipeline.filter((item) => {
    if (filter === 'all') return item.status !== 'completed';
    if (filter === '30') return item.daysUntilRenewal <= 30 && item.daysUntilRenewal >= 0;
    if (filter === '60') return item.daysUntilRenewal <= 60 && item.daysUntilRenewal > 30;
    if (filter === '90') return item.daysUntilRenewal <= 90 && item.daysUntilRenewal > 60;
    if (filter === 'overdue') return item.daysUntilRenewal < 0;
    return true;
  });

  const handleSendNotification = async (renewalId: string) => {
    setLoadingId(renewalId);
    const result = await onSendNotification(renewalId);
    setLoadingId(null);
    
    if (result.success) {
      // Update local state
      setPipeline(pipeline.map(item => 
        item.id === renewalId 
          ? { ...item, notification30Sent: true }
          : item
      ));
    }
  };

  const handleUpdateStatus = async (renewalId: string, status: string) => {
    setLoadingId(renewalId);
    const result = await onUpdateStatus(renewalId, status);
    setLoadingId(null);
    
    if (result.success) {
      setPipeline(pipeline.map(item => 
        item.id === renewalId 
          ? { ...item, status }
          : item
      ));
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const item = pipeline.find(i => i.id === draggableId);
    if (!item) return;

    // Map droppable ID to status
    const statusMap: Record<string, string> = {
      '90_days': 'pending',
      '60_days': 'in_progress',
      '30_days': 'urgent',
      'overdue': 'overdue',
      'completed': 'completed',
    };

    const newStatus = statusMap[destination.droppableId];
    if (newStatus) {
      await handleUpdateStatus(draggableId, newStatus);
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'bg-red-500';
    if (days <= 30) return 'bg-orange-500';
    if (days <= 60) return 'bg-amber-500';
    return 'bg-secondary';
  };

  const getUrgencyBg = (days: number) => {
    if (days < 0) return 'bg-red-50 border-red-200';
    if (days <= 30) return 'bg-orange-50 border-orange-200';
    if (days <= 60) return 'bg-amber-50 border-amber-200';
    return 'bg-secondary/5 border-secondary/10';
  };

  return (
    <div className="space-y-6 font-body">
      {/* Filter Tabs */}
      <div className="bg-slate-50/50 p-1.5 rounded-[24px] flex flex-wrap md:flex-nowrap gap-1.5 border border-black/5 w-fit editorial-shadow">
        {[
          { id: 'all', label: 'All Active', icon: Shield, count: stats.pending, activeClass: 'bg-white text-on-surface shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-black/5', iconColor: 'text-primary' },
          { id: '30', label: '≤ 30 Days', icon: AlertOctagon, count: stats.days30, activeClass: 'bg-white text-orange-600 shadow-[0_4px_12px_rgba(249,115,22,0.05)] border border-orange-200', iconColor: 'text-orange-500' },
          { id: '60', label: '31-60 Days', icon: AlertTriangle, count: stats.days60, activeClass: 'bg-white text-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.05)] border border-amber-200', iconColor: 'text-amber-600' },
          { id: '90', label: '61-90 Days', icon: Clock, count: stats.days90, activeClass: 'bg-white text-secondary shadow-[0_4px_12px_rgba(34,197,94,0.05)] border border-secondary/10', iconColor: 'text-secondary' },
          { id: 'overdue', label: 'Overdue', icon: AlertCircle, count: stats.overdue, activeClass: 'bg-white text-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.05)] border border-red-200', iconColor: 'text-red-500' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filter === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`group flex items-center gap-3 px-6 py-3 rounded-[18px] font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? tab.activeClass
                  : "text-on-surface/40 hover:text-on-surface/70 hover:bg-white/50"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${
                isActive 
                  ? "bg-current/5" 
                  : "bg-transparent text-on-surface/20 group-hover:text-on-surface/40"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-headline italic tracking-normal normal-case text-sm">
                {tab.label}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                isActive 
                  ? "bg-current text-white" 
                  : "bg-black/5 text-on-surface/40 group-hover:bg-black/10"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Drag-and-Drop Pipeline Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { id: '90_days', title: '90 Days', color: 'bg-secondary', count: groupedPipeline['90_days'].length },
            { id: '60_days', title: '60 Days', color: 'bg-amber-500', count: groupedPipeline['60_days'].length },
            { id: '30_days', title: '30 Days', color: 'bg-orange-500', count: groupedPipeline['30_days'].length },
            { id: 'overdue', title: 'Overdue', color: 'bg-red-500', count: groupedPipeline['overdue'].length },
            { id: 'completed', title: 'Renewed', color: 'bg-green-500', count: groupedPipeline['completed'].length },
          ].map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-slate-50/50 rounded-[24px] p-4 border border-black/5 transition-all ${
                    snapshot.isDraggingOver ? 'border-secondary/30 bg-secondary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                      <h5 className="font-black text-on-surface italic font-headline tracking-tight text-sm">{column.title}</h5>
                    </div>
                    <span className="text-[9px] font-black bg-white text-on-surface/60 border border-black/5 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {column.count}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {groupedPipeline[column.id as keyof typeof groupedPipeline].map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 bg-white rounded-2xl border border-black/5 hover:shadow-xl transition-all cursor-pointer group ${
                              snapshot.isDragging ? 'rotate-2 shadow-2xl scale-105' : ''
                            } ${getUrgencyBg(item.daysUntilRenewal)}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4 text-on-surface/20" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-on-surface text-xs font-headline italic truncate">{item.clientName}</p>
                                <p className="text-[9px] text-on-surface/40 uppercase tracking-widest mt-1">{item.policyType}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-[9px] font-black bg-slate-50 text-on-surface/40 px-1.5 py-0.5 rounded border border-black/5 uppercase tracking-widest">{item.carrier}</span>
                                  <span className="text-sm font-black text-on-surface tracking-tighter font-headline italic">${item.premium}</span>
                                </div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${getUrgencyColor(item.daysUntilRenewal)}`} />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {groupedPipeline[column.id as keyof typeof groupedPipeline].length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-[9px] font-black text-on-surface/20 uppercase tracking-[0.2em] italic">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
