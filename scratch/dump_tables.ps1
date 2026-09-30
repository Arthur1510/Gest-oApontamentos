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
    if (-not $c) { return $null }
    $t = $c.t
    $v = $c.v
    if ($t -eq "s" -and $v -ne $null) {
        $idx = [int]$v
        if ($idx -lt $sst.Count) { return $sst[$idx] }
    }
    return $v
}

# Column letter to index (1-based)
function Col-To-Num($colStr) {
    $num = 0
    foreach ($char in $colStr.ToCharArray()) {
        $num = $num * 26 + ([int]$char - [int][char]'A' + 1)
    }
    return $num
}

# Parse a table given sheet XML and table XML
function Parse-Table($sheetXml, $tableXml) {
    $range = $tableXml.table.ref # e.g. A1:J111
    $parts = $range -split ':'
    $startCol = [regex]::Match($parts[0], '^[A-Z]+').Value
    $startRow = [int][regex]::Match($parts[0], '\d+$').Value
    $endCol = [regex]::Match($parts[1], '^[A-Z]+').Value
    $endRow = [int][regex]::Match($parts[1], '\d+$').Value

    $cols = @()
    foreach ($col in $tableXml.table.tableColumns.tableColumn) {
        $cols += $col.name
    }

    $minColNum = Col-To-Num $startCol
    $maxColNum = Col-To-Num $endCol

    # Build a lookup for rows in sheet
    $rowDict = @{}
    foreach ($r in $sheetXml.worksheet.sheetData.row) {
        $rNum = [int]$r.r
        if ($rNum -ge $startRow -and $rNum -le $endRow) {
            $rowDict[$rNum] = $r
        }
    }

    $rowsData = @()
    for ($rNum = $startRow + 1; $rNum -le $endRow; $rNum++) {
        if (-not $rowDict.ContainsKey($rNum)) { continue }
        $r = $rowDict[$rNum]
        $rowObj = [ordered]@{}
        $cDict = @{}
        foreach ($c in $r.c) {
            $cCol = [regex]::Match($c.r, '^[A-Z]+').Value
            $colNum = Col-To-Num $cCol
            $cDict[$colNum] = Get-CellValue $c
        }

        for ($i = 0; $i -lt $cols.Count; $i++) {
            $colIdx = $minColNum + $i
            $val = if ($cDict.ContainsKey($colIdx)) { $cDict[$colIdx] } else { $null }
            $rowObj[$cols[$i]] = $val
        }
        $rowsData += [pscustomobject]$rowObj
    }
    return $rowsData
}

# Relationship map
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

# Map sheet target to sheet XML
$sheetXmlMap = @{}
foreach ($sh in $wbXml.workbook.sheets.sheet) {
    $target = $relMap[$sh.id]
    $entry = $zip.GetEntry("xl/$target")
    $sr = New-Object System.IO.StreamReader($entry.Open())
    $sheetXmlMap[$target] = [xml]$sr.ReadToEnd()
    $sr.Close()
}

# Dump each table
$allTables = @{}
foreach ($entry in $zip.Entries) {
    if ($entry.FullName.StartsWith('xl/tables/')) {
        $tr = New-Object System.IO.StreamReader($entry.Open())
        $txml = [xml]$tr.ReadToEnd()
        $tr.Close()

        $tableName = $txml.table.name
        # Find which sheet has this table
        # Look in sheet _rels
        $foundSheetTarget = $null
        foreach ($target in $sheetXmlMap.Keys) {
            $baseName = [System.IO.Path]::GetFileName($target)
            $sheetRelPath = "xl/worksheets/_rels/$baseName.rels"
            $srelEntry = $zip.GetEntry($sheetRelPath)
            if ($srelEntry) {
                $sr = New-Object System.IO.StreamReader($srelEntry.Open())
                $srelXml = [xml]$sr.ReadToEnd()
                $sr.Close()
                foreach ($rel in $srelXml.Relationships.Relationship) {
                    if ($rel.Target -like "*$([System.IO.Path]::GetFileName($entry.FullName))") {
                        $foundSheetTarget = $target
                        break
                    }
                }
            }
            if ($foundSheetTarget) { break }
        }

        if ($foundSheetTarget) {
            $shXml = $sheetXmlMap[$foundSheetTarget]
            $tableRows = Parse-Table $shXml $txml
            Write-Host "Parsed table $tableName : $($tableRows.Count) rows (from $foundSheetTarget)"
            $allTables[$tableName] = $tableRows
        }
    }
}

$allTables | ConvertTo-Json -Depth 5 | Set-Content -Path "scratch/excel_tables.json" -Encoding UTF8
Write-Host "Saved scratch/excel_tables.json successfully!"

$zip.Dispose()
