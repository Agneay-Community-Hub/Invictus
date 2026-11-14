param([string]$Out)
Add-Type -AssemblyName System.Speech
$lines = @(
  "July twentieth, nineteen seventy-six. After ten months in space, I dropped toward Mars.",
  "I landed on the Plain of Gold, and took the very first photo from the surface of Mars.",
  "For six years I tested the soil and sent home weather reports, with my dish pointed at Earth.",
  "Then, in November nineteen eighty-two, a wrong command turned my dish away from home.",
  "Since then, the dust has settled. Years and years of it.",
  "I'm still here, on Mars. Still facing the wrong way."
)
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice("Microsoft David Desktop")
$s.Rate = -1
$i = 0
$durs = @()
foreach ($l in $lines) {
  $i++
  $f = Join-Path $Out ("line$i.wav")
  $s.SetOutputToWaveFile($f)
  $s.Speak($l)
  $s.SetOutputToNull()
  $fs = [System.IO.File]::OpenRead($f); $br = New-Object System.IO.BinaryReader($fs)
  $fs.Position = 28; $bps = $br.ReadInt32(); $len = $fs.Length - 44; $br.Close()
  $durs += [math]::Round($len / $bps, 2)
}
$obj = @{ lines = $lines; durations = $durs }
$obj | ConvertTo-Json | Set-Content (Join-Path $Out "voice.json") -Encoding utf8
$durs -join ", "
