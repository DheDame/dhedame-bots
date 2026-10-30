# DheDame Bots — Panduan Fork

Fork berjenama DheDame daripada [sam666-byte/nusantara-bots](https://github.com/sam666-byte/nusantara-bots)
(v0.10.17, lesen MIT — fail LICENSE asal dikekalkan, hak cipta upstream tidak dibuang).

## Apa yang ditukar dari upstream

- **Nama app:** DheDame Bots (dulu Nusantara Bots).
- **ID app:** `id.dhedame.bots` (boleh install sebelah app asal tanpa bertindih).
- **Warna aksen:** merah DheDame `#c62828` (dulu teal `#2dd4bf`).
- **Ikon + splash:** mark "D" serif putih atas merah (fail dalam `assets/` — ganti fail itu
  kalau nak tukar logo). Ikon launcher Android sebenar dalam
  `android/app/src/main/res/mipmap-*/` dan logo splash dalam
  `android/app/src/main/res/drawable-*/` pun dah diganti dengan mark yang sama.
- **Identiti bot:** system prompt kini kata "asisten AI di aplikasi DheDame Bots".
- **Sokongan/donasi Saweria dibuang** — diganti pautan DheDame
  (https://dhedame.my.id, https://wa.me/601126767561).
- **Lalai 9Router:** model lalai BYOK = `kr/claude-sonnet-5.5`; contoh base URL dalam
  dokumen = `https://9router.dhedame.my.id/v1`.

## Sambung ke 9Router (nilai BYOK dalam app)

Dalam app → Settings → Model API sendiri (BYO), isi:

- **Base URL:** `https://9router.dhedame.my.id/v1`
- **Model:** `kr/claude-sonnet-5.5` (atau mana-mana model `kr/` dari 9Router)
- **API key:** client API key 9Router (dibuat dari localhost 9Router — bukan key shop)

## Prasyarat 9Router — status semasa (29 Okt 2026)

1. **/v1 belum terdedah ke internet.** Sekarang `/v1` cuma di localhost VPS
   (port 20128); domain publik bagi 301. Perlu tambah route nginx `/v1` →
   `127.0.0.1:20128` di VPS 9Router. Perlu password SSH VPS (transient).
2. **Tiada provider hidup dalam 9Router.** xai masih "No active credentials";
   OAuth Kiro belum siap (device code lama dah expired). Sambung sekarang pun
   chat akan gagal — sama macam bot Hermes kedua. Kena siapkan OAuth Kiro dulu
   (pengguna kena live 10 minit untuk approve).
3. **Client API key baru** untuk app ini (dibuat dari localhost 9Router bila
   langkah 1 dibuat).

Selagi 3 di atas belum siap, app masih boleh dipasang dan diteroka, tapi chat
melalui 9Router belum akan jalan.

## Build APK

Sandbox yang buat fork ini tiada JDK/Android SDK, jadi APK tidak dibina di sini.
Dua jalan:

### A. GitHub Actions (tanpa PC)

1. Buat repo baru di GitHub, upload semua fail fork ini (tanpa folder `.git`).
2. Push ke branch `main` — workflow `.github/workflows/build-apk.yml` akan jalan
   automatik: type-check + test, kemudian bina APK debug.
3. Muat turun APK dari tab Actions → artifact `dhedame-bots-debug-apk`.

### B. Android Studio / PC

1. Pasang JDK 17 + Android SDK.
2. `npm install` (atau `npm ci`) di root repo.
3. `cd android && ./gradlew assembleDebug`
4. APK di `android/app/build/outputs/apk/debug/app-debug.apk`.

## Nota teknikal (jangan ubah tanpa sebab)

- **Identifier dalaman dikekalkan dengan sengaja** supaya app/server tidak rosak:
  kunci SecureStore `grokbot_byo`, env server `GROKBOT_APP_*`, dan data contoh
  "Sejarah Islam Nusantara" dalam `server/memory/` (itu data ujian, bukan branding).
- Companion server Python dalam `server/` cuma ditukar string paparan; wiring
  tidak disentuh.
- Kalau nak tukar logo: ganti fail dalam `assets/` (`icon.png`,
  `android-icon-foreground.png`, `android-icon-background.png`,
  `android-icon-monochrome.png`, `splash-icon.png`, `favicon.png`).
