# Stop processes listening on FEMS service ports (3000-3007)
$ports = 3000..3007
$killed = @{}

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    $processId = $conn.OwningProcess
    if ($processId -and -not $killed.ContainsKey($processId)) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
      $killed[$processId] = $true
      Write-Host "Stopped PID $processId (port $port)"
    }
  }
}

if ($killed.Count -eq 0) {
  Write-Host "No FEMS services were listening on ports 3000-3007."
} else {
  Write-Host "Freed ports 3000-3007. Run: npm run dev:services"
}
