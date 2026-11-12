# CHANGELOG — yumshoq tekshiruv (English → Uzbek yozish)

Model: claude-sonnet-5-5.

## Nima o‘zgardi
- `public/engine.mjs`: yangi `gradeUzbek(given, answer, vocab)`, `editDistance` (Damerau: qo‘shni harflar almashishi = 1 xato), `maxTypos`.
- `public/app.mjs`: faqat `write-uz` savollarida `gradeUzbek` ishlatiladi. `write-en`, tanlash (choice) va harf yig‘ish (assemble) avvalgidek qat’iy (`normalize` tengligi).
  Imlo xatosi bo‘lsa, javobdan keyin darhol yashil xabar chiqadi (sizning javobingiz → to‘g‘ri javob + xato joyi `[ ]` bilan). Javob to‘g‘ri sanaladi, qayta urinish talab qilinmaydi, jon olinmaydi (yozish mashqlari uchun qoida o‘zgarmagan). Level oxirida "Imlo eslatmasi" ro‘yxati ko‘rsatiladi.
- `tests/engine.test.mjs`: yangi testlar (eski testlar saqlangan).

## Chegaralar (to‘g‘ri javob uzunligi, bo‘shliq va chiziqchalarsiz)
| Uzunlik | Ruxsat etilgan xato |
|---|---|
| ≤ 4 | 0 (suv/sut, ona/ota, it/oy kabi juftliklar uchun) |
| 5–6 | 1 |
| ≥ 7 | 2 |

Xato = harf almashishi, tushib qolishi, ortiqcha harf yoki qo‘shni ikki harf o‘rni almashishi. Apostrof (`‘`) harf sifatida sanaladi.

## Himoyalar (boshqa so‘zni noto‘g‘ri qabul qilmaslik)
1. Yozilgan so‘z boshqa lug‘at so‘ziga to‘liq teng bo‘lsa — noto‘g‘ri.
2. Yozilgan so‘z boshqa lug‘at so‘ziga maqsadli so‘zdan yaqinroq yoki teng masofada bo‘lsa — noto‘g‘ri.
3. 2 ta xato bo‘lsa, birinchi harf mos bo‘lishi shart.
4. Uzunlik farqi ruxsat etilgan xatodan oshmasligi kerak.

## Chiziqcha / bo‘shliq / apostrof
- `ob havo` ≈ `ob-havo` (chiziqcha ↔ bo‘shliq): jimgina to‘g‘ri.
- `obhavo` (chiziqcha/bo‘shliq tushib qolgan): to‘g‘ri, lekin to‘g‘ri yozilishi ko‘rsatiladi.
- `‘ ’ ʻ ʼ ` ` va `'` bir xil hisoblanadi; `do'st` = `do‘st` (aniq moslik).

## Cheklovlar
- Himoya 2 (yaqin boshqa so‘z) ba’zi haqiqiy imlo xatolarini rad etadi — bu ataylab konservativ.
- Lug‘at faqat shu ilovadagi 200 ta so‘zdan iborat; sinonimlar qabul qilinmaydi.
- Xato joyi oddiy umumiy prefiks/suffiks usuli bilan belgilanadi (ikki uzoq xato bitta oraliq bo‘lib ko‘rinadi).
- Kirish uzunligi chegarasi: `MAX_GRADE_INPUT = 100` belgi (bo‘shliqlar qirqilgach). Eng uzun lug‘at iborasi 26 belgi, shuning uchun barcha to‘g‘ri javoblar saqlanadi. Undan uzun javob darhol noto‘g‘ri deb hisoblanadi — Damerau matritsasi cheksiz o‘smaydi, brauzer qotib qolmaydi. Chegaralar (xato soni) o‘zgarmagan. Test: `gradeUzbek rejects absurdly long input...`.
- Hisobot oynasidagi "Imlo eslatmasi" uchun inline `style` olib tashlandi (CSP); o‘rniga `public/style.css` dagi `.result .typo-note` klassi ishlatiladi.

## Ma’lum boshqa so‘zlar himoyasi (Opus review tuzatishi)
Muammo: `tort`→`to‘rt` (tort ≠ to‘rt), `ochmoq`→`oshmoq`, `yechin`→`yechim`, `kech`→`kecha`, `tahlil qilmoq`→`taklif qilmoq` noto‘g‘ri qabul qilinardi (bular lug‘atda yo‘q, shuning uchun Himoya 1–2 ularni ushlamagan).
Tuzatish (`public/engine.mjs`):
- `KNOWN_OTHER_WORDS` — qo‘lda tuzilgan KICHIK ro‘yxat (`tort, ochmoq, yechin, kech, tahlil`). Bu to‘liq o‘zbek lug‘ati EMAS; yangi yolg‘on qabul topilsa, ro‘yxatga qo‘shiladi.
- Har bir so‘z (token) bo‘yicha himoya: yozilgan so‘z shu ro‘yxatda yoki boshqa lug‘at javobining (≥4 harfli) so‘zi bo‘lsa va to‘g‘ri javobning o‘z so‘zi bo‘lmasa — noto‘g‘ri. Ko‘p so‘zli iboralarda (`tahlil qilmoq`) bitta begona so‘z yetarli.
- Chegaralar (≤4: 0, 5–6: 1, ≥7: 2) O‘ZGARTIRILMAGAN. `maktap`, `shefoxnoa`, `obhavo`, `taklif qilmok` avvalgidek qabul qilinadi.
- Testlar: `curated known-other-word guard...` (5 ta hujjatlashtirilgan holat + musbat holatlar).
Qolgan cheklov: ro‘yxatda yo‘q har qanday haqiqiy boshqa so‘z hali ham imlo xatosi deb qabul qilinishi mumkin (masalan, qisqa so‘zlarda 1 harf farq). Bu to‘liq hal qilinmagan.
