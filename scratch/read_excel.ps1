Add-Type -AssemblyName System.IO.Compression.FileSystem

$file = Get-ChildItem -Filter "*CONTROLE*.xlsx" | Select-Object -First 1
Write-Host "File found: $($file.FullName)"
$zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)

Write-Host "`n=== SHEETS ==="
$wbEntry = $zip.GetEntry('xl/workbook.xml')
$sr = New-Object System.IO.StreamReader($wbEntry.Open())
$wbXml = [xml]$sr.ReadToEnd()
$sr.Close()

foreach ($sh in $wbXml.workbook.sheets.sheet) {
    Write-Host "Sheet: $($sh.name) (id: $($sh.sheetId), r:id: $($sh.id))"
}

Write-Host "`n=== TABLES ==="
foreach ($entry in $zip.Entries) {
    if ($entry.FullName.StartsWith('xl/tables/')) {
        $tr = New-Object System.IO.StreamReader($entry.Open())
        $txml = [xml]$tr.ReadToEnd()
        $tr.Close()
        Write-Host "Table: $($txml.table.name) displayName: $($txml.table.displayName) ref: $($txml.table.ref)"
        $cols = $txml.table.tableColumns.tableColumn | ForEach-Object { $_.name }
        Write-Host "  Columns: $($cols -join ' | ')"
    }
}

$zip.Dispose()
