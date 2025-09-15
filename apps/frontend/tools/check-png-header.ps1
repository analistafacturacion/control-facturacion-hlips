param([string[]]$paths)
foreach($p in $paths){
  if(Test-Path $p){
    $b = Get-Content $p -Encoding Byte -TotalCount 8
    $hex = ($b | ForEach-Object { $_.ToString('X2') }) -join ' '
    $len = (Get-Item $p).Length
    Write-Output "$p -> $len bytes | header: $hex"
  } else {
    Write-Output "$p -> MISSING"
  }
}
