# Dokumentasi Proyek Block Blast RPG

Dokumentasi ini menjelaskan setiap file utama dalam proyek `block-blast-rpg`, fungsi utamanya, dan bagaimana file-file tersebut bekerja bersama.

---

## 1. `package.json`

Deskripsi:
- Metadata proyek dan package.
- Menentukan dependencies, devDependencies, dan skrip npm.

Isi penting:
- `name`: `block-blast-rpg`
- `version`: `1.0.0`
- `description`: `Block Blast RPG battle game built with Phaser 3 + Capacitor`
- `type`: `module`
- `scripts`:
  - `dev`: menjalankan `vite` untuk pengembangan.
  - `build`: membangun proyek dengan `vite build`.
  - `preview`: menjalankan `vite preview`.
  - `android`: membangun proyek, sinkron Capacitor, dan membuka Android Studio.
- `dependencies`:
  - `@capacitor/android` `^6.0.0`
  - `@capacitor/core` `^6.0.0`
  - `phaser` `^4.0.0`
- `devDependencies`:
  - `@capacitor/cli` `^6.0.0`
  - `vite` `^5.0.0`

---

## 2. `vite.config.js`

Deskripsi:
- Konfigurasi bundler Vite.
- Mengatur output build dan server dev.

Isi penting:
- `base: './'` untuk mendukung jalur relatif pada build Capacitor.
- `build.outDir: 'dist'` menyimpan hasil build ke folder `dist`.
- `build.emptyOutDir: true` membersihkan output directory sebelum build.
- `server.port: 3000` untuk development server.

---

## 3. `index.html`

Deskripsi:
- Halaman HTML entrypoint untuk aplikasi web.
- Menyediakan kontainer div dan memuat modul `src/main.js`.

Isi penting:
- `<div id="game-container"></div>` sebagai root container untuk objek Phaser.
- `<script type="module" src="/src/main.js"></script>` memulai aplikasi.
- Styling sederhana untuk membuat body gelap dan menempatkan canvas di tengah layar.

---

## 4. `src/main.js`

Deskripsi:
- Entry point aplikasi Phaser.
- Memulai game langsung pada web atau menunggu event Capacitor native.

Isi penting:
- Import `Phaser` dari paket `phaser`.
- Import `gameConfig` dari `./config/gameConfig.js`.
- Deteksi platform native dengan `window.Capacitor?.isNativePlatform()`.
- Jika native, menunggu `deviceready` sebelum membuat `new Phaser.Game(gameConfig)`.
- Jika web, langsung membuat `new Phaser.Game(gameConfig)`.

---

## 5. `src/config/constants.js`

Deskripsi:
- Semua nilai statis dan konfigurasi game disimpan di sini.
- Mencegah "magic number" tersebar di scene.

Isi penting:
- Dimensi kanvas: `GAME_W`, `GAME_H`.
- Grid: `COLS`, `ROWS`, `CELL`, `GAP`, `GRID_X`, `GRID_Y`.
- Posisi UI: `TRAY_Y`, `HUD_CARD_Y`.
- Perang: `MAX_HP`, interval serangan musuh `ENEMY_ATTACK_MS`, damage musuh `ENEMY_DMG_MIN`, `ENEMY_DMG_MAX`.
- Kombinasi damage: array `COMBO_DAMAGE` dan aturan `4+ = lines * 20`.
- Palet warna blok `BLOCK_COLORS`.
- Definisi bentuk potongan `PIECES` sebagai matriks 0/1.

---

## 6. `src/config/gameConfig.js`

Deskripsi:
- Menghasilkan konfigurasi `Phaser.Game`.
- Menghubungkan `GameScene` sebagai scene utama.

Isi penting:
- `type: Phaser.AUTO` untuk memilih renderer otomatis.
- `width` dan `height` dari `GAME_W`, `GAME_H`.
- `backgroundColor: '#0f0f1a'`.
- `parent: 'game-container'` agar game ditempatkan dalam elemen HTML.
- `scene: [GameScene]`.
- `scale.mode: Phaser.Scale.FIT` dan `scale.autoCenter: Phaser.Scale.CENTER_BOTH` untuk menyesuaikan ukuran layar.

---

## 7. `src/scenes/GameScene.js`

Deskripsi:
- Scene utama permainan.
- Menangani render, input, logika grid, tray, drag-drop, baris penuh, damage, dan kondisi game over.

Fungsi utama:
- `_initState()`: inisialisasi state permainan (grid, HP, tray, drag state, status game).
- `_initGraphics()`: membuat objek grafik Phaser untuk background, grid, tray, ghost, dan UI.
- `_initTexts()`: membuat teks HUD, label, pesan, dan combo.
- `_initInput()`: menyetel event pointer untuk drag-and-drop.
- `_initEnemyTimer()`: membuat timer serangan musuh berkala.
- `drawBackground()`: menggambar latar belakang dan panel tray.
- `drawHUD()`: menggambar kartu HP pemain/musuh dan bar HP.
- `drawGrid()`: menggambar grid sel dan blok yang terisi.
- `spawnTray()`: membuat 3 potongan acak di tray.
- `drawTray()`: menggambar potongan yang tersedia di tray.
- `_updateDragGhost()`: menampilkan preview bentuk saat pemain menyeret potongan.
- `_onPointerDown()`, `_onPointerMove()`, `_onPointerUp()`: menangani input pointer untuk pick-up, drag, dan drop.
- `_placePiece()`: menempatkan potongan ke grid, menandai tray used, dan memicu pengecekan baris.
- `_checkLines()`: mencari baris/kolom penuh, mem-flash, membersihkan, dan menghitung damage ke musuh.
- `_flashLines()`: animasi flash saat baris atau kolom penuh dihapus.
- `_showCombo()`: menampilkan teks combo dan damage.
- `_enemyAttack()`: menyerang pemain secara periodik dan menangani efek visual.
- `_endGame()`: menampilkan layar kemenangan atau kalah serta tombol restart.
- `_setMsg()`: mengubah teks instruksi/pesan di bawah.

Relasi file:
- Menggunakan banyak konstanta dari `../config/constants.js`.
- Menggunakan helper fungsi dari `../utils/helpers.js` seperti `randShape`, `randPieceColor`, `calcDamage`, `canPlace`, `findFullLines`, `clearLines`.

---

## 8. `src/utils/helpers.js`

Deskripsi:
- Kumpulan fungsi utilitas permainan.
- Berisi logika non-UI yang bisa diuji secara terpisah.

Fungsi utama:
- `randFrom(arr)`: memilih nilai acak dari array.
- `randShape()`: mengambil bentuk acak dari `PIECES`.
- `randPieceColor()`: mengambil warna acak dari `BLOCK_COLORS`.
- `calcDamage(lines)`: menghitung damage berdasarkan jumlah baris/kolom yang dibersihkan.
- `canPlace(grid, shape, row, col, ROWS, COLS)`: memeriksa apakah potongan bisa ditempatkan pada posisi tertentu.
- `findFullLines(grid, ROWS, COLS)`: menemukan baris dan kolom penuh.
- `clearLines(grid, fullRows, fullCols)`: membersihkan sel di baris/kolom penuh.

Relasi file:
- Diimpor oleh `src/scenes/GameScene.js`.
- Menggunakan konstanta warna dan bentuk dari `../config/constants.js`.

---

## 9. `capacitor.config.json`

Deskripsi:
- Konfigurasi Capacitor untuk build native.
- Biasanya berisi `appId`, `appName`, dan `webDir`.

Catatan:
- File ini digunakan saat aplikasi ditempatkan ke platform Android.
- Tidak dimodifikasi dalam dokumentasi ini karena biasanya berisi pengaturan runtime platform.

---

## 10. `.gitignore`

Deskripsi:
- Daftar file/folder yang diabaikan oleh Git.
- Biasanya termasuk `node_modules`, `dist`, dan file konfigurasi local.

Catatan:
- Berguna untuk menjaga repositori tetap bersih dan hanya menyertakan file penting.

---

## 11. Enemy Wave Design

Desain wave berikut dibuat berdasarkan difficulty curve dari karakter musuh yang sudah disiapkan.
Gunakan ini sebagai urutan wave default, lalu tambahkan opsi random agar setiap run bisa terasa berbeda.

### Placeholder visual untuk karakter
- Gunakan placeholder sederhana dulu: emoji pemain/musuh atau warna blok.
- `Player` dan semua `enemy` bisa direpresentasikan dengan icon teks atau warna sebelum asset final tersedia.

### Rencana wave

| Wave | Musuh | Alasan / Curve |
|------|-------|----------------|
| 1 | Goblin ×2 + Forest Bandit | Mudah, mengajarkan mekanik dasar: combo ×2, trap, dan board awareness. |
| 2 | Goblin ×1 + Walyan Archer ×1 + Stormfjord Refugee ×1 | Tambah variasi awal dengan disruption, target block, dan musuh cepat yang lemah. |
| 3 | Walyan Soldier ×1 + Spider ×1 + Goblin ×1 | Tekanan menengah: kompresi board + webs + gangguan grup. |
| 4 | Undead ×1 + Goblin Boss ×1 | Perkenalkan revive dan summon obstacle; butuh combo lebih besar dan fokus. |
| 5 | Mutated Undead ×1 + Manfrog ×1 + Forest Bandit ×1 | Kontaminasi + slime + trap menciptakan tantangan board control sedang. |
| 6 | Stormfjord Raider ×1 + Dusk Skeleton ×1 | Rhythm serangan berubah, boss charge dan shield menuntut interrupt/timing. |
| 7 | Walyan Paladin ×1 + Giant Spider ×1 + Spider ×1 | Late-game pressure dengan purge board, webs, dan potensi spawn tambahan. |
| 8 | Werewolf ×1 + Walyan Soldier ×1 + Walyan Archer ×1 | Final gauntlet: transformasi + armor + targeted disruption; butuh kombo tinggi dan adaptasi. |

### Opsi random wave

1. Kelompokkan musuh dalam tier:
   - Tier 1: `Goblin`, `Forest Bandit`, `Stormfjord Refugee`, `Spider`
   - Tier 2: `Walyan Archer`, `Walyan Soldier`, `Stormfjord Soldier`, `Undead`, `Manfrog`
   - Tier 3: `Goblin Boss`, `Mutated Undead`, `Dusk Skeleton`, `Stormfjord Raider`, `Walyan Paladin`, `Giant Spider`, `Werewolf`
2. Untuk wave acak:
   - Wave awal: pilih 2-3 musuh Tier 1.
   - Wave menengah: pilih 1-2 Tier 1 + 1 musuh Tier 2.
   - Wave sulit: pilih 1 musuh Tier 3 + 1-2 musuh pendukung Tier 1/2.
3. Pastikan ada progression:
   - Wave awal berfokus pada musuh cepat/lemah.
   - Wave menengah menambahkan board interference.
   - Wave akhir membawa boss atau sinergi efek berat.
4. Tambahkan aturan randomisasi aman:
   - minimal 1 musuh dengan efek board per wave menengah/tinggi
   - maksimal 2 musuh Tier 3 per wave
   - selalu sertakan setidaknya satu musuh yang bisa dikalahkan dengan combo besar untuk memberi pemain peluang comeback

Dengan struktur ini, wave tetap masuk akal secara difficulty curve, sementara random spawn dapat digunakan tanpa merusak flow permainan.
