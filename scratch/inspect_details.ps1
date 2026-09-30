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

foreach ($name in @('Resumo', 'Clculos', 'Planilha1')) {
    $sh = $wbXml.workbook.sheets.sheet | Where-Object { $_.name -like "*$name*" -or ($name -eq 'Clculos' -and $_.name -like '*lculos*') } | Select-Object -First 1
    if ($sh) {
        $target = $relMap[$sh.id]
        Write-Host "`n=========================================="
        Write-Host "SHEET: $($sh.name) (Target: $target)"
        Write-Host "=========================================="
        $sheetEntry = $zip.GetEntry("xl/$target")
        if ($sheetEntry) {
            $sr = New-Object System.IO.StreamReader($sheetEntry.Open())
            $shXml = [xml]$sr.ReadToEnd()
            $sr.Close()
            foreach ($r in $shXml.worksheet.sheetData.row) {
                $rowVals = @()
                foreach ($c in $r.c) {
                    $val = Get-CellValue $c
                    $f = if ($c.f) { " [=$($c.f)]" } else { "" }
                    $rowVals += "$($c.r): $val$f"
                }
                Write-Host "Row $($r.r): $($rowVals -join ' | ')"
            }
        }
    }
}

Write-Host "`n=== CHARTS ==="
foreach ($entry in $zip.Entries) {
    if ($entry.FullName.StartsWith('xl/charts/')) {
        Write-Host "Chart: $($entry.FullName)"
        $cr = New-Object System.IO.StreamReader($entry.Open())
        $cxml = [xml]$cr.ReadToEnd()
        $cr.Close()
        Write-Host "Title: $($cxml.chartSpace.chart.title.tx.rich.p.r.t)"
        # chart type:
        $plot = $cxml.chartSpace.chart.plotArea
        $types = $plot.ChildNodes | ForEach-Object { $_.LocalName }
        Write-Host "Plot area elements: $($types -join ', ')"
    }
}

$zip.Dispose()
