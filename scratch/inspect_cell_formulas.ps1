Add-Type -AssemblyName System.IO.Compression.FileSystem

$file = Get-ChildItem -Filter "*CONTROLE*.xlsx" | Select-Object -First 1
$zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)

foreach ($entryName in @('xl/worksheets/sheet4.xml', 'xl/worksheets/sheet5.xml', 'xl/worksheets/sheet6.xml')) {
    $entry = $zip.GetEntry($entryName)
    $sr = New-Object System.IO.StreamReader($entry.Open())
    $shXml = [xml]$sr.ReadToEnd()
    $sr.Close()
    
    Write-Host "`n==============================================="
    Write-Host "ENTRY: $entryName"
    Write-Host "==============================================="
    $r2 = $shXml.worksheet.sheetData.row | Where-Object { $_.r -eq "2" }
    foreach ($c in $r2.c) {
        if ($c.f) {
            $fText = if ($c.f -is [string]) { $c.f } else { $c.f.InnerText }
            Write-Host "Cell $($c.r): Formula = $fText | Value = $($c.v)"
        }
    }
}

$zip.Dispose()
