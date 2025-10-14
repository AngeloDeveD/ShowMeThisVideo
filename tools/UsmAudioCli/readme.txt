UsmAudioCli — CRI USM demux console

What is it
----------
A lightweight console “mini-clone” of VGMToolbox that demultiplexes CRI USM.
It extracts audio streams to .hca (with the same header/footer trimming VGMToolbox does)
and can optionally extract video streams.

Requirements
------------
- .NET 8 SDK

Build
-----
dotnet build -c Release
Executable: bin\Release\net8.0\UsmAudioCli.exe

Usage
-----
UsmAudioCli <input.usm> [--out DIR] [--audio] [--video] [--split] [--addheader]

Options:
  --out DIR     directory to write results to (default: next to the .usm)
  --split       split audio by stream_id (audio0.hca, audio1.hca, …)
  --addheader   add headers on top of audio (usually not needed)

Examples
--------
   Audio only, write next to the file:
   UsmAudioCli.exe file.usm --audio --split

Output files
------------
- Audio:  <USM name>.audio{N}.hca
  Inside you may find HCA / ADX / AIX / PCM. The extension remains .hca, just like VGMToolbox.

License / Notes
---------------
Logic mirrors VGMToolbox for CRI USM (demux and header/footer trimming).
Intended for analysis/demuxing of media files.
