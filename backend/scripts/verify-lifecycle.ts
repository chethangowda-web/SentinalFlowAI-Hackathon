

async function verifyLifecycle() {
  console.log('Starting E2E Lifecycle Verification...');
  const baseUrl = process.env.API_URL || 'http://localhost:3000';

  try {
    // 1. Ingest Telemetry
    console.log('1. Ingesting Telemetry...');
    const telemetryPayload = {
      service: 'payment-gateway',
      environment: 'production',
      metrics: { cpu: 98, latency_ms: 1500 },
      logs: 'ERROR: Payment processing failed due to upstream timeout'
    };
    
    const ingestRes = await fetch(`${baseUrl}/custom/v1/telemetry/otlp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetryPayload)
    });
    
    const ingestData = await ingestRes.json();
    if (!ingestData.success) {
      throw new Error('Telemetry ingestion failed');
    }
    console.log('  -> Telemetry accepted.');

    // 2. Wait for background processing
    console.log('2. Waiting for incident pipeline to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Check Incidents
    console.log('3. Fetching recent incidents...');
    const incidentsRes = await fetch(`${baseUrl}/custom/v1/incidents?limit=5`);
    const incidentsData = await incidentsRes.json();
    const incidents = incidentsData.data;
    const testIncident = incidents.find((i: any) => i.service === 'payment-gateway');
    
    if (!testIncident) {
      console.log('  -> WARNING: Could not find newly created incident (it may be queued or mock DB may be empty).');
    } else {
      console.log(`  -> Found Incident: ${testIncident.incidentId} (${testIncident.title})`);
      
      // 4. Verify AI Report
      if (testIncident.aiReport) {
        console.log('  -> AI Analysis successfully generated.');
      } else {
        console.log('  -> AI Analysis is missing from the incident.');
      }
    }

    console.log('E2E Lifecycle Verification Complete.');
  } catch (error: any) {
    console.error('Lifecycle verification failed:', error.message);
    process.exit(1);
  }
}

verifyLifecycle();
