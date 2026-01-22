param (
    [string]$Message,
    [switch]$Checkpoint
)

if (-not $Message) {
    Write-Error "Commit message is required."
    exit 1
}

# 1. Update GEMINI.md status (Handled by the agent manually, but we can verify)
Write-Host "Syncing with GitHub..." -ForegroundColor Cyan

# 2. Git Add & Commit
git add .
git commit -m "$Message"

# 3. Handle Checkpoint (Tagging)
if ($Checkpoint) {
    $date = Get-Date -Format "yyyyMMdd-HHmm"
    $tagName = "ckpt-$date"
    Write-Host "Creating checkpoint: $tagName" -ForegroundColor Green
    git tag -a $tagName -m "Checkpoint: $Message"
}

# 4. Push
Write-Host "Pushing to remote..." -ForegroundColor Cyan
git push origin main
if ($Checkpoint) {
    git push origin --tags
}

Write-Host "Done!" -ForegroundColor Green
