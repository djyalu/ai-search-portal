---
description: Automated Git Deployment & Checkpoint Workflow
---

# Checkpoint Workflow

This workflow ensures that every task completion is recorded in `GEMINI.md` and synced with GitHub. Stable versions are marked with checkpoints (Git Tags).

## Steps

1. **Task Execution**: Perform the coding task as requested by the user.
2. **Document Progress**: 
   - Update `GEMINI.md` with the latest changes under the relevant Phase.
   - If a new Phase is started, add it.
   - Ensure the "Status" is updated (e.g., "In Progress" -> "Completed").
3. **Commit & Push**:
// turbo
   - Run the checkpoint script to commit and push changes:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\checkpoint.ps1 -Message "Task Summary"
     ```
4. **Create Checkpoint (If Stable)**:
// turbo
   - If the current version is functional and stable, create a checkpoint:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\checkpoint.ps1 -Message "Stable: Feature X implemented" -Checkpoint
     ```
5. **Recovery**:
   - To recover a checkpoint, use:
     ```powershell
     git checkout tags/<tag_name>
     ```

## Agent Roles
- **PM**: Updates `GEMINI.md`.
- **Deployer**: Executes `checkpoint.ps1`.
- **QA**: Verifies stability before `-Checkpoint` is used.
