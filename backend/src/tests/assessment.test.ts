import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

const app = createApp();

describe('Assessment & Telemetry Contract Suite', () => {
  it('GET /api/assessments lists seeded assessments', async () => {
    const res = await request(app).get('/api/assessments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body.total).toBeGreaterThanOrEqual(2);

    const submissionIds = res.body.items.map((i: any) => i.submissionId);
    expect(submissionIds).toContain('ASM-3088-TASK');
    expect(submissionIds).toContain('ASM-2041-TSSA');
  });

  it('GET /api/assessments/ASM-3088-TASK returns complete contract conforming to FRONTEND_CONTRACT.md', async () => {
    const res = await request(app).get('/api/assessments/ASM-3088-TASK');
    expect(res.status).toBe(200);

    const data = res.body;
    expect(data).toHaveProperty('candidate');
    expect(data.candidate.submissionId).toBe('ASM-3088-TASK');
    expect(data).toHaveProperty('summaryMetrics');
    expect(Array.isArray(data.summaryMetrics)).toBe(true);
    expect(data.summaryMetrics.length).toBeGreaterThanOrEqual(4);

    expect(data).toHaveProperty('events');
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThanOrEqual(5);

    expect(data).toHaveProperty('revisions');
    expect(Array.isArray(data.revisions)).toBe(true);

    expect(data).toHaveProperty('testRuns');
    expect(Array.isArray(data.testRuns)).toBe(true);

    expect(data).toHaveProperty('aiExchanges');
    expect(Array.isArray(data.aiExchanges)).toBe(true);

    expect(data).toHaveProperty('finding');
    expect(data.finding).toHaveProperty('evidence');
    expect(data.finding.evidence.length).toBeGreaterThanOrEqual(1);

    // Verify evidence items have real event references
    for (const ev of data.finding.evidence) {
      expect(ev.eventId).toBeDefined();
    }
  });

  it('GET /api/assessments/ASM-2041-TSSA returns Two Sum assessment data', async () => {
    const res = await request(app).get('/api/assessments/ASM-2041-TSSA');
    expect(res.status).toBe(200);
    expect(res.body.candidate.submissionId).toBe('ASM-2041-TSSA');
  });
});
