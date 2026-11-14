param([string]$Out, [string]$Voice = "Microsoft David Desktop")
# Speaks each line of <Out>/lines.json into line1.wav, line2.wav ... and writes voice.json with their lengths.
Add-Type -AssemblyName System.Speech
$lines = Get-Content (Join-Path $Out "lines.json") -Raw -Encoding utf8 | ConvertFrom-Json
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice($Voice)
$s.Rate = -1
$i = 0
$durs = @()
foreach ($l in $lines.spoken) {
  $i++
  $f = Join-Path $Out ("line$i.wav")
  $s.SetOutputToWaveFile($f)
  $s.Speak($l)
  $s.SetOutputToNull()
  $fs = [System.IO.File]::OpenRead($f); $br = New-Object System.IO.BinaryReader($fs)
  $fs.Position = 28; $bps = $br.ReadInt32(); $len = $fs.Length - 44; $br.Close()
  $durs += [math]::Round($len / $bps, 2)
}
$obj = @{ lines = $lines.shown; durations = $durs }
$obj | ConvertTo-Json | Set-Content (Join-Path $Out "voice.json") -Encoding utf8
$durs -join ", "
