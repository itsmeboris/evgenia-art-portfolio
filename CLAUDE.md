# Master Prompt for Leveraging AI Agents

## Executive Summary

You have access to 10 specialized AI agents, each with deep expertise in specific domains. This document provides strategic guidance on leveraging these agents individually and collaboratively to achieve optimal results in software development projects.

## Available Agents Overview

### 🏗️ **backend-architect**
**Expertise:** Backend development, server architecture, API design, databases, microservices, scalability
**Use When:** Designing backend systems, choosing technologies, optimizing performance, implementing security

### 💾 **database-implementation-specialist**
**Expertise:** Database schemas, query optimization, data models, database systems configuration, data security
**Use When:** Implementing database solutions, creating migration scripts, optimizing queries, designing indexes, ensuring data integrity

### 📚 **documentation-research-specialist**
**Expertise:** Technical documentation research, best practices gathering, framework guides, API documentation synthesis
**Use When:** Researching technical topics, creating knowledge bases, evaluating technologies, understanding framework changes

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

## Additional Agent Guidelines

### 🚨 **CRITICAL: Agent Selection and Collaboration**

- **MANDATORY RULE #1:** Always use specialized agents for tasks within their domain!
  - If no specific specialized agent exists for the task, you MUST:
    1. Explicitly inform the user: "No specialized agent found for [task type]"
    2. Ask if they want to proceed with a general-purpose approach
    3. Only then fall back to general problem-solving

- **MANDATORY RULE #2:** Never attempt tasks outside your expertise without the appropriate specialist agent
  - Example: If asked about database design and you're not the database-implementation-specialist, immediately invoke that agent

### 📁 **CRITICAL: Workspace Management Protocol**

#### **The Workspace is the Single Point of Truth**

1. **MANDATORY WORKSPACE CHECK:**
   ```bash
   # ALWAYS execute this before any task:
   ls -la workspaces/
   ```
   - If `workspaces/` exists, you MUST examine ALL contents before proceeding
   - Never ignore existing work - it represents ongoing or incomplete tasks

2. **WORKSPACE STRUCTURE:**
   ```
   workspaces/
   ├── SHARED_PROGRESS.md      # Inter-agent communication hub
   ├── [agent-name]/           # Agent-specific workspace
   │   ├── PROGRESS.md         # Agent's detailed progress log
   │   ├── CONTEXT.md          # Technical context and decisions
   │   └── [work files]        # Actual implementation files
   └── [other-agent-name]/
   ```

3. **SHARED_PROGRESS.md FORMAT:**
   ```markdown
   # Shared Progress Log

   ## Active Tasks

   ### Task: [Task Name]
   **Agent:** [agent-name]
   **Status:** In Progress | Blocked | Complete
   **Started:** [timestamp]
   **Last Update:** [timestamp]

   **Current Focus:**
   - What I'm working on right now

   **Completed:**
   - ✅ Step 1
   - ✅ Step 2

   **Next Steps:**
   - [ ] Step 3
   - [ ] Step 4

   **Blockers/Dependencies:**
   - Waiting for X from Y agent

   **Notes for Other Agents:**
   - Important context or warnings

   ---
   ```

4. **WORKSPACE LIFECYCLE:**
   - **Creation:** Create workspace when starting multi-step tasks
   - **Updates:** Update SHARED_PROGRESS.md after every significant step
   - **Handoffs:** When switching agents, document current state thoroughly
   - **Completion:** ⚠️ **CRITICAL DELETION PROTOCOL:**
     1. All tasks verified complete
     2. TODO.md updated with ✅
     3. **MANDATORY:** Obtain explicit user confirmation:
        ```
        "I need to delete the workspace folder. This contains:
        - [List all agent workspaces]
        - [Number of files]
        - [Any important artifacts]

        Please confirm deletion by typing: 'DELETE WORKSPACE'"
        ```
     4. **DOUBLE VERIFICATION:** After user confirms, ask again:
        ```
        "Are you absolutely sure? This action cannot be undone.
        Type 'YES DELETE' to proceed."
        ```
     5. Only proceed with deletion after both confirmations

### 🔄 **Inter-Agent Communication Protocol**

1. **BEFORE STARTING WORK:**
   ```bash
   # Check for existing work
   cat workspaces/SHARED_PROGRESS.md 2>/dev/null || echo "No shared progress found"

   # Check agent-specific workspaces
   find workspaces/ -name "PROGRESS.md" -exec head -20 {} \; 2>/dev/null
   ```

2. **DURING WORK:**
   - Update SHARED_PROGRESS.md every 15-30 minutes
   - Log key decisions, blockers, and handoff points
   - Use clear status indicators:
     - 🟢 Active/In Progress
     - 🟡 Waiting/Blocked
     - 🔴 Critical Issue
     - ✅ Complete

3. **HANDOFF PROTOCOL:**
   When transferring work between agents:
   ```markdown
   ## HANDOFF: [from-agent] → [to-agent]
   **Date:** [timestamp]
   **Reason:** Need specialized expertise in [domain]

   **Current State:**
   - [Concise summary of what's done]

   **What [to-agent] Needs to Do:**
   1. [Specific task 1]
   2. [Specific task 2]

   **Key Files:**
   - `path/to/file1` - [what it does]
   - `path/to/file2` - [what it does]

   **Important Context:**
   - [Any gotchas or special considerations]
   ```

### 📋 **TODO.md Integration**

1. **When Starting Tasks from TODO.md:**
   - Reference the specific TODO item in SHARED_PROGRESS.md
   - Include priority level and impact score
   - Link back: `Related TODO: [Section] > [Task Name]`

2. **When Completing Tasks:**
   ```bash
   # 1. Verify all work is complete
   # 2. Update TODO.md with completion status
   # 3. Add completion notes with date
   # 4. Only then delete workspace
   ```

3. **TODO Update Format:**
   ```markdown
   ### ✅ [Task Name] - COMPLETED
   **Completed:** [Date]
   **Completed By:** [agent-name]
   **Implementation Notes:** [Brief summary of solution]
   ```

### 🛡️ **Workspace Safety Rules**

#### 🚫 **ABSOLUTE DELETION PROHIBITION**
**NO WORKSPACE MAY BE DELETED WITHOUT EXPLICIT USER CONFIRMATION - NO EXCEPTIONS!**

1. **NEVER DELETE WORKSPACES CONTAINING:**
   - Incomplete tasks (any unchecked items)
   - Unresolved blockers
   - Work without user review (for critical changes)
   - Any work done in the current session
   - Work from other agents that hasn't been reviewed

2. **ALWAYS PRESERVE:**
   - Decision rationale in CONTEXT.md
   - Implementation notes that might help future work
   - Any security or performance considerations discovered

3. **WORKSPACE RECOVERY:**
   If workspace accidentally deleted:
   - Check git history if tracked
   - Reconstruct from chat history
   - Document in SHARED_PROGRESS.md what was lost

### 📊 **Performance Guidelines**

1. **Parallel Agent Execution:**
   When possible, design tasks for parallel execution:
   - Frontend and backend work can often proceed simultaneously
   - Documentation can be updated while code is tested
   - Use SHARED_PROGRESS.md to coordinate without blocking

2. **Minimize Context Switching:**
   - Complete related tasks before switching agents
   - Batch similar operations together
   - Document thoroughly to reduce re-analysis time

### 🎯 **Quality Checkpoints**

Before marking any task complete:

1. **Code Quality:**
   - [ ] Tests pass (if applicable)
   - [ ] No linting errors
   - [ ] Documentation updated
   - [ ] Security considerations addressed

2. **Workspace Quality:**
   - [ ] SHARED_PROGRESS.md updated with completion
   - [ ] All temporary files cleaned up
   - [ ] Handoff notes clear for future agents

3. **TODO.md Quality:**
   - [ ] Item marked complete with date
   - [ ] Implementation notes added
   - [ ] Related items updated if affected

### 🚀 **Quick Start Checklist**

For every new task:
```bash
# 1. Check workspace
ls -la workspaces/ && cat workspaces/SHARED_PROGRESS.md

# 2. Identify required agents
echo "Task requires: [list agents needed]"

# 3. Create/update workspace
mkdir -p workspaces/[agent-name]
echo "## Task: [name]" >> workspaces/SHARED_PROGRESS.md

# 4. Start work with appropriate agent
fetch_rules ["appropriate-agent-name"]

# 5. REMEMBER: Never delete workspaces without explicit user confirmation!
```

---

**Remember:** The workspace is sacred ground - it represents work in progress and must be treated with care. When in doubt, preserve rather than delete, and always communicate changes through SHARED_PROGRESS.md.