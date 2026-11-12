Boshqa agent hozirgina `engine.mjs`, `app.mjs` va testlarni o'zgartirdi — yangi baholash kodini ham ko'rib chiqaman (faqat o'qish).
# Jenius — audit hisoboti (faqat ko'rib chiqish, kodga tegilmadi)

**Model va effort:** sessiya `claude-opus-5-5` modelida ishladi. Model almashtirilmadi, ish hech kimga topshirilmadi. "High effort" sozlamasini ichkaridan tekshirib bo'lmaydi, buni faqat ko'rsatish mumkin.

## 0. Nimani tekshirdim

**Bajarilgan:**
- Barcha manba fayllarini o'qidim: `server.mjs`, `public/{app,engine,data}.mjs`, `index.html`, `style.css`, testlar, README.
- `npm test` ni ikki marta ishga tushirdim. Birinchisida 8/8 o'tdi. Ikkinchisida, Sonnet agent fayllarni o'zgartirgandan keyin, 17/17 o'tdi.
- `/tmp/jenius-audit/` ichida faqat o'qiydigan tahlil skriptlarini yozib ishga tushirdim. Ular loyiha modullarini import qilib tekshiradi: savollar, takrorlanish, distraktorlar, imtihon, `normalize`, yangi `gradeUzbek`, Levenshtein juftliklari va CSS kontrasti.

**Bajarilmagan:**
- Brauzer, server, Telegram, `verify-telegram.mjs` ishga tushirilmadi.
- O'rnatish yoki fayl tahrirlash bo'lmadi.

Shuning uchun brauzerga oid xulosalar kodni o'qishga asoslangan va har birida "[kod]" deb belgilangan. "[tasdiqlandi]" esa skript yoki test natijasi bilan isbotlanganini bildiradi.

**Diqqat:** audit davomida Sonnet agent `engine.mjs`, `app.mjs`, `style.css` va testlarni o'zgartirdi, `CHANGELOG-typing.md` qo'shdi. Hisobot soat ~22:12 dagi holatga tegishli.

---

## 1. Kritik va yuqori darajadagi xatolar

**K1 — Kritik [tasdiqlandi]. "Teskari tarjima" savoli javobni o'zi ko'rsatib turibdi.**
- `public/app.mjs` → `renderSession`: `reverse||... ? q.word.en` ifodasi ekranga inglizcha so'zni chiqaradi.
- `data.mjs` → `questions`: variantlar ham inglizcha (`key='en'`).
- Natijada 200/200 savolda ko'rsatilgan so'z to'g'ri javobning o'zi. Masalan: savol "house", variantlar `[house, cat, friend, green]`.
- Testlar buni tutmaydi, chunki savol matni qanday chiqishi tekshirilmaydi.
- **Tuzatish:** `choice-reverse` uchun `q.word.uz` ni ko'rsatish. `promptFor(q)` funksiyasini engine'ga chiqarib, "savol matni ≠ javob" degan test yozish.

**Y1 — Yuqori [tasdiqlandi]. Distraktorlar (noto'g'ri variantlar) deyarli o'zgarmaydi.**
- `data.mjs` → `questions`: `.filter((_,j)=>j%7===i%7).slice(0,3)` sababli variantlar savolning tartib raqamiga bog'langan.
- Beginner'da 50 levelning hammasida `choice` savoli faqat {kitob, non, aka, olma, oy, opa} orasidan distraktor oladi. `choice-reverse` esa faqat {house, cat, friend, green, school, blue} dan oladi.
- O'quvchi so'zni bilmasdan, "bu variant doim noto'g'ri bo'ladi" deb tashlab, javobni topa oladi.
- **Tuzatish:** level/urinish bo'yicha seed qilingan tasodifiy tanlash. Iloji bo'lsa o'xshash uzunlik yoki so'z turkumidagi so'zlarni olish.

**Y2 — Yuqori [tasdiqlandi]. 50 levelning 33 tasi faqat takrorlash, lekin "yangi so'zlar" deb ko'rsatiladi.**
- `lessonWords` 3 qadam bilan aylanadi, shuning uchun har bir bosqichning 50 so'zi 17-levelgacha tugaydi.
- 18–50-levellar (66%) bir xil aylanma tartibda takrorlanadi. Ekranda esa "YANGI SO'ZLAR" yozuvi turadi.
- Har so'z aniq 5 marta chiqadi, o'quvchi uni bilish-bilmasligidan qat'i nazar. Ya'ni tizim moslashuvchan emas.

**Y3 — O'rta-yuqori [tasdiqlandi + kod]. Yakuniy test har safar bir xil.**
- `questions(t,50,true)` har doim aynan bir xil 10 savolni, bir xil tartib va variantlar bilan qaytaradi. Bu bosqich so'zlarining atigi 20% i.
- 5 daqiqalik kutishdan keyin test yana o'sha holida chiqadi, uni yodlab olish mumkin.
- Testni tashlab chiqib cheklovni chetlab o'tish ham mumkin [kod]. Kutish vaqti faqat "×" tugmasi bosilganda yoki jonlar tugaganda yoziladi. Tab yopilsa yoki sahifa yangilansa, kutish yozilmaydi.
- Testdan o'tish faqat ✓ belgisini beradi, boshqa ma'nosi yo'q.

---

## 2. Yozma tarjimani yumshoq tekshirish (`gradeUzbek`, Sonnet versiyasi)

**Yaxshi tomonlari:**
- Faqat `write-uz` savoliga qo'llangan.
- Xato chegarasi so'z uzunligiga bog'liq: ≤4 harf → 0 xato, 5–6 → 1, ≥7 → 2.
- Damerau masofasi ishlatilgan (qo'shni ikki harf o'rni almashsa = 1 xato).
- Yozilgan so'z boshqa lug'at so'ziga teng yoki yaqinroq bo'lsa, rad etiladi.
- 2 ta xato bo'lsa, birinchi harf mos bo'lishi shart.
- Chiziqcha va bo'shliq to'g'ri ishlanadi: `obhavo` va `ob havo` ikkalasi ham qabul qilinadi.

Lug'atdagi qisqa so'zlar o'zaro juda yaqin. Masofasi 1 bo'lgan juftliklar: suv/sut, uy/oy, ona/ota/opa, uch/och, tun/kun, stol/stul, gul/pul. Shuning uchun ≤4 harfda 0 xato qoidasi to'g'ri tanlangan.

**Tekshiruvda topilgan noto'g'ri qabullar (false positive) [tasdiqlandi].** Bular boshqa haqiqiy o'zbekcha so'zlar, ular lug'atda yo'qligi uchun himoya ishlamaydi:

| Yozilgan | Kutilgan | Natija | Muammo |
|---|---|---|---|
| `tort` | to'rt | qabul | "tort" — shirinlik |
| `ochmoq` | oshmoq | qabul | "ochmoq" = to open |
| `yechin` | yechim | qabul | boshqa so'z |
| `kech` | kecha | qabul | "kech" = late |
| `tahlil qilmoq` | taklif qilmoq | qabul, 2 xato | ma'nosi umuman boshqa. Ibora uzunligi umumiy "qilmoq" qismi bilan oshib, xato chegarasi 2 ga chiqib qoladi |

**Noto'g'ri radlar va kichik kamchiliklar [tasdiqlandi]:**
- `kok`→ko'k, `yoq`→yo'q, `bog`→bog' rad etiladi. Apostrof tushib qolsa, bu harf soni sifatida sanaladi.
- `hafa`→xafa rad etiladi, garchi x/h almashinuvi tipik xato bo'lsa ham.
- `ovqat kechki` (so'z tartibi almashgan) rad etiladi. Bu to'g'ri qaror.
- `nonushta,` dagi vergul imlo xatosi deb sanaladi.
- `do´st` dagi `´` (U+00B4) belgisi apostrof sifatida normallashmaydi: NFKC uni `" ́"` ga aylantiradi va bu imlo xatosi bo'lib chiqadi. `ko´k` rad etilishi kerak (bu xulosa kodga asoslangan).

**Taklif — xavfsiz chegaralar** (bular taklif, hali amalga oshirilmagan):
1. **Avval imlo variantlarini ajratish:** `‘ ’ ʻ ʼ ´ \``, chiziqcha/bo'shliq, tushib qolgan apostrof, x↔h, ikki harf (ll/rr). Bular "to'g'ri, lekin imloga e'tibor bering" deb qabul qilinadi, qisqa so'zlarda ham. Yagona shart: natija bloklangan haqiqiy so'z bo'lmasin (kok/yoq/bog kabi).
2. **Tinish belgilarini jimgina olib tashlash:** `, ; : "`.
3. **Xato chegarasini har bir so'z uchun alohida hisoblash:** ≤4 harf → faqat 1-banddagi imlo variantlari; 5–7 → 1 xato; ≥8 → 2 xato. Iboraning jami xatosi ≤2. Bu "tahlil/taklif qilmoq" holatini yopadi.
4. **Kichik oflayn o'zbekcha so'zlar ro'yxati** (5–10 ming so'z, bir necha yuz KB): yozilgan shakl haqiqiy boshqa so'z bo'lsa, rad etish. Bu tort, ochmoq, kech kabi holatlarni yopadi.
5. **Taqriban qabul qilingan javobni "zaif" deb belgilash.** U to'g'ri hisoblanadi, lekin so'z keyingi takrorlashga ertaroq chiqadi. Rangi yashil emas, sariq bo'lsin, va xato joyi `[ ]` qavslar o'rniga ajratib ko'rsatilsin.

**Javobning o'zi to'g'riligi [kod].** Muqobil tarjimalar uchun alohida maydon yo'q, shuning uchun ba'zi to'g'ri javoblar ham rad etiladi:
- patient → faqat "sabrli" (aslida "bemor" ham).
- write-en savolida `suhbat` → faqat "interview" kutiladi (suhbat aslida conversation).
- sister → "singil", brother → "uka", application → "ilova", night → "kecha" qabul qilinmaydi.
- implication → "yashirin ma'no" degan tarjimaning o'zi shubhali.
- `-moq` infinitiv shakli majburiy.

**Tuzatish:** `{en, uz, altUz:[], altEn:[]}` ko'rinishidagi tuzilma va lug'atni qo'lda qayta ko'rib chiqish.

---

## 3. O'rta va past darajadagi xatolar

| # | Daraja | Joy | Dalil | Tuzatish |
|---|---|---|---|---|
| O1 | O'rta [kod] | `app.mjs` boshidagi yuklash qismi | localStorage'dan faqat bir nechta maydon tekshiriladi. `tier`, `streak`, `freeze`, `regenAt`, `lastDay` va `completed` ichidagi qiymatlar tekshirilmaydi. Masalan, `tier:7` bo'lsa, `learnPage` ichidagi `TIERS[7].icon` xato beradi va sahifa storage tozalanmaguncha bo'sh qoladi. `streak` qatori `innerHTML` ga tushadi, ya'ni o'zini-o'zi XSS qilish mumkin. | To'liq sxema tekshiruvi va versiya migratsiyasi |
| O2 | O'rta [kod] | `save` funksiyasi | Bir nechta tab ochilsa, oxirgi saqlagan tab yutadi: progress yo'qoladi yoki tangani ikki marta sarflash mumkin. `storage` hodisasi tinglanmaydi. | `storage` listener qo'shish va saqlashdan oldin qayta o'qish |
| O3 | O'rta [kod] | `setInterval` → `render()` | Jon tiklanganda yoki kun o'zgarganda butun sahifa qayta chiziladi. "Bizga yozing" formasidagi yozilayotgan matn o'chib ketadi, xaritada aylantirish joyi yo'qoladi. | Faqat raqamlarni yangilash |
| O4 | O'rta [kod] | `start` va `next` | 0 jonda hamma narsa bloklanadi, jon olmaydigan yozish mashqlari ham. Qayta mashq qilishda ham jon ketadi. Level o'rtasida jon tugasa, bajarilgan ish yo'qoladi. | 1-bo'limdan keyingi takliflarga qarang |
| O5 | O'rta [kod] | `completeLevel` | Strayk faqat YANGI level uchun beriladi, takrorlash uchun tanga ham, strayk ham yo'q. Bu shoshilishga undaydi. 200 level tugagach strayk davom ettirib bo'lmaydi. | — |
| O6 | O'rta [tasdiqlandi] | `style.css` | Kontrast juda past: 1.56 (qulflangan level), 1.89 (joriy level), 2.42 (asosiy tugma), 2.6–2.8 (izohlar). WCAG talabi ≥4.5. Shrift o'lchami 8–12px. | Ranglarni to'qroq qilish, shriftni kattalashtirish |
| O7 | O'rta [kod] | `app.mjs` | Inglizcha so'zlarda `lang="en"` yo'q, ekran o'quvchisi ularni noto'g'ri o'qiydi. Esc bilan dialog yopilmaydi. Tanlangan variantda `aria-pressed` yo'q. Variantlarda 1–4 raqamlari ko'rsatilgan, lekin klaviaturada ishlamaydi. Qayta chizishdan keyin fokus yo'qoladi. Talaffuz yo'q. | — |
| O8 | Past-o'rta [kod] | `server.mjs` | Host sarlavhasi tekshirilmaydi. DNS rebinding hujumida Origin bilan Host mos tushadi va Telegram kanaliga spam yuborish mumkin (1 daqiqada 1 ta). Content-Type tekshirilmaydi. | Ruxsat etilgan Host ro'yxati |
| O9 | Past [tasdiqlandi] | `tests/verification.json`, `verify-telegram.mjs` | Haqiqiy `chatId` repoga yozilgan. "8 passed" va brauzer tekshiruvlari ro'yxati skript ichiga qo'lda yozib qo'yilgan, ya'ni bu isbot emas. Hozir testlar soni 17. README'da mavjud bo'lmagan `telegram-config.example.json` fayli va boshqa papka yo'li ko'rsatilgan. | — |
| O10 | Past [kod] | `buy('refill')` | Jonlar 4/5 bo'lsa ham to'ldirish 500 tanga turadi, holbuki bitta jon 150. Ogohlantirish yo'q. | Narxni yetishmayotgan jonlar soniga bog'lash |
| O11 | Past [kod] | `toast` | Bir nechta xabar bir-birini erta yopadi. Storage xatosi har qayta chizishda xabar chiqaradi. `storageOK` o'zgaruvchisi ishlatilmaydi. | — |

**Server — yaxshi tomonlari [kod]:**
- Statik fayllar ruxsat ro'yxati orqali beriladi.
- CSP o'rnatilgan.
- So'rov hajmi 12KB bilan cheklangan.
- `parse_mode` yo'q, shuning uchun HTML in'ektsiya mumkin emas.
- Token faqat serverda.
- Standart holatda faqat `127.0.0.1` da tinglaydi.

---

## 4. Xarita va levellarni qiziqroq qilish (takliflar, amalga oshirilmagan)

**P0 — avval xatolarni tuzatish:** K1, Y1, Y3 (tasodifiy imtihon, tab yopilganda ham kutish yozilsin), O1, O3.

**P1 — har bir so'zni o'zlashtirish modeli:**
- localStorage'da har so'z uchun `{box, due, correct, lapses, typo}` saqlash.
- Leitner qutilari, oraliqlar: 1, 3, 7, 14, 30 kun.
- Har level: 3 ta yangi so'z va 2 ta "vaqti kelgan" yoki zaif so'z.
- 18–50-levellar aylanma takror o'rniga "aqlli takrorlash" bo'ladi.
- Xaritada har so'zning o'zlashtirish foizi ko'rsatiladi.

**P1 — kontekst:**
- Har so'zga qisqa misol gap va bo'sh joyni to'ldirish (cloze) mashqi.
- Moslash juftliklari.
- `speechSynthesis` orqali tinglash. Bu oflayn va yengil, kuchsiz noutbukda ham ishlaydi.
- Har 10-levelda "bekat" mavzusi bo'yicha mini-dialog, masalan Elementary uchun "aeroportda".

**P2 — Advanced'da ma'noli qiyinlik:**
- Uzun iboralarni harfma-harf yig'ish o'rniga so'z tartibini yig'ish (masalan, "take into account" — 17 ta harf plitkasi).
- Kontekstga mos idiomani tanlash.
- Ma'nosi yaqin distraktorlar: mitigate / facilitate / undermine.
- Kollokatsiyalar bilan ishlash.

**P2 — imtihon:**
- Butun bosqichdan, zaif so'zlarga ko'proq og'irlik berib, 15–20 ta tasodifiy savol.
- Yiqilsa, faqat kutib turish o'rniga aynan qaysi so'zlar zaifligini ko'rsatib, shu so'zlarga mashq taklif qilish.
- O'tsa, nishon (badge) berish.

**P2 — sog'lom motivatsiya:**
- Takrorlash va mashq rejimini jonlar hech qachon bloklamasin. Jonlar faqat "sinov" rejimida bo'lsin.
- Takrorlash sessiyasi bajarilsa, bitta jon tiklansin (do'konsiz yo'l).
- Strayk har qanday ma'noli faoliyat uchun berilsin, takrorlash ham kirsin.
- Haftalik maqsad va 15–20 daqiqadan keyin "bugunga yetarli" xabari.
- "Olovni so'ndirma!" kabi yo'qotish qo'rquviga asoslangan matnlarni yumshatish.

**P3 — adolatli iqtisod:**
- Takrorlash uchun kunlik limit bilan kichik tanga, masalan 5 tanga, kuniga 3 marta.
- Imtihondan o'tish uchun mukofot.
- Jon to'ldirish narxi yetishmayotgan jonlarga qarab: `min(500, yetishmayotgan × 120)`.
- Tanga asosan kosmetik narsalarga sarflansin (xarita mavzusi, avatar), "davom etish uchun to'lash"ga emas.

**P3 — xarita:**
- Har 10-levelda mavzuli bekat.
- Aralash takrorlash uchun "sandiq" nuqtalari.
- Bosqich oxirida "boss" takrorlash.
- Har bosqichga o'z vizual uslubi.
- Progressni eksport va import qilish.

[claude-agent] папка: /home/jaloliddin/projects/jenius-claude-review | стоимость: $1.119
