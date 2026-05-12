# Block Blast RPG 🎮

Game puzzle RPG mobile — hancurkan baris/kolom untuk menyerang musuh. Dibangun dengan **Phaser 3** + **Vite** + **Capacitor (Android)**.

---

## Struktur Project

```
block-blast-rpg/
├── index.html                  # Entry HTML
├── vite.config.js              # Vite bundler config
├── capacitor.config.json       # Capacitor config (app ID, webDir, dll)
├── package.json
├── .gitignore
└── src/
    ├── main.js                 # Boot Phaser, handle Capacitor deviceready
    ├── config/
    │   ├── constants.js        # Semua magic number & data statis
    │   └── gameConfig.js       # Phaser.Game config object
    ├── scenes/
    │   └── GameScene.js        # Scene utama (render + input + logic)
    └── utils/
        └── helpers.js          # Pure functions (canPlace, calcDamage, dll)
```

---

## Setup Lokal

```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev
# Buka http://localhost:3000
```

---

## Build & Run di Android

> Prerequisites: **Android Studio** + **JDK 17** sudah terinstall.

```bash
# 1. Build web app
npm run build

# 2. Inisialisasi Capacitor (hanya pertama kali)
npx cap init

# 3. Tambah platform Android (hanya pertama kali)
npx cap add android

# 4. Sync & buka Android Studio
npx cap sync android
npx cap open android
```

Di Android Studio: **Run ▶** untuk deploy ke emulator atau device fisik.

Atau pakai shortcut (build + sync + open sekaligus):
```bash
npm run android
```

---

## Setup GitHub Repository

```bash
# 1. Init git di folder project
git init
git add .
git commit -m "feat: initial commit"

# 2. Buat repo baru di github.com, lalu:
git remote add origin https://github.com/USERNAME/block-blast-rpg.git
git branch -M main
git push -u origin main
```

---

## Cara Main

1. Tap blok di tray bawah untuk memilihnya
2. Tap cell di grid untuk menaruhnya
3. Isi 1 baris/kolom penuh → dihancurkan → damage ke musuh
4. Combo (2+ baris sekaligus) → damage lebih besar
5. Musuh menyerang otomatis tiap 4 detik
6. Habiskan HP musuh sebelum HP kamu habis!

## Damage Table

| Baris sekaligus | Damage |
|-----------------|--------|
| 1               | 10     |
| 2               | 25     |
| 3               | 45     |
| 4+              | ×20    |
