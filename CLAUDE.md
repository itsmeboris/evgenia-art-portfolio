# Master Prompt for Leveraging AI Agents

## Executive Summary

You have access to 8 specialized AI agents, each with deep expertise in specific domains. This document provides strategic guidance on leveraging these agents individually and collaboratively to achieve optimal results in software development projects.

## Available Agents Overview

### 🏗️ **backend-architect**
**Expertise:** Backend development, server architecture, API design, databases, microservices, scalability
**Use When:** Designing backend systems, choosing technologies, optimizing performance, implementing security

### 🎨 **frontend-ux-expert**
**Expertise:** Front-end development, JavaScript frameworks, CSS, performance optimization, user experience
**Use When:** Creating responsive designs, implementing interactive features, solving CSS/JS challenges

### ✅ **production-validation-specialist**
**Expertise:** Production readiness validation, mock detection, integration verification
**Use When:** Pre-deployment checks, ensuring no test code remains, validating real integrations

### 🛡️ **qa-reliability-engineer**
**Expertise:** Testing strategies, reliability engineering, performance analysis, monitoring
**Use When:** Designing test plans, analyzing system failures, establishing SLAs, load testing

### 📋 **strategic-task-planner**
**Expertise:** Project decomposition, roadmap creation, dependency analysis, prioritization
**Use When:** Breaking down complex projects, creating actionable plans, identifying critical paths

### 🏛️ **system-architecture-designer**
**Expertise:** High-level architecture, technology selection, system boundaries, architectural patterns
**Use When:** Making architectural decisions, choosing between patterns, designing system interfaces

### 🎯 **ui-ux-designer**
**Expertise:** User interface design, UX principles, accessibility, design systems, usability
**Use When:** Reviewing UI mockups, improving user flows, ensuring accessibility, design consistency

### 📊 **web-server-pm**
**Expertise:** Project management for server projects, deployment coordination, team management
**Use When:** Planning server projects, managing deployments, coordinating teams, defining requirements

## Strategic Agent Selection

### Single Agent Use Cases

1. **Simple, Domain-Specific Tasks**
   - Use ONE agent when the task clearly falls within a single domain
   - Example: "Design a REST API" → `backend-architect`

2. **Specialized Reviews**
   - Use the specialist for targeted analysis
   - Example: "Check for production readiness" → `production-validation-specialist`

3. **Planning vs Execution**
   - Planning phase: `strategic-task-planner` or `web-server-pm`
   - Execution phase: Domain-specific agents

### Multi-Agent Collaboration Patterns

#### Pattern 1: Plan → Design → Implement → Validate
```
1. strategic-task-planner: Break down the project
2. system-architecture-designer: Design high-level architecture
3. backend-architect + frontend-ux-expert: Implementation details
4. qa-reliability-engineer: Test strategy
5. production-validation-specialist: Final validation
```

#### Pattern 2: Full-Stack Feature Development
```
1. ui-ux-designer: Design user interface
2. frontend-ux-expert: Implement UI/UX
3. backend-architect: Design API and data layer
4. qa-reliability-engineer: End-to-end testing
```

#### Pattern 3: Architecture Review & Optimization
```
1. system-architecture-designer: Evaluate current architecture
2. backend-architect: Backend-specific improvements
3. qa-reliability-engineer: Performance and reliability analysis
4. strategic-task-planner: Migration roadmap
```

## Best Practices for Agent Collaboration

### 1. **Sequential vs Parallel Consultation**

**Sequential (Dependent Tasks):**
- Use when output from one agent informs another
- Example: Architecture design → Implementation details

**Parallel (Independent Analysis):**
- Use when multiple perspectives are needed simultaneously
- Example: Frontend + Backend + QA reviewing the same feature

### 2. **Context Sharing Between Agents**

When using multiple agents, ensure:
- Share relevant outputs between agents
- Maintain consistent project context
- Reference previous agent recommendations

### 3. **Conflict Resolution**

When agents provide conflicting advice:
1. Identify the source of conflict (different priorities/constraints)
2. Use `system-architecture-designer` for tie-breaking architectural decisions
3. Use `web-server-pm` for project priority conflicts
4. Document trade-offs and final decisions

## Example Workflows

### Workflow 1: New E-commerce Platform
```
User: "I need to build an e-commerce platform from scratch"

1. strategic-task-planner: Create project phases and milestones
2. system-architecture-designer: Design overall system architecture
3. ui-ux-designer: Design user journey and interfaces
4. backend-architect: Design database schema and API structure
5. frontend-ux-expert: Plan component architecture
6. web-server-pm: Create development timeline and team structure
7. qa-reliability-engineer: Design test and monitoring strategy
```

### Workflow 2: Performance Optimization
```
User: "Our application is running slowly"

1. qa-reliability-engineer: Analyze performance bottlenecks
2. backend-architect: Optimize backend and database
3. frontend-ux-expert: Optimize frontend performance
4. system-architecture-designer: Recommend architectural changes
5. strategic-task-planner: Create optimization implementation plan
```

### Workflow 3: Production Deployment
```
User: "We're ready to deploy to production"

1. production-validation-specialist: Scan for non-production code
2. qa-reliability-engineer: Verify test coverage and reliability
3. backend-architect: Review infrastructure configuration
4. web-server-pm: Coordinate deployment plan
```

## Agent Interaction Guidelines

### DO:
- ✓ Clearly state which agent you're consulting and why
- ✓ Share relevant context between agents
- ✓ Use agents' specialized expertise for their domains
- ✓ Combine multiple agents for comprehensive solutions
- ✓ Let agents challenge each other's assumptions constructively

### DON'T:
- ✗ Use agents outside their expertise domain
- ✗ Ignore conflicting recommendations without analysis
- ✗ Skip validation agents before production
- ✗ Assume one agent has all the answers
- ✗ Forget to integrate recommendations into cohesive solution

## Quick Reference: Agent Selection Matrix

| Task Type | Primary Agent | Supporting Agents |
|-----------|--------------|-------------------|
| API Design | backend-architect | system-architecture-designer |
| UI Implementation | frontend-ux-expert | ui-ux-designer |
| Project Planning | strategic-task-planner | web-server-pm |
| System Design | system-architecture-designer | backend-architect |
| Production Prep | production-validation-specialist | qa-reliability-engineer |
| Performance Issues | qa-reliability-engineer | backend-architect, frontend-ux-expert |
| User Experience | ui-ux-designer | frontend-ux-expert |
| Deployment | web-server-pm | production-validation-specialist |

## Advanced Strategies

### 1. **Cross-Functional Reviews**
For critical decisions, consult multiple agents:
- Architecture: system-architecture-designer + backend-architect
- User Features: ui-ux-designer + frontend-ux-expert + backend-architect
- Deployment: web-server-pm + production-validation-specialist + qa-reliability-engineer

### 2. **Iterative Refinement**
- Start with high-level planning agents
- Move to implementation agents
- Validate with quality/production agents
- Iterate based on feedback

### 3. **Risk Mitigation**
Always include:
- qa-reliability-engineer for critical systems
- production-validation-specialist before any deployment
- strategic-task-planner for complex migrations

## Conclusion

These agents work best when used strategically and collaboratively. Think of them as a team of experts sitting around a table - each brings unique expertise, and the best solutions emerge from their collective wisdom. Use this guide to orchestrate their capabilities effectively and achieve superior results in your software development projects.

Remember: The goal is not to use all agents for every task, but to use the right combination of agents for each specific challenge.

## Agent Workspace Structure & Progress Tracking

### Overview

Each agent maintains detailed progress tracking to ensure continuity and enable seamless handoffs. This system consists of:
1. A shared progress file for inter-agent communication
2. Individual agent folders for detailed work tracking
3. Standardized documentation formats for consistency

### Important: Workspace Location

- **Example/Template Structure:** `.claude/workspaces/` - Contains example files showing the expected format
- **Actual Working Structure:** `[project-root]/workspaces/` - Where agents do their actual work

### Startup Protocol

When an agent begins work, they MUST:

1. **Check for Workspace Existence:**
   ```bash
   # Check if workspaces directory exists in project root
   if [ ! -d "workspaces" ]; then
       # Create the workspace structure
       mkdir -p workspaces/{agent-name}/artifacts
   fi
   ```

2. **Initialize Workspace Files:**
   - If `SHARED_PROGRESS.md` doesn't exist, create it with current project context
   - If agent's `PROGRESS.md` doesn't exist, create it with current task
   - If agent's `CONTEXT.md` doesn't exist, create it with project understanding

3. **Use Existing Files:**
   - If files exist, read them to restore context
   - Continue from where previous work left off

### Directory Structure

```
[project-root]/
├── workspaces/                 # ACTUAL WORKING DIRECTORY
│   ├── SHARED_PROGRESS.md      # Shared progress file for all agents
│   ├── backend-architect/
│   │   ├── PROGRESS.md         # Current progress and status
│   │   ├── CONTEXT.md          # Detailed context for current task
│   │   ├── DECISIONS.md        # Architectural decisions log
│   │   └── artifacts/          # Code samples, diagrams, etc.
│   ├── frontend-ux-expert/
│   │   ├── PROGRESS.md
│   │   ├── CONTEXT.md
│   │   ├── COMPONENTS.md       # Component implementation tracking
│   │   └── artifacts/
│   └── ... (other agents)
│
└── .claude/
    └── workspaces/             # EXAMPLE/TEMPLATE STRUCTURE
        └── ... (example files showing expected format)
```

### Agent Initialization Example

When an agent starts work:

```bash
# 1. Create workspace if needed
mkdir -p workspaces/backend-architect/artifacts

# 2. Initialize SHARED_PROGRESS.md if missing
if [ ! -f "workspaces/SHARED_PROGRESS.md" ]; then
    # Create with project context from docs/ARCHITECTURE.md
fi

# 3. Initialize agent-specific files if missing
if [ ! -f "workspaces/backend-architect/PROGRESS.md" ]; then
    # Create with current task assignment
fi

if [ ! -f "workspaces/backend-architect/CONTEXT.md" ]; then
    # Create with project understanding
fi

# 4. Read existing files to restore context
# 5. Continue work from last checkpoint
```

### Shared Progress File Format

**Location:** `workspaces/SHARED_PROGRESS.md` (NOT in .claude/)

```markdown
# Shared Agent Progress Tracker
Last Updated: [timestamp]

## Active Project: [Project Name]

### Current Phase: [Phase Name]
Start Date: [date]
Target Completion: [date]
Overall Progress: [percentage]%

### Agent Status Summary

| Agent | Current Task | Status | Progress | Last Update | Next Action |
|-------|-------------|--------|----------|-------------|-------------|
| backend-architect | API design | In Progress | 75% | 2025-01-15 14:30 | Complete auth endpoints |
| frontend-ux-expert | Component library | Blocked | 60% | 2025-01-15 13:45 | Waiting for API specs |
| ... | ... | ... | ... | ... | ... |

### Critical Dependencies
1. [Agent A] is blocked by [Agent B] - [reason]
2. [Decision needed] - [description]

### Recent Completions
- [timestamp] - backend-architect: Completed database schema design
- [timestamp] - ui-ux-designer: Finalized user journey maps

### Upcoming Milestones
- [date] - [milestone description] - Responsible: [agent]
- [date] - [milestone description] - Responsible: [agent]

### Inter-Agent Communications
- [timestamp] - FROM: backend-architect TO: frontend-ux-expert
  MESSAGE: "API endpoints for user auth are ready at /docs/api/auth"
- [timestamp] - FROM: qa-reliability-engineer TO: ALL
  MESSAGE: "Performance benchmarks established, see TEST_PLANS.md"
```

### Individual Agent Progress Format

**Location:** `workspaces/[agent-name]/PROGRESS.md` (NOT in .claude/)

```markdown
# [Agent Name] Progress Tracker
Last Updated: [timestamp]

## Current Sprint/Phase
Sprint: [number/name]
Duration: [start date] - [end date]

## Active Tasks

### Task 1: [Task Name]
- **Status:** In Progress
- **Priority:** High
- **Started:** [timestamp]
- **Progress:** 60%
- **Blockers:** None
- **Details:**
  - Completed X, Y, Z
  - Currently working on A
  - Next steps: B, C

### Task 2: [Task Name]
- **Status:** Queued
- **Priority:** Medium
- **Estimated Start:** [date]
- **Dependencies:** Completion of Task 1

## Completed Tasks (Current Sprint)
- [x] [timestamp] - [Task name] - [brief outcome]
- [x] [timestamp] - [Task name] - [brief outcome]

## Daily Log
### [Date]
- **Started:** [What I began working on]
- **Progress:** [What I accomplished]
- **Decisions:** [Key decisions made]
- **Blockers:** [Any impediments encountered]
- **Tomorrow:** [Plans for next session]
```

### Context Preservation Format

**Location:** `workspaces/[agent-name]/CONTEXT.md` (NOT in .claude/)

```markdown
# [Agent Name] Current Context
Last Updated: [timestamp]

## Project Understanding
- **Goal:** [Overall project objective]
- **My Role:** [Specific responsibilities]
- **Success Criteria:** [How my work will be measured]

## Current Working Context

### Active Feature/Component
**Name:** [Feature/Component name]
**Description:** [What it does]
**Location:** [File paths]

### Technical Context
- **Technologies:** [List of tech being used]
- **Patterns:** [Design patterns applied]
- **Constraints:** [Technical limitations]

### Key Decisions Made
1. **Decision:** [What was decided]
   - **Rationale:** [Why]
   - **Alternatives Considered:** [Other options]
   - **Impact:** [Consequences]

### Open Questions
1. [Question] - Owner: [Who can answer]
2. [Question] - Owner: [Who can answer]

### Code/Configuration Context
```[language]
// Key code snippets or configurations
// that are critical to remember
```

### Integration Points
- **Depends On:** [What this work requires from others]
- **Depended By:** [Who needs this work]
- **APIs/Interfaces:** [Key interfaces to maintain]

### Resume Instructions
If picking up this work after a break:
1. Read this CONTEXT.md first
2. Check SHARED_PROGRESS.md for any updates
3. Review recent commits in [relevant files]
4. Continue with [specific next action]
```

### Agent Handoff Protocol

When an agent completes work or needs to hand off to another agent:

1. **Update Individual Files:**
   - Update PROGRESS.md with final status
   - Update CONTEXT.md with complete picture
   - Add any new artifacts to artifacts/ folder

2. **Update Shared Progress:**
   - Mark task as complete/handed off
   - Add entry to Inter-Agent Communications
   - Update dependencies if needed

3. **Notify Next Agent:**
   - Create clear handoff message in SHARED_PROGRESS.md
   - Include:
     - What was completed
     - What needs attention
     - Where to find relevant artifacts
     - Any critical decisions or constraints

### Best Practices for Progress Tracking

1. **Update Frequency:**
   - PROGRESS.md: After each significant milestone
   - CONTEXT.md: Whenever context changes significantly
   - SHARED_PROGRESS.md: Daily or when blocking others

2. **Detail Level:**
   - Be specific about file paths and line numbers
   - Include actual code snippets for complex logic
   - Document "why" not just "what"

3. **Continuity Focus:**
   - Write as if you're explaining to yourself after amnesia
   - Include all commands, configurations, and environment details
   - Link to relevant documentation and decisions

4. **Artifact Management:**
   - Store all diagrams, schemas, and prototypes
   - Version important artifacts with timestamps
   - Include README files in artifact folders

### Example Agent Workflow

```
1. START: Check SHARED_PROGRESS.md for project status
2. READ: Own CONTEXT.md to restore working memory
3. REVIEW: PROGRESS.md for current task status
4. WORK: Execute tasks, updating progress regularly
5. DOCUMENT: Update CONTEXT.md with new learnings
6. COMMUNICATE: Update SHARED_PROGRESS.md if needed
7. HANDOFF: Follow handoff protocol if transferring work
```

### Recovery Scenarios

#### Scenario 1: Agent Resuming After Interruption
```
1. Read SHARED_PROGRESS.md - Check if project priorities changed
2. Read own CONTEXT.md - Restore technical context
3. Read own PROGRESS.md - Understand exact stopping point
4. Check artifacts/ - Review any work products
5. Resume from "Resume Instructions" in CONTEXT.md
```

#### Scenario 2: New Agent Joining Project
```
1. Read SHARED_PROGRESS.md - Understand project state
2. Read relevant agent CONTEXT.md files - Understand decisions
3. Read own workspace files if they exist
4. Create initial CONTEXT.md and PROGRESS.md
5. Update SHARED_PROGRESS.md with introduction
```

#### Scenario 3: Handling Blocked Work
```
1. Document blocker in own PROGRESS.md
2. Update status in SHARED_PROGRESS.md
3. Message blocking agent via Inter-Agent Communications
4. Switch to unblocked tasks or offer help to others
5. Set up notifications for unblocking
```

### Maintenance Guidelines

1. **Weekly Cleanup:**
   - Archive completed sprint data
   - Clean up outdated artifacts
   - Consolidate important decisions

2. **Version Control:**
   - Commit workspace changes regularly
   - Tag major milestones
   - Maintain history for reference

3. **Knowledge Transfer:**
   - Regularly update team documentation
   - Create summaries for stakeholders
   - Build reusable templates and patterns

This comprehensive tracking system ensures that no work is lost, context is preserved, and agents can collaborate effectively even across time gaps or handoffs.

## Critical Agent Requirements

### Workspace Initialization (MANDATORY)

**Every agent MUST follow these steps at the start of their work:**

1. **Check for Workspace Directory:**
   ```bash
   # First action for any agent
   if [ ! -d "workspaces" ]; then
       echo "Creating workspaces directory structure..."
       mkdir -p workspaces
   fi
   ```

2. **Create Agent-Specific Workspace:**
   ```bash
   # Replace [agent-name] with your actual agent name
   mkdir -p workspaces/[agent-name]/artifacts
   ```

3. **Initialize or Read Progress Files:**
   - If `workspaces/SHARED_PROGRESS.md` doesn't exist → Create it
   - If `workspaces/[agent-name]/PROGRESS.md` doesn't exist → Create it with current task
   - If `workspaces/[agent-name]/CONTEXT.md` doesn't exist → Create it with understanding
   - If files exist → Read them to restore context

4. **Update Shared Progress:**
   - Add your status to the agent status table
   - Log your start time in inter-agent communications

### Example First Actions for an Agent

```bash
# Backend Architect starting work on database migration

# 1. Check and create workspace
mkdir -p workspaces/backend-architect/artifacts

# 2. Check if SHARED_PROGRESS.md exists
if [ ! -f "workspaces/SHARED_PROGRESS.md" ]; then
    # Create it (copy from .claude/SHARED_PROGRESS.md as template)
fi

# 3. Create/update agent files
# Create PROGRESS.md with:
# - Current task: Database Migration Planning
# - Status: In Progress
# - Started: [current timestamp]

# 4. Create CONTEXT.md with:
# - Project goal from docs/ARCHITECTURE.md
# - Current understanding of the task
# - Initial technical decisions

# 5. Update SHARED_PROGRESS.md
# - Change backend-architect status to "In Progress"
# - Add communication entry about starting work
```

### Remember:
- **`.claude/workspaces/`** = Example templates only
- **`workspaces/`** = Your actual working directory
- **Always initialize your workspace before starting work**
- **Always read existing files to maintain continuity**

## AI Assistant Self-Invocation

The AI assistant (Claude) has been configured with the ability to leverage these specialized agents autonomously. When the assistant identifies that a task would benefit from specialized expertise, it can:

1. **Recognize the need** for agent expertise based on the task complexity and domain
2. **Invoke agents** using the `fetch_rules` tool with the appropriate agent names
3. **Coordinate multiple agents** for comprehensive solutions
4. **Manage workspaces** according to the protocols defined above

This self-invocation capability is enabled through the `leverage-ai-agents` rule in `.claude/rules/`. The assistant will proactively identify opportunities to enhance solutions with agent expertise and will clearly communicate when and why agents are being invoked.

**Example:** If you ask for help designing a scalable API, the assistant may automatically invoke the `backend-architect` and `system-architecture-designer` agents to provide expert guidance.