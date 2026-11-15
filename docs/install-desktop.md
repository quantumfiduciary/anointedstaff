# Desktop install (Windows · Linux · macOS)

Installers ship only on [GitHub Releases](https://github.com/quantumfiduciary/anointedstaff/releases). They are not hosted on Cloudflare Pages.

## macOS

Asset: universal `.dmg` (Apple Silicon + Intel).

1. Download the `.dmg`, open it, drag **Anointed Staff** into **Applications**.
2. First open: **right-click → Open** (or allow under **System Settings → Privacy & Security**).

### “App is damaged and was moved to the Trash”

That dialog is usually **Gatekeeper**, not a broken download. CI builds are **ad-hoc signed** so Apple Silicon should open after right-click → Open. If the dialog still appears:

```bash
xattr -cr "/Applications/Anointed Staff.app"
```

Then open the app again.

Fully notarized builds (Apple Developer ID secrets in CI) remove this step. See [developer.md](developer.md).

Verify the download is a real disk image (optional):

```bash
# should mention "Macintosh" / UDIF / zlib
file ~/Downloads/Anointed.Staff_*.dmg
```

## Linux

### AppImage (amd64)

```bash
chmod +x Anointed.Staff_*_amd64.AppImage
./Anointed.Staff_*_amd64.AppImage
```

Ubuntu 24.04+ may need FUSE:

```bash
sudo apt install libfuse2t64   # or libfuse2 on older releases
```

### Debian / Ubuntu `.deb` (amd64)

```bash
sudo apt install ./Anointed.Staff_*_amd64.deb
```

Runtime dependency: **WebKitGTK 4.1** (`libwebkit2gtk-4.1-0`).

### Quick integrity checks

```bash
file Anointed.Staff_*_amd64.AppImage   # ELF 64-bit
file Anointed.Staff_*_amd64.deb        # Debian binary package
```

## Windows

Run the NSIS `.exe` installer. SmartScreen may warn on unsigned builds — choose **More info → Run anyway**.

## After install

Open the desk, load a chapter, confirm notes survive a restart. Optional AI stays off until you turn it on in Settings.
