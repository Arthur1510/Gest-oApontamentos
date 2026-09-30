Add-Type -AssemblyName System.IO.Compression.FileSystem
$file = Get-ChildItem -Filter "*CONTROLE*.xlsx" | Select-Object -First 1
$zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)
$entry = $zip.GetEntry('xl/worksheets/sheet6.xml')
$sr = New-Object System.IO.StreamReader($entry.Open())
$shXml = [xml]$sr.ReadToEnd()
$sr.Close()
$sstEntry = $zip.GetEntry('xl/sharedStrings.xml')
$sr = New-Object System.IO.StreamReader($sstEntry.Open())
$sstXml = [xml]$sr.ReadToEnd()
$sr.Close()
$zip.Dispose()
Write-Host "String 10: $($sstXml.sst.si[10].InnerText)"
