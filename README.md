# Show Me This Video
[Читать на русском](./README_rus.md)

A specialized tool designed for analyzing and processing **containerized video assets** used in certain proprietary game engines, including formats found in the *Persona* game series.

> ⚠️ **Disclaimer:**  
> This project is not affiliated with, endorsed, or sponsored by ATLUS, SEGA, or any of their subsidiaries.  
> It is provided strictly for **educational and research purposes**.  
> No copyrighted game data, keys, or assets are included or distributed.  
> Users are solely responsible for ensuring their use of this software complies with all applicable laws, EULAs, and copyright regulations.

---

## 🚀 Overview

This application simplifies research into custom video file formats by providing an intuitive interface that automates the parsing and transformation process.  
It’s designed for developers, modders, and digital preservation researchers interested in understanding how certain proprietary video containers are structured.

---

## 🛠️ Technical Architecture

### Frontend
- **Electron** + **React** — Modern cross-platform desktop framework

### Backend Processing
- **crid_mod** — Custom binary data handling module (for container analysis and format conversion)
- **FFmpeg** — Video decoding, conversion, and playback integration
- **UsmAudioCli** - Extract audio (less often video) files from a .usm

---

## ✨ Key Features

- ⚡ **Automated container parsing** — reduces the need for manual hex or CLI operations
- 🔧 **Format analysis utilities** — designed for research into video encoding structures
- 🔍 **Custom modular architecture** — allows easy integration with external tools and codecs

---

## 📦 Installation & Usage

### 🧩 Portable version
Download the portable build. After downloading, simply run the executable — within a few seconds, the program will launch and be ready to use.

### 📦 ZIP version
Download the `.zip` archive, extract it anywhere you like, and run `Persona Video Converter.exe`.

### 💿 Installer (.exe)
Run the setup `.exe` file. During installation, you’ll be asked to choose the destination folder.  
Once installed, launch `Persona Video Converter.exe` and enjoy!

---

## 🎞️ Working with `.usm` Files

To start, select the `.usm` file option in the main menu — you’ll be taken to a page with several settings:

- **Region selection**  
- **Game selection**  
- **Auto-open folder after processing**  
- **Merge audio and video**

### 🧠 Details

#### 🌍 Region selection
Starting from *Persona 5 Royal*, different regions use different encryption keys.  
Using the wrong one may result in a black video or distorted audio.  
Make sure you know the region of your `.usm` file in advance.

#### 🎮 Game selection
Each *Persona* title has its own encryption type and keys (some may not use encryption at all).  
To get proper video and audio output, select the correct game your `.usm` file belongs to.

#### 📂 Auto-open folder
You can enable or disable automatic folder opening after the process finishes.

#### 🎧 Separate audio and video
The program can also extract audio and video separately.  
All exported files are unencrypted and safe for personal use.

#### 📁 File selection
Click the large rectangular button to choose a `.usm` file.

#### 🔍 File details
If you’re unsure which file you selected, click **“USM File Details”** — it will open a forum page with more information about `.usm` files  
(Currently works for *P5* and *P5R*).

#### ▶️ Run command
Click **“Run Command”** to start the conversion process.

#### 🗂️ Open output folder
Click **“Open Folder”** to go directly to the directory containing the processed files.

#### 🔄 Reset
If you selected the wrong file, just click **“Reset”** and pick another one.

---


## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

### 🧠 Notes

This tool is intended for:
- reverse engineering education,
- format interoperability research,
- digital preservation and archival studies.

---

## 🚧 Coming Soon

Future updates will add support for working with:
- `.awb` audio files  
- `.adx` audio files

---

## 🙏 Special Thanks

Special thanks to the developers of the following amazing tools used in this project:

- [**FFmpeg**](https://github.com/FFmpeg/FFmpeg) — powerful multimedia framework for handling audio and video.  
- [**VgmToolbox**](https://github.com/Manicsteiner/VGMToolbox) — a versatile toolkit for processing and extracting game media data.  
- [**CRID Mode**](https://github.com/kokarare1212/CRID-usm-Decrypter) — tool for decrypting and working with `.usm` video files.  
- [**VGAudioCli**](https://github.com/Thealexbarney/VGAudio) — library and CLI tool for handling various game audio formats.

---

Please do **not** use it to distribute or modify proprietary game assets.

<p align="center">
  <sub>Made with ❤️ for the Persona community</sub>
</p>
