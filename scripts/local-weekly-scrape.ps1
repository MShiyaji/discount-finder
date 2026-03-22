<#
.SYNOPSIS
    Local version of the weekly-scrape.yml GitHub Actions workflow.
    Calls the /api/cron/discover and /api/cron/research endpoints
    on a running local (or remote) Next.js server.
    All data is written directly to Supabase — no local files are created.

.DESCRIPTION
    This is a standalone, one-time-use script that replicates what the
    weekly-scrape GitHub Action does, but runs locally via PowerShell.

    Prerequisites:
      1. Your Next.js dev server must be running (npm run dev)
      2. CRON_SECRET must be set in your .env.local

.PARAMETER SiteUrl
    Base URL of the running app. Defaults to http://localhost:3000.

.PARAMETER CronSecret
    The CRON_SECRET value. If not provided, it will be read from .env.local.

.PARAMETER SkipDiscover
    Skip the discover phase and only run research.

.PARAMETER SkipResearch
    Skip the research phase and only run discovery.

.EXAMPLE
    .\scripts\local-weekly-scrape.ps1
    .\scripts\local-weekly-scrape.ps1 -SkipResearch
    .\scripts\local-weekly-scrape.ps1 -SiteUrl "https://your-app.vercel.app" -CronSecret "my-secret"
#>

param(
    [string]$SiteUrl = "http://localhost:3000",
    [string]$CronSecret = "",
    [switch]$SkipDiscover,
    [switch]$SkipResearch
)

# ── Helpers ──────────────────────────────────────────────────────────
function Write-Header($text) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor DarkGray
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor DarkGray
}

function Write-Step($text) {
    Write-Host "  $text" -ForegroundColor White
}

function Write-Success($text) {
    Write-Host "  ✅ $text" -ForegroundColor Green
}

function Write-Fail($text) {
    Write-Host "  ❌ $text" -ForegroundColor Red
}

function Write-Divider() {
    Write-Host ("-" * 60) -ForegroundColor DarkGray
}

# ── Read CRON_SECRET from .env.local if not provided ─────────────────
if (-not $CronSecret) {
    $envFile = Join-Path (Join-Path $PSScriptRoot "..") ".env.local"
    if (Test-Path $envFile) {
        $match = Select-String -Path $envFile -Pattern "^CRON_SECRET\s*=\s*(.+)$"
        if ($match) {
            $CronSecret = $match.Matches[0].Groups[1].Value.Trim().Trim('"').Trim("'")
        }
    }

    if (-not $CronSecret) {
        Write-Step "CRON_SECRET not found in .env.local. Proceeding without auth (Local Dev Mode)."
    }
}

# ── Banner ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  🔍 Discount Deal Finder — Local Weekly Scrape" -ForegroundColor Yellow
Write-Host "     Target: $SiteUrl" -ForegroundColor DarkGray
Write-Host "     All data is saved directly to Supabase." -ForegroundColor DarkGray
Write-Divider

$startTime = Get-Date
$headers = @{ "Authorization" = "Bearer $CronSecret" }

# ── Phase 1: Discover ───────────────────────────────────────────────
if (-not $SkipDiscover) {
    Write-Header "Phase 1: Discover New Services"
    Write-Step "Calling $SiteUrl/api/cron/discover ..."

    try {
        $response = Invoke-WebRequest `
            -Uri "$SiteUrl/api/cron/discover" `
            -Headers $headers `
            -Method GET `
            -TimeoutSec 120 `
            -UseBasicParsing

        $httpCode = $response.StatusCode
        $body = $response.Content

        Write-Step "HTTP Status: $httpCode"

        try {
            $json = $body | ConvertFrom-Json
            $pretty = $json | ConvertTo-Json -Depth 10
            Write-Host $pretty -ForegroundColor Gray
        } catch {
            Write-Host $body -ForegroundColor Gray
        }

        if ($httpCode -ne 200) {
            Write-Fail "Discover endpoint returned HTTP $httpCode"
            exit 1
        }

        Write-Success "Discovery completed — results saved to Supabase"
    } catch {
        Write-Fail "Discover request failed: $($_.Exception.Message)"
        exit 1
    }

    Write-Divider
}

# ── Phase 2: Research ────────────────────────────────────────────────
if (-not $SkipResearch) {
    Write-Header "Phase 2: Research Discounts"
    Write-Step "Calling $SiteUrl/api/cron/research ..."
    Write-Step "(This may take several minutes for AI research)"

    try {
        $response = Invoke-WebRequest `
            -Uri "$SiteUrl/api/cron/research" `
            -Headers $headers `
            -Method GET `
            -TimeoutSec 600 `
            -UseBasicParsing

        $httpCode = $response.StatusCode
        $body = $response.Content

        Write-Step "HTTP Status: $httpCode"

        try {
            $json = $body | ConvertFrom-Json
            $pretty = $json | ConvertTo-Json -Depth 10
            Write-Host $pretty -ForegroundColor Gray
        } catch {
            Write-Host $body -ForegroundColor Gray
        }

        if ($httpCode -ne 200) {
            Write-Fail "Research endpoint returned HTTP $httpCode"
            exit 1
        }

        Write-Success "Research completed — results saved to Supabase"
    } catch {
        Write-Fail "Research request failed: $($_.Exception.Message)"
        exit 1
    }

    Write-Divider
}

# ── Summary ──────────────────────────────────────────────────────────
$elapsed = ((Get-Date) - $startTime).TotalSeconds
Write-Host ""
Write-Success "Done in $([math]::Round($elapsed, 1))s"
Write-Host ""
