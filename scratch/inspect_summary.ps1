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

$relsEntry = $zip.GetEntry('xl/_rels/workbook.xml.rels')
$sr = New-Object System.IO.StreamReader($relsEntry.Open())
$relsXml = [xml]$sr.ReadToEnd()
$sr.Close()

$relMap = @{}
foreach ($rel in $relsXml.Relationships.Relationship) {
    $relMap[$rel.Id] = $rel.Target
}

$wbEntry = $zip.GetEntry('xl/workbook.xml')
$sr = New-Object System.IO.StreamReader($wbEntry.Open())
$wbXml = [xml]$sr.ReadToEnd()
$sr.Close()

foreach ($sh in $wbXml.workbook.sheets.sheet) {
    if ($sh.name -in @('Resumo', 'Listas', 'Clculos', 'tbOramento')) {
        $target = $relMap[$sh.id]
        Write-Host "`n=========================================="
        Write-Host "SHEET: $($sh.name) (Target: $target)"
        Write-Host "=========================================="
        
        $sheetEntry = $zip.GetEntry("xl/$target")
        if ($sheetEntry) {
            $sr = New-Object System.IO.StreamReader($sheetEntry.Open())
            $shXml = [xml]$sr.ReadToEnd()
            $sr.Close()
            
            $rows = $shXml.worksheet.sheetData.row
            Write-Host "Total rows: $($rows.Count)"
            $count = 0
            foreach ($r in $rows) {
                if ($count -ge 30) { break }
                $rowVals = @()
                foreach ($c in $r.c) {
                    $val = Get-CellValue $c
                    $f = if ($c.f) { " [=$($c.f)]" } else { "" }
                    $rowVals += "$($c.r): $val$f"
                }
                Write-Host "Row $($r.r): $($rowVals -join ' | ')"
                $count++
            }
        }
    }
}

$zip.Dispose()
