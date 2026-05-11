import { inngest } from './inngest-client';
import { db } from './db';
import { policies, clients, importJobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from './logger';

export const backgroundCSVImport = (inngest as any).createFunction(
  { 
    id: 'background-csv-import', 
    name: 'Background CSV Import Engine',
    triggers: [{ event: 'import/csv.requested' }]
  },
  async ({ event, step }: any) => {
    const database = db;
    if (!database) {
      logger.error('Database not available for background import');
      return { success: 0, error: 0, details: ['Database not available'] };
    }
    const { jobId, agencyId, userId, rows } = event.data;
    
    await step.run('update-job-status-processing', async () => {
      await database.update(importJobs)
        .set({ status: 'processing', totalRows: rows.length, updatedAt: new Date() })
        .where(eq(importJobs.id, jobId));
    });

    const results = {
      success: 0,
      error: 0,
      details: [] as any[]
    };

    // Process in batches of 100 for enterprise stability
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      await step.run(`process-batch-${i / BATCH_SIZE}`, async () => {
        for (const row of batch) {
          try {
            // 1. Find or create client
            let clientId: string;
            const existingClient = await database.query.clients.findFirst({
              where: and(
                eq(clients.agencyId, agencyId),
                eq(clients.name, row.clientName)
              ),
            });

            if (existingClient) {
              clientId = existingClient.id;
            } else {
              const [newClient] = await database.insert(clients).values({
                id: crypto.randomUUID(),
                agencyId,
                name: row.clientName,
                email: row.clientEmail,
                phone: row.clientPhone,
                industry: row.clientIndustry,
              }).returning({ id: clients.id });
              clientId = newClient.id;
            }

            // 2. Create policy
            await database.insert(policies).values({
              id: crypto.randomUUID(),
              clientId,
              agencyId,
              policyNumber: row.policyNumber,
              carrier: row.carrier,
              policyType: row.policyType,
              premium: row.premium,
              effectiveDate: new Date(row.effectiveDate),
              expirationDate: new Date(row.expirationDate),
              status: row.status || 'active',
              metadata: {
                ...(row._extraData || {}),
                import_warnings: row._warnings,
                imported_at: new Date().toISOString(),
                batch_index: i / BATCH_SIZE
              },
            }).onConflictDoUpdate({
              target: [policies.agencyId, policies.policyNumber],
              set: {
                premium: row.premium,
                expirationDate: new Date(row.expirationDate),
                updatedAt: new Date(),
              }
            });

            results.success++;
          } catch (err: any) {
            results.error++;
            results.details.push({
              row: i + batch.indexOf(row),
              error: err.message,
              policyNumber: row.policyNumber
            });
          }
        }

        // Update progress in database
        await database.update(importJobs)
          .set({ 
            processedRows: i + batch.length,
            successCount: results.success,
            errorCount: results.error,
            updatedAt: new Date()
          })
          .where(eq(importJobs.id, jobId));
      });
    }

    await step.run('finalize-job', async () => {
      await database.update(importJobs)
        .set({ 
          status: 'completed', 
          errorDetails: results.details.length > 0 ? results.details : null,
          updatedAt: new Date() 
        })
        .where(eq(importJobs.id, jobId));
        
      logger.info(`Import job ${jobId} completed. Success: ${results.success}, Errors: ${results.error}`);
    });

    return results;
  }
);
