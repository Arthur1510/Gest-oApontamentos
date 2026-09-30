
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
        if ($si.t) { $sst += $si.t }
        elseif ($si.r) { $sst += ($si.r | ForEach-Object { $_.t }) -join '' }
        else { $sst += '' }
    }
}

function Get-Val($c) {
    if (-not $c) { return $null }
    $t = $c.t
    $v = $c.v
    if ($t -eq "s" -and $v -ne $null) {
        $idx = [int]$v
        if ($idx -lt $sst.Count) { return $sst[$idx] }
    }
    return $v
}

function Col-To-Num($colStr) {
    $num = 0
    foreach ($char in $colStr.ToCharArray()) {
        $num = $num * 26 + ([int]$char - [int][char]'A' + 1)
    }
    return $num
}

$entry = $zip.GetEntry('xl/worksheets/sheet2.xml')
$sr = New-Object System.IO.StreamReader($entry.Open())
$shXml = [xml]$sr.ReadToEnd()
$sr.Close()

$rows = $shXml.worksheet.sheetData.row
Write-Host "Total rows in sheet2: $($rows.Count)"

# Let's inspect rows 1 to 15
for ($i = 1; $i -le 12; $i++) {
    $r = $rows | Where-Object { $_.r -eq "$i" }
    if ($r) {
        $vals = @()
        foreach ($c in $r.c) {
            $vals += "$($c.r): $(Get-Val $c)"
        }
        Write-Host "Row $i : $($vals -join ' | ')"
    }
}

$zip.Dispose()
