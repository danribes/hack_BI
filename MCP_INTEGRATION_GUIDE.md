# MCP Server Integration Guide for Render Deployment

This guide explains how the MCP (Model Context Protocol) server v2.0 is integrated with the backend for deployment on Render.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Render Backend Service                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Backend API (Express + Claude SDK)        │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │        Doctor Agent Service                 │  │  │
│  │  │  - Chat endpoint                            │  │  │
│  │  │  - Uses Anthropic SDK with MCP tools        │  │  │
│  │  └────────────┬────────────────────────────────┘  │  │
│  │               │ imports                            │  │
│  │  ┌────────────▼────────────────────────────────┐  │  │
│  │  │         MCP Client Service                  │  │  │
│  │  │  - Spawns MCP server as child process       │  │  │
│  │  │  - stdio transport communication            │  │  │
│  │  └────────────┬────────────────────────────────┘  │  │
│  └───────────────┼──────────────────────────────────┘  │
│                  │ stdio (IPC)                         │
│  ┌───────────────▼──────────────────────────────────┐  │
│  │          MCP Server (Child Process)             │  │
│  │  - Phase 1: assess_pre_diagnosis_risk           │  │
│  │  - Phase 2: classify_kdigo                      │  │
│  │  - Phase 3: assess_treatment_options            │  │
│  │  - Phase 4: monitor_adherence                   │  │
│  │  - Legacy tools for compatibility               │  │
│  │                                                  │  │
│  │  Connects to: PostgreSQL (via DATABASE_URL)     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Build Process

The **root-level Dockerfile** (`/Dockerfile`) builds both backend and MCP server:

```dockerfile
# Stage 1: Build both services
- Install backend dependencies
- Install MCP server dependencies
- Build backend TypeScript
- Build MCP server TypeScript

# Stage 2: Production
- Copy production dependencies for both
- Copy built dist/ folders for both
- Set up runtime environment
```

**Key configuration changes:**

- `render.yaml`: Changed `rootDir: backend` → `rootDir: .` (root)
- `render.yaml`: Changed `dockerfilePath: ./Dockerfile` (now uses root Dockerfile)
- `backend/package.json`: Split build into `build:backend` and `build:mcp`

### 2. Runtime Process

When the backend starts:

1. **Backend API starts** (`node dist/index.js`)
2. **MCP Client initializes** on first tool call
3. **MCP Client spawns MCP server** as child process via stdio transport
4. **Communication** happens via stdin/stdout between parent and child

### 3. File Structure in Render Container

```
/app/
├── backend/
│   ├── dist/           # Built backend (Node.js)
│   ├── package.json
│   └── node_modules/   # Backend dependencies (including MCP SDK)
└── mcp-server/
    ├── dist/           # Built MCP server
    ├── package.json
    └── node_modules/   # MCP server dependencies (pg, dotenv, etc.)
```

### 4. Environment Variables

The backend passes `DATABASE_URL` to the MCP server child process:

```typescript
// backend/src/services/mcpClient.ts
this.transport = new StdioClientTransport({
  command: 'node',
  args: [mcpServerPath],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,  // Passed from Render
    NODE_ENV: process.env.NODE_ENV,
  },
});
```

**Required environment variables in Render:**
- ✅ `DATABASE_URL` - Already configured (from database service)
- ✅ `ANTHROPIC_API_KEY` - Already configured
- ✅ `NODE_ENV` - Already configured

**No additional environment variables needed!**

## Usage in Backend Code

### Example 1: Using MCP Client in Doctor Agent

```typescript
import { getMCPClient } from './mcpClient.js';

export class DoctorAgentService {
  async chat(messages: ChatMessage[], context?: PatientContext): Promise<string> {
    // Initialize MCP client (singleton, only connects once)
    const mcpClient = await getMCPClient();

    // Example: Get patient data using MCP
    if (context?.patientId) {
      const patientData = await mcpClient.getPatientData(context.patientId);

      // Example: Run KDIGO classification
      const kdigo = await mcpClient.classifyKDIGO(context.patientId);

      // Example: Assess treatment options
      const treatment = await mcpClient.assessTreatmentOptions(context.patientId);

      // Add to system prompt for Claude
      systemPrompt += `\n\n--- PATIENT DATA FROM MCP ---\n${JSON.stringify(patientData, null, 2)}`;
      systemPrompt += `\n\n--- KDIGO CLASSIFICATION ---\n${JSON.stringify(kdigo, null, 2)}`;
      systemPrompt += `\n\n--- TREATMENT RECOMMENDATIONS ---\n${JSON.stringify(treatment, null, 2)}`;
    }

    // Call Claude with enhanced context
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    return response;
  }
}
```

### Example 2: Phase-Based Workflow

```typescript
// PHASE 1: Pre-diagnosis risk assessment (when labs missing)
const riskAssessment = await mcpClient.assessPreDiagnosisRisk(patientId);
console.log(`Risk Tier: ${riskAssessment.riskTier}`);
console.log(`Testing Timeline: ${riskAssessment.testingTimeline}`);

// PHASE 2: KDIGO classification (after labs available)
const kdigo = await mcpClient.classifyKDIGO(patientId);
console.log(`GFR Category: ${kdigo.gfrCategory}`);
console.log(`Risk Level: ${kdigo.riskLevel}`);
if (kdigo.trajectory?.progressionRisk === 'RAPID') {
  console.log('⚠️ RAPID PROGRESSOR - Immediate intervention needed!');
}

// PHASE 3: Treatment decision support
const treatment = await mcpClient.assessTreatmentOptions(patientId);
console.log(`Jardiance Indication: ${treatment.jardiance.indication}`);
console.log(`RAS Inhibitor Indication: ${treatment.rasInhibitor.indication}`);

// PHASE 4: Adherence monitoring
const adherence = await mcpClient.monitorAdherence(patientId, 'ALL', 90);
if (adherence.overallAdherence < 80) {
  console.log('⚠️ Poor adherence detected - Patient outreach needed');
}
```

### Example 3: Using MCP Tools with Claude (Agentic Pattern)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { getMCPClient } from './mcpClient.js';

async function chatWithTools(userMessage: string, patientId: string) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const mcpClient = await getMCPClient();

  // Get available MCP tools
  const mcpTools = await mcpClient.listTools();

  // Convert MCP tools to Anthropic tool format
  const tools = mcpTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' }
      },
      required: ['patient_id']
    }
  }));

  // Call Claude with tools
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    tools: tools,
    messages: [{ role: 'user', content: userMessage }],
  });

  // Handle tool use
  for (const block of response.content) {
    if (block.type === 'tool_use') {
      let toolResult;

      // Route to appropriate MCP method
      switch (block.name) {
        case 'assess_pre_diagnosis_risk':
          toolResult = await mcpClient.assessPreDiagnosisRisk(patientId);
          break;
        case 'classify_kdigo':
          toolResult = await mcpClient.classifyKDIGO(patientId);
          break;
        case 'assess_treatment_options':
          toolResult = await mcpClient.assessTreatmentOptions(patientId);
          break;
        case 'monitor_adherence':
          toolResult = await mcpClient.monitorAdherence(patientId);
          break;
      }

      // Continue conversation with tool result
      const followUp = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(toolResult)
            }]
          }
        ],
      });

      return followUp;
    }
  }

  return response;
}
```

## Deployment Steps

### 1. Local Testing (Optional)

```bash
# Install dependencies
cd backend && npm install
cd ../mcp-server && npm install
cd ..

# Build both services
cd backend && npm run build
cd ../mcp-server && npm run build
cd ..

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/ckd_analyzer"
export ANTHROPIC_API_KEY="your-key-here"

# Start backend (will spawn MCP server automatically)
cd backend && npm start
```

### 2. Deploy to Render

The deployment is **automatic** when you push to the branch:

```bash
# Commit all changes
git add .
git commit -m "Integrate MCP server v2.0 with backend"

# Push to your branch
git push -u origin claude/fix-ai-chat-issues-016tGUwFZTWuPtUKy3vLDa5R
```

Render will:
1. Detect `render.yaml` changes
2. Build using root `Dockerfile`
3. Create container with both backend and MCP server
4. Start backend, which automatically spawns MCP server

### 3. Verify Deployment

Check Render logs for:

```
[MCP Client] Connecting to MCP server at: /app/mcp-server/dist/index.js
[MCP Client] Successfully connected to MCP server
[MCP Client] Available tools: assess_pre_diagnosis_risk, classify_kdigo, assess_treatment_options, monitor_adherence, get_patient_data, query_lab_results, get_population_stats, search_guidelines
```

## Troubleshooting

### Issue: "Cannot find module '@modelcontextprotocol/sdk'"

**Solution**: Ensure MCP SDK is in backend dependencies:
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4"
  }
}
```

### Issue: "MCP server process exited"

**Possible causes:**
1. **Missing DATABASE_URL**: MCP server needs database access
2. **Build failed**: Check that `mcp-server/dist/` exists
3. **Permission issues**: Ensure non-root user has access

**Debug**: Add logging in `mcpClient.ts`:
```typescript
this.transport = new StdioClientTransport({
  command: 'node',
  args: [mcpServerPath],
  env: { ...process.env, DEBUG: 'mcp:*' }  // Enable debug logs
});
```

### Issue: "Tool execution timeout"

**Solution**: Database queries may be slow. Increase timeout in MCP client:
```typescript
const result = await this.client.callTool({
  name: 'classify_kdigo',
  arguments: { patient_id: patientId },
}, { timeout: 30000 });  // 30 second timeout
```

### Issue: "Path resolution error"

**Check paths in production:**
```typescript
// backend/src/services/mcpClient.ts
const mcpServerPath = path.resolve(__dirname, '../../mcp-server/dist/index.js');
console.log('MCP Server Path:', mcpServerPath);
```

Should output: `/app/backend/dist/../../mcp-server/dist/index.js` → `/app/mcp-server/dist/index.js`

## Performance Considerations

### Connection Pooling

The MCP client uses a **singleton pattern**:
- First call: Spawns MCP server process (~500ms startup)
- Subsequent calls: Reuses existing connection (~10-50ms)

### Database Connection

The MCP server maintains its own connection pool (max 10 connections):
```typescript
// mcp-server/src/database.ts
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,  // Maximum 10 concurrent connections
});
```

### Memory Usage

- Backend: ~100MB
- MCP Server: ~50MB
- Total: ~150MB (well within Render free tier 512MB limit)

## Security Notes

1. **Database Access**: MCP server has direct PostgreSQL access via `DATABASE_URL`
2. **Input Validation**: All patient IDs are validated as UUIDs
3. **SQL Injection**: All queries use parameterized statements
4. **Process Isolation**: MCP runs as separate process with restricted permissions

## Next Steps

1. **Update Doctor Agent**: Integrate MCP tools into chat flow
2. **Add Monitoring**: Log MCP tool usage and response times
3. **Implement Caching**: Cache frequent MCP queries (patient data, KDIGO classifications)
4. **Error Handling**: Add retry logic for database timeouts
5. **Testing**: Add integration tests for MCP client

## References

- MCP Server README: `/mcp-server/README.md`
- MCP Specification: https://spec.modelcontextprotocol.io/
- Anthropic SDK: https://github.com/anthropics/anthropic-sdk-typescript
- Render Docker Deployment: https://render.com/docs/deploy-docker
