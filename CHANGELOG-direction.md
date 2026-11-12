# CHANGELOG — savol yo‘nalishi (til) tuzatildi

Model: claude-sonnet-5-5.

## Xato
Beginner 2-level 4/5-savol (`choice-reverse`): ekranda `sun`, variantlar `house/friend/green/sun` — ingliz so‘zi uchun ingliz variantlari. Tarjima emas.

## Ildiz sabab
Savol turining yo‘nalishi bir joyda aniqlanmagan, uch joyda alohida yozilgan:
- `data.mjs` `questions()`: `choice-reverse` variantlarni inglizcha qilib yasagan (to‘g‘ri).
- `app.mjs` savol matni: `reverse||write-uz ? word.en : choice ? word.en : word.uz` — `choice-reverse` uchun ham `en` ko‘rsatgan (xato).
- `app.mjs` `check()`: to‘g‘ri javob alohida shartlar bilan hisoblangan.

## O‘zgargan fayllar
- `public/data.mjs`: `QUESTION_TYPES` (har tur uchun `promptLang`, `answerLang`, ko‘rsatma matni), `promptOf`, `answerOf`, `instructionOf`. `questions()` variant tilini shu jadvaldan oladi. Savol tartibi va variantlarni tanlash algoritmi o‘zgarmagan.
- `public/app.mjs`: savol matni, ko‘rsatma va to‘g‘ri javob faqat shu yordamchilardan olinadi.
- `tests/direction.test.mjs`: yangi regressiya testlari.
- Tegilmagan: `engine.mjs` (imlo tolerantligi, jonlar, tangalar), localStorage, levellar, `style.css`, `tests/verify-telegram.mjs`, `tests/verification.json`.

## Yo‘nalish jadvali
| Tur | Ko‘rsatiladi | Javob |
|---|---|---|
| choice | EN | UZ (tanlash) |
| choice-reverse | UZ | EN (tanlash) |
| write-en | UZ | EN |
| assemble | UZ | EN (harflar) |
| write-uz | EN | UZ |

Ko‘rsatma matnlari endi yo‘nalishni aniq aytadi (masalan, «O‘zbekcha so‘zning inglizcha tarjimasini toping»); avval hamma tanlash savollarida bir xil «To‘g‘ri tarjimani toping» edi, `assemble` esa «so‘zni yig‘ing» deb turgan.

## Tekshiruv qamrovi
- 4 daraja × 50 level × 5 = **1000** dars savoli (200 dars).
- 4 yakuniy test × 10 = **40** savol (4 imtihon).
- Har savol: tur tartibi; prompt = `promptOf`; javob = `answerOf`; tillar har xil.
- Har tanlash savolida: 4 ta noyob variant, to‘g‘ri javob aynan 1 marta, prompt variantlar orasida yo‘q, barcha variantlar javob tilidagi lug‘at so‘zlari.
- Alohida test: `sun`/`quyosh` (Beginner 2-level, 4-savol: prompt `quyosh`, variantlar `house/friend/green/sun`).
- `app.mjs` ichida qattiq yozilgan til tanlovi qolmaganini tekshiruvchi test.

## Natija
`npm test`: 24 test, 24 o‘tdi, 0 xato. `node --check` barcha `public/*.mjs`, `server.mjs`, `tests/*.mjs` uchun o‘tdi.

## Cheklovlar
- Brauzerda (DOM) qo‘lda sinab ko‘rilmadi: testlar `questions()` ma’lumotlarini va `app.mjs` manba matnini tekshiradi, render funksiyasini ishga tushirmaydi.
- Ayni lug‘atda bir xil yozilgan inglizcha/o‘zbekcha so‘z bo‘lmasligi testda tekshiriladi, kelajakda qo‘shilgan so‘z uchun ham shu test ishlaydi.
