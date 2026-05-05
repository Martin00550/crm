'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
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
  const [filter, setFilter] = useState<'all' | '30' | '60' | '90' | 'overdue'>('all');

  const filteredPipeline = pipeline.filter((item) => {
    if (filter === 'all') return item.status !== 'completed';
    if (filter === '30') return item.daysUntilRenewal <= 30 && item.daysUntilRenewal >= 0;
    if (filter === '60') return item.daysUntilRenewal <= 60 && item.daysUntilRenewal > 30;
    if (filter === '90') return item.daysUntilRenewal <= 90 && item.daysUntilRenewal > 60;
    if (filter === 'overdue') return item.daysUntilRenewal < 0;
    return true;
  });

  const groupedPipeline = {
    '90_days': filteredPipeline.filter(item => item.daysUntilRenewal > 60 && item.daysUntilRenewal <= 90),
    '60_days': filteredPipeline.filter(item => item.daysUntilRenewal > 30 && item.daysUntilRenewal <= 60),
    '30_days': filteredPipeline.filter(item => item.daysUntilRenewal > 0 && item.daysUntilRenewal <= 30),
    'overdue': filteredPipeline.filter(item => item.daysUntilRenewal < 0),
    'completed': filteredPipeline.filter(item => item.status === 'completed'),
  };

  const handleUpdateStatus = async (renewalId: string, status: string) => {
    const result = await onUpdateStatus(renewalId, status);
    if (result.success) {
      setPipeline(prev => prev.map(item => 
        item.id === renewalId ? { ...item, status } : item
      ));
    }
  };


  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const statusMap: Record<string, string> = {
      '90_days': 'pending', '60_days': 'in_progress', '30_days': 'urgent', 'overdue': 'overdue', 'completed': 'completed',
    };
    const newStatus = statusMap[destination.droppableId];
    if (newStatus) await handleUpdateStatus(draggableId, newStatus);
  };

  return (
    <div className="space-y-10 font-body">
      {/* Minimal Tabs */}
      <div className="flex gap-4 border-b border-black/5 pb-1">
        {[
          { id: 'all', label: 'All Active' },
          { id: '30', label: '≤ 30 Days' },
          { id: '60', label: '31-60 Days' },
          { id: '90', label: '61-90 Days' },
          { id: 'overdue', label: 'Overdue' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              filter === tab.id ? "border-secondary text-secondary" : "border-transparent text-on-surface/30 hover:text-on-surface/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6">
          {[
            { id: '90_days', title: '90 Days', color: 'bg-secondary' },
            { id: '60_days', title: '60 Days', color: 'bg-amber-400' },
            { id: '30_days', title: '30 Days', color: 'bg-red-400' },
            { id: 'overdue', title: 'Overdue', color: 'bg-red-600' },
            { id: 'completed', title: 'Renewed', color: 'bg-on-surface/10' },
          ].map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl bg-slate-50/50 border border-transparent group-hover/column:border-black/5 transition-all">
                    <div className={`w-2 h-2 rounded-full ${column.color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                    <h5 className="font-bold text-on-surface text-[10px] uppercase tracking-[0.2em]">{column.title}</h5>
                    <div className="ml-auto bg-white px-2 py-0.5 rounded-lg border border-black/5 shadow-sm">
                      <span className="text-[10px] text-on-surface/60 font-black">{groupedPipeline[column.id as keyof typeof groupedPipeline].length}</span>
                    </div>
                  </div>
                  <div className="space-y-5 min-h-[200px]">
                    {groupedPipeline[column.id as keyof typeof groupedPipeline].map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-6 bg-white rounded-[2rem] border border-black/5 hover:border-secondary/20 hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 group/card relative overflow-hidden ${
                              snapshot.isDragging ? 'shadow-2xl scale-105 z-50 ring-2 ring-secondary/20' : 'shadow-sm'
                            }`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            <div className="flex gap-3">
                              <div {...provided.dragHandleProps} className="mt-1 opacity-10 group-hover/card:opacity-40 transition-opacity">
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <Link 
                                    href={`/dashboard/policy/${item.policyId}`}
                                    className="font-black text-on-surface text-[13px] truncate hover:text-secondary transition-colors leading-tight"
                                  >
                                    {item.clientName}
                                  </Link>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className={cn(
                                      "text-[8px] font-black px-1.5 py-0.5 rounded-md border shadow-sm",
                                      item.daysUntilRenewal <= 30 ? "bg-red-50 text-red-500 border-red-100" :
                                      item.daysUntilRenewal <= 60 ? "bg-amber-50 text-amber-500 border-amber-100" :
                                      "bg-emerald-50 text-emerald-500 border-emerald-100"
                                    )}>
                                      {item.daysUntilRenewal}d
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[10px] text-on-surface/30 uppercase tracking-[0.2em] font-black mb-6">{item.policyType}</p>
                                
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-black/[0.05]">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] text-on-surface/20 font-black uppercase tracking-widest">Placement Partner</span>
                                    <span className="text-[11px] font-bold text-on-surface/80 truncate">{item.carrier}</span>
                                  </div>
                                  <div className="flex flex-col gap-1 text-right">
                                    <span className="text-[9px] text-on-surface/20 font-black uppercase tracking-widest">Premium Volume</span>
                                    <span className="text-[15px] font-black text-on-surface leading-none tracking-tighter">${parseFloat((item.premium || "0").replace(/[^0-9.-]+/g, "") || "0").toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
