Add-Type -AssemblyName System.IO.Compression.FileSystem

$file = Get-ChildItem -Filter "*CONTROLE*.xlsx" | Select-Object -First 1
$zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)

$sstEntry = $zip.GetEntry('xl/sharedStrings.xml')
$sst = @()
if ($sstEntry) {
    $sr = New-Object System.IO.StreamReader($sstEntry.Open())
    $sstXml = [xml]$sr.ReadToEnd()
    $sr.Close()
    foreach ($si in $sstXml.sst.si) {
        if ($si.t) {
            $sst += $si.t
        } elseif ($si.r) {
            $sst += ($si.r | ForEach-Object { $_.t }) -join ''
        } else {
            $sst += ''
        }
    }
}

function Get-CellValue($c) {
    if (-not $c) { return "" }
    $t = $c.t
    $v = $c.v
    if ($t -eq "s" -and $v) {
        $idx = [int]$v
        if ($idx -lt $sst.Count) { return $sst[$idx] }
    }
    return $v
}

# Inspect tables definitions
foreach ($entry in $zip.Entries) {
    if ($entry.FullName.StartsWith('xl/tables/')) {
        $tr = New-Object System.IO.StreamReader($entry.Open())
        $txml = [xml]$tr.ReadToEnd()
        $tr.Close()
        Write-Host "=============================="
        Write-Host "TABLE: $($txml.table.name) ($($txml.table.displayName)) ref: $($txml.table.ref)"
        foreach ($col in $txml.table.tableColumns.tableColumn) {
            $formula = if ($col.calculatedColumnFormula) { " [Calc: $($col.calculatedColumnFormula.'#text')]" } else { "" }
            Write-Host "  Col $($col.id): $($col.name)$formula"
        }
    }
}

$zip.Dispose()
