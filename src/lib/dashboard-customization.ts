/**
 * Dashboard Customization with Widget System
 * Allows agency owners to customize their dashboard layout
 */

import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface DashboardWidget {
  id: string;
  type: 'renewal_pipeline' | 'book_of_business' | 'at_risk_policies' | 'carrier_breakdown' | 'monthly_trends' | 'ai_insights' | 'quick_actions' | 'recent_activity';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
  visible: boolean;
}

export interface DashboardLayout {
  userId: string;
  widgets: DashboardWidget[];
  version: number;
  updatedAt: Date;
}

/**
 * Default dashboard widgets for new users
 */
export const defaultWidgets: DashboardWidget[] = [
  {
    id: 'renewal-pipeline',
    type: 'renewal_pipeline',
    position: { x: 0, y: 0, w: 6, h: 4 },
    config: {},
    visible: true,
  },
  {
    id: 'book-of-business',
    type: 'book_of_business',
    position: { x: 6, y: 0, w: 6, h: 4 },
    config: {},
    visible: true,
  },
  {
    id: 'at-risk-policies',
    type: 'at_risk_policies',
    position: { x: 0, y: 4, w: 4, h: 4 },
    config: { limit: 10 },
    visible: true,
  },
  {
    id: 'carrier-breakdown',
    type: 'carrier_breakdown',
    position: { x: 4, y: 4, w: 4, h: 4 },
    config: { showTop: 5 },
    visible: true,
  },
  {
    id: 'monthly-trends',
    type: 'monthly_trends',
    position: { x: 8, y: 4, w: 4, h: 4 },
    config: { months: 6 },
    visible: true,
  },
  {
    id: 'ai-insights',
    type: 'ai_insights',
    position: { x: 0, y: 8, w: 12, h: 2 },
    config: {},
    visible: true,
  },
];

/**
 * Available widget types with metadata
 */
export const widgetTypes = [
  {
    type: 'renewal_pipeline',
    name: 'Renewal Pipeline',
    description: 'View upcoming renewals and their status',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
  },
  {
    type: 'book_of_business',
    name: 'Book of Business',
    description: 'Total premium volume and policy count',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
  },
  {
    type: 'at_risk_policies',
    name: 'At-Risk Policies',
    description: 'Policies with health issues or approaching expiration',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 8, h: 6 },
  },
  {
    type: 'carrier_breakdown',
    name: 'Carrier Breakdown',
    description: 'Premium distribution by carrier',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 8, h: 6 },
  },
  {
    type: 'monthly_trends',
    name: 'Monthly Trends',
    description: 'New business, renewals, and lapses over time',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 12, h: 6 },
  },
  {
    type: 'ai_insights',
    name: 'AI Insights',
    description: 'Predictive analytics and leakage prevention recommendations',
    defaultSize: { w: 12, h: 2 },
    minSize: { w: 6, h: 2 },
    maxSize: { w: 12, h: 4 },
  },
  {
    type: 'quick_actions',
    name: 'Quick Actions',
    description: 'Common actions like add policy, send email',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 4 },
  },
  {
    type: 'recent_activity',
    name: 'Recent Activity',
    description: 'Latest changes and actions in your book',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 8, h: 6 },
  },
];

/**
 * Get user's dashboard layout
 */
export async function getDashboardLayout(userId: string): Promise<DashboardLayout> {
  if (!db) {
    return { userId, widgets: defaultWidgets, version: 1, updatedAt: new Date() };
  }
  const user = await db
    .select({ dashboardLayout: users.dashboardLayout, dashboardLayoutVersion: users.dashboardLayoutVersion })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!user || !user.dashboardLayout) {
    return {
      userId,
      widgets: defaultWidgets,
      version: 1,
      updatedAt: new Date(),
    };
  }

  try {
    return JSON.parse(user.dashboardLayout);
  } catch {
    return {
      userId,
      widgets: defaultWidgets,
      version: 1,
      updatedAt: new Date(),
    };
  }
}

/**
 * Save user's dashboard layout
 */
export async function saveDashboardLayout(
  userId: string,
  widgets: DashboardWidget[]
): Promise<DashboardLayout> {
  const currentLayout = await getDashboardLayout(userId);
  const newVersion = (currentLayout.version || 0) + 1;

  const layout: DashboardLayout = {
    userId,
    widgets,
    version: newVersion,
    updatedAt: new Date(),
  };

  if (!db) return layout;

  await db
    .update(users)
    .set({
      dashboardLayout: JSON.stringify(layout),
      dashboardLayoutVersion: newVersion,
    })
    .where(eq(users.id, userId));

  return layout;
}

/**
 * Add a widget to the dashboard
 */
export async function addWidget(
  userId: string,
  type: DashboardWidget['type'],
  config: Record<string, any> = {}
): Promise<DashboardLayout> {
  const layout = await getDashboardLayout(userId);
  const widgetType = widgetTypes.find(w => w.type === type);

  if (!widgetType) {
    throw new Error('Invalid widget type');
  }

  // Find next available position
  const maxY = Math.max(...layout.widgets.map(w => w.position.y + w.position.h));
  
  const newWidget: DashboardWidget = {
    id: randomUUID(),
    type,
    position: {
      x: 0,
      y: maxY,
      w: widgetType.defaultSize.w,
      h: widgetType.defaultSize.h,
    },
    config,
    visible: true,
  };

  layout.widgets.push(newWidget);
  return saveDashboardLayout(userId, layout.widgets);
}

/**
 * Remove a widget from the dashboard
 */
export async function removeWidget(userId: string, widgetId: string): Promise<DashboardLayout> {
  const layout = await getDashboardLayout(userId);
  layout.widgets = layout.widgets.filter(w => w.id !== widgetId);
  return saveDashboardLayout(userId, layout.widgets);
}

/**
 * Update widget position or configuration
 */
export async function updateWidget(
  userId: string,
  widgetId: string,
  updates: Partial<Pick<DashboardWidget, 'position' | 'config' | 'visible'>>
): Promise<DashboardLayout> {
  const layout = await getDashboardLayout(userId);
  const widgetIndex = layout.widgets.findIndex(w => w.id === widgetId);

  if (widgetIndex === -1) {
    throw new Error('Widget not found');
  }

  layout.widgets[widgetIndex] = {
    ...layout.widgets[widgetIndex],
    ...updates,
  };

  return saveDashboardLayout(userId, layout.widgets);
}

/**
 * Reset dashboard to default layout
 */
export async function resetDashboardLayout(userId: string): Promise<DashboardLayout> {
  return saveDashboardLayout(userId, defaultWidgets);
}
