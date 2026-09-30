
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

# Read sheet2 (Listas)
$entry = $zip.GetEntry('xl/worksheets/sheet2.xml')
$sr = New-Object System.IO.StreamReader($entry.Open())
$sh2Xml = [xml]$sr.ReadToEnd()
$sr.Close()

$rows = $sh2Xml.worksheet.sheetData.row

# Extract Obras (Cols A to E, rows 2 to 11)
$obras = @()
for ($r = 2; $r -le 11; $r++) {
    $row = $rows | Where-Object { $_.r -eq "$r" }
    if ($row) {
        $map = @{}
        foreach ($c in $row.c) {
            $colLetter = [regex]::Match($c.r, '^[A-Z]+').Value
            $map[$colLetter] = Get-Val $c
        }
        if ($map['C']) {
            $obras += [pscustomobject]@{
                id = $map['A']
                cc = $map['B']
                codigo = $map['C']
                nome = $map['D']
                endereco = $map['E']
            }
        }
    }
}

# Extract Disciplinas (Cols G to I, rows 2 to 17)
$disciplinas = @()
for ($r = 2; $r -le 17; $r++) {
    $row = $rows | Where-Object { $_.r -eq "$r" }
    if ($row) {
        $map = @{}
        foreach ($c in $row.c) {
            $colLetter = [regex]::Match($c.r, '^[A-Z]+').Value
            $map[$colLetter] = Get-Val $c
        }
        if ($map['H']) {
            $disciplinas += [pscustomobject]@{
                id = $map['G']
                disciplina = $map['H']
                codigo = $map['I']
            }
        }
    }
}

# Extract Subdisciplinas (Cols K to O, rows 2 to 60)
$subdisciplinas = @()
for ($r = 2; $r -le 60; $r++) {
    $row = $rows | Where-Object { $_.r -eq "$r" }
    if ($row) {
        $map = @{}
        foreach ($c in $row.c) {
            $colLetter = [regex]::Match($c.r, '^[A-Z]+').Value
            $map[$colLetter] = Get-Val $c
        }
        if ($map['N']) {
            $subdisciplinas += [pscustomobject]@{
                id = $map['K']
                disciplina = $map['L']
                cod_disciplina = $map['M']
                subdisciplina = $map['N']
                cod_subdisciplina = $map['O']
            }
        }
    }
}

# Extract Fornecedores (Cols Q to T, rows 2 to 25)
$fornecedores = @()
for ($r = 2; $r -le 25; $r++) {
    $row = $rows | Where-Object { $_.r -eq "$r" }
    if ($row) {
        $map = @{}
        foreach ($c in $row.c) {
            $colLetter = [regex]::Match($c.r, '^[A-Z]+').Value
            $map[$colLetter] = Get-Val $c
        }
        if ($map['S']) {
            $fornecedores += [pscustomobject]@{
                id = $map['Q']
                id_sienge = $map['R']
                fornecedor = $map['S']
                tipo = $map['T']
            }
        }
    }
}

$res = [pscustomobject]@{
    obras = $obras
    disciplinas = $disciplinas
    subdisciplinas = $subdisciplinas
    fornecedores = $fornecedores
}

$res | ConvertTo-Json -Depth 5 | Set-Content -Path "scratch/listas.json" -Encoding UTF8
Write-Host "Obras count: $($obras.Count)"
Write-Host "Disciplinas count: $($disciplinas.Count)"
Write-Host "Subdisciplinas count: $($subdisciplinas.Count)"
Write-Host "Fornecedores count: $($fornecedores.Count)"

$zip.Dispose()
