# Jenius

Ingliz tilini o‘zbekcha o‘rganish uchun mahalliy ishlaydigan web-ilova.

## Ishga tushirish

Node.js 22+ kerak. Tashqi paketlar va npm install kerak emas.

```bash
cd /home/jaloliddin/Documents/Project1
npm start
```

Brauzer: http://127.0.0.1:4173

Standart holatda faqat shu kompyuterdan ochiladi. Internetga joylashtirish hali bajarilmagan. Ommaviy sayt uchun HTTPS, serverdagi foydalanuvchi hisoblari, ma’lumotlar bazasi va kuchliroq spam himoyasi kerak.

## O‘qish

- Beginner, Elementary, Intermediate, Advanced — har birida 50 level, jami 200 level.
- Har bosqichda 50 so‘z/ibora bor; keyingi levellarda ular takrorlab mustahkamlanadi. Jami 200 noyob lug‘at birligi, 1 000 level-savol joyi; bu 1 000 noyob so‘z emas.
- Level boshida 5 so‘z o‘rgatiladi, bosib tarjimasini ochish mumkin.
- Keyin shu so‘zlardan 5 savol: tarjima tanlash, harflardan yig‘ish, inglizcha yozish, teskari tarjima tanlash, o‘zbekcha yozish.
- Level xatosiz tugatilganda keyingisi ochiladi. Xato bo‘lsa shu 5 savol qayta mashq qilinadi.
- Bosqich oxirida 10 savolli test, o‘tish chegarasi 80%. Muvaffaqiyatsizlik yoki testni tashlab chiqishda 5 daqiqalik kutish saqlanadi.
- Istalgan boshlang‘ich darajani tanlash mumkin; bosqich testlari boshqa darajani tanlashni bloklamaydi.

## Jon, tanga va strayk

- Maksimum 5 jon; tanlash/yig‘ishdagi xato 1 jon oladi; yozishdagi xato jon olmaydi.
- 0 jonda level boshlanmaydi yoki davom ettirilmaydi.
- Har 30 daqiqada 1 jon tiklanadi, sayt yopiq bo‘lsa ham qayta ochilganda hisoblanadi.
- Yangi level uchun 20 tanga, har 10-level uchun 30 tanga. Bir bosqich jami 1 050 tanga.
- Takroriy level yoki yakuniy test tanga bermaydi.
- Shop: +1 jon = 150, 5 tagacha to‘ldirish = 500, 1 kunlik strayk himoyasi = 300 tanga.
- Himoya oldindan olinadi va bir marta ishlaydi. Bir vaqtning o‘zida faqat bitta himoya.
- Strayk uchun har kuni kamida bitta YANGI level tugatiladi; kun mahalliy qurilma vaqtida hisoblanadi.

## Saqlash cheklovlari

Natijalar faqat shu brauzerning localStorage xotirasida. Hisob yoki qurilmalararo sinxronlash yo‘q. Brauzer ma’lumotlari tozalansa progress yo‘qoladi. Qurilma soatini yoki localStorage’ni o‘zgartirishni cheklaydigan server tekshiruvi yo‘q. Bu mahalliy MVP, firibgarlikdan himoyalangan ommaviy iqtisodiyot emas.

## Telegram

`telegram-config.json` faqat server tomonidan o‘qiladi, HTTP orqali berilmaydi va .gitignore’da. Fayl ruxsati 600. Namuna: `telegram-config.example.json`.

Bot tokeni chatda oshkor bo‘lganligi sababli BotFather orqali yangilang va faqat shu server fayliga yozing. Tokenni frontendga qo‘ymang. Sozlama o‘zgargach serverni qayta ishga tushiring.

Xabarlar haqiqiy Telegram kanaliga yuboriladi. Minimal xabar 10, maksimal 2 000 belgi. Bir IP uchun 60 soniyada bitta yuborish. Token serverda qoladi; ommaviy joylashtirishdan oldin CAPTCHA va ishonchli rate-limit qo‘shish kerak.

## Testlar

```bash
npm test
```

Avtomatik testlar lug‘at/savollar, normalizatsiya, jon tiklanishi, tanga iqtisodiyoti, do‘kon, strayk/himoya va 5 daqiqa intervalini tekshiradi. Brauzerda levelni tugatish, qayta level uchun mukofot yo‘qligi, yozishda jon saqlanishi, testdan yiqilish/kutish/muvaffaqiyat, mobil 390px va desktop 1440px ko‘rinishi ham tekshirildi.
