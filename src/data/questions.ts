// Savollar manbasi: Bogcha-sorovnoma.pdf (savol matnlari) va
// Suhbat-yoriqnomasi.pdf (chuqurlashtiruvchi/probe savollar).
// Savol matnlari o'zgartirilmagan yoki "yaxshilanmagan" — TZ.md 14-bo'lim talabiga ko'ra.

export type QuestionType =
  | "text_short"
  | "text_long"
  | "number"
  | "money"
  | "yes_no"
  | "single_choice"
  | "multi_choice";

export type SeedQuestion = {
  number: number;
  text: string;
  hint?: string;
  type: QuestionType;
  options?: string[];
  allowVoice?: boolean;
  isKey?: boolean;
  probes?: string[];
};

export type SeedBlock = {
  code: string;
  title: string;
  description?: string;
  questions: SeedQuestion[];
};

// Suhbat-yoriqnomasi.pdf — "Universal chuqurlashtiruvchilar"
// Barcha text_long savollarga qo'llaniladi.
const UNIVERSAL_PROBES = [
  "Oxirgi marta qachon shunday bo'ldi?",
  "O'shanda aniq nima qildingiz? Boshidan oxirigacha aytib bering.",
  "Qancha vaqt ketdi? Qancha pulga tushdi?",
  "Buni hal qilish uchun biror narsa sotib olganmisiz yoki kimgadir pul to'laganmisiz?",
  "Hozir buni qanday hal qilyapsiz?",
];

// Suhbat-yoriqnomasi.pdf — "Subsidiya (7-15-savollar)"
const SUBSIDY_PROBES = [
  "Hisobotni topshirish kuni sizda qanday o'tadi? Soat nechada boshlaysiz?",
  "Pul kelmagan oyda tarbiyachilarga maoshni qayerdan topdingiz?",
  "Kim bilan gaplashdingiz, qayerga murojaat qildingiz? Qancha kun ketdi?",
  "Xato sizdanmi yoki tizimdanmi ekanini qanday bildingiz?",
  "Agar bugun tizim yana xato qilsa — buni qachon sezasiz? O'sha kuniyoqmi yoki pul kelmaganda?",
];

// Suhbat-yoriqnomasi.pdf — "Hujjatlar (16-21-savollar)"
const DOCUMENTS_PROBES = [
  "Bitta hujjatni ko'rsata olasizmi? Qanday to'ldirilishini ko'rsating.",
  "Buni kechqurun uydami yoki ish vaqtidami qilasiz?",
  "O'tgan safar tekshiruvga tayyorgarlikka necha kun ketdi?",
  "Bu hujjatlarning qaysi biri eng ko'p vaqt oladi?",
];

// Suhbat-yoriqnomasi.pdf — "Bo'sh o'rin va jalb qilish (27-31-savollar)"
const VACANCY_PROBES = [
  "Bitta bo'sh o'rin sizga oyiga qancha zarar keltiradi?",
  "Oxirgi bola qachon qo'shildi? U qanday topib keldi?",
  "Qo'ng'iroq qilgan ota-onalardan nechtasi haqiqatan bola olib keladi?",
];

export const questionnaire = {
  code: "bogcha-v1",
  title: "Bog'cha faoliyati bo'yicha so'rovnoma",
  description:
    "Uy sharoitidagi nodavlat bog'chalar uchun · taxminan 25-30 daqiqa",
};

export const seedBlocks: SeedBlock[] = [
  {
    code: "A",
    title: "Bog'cha haqida umumiy ma'lumot",
    questions: [
      {
        number: 1,
        text: "Bog'cha qachon ochilgan? (yili, iloji bo'lsa oyi bilan)",
        type: "text_short",
      },
      {
        number: 2,
        text: "Hozir nechta bola qatnaydi? Umuman necha o'ringa joyingiz yetadi?",
        type: "number",
      },
      {
        number: 3,
        text: "Nechta xodim ishlaydi va kim-kim?",
        hint: "masalan: 2 tarbiyachi, 1 oshpaz, 1 farrosh",
        type: "text_short",
      },
      {
        number: 4,
        text: "Bolalarning yoshi qaysi oraliqda va bog'cha necha soatdan necha soatgacha ishlaydi?",
        type: "text_short",
      },
      {
        number: 5,
        text: "Faoliyat qanday rasmiylashtirilgan?",
        hint: "YaTT, MChJ, oilaviy bog'cha ruxsatnomasi yoki boshqa",
        type: "text_short",
      },
      {
        number: 6,
        text: "Bir bola uchun ota-onadan oyiga qancha to'lov olasiz?",
        type: "money",
      },
    ],
  },
  {
    code: "B",
    title: "Davlat subsidiyasi",
    questions: [
      {
        number: 7,
        text: "Davlat bilan davlat-xususiy sheriklik (DXSh) shartnomangiz bormi? Bo'lsa — qachon imzolagansiz?",
        type: "yes_no",
        probes: SUBSIDY_PROBES,
      },
      {
        number: 8,
        text: "Davlatdan subsidiya olasizmi? Olsangiz — oxirgi oyda taxminan qancha summa tushdi?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...SUBSIDY_PROBES],
      },
      {
        number: 9,
        text: "Umumiy daromadingizning taxminan necha foizi subsidiya, necha foizi ota-ona to'lovi?",
        type: "text_short",
        probes: SUBSIDY_PROBES,
      },
      {
        number: 10,
        text: "Har oy davlatga qanday hisobot topshirasiz? Uni kim tayyorlaydi va taxminan qancha vaqt oladi?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...SUBSIDY_PROBES],
      },
      {
        number: 11,
        text: "Subsidiya puli har doim o'z vaqtida keladimi? Kechikkan bo'lsa — qachon bo'lgan va necha kun yoki oy kechikkan?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...SUBSIDY_PROBES],
      },
      {
        number: 12,
        text: "Subsidiya kutilganidan kam kelgan yoki umuman kelmagan holat bo'lganmi? Bo'lgan bo'lsa: qachon, taxminan qancha summa edi, sababi nima bo'ldi va buni qanday hal qildingiz?",
        hint: "Bu men uchun eng muhim savollardan biri — iltimos batafsil yozing",
        type: "text_long",
        isKey: true,
        probes: [
          "Pul kelmagan oyda maoshni qayerdan topdingiz?",
          "Kim bilan gaplashdingiz? Qancha kun ketdi?",
          "Agar bugun tizim yana xato qilsa — buni qachon sezasiz?",
          ...UNIVERSAL_PROBES,
          ...SUBSIDY_PROBES,
        ],
      },
      {
        number: 13,
        text: "Bolalarning kunlik davomatini qanday belgilaysiz? Buni kim qiladi va kuniga taxminan qancha vaqt oladi?",
        hint: "ilovada suratga olib, daftarga yozib yoki boshqa usulda",
        type: "text_long",
        isKey: true,
        probes: [...UNIVERSAL_PROBES, ...SUBSIDY_PROBES],
      },
      {
        number: 14,
        text: "O'sha tizim yoki ilova xato qilgan, ishlamagan yoki internet uzilib qolgan holat bo'lganmi? O'shanda nima qildingiz?",
        type: "text_long",
        isKey: true,
        probes: [...UNIVERSAL_PROBES, ...SUBSIDY_PROBES],
      },
      {
        number: 15,
        text: "Oylik o'rtacha davomat 40% dan pastga tushsa davlat hisobidan maosh to'lanmasligi haqida bilasizmi? Shu chegaraga yaqinlashib qolgan oy bo'lganmi?",
        type: "yes_no",
        probes: SUBSIDY_PROBES,
      },
    ],
  },
  {
    code: "C",
    title: "Hujjatlar va hisobotlar",
    questions: [
      {
        number: 16,
        text: "Majburiy ravishda qanday hujjatlarni yuritasiz?",
        hint: "iloji bo'lsa ro'yxat qilib sanab bering",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...DOCUMENTS_PROBES],
      },
      {
        number: 17,
        text: "Har bir bola uchun alohida individual rivojlanish varaqasi to'ldiriladimi? Kim to'ldiradi va bitta bolaga qancha vaqt ketadi?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...DOCUMENTS_PROBES],
      },
      {
        number: 18,
        text: "Bir oyda taxminan nechta hisobot yoki hujjat to'ldirasiz? Bularga jami haftasiga qancha vaqt ketadi deb o'ylaysiz?",
        type: "text_long",
        isKey: true,
        probes: [
          "Buni kechqurun uydami yoki ish vaqtidami qilasiz?",
          "Qaysi hujjat eng ko'p vaqt oladi?",
          ...UNIVERSAL_PROBES,
          ...DOCUMENTS_PROBES,
        ],
      },
      {
        number: 19,
        text: "Bu hujjatlar qayerda yuritiladi — qo'lda daftardami, Excel'dami yoki biror dasturdami?",
        type: "text_short",
        probes: DOCUMENTS_PROBES,
      },
      {
        number: 20,
        text: "Oxirgi tekshiruv qachon bo'ldi va nimalarni so'rashdi? Hujjat yetishmay qolgan holat bo'lganmi?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...DOCUMENTS_PROBES],
      },
      {
        number: 21,
        text: "Hujjat yoki hisobot sababli jarima, ogohlantirish yoki boshqa muammo bo'lganmi?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...DOCUMENTS_PROBES],
      },
    ],
  },
  {
    code: "D",
    title: "Pul, to'lov va hisob-kitob",
    questions: [
      {
        number: 22,
        text: "Ota-ona to'lovini qanday qabul qilasiz?",
        hint: "naqd, Click, Payme, bank o'tkazmasi",
        type: "text_short",
      },
      {
        number: 23,
        text: "Hozir nechta ota-ona to'lovni kechiktirgan va umumiy qancha qarz yig'ilgan? Ularga qanday eslatasiz?",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 24,
        text: "Oy oxirida qancha foyda qolganini qanday hisoblaysiz? Buni kim qiladi va qancha vaqt oladi?",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 25,
        text: "Eng katta oylik xarajatlaringiz nima?",
        hint: "taxminiy summalari bilan",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 26,
        text: "O'tgan 12 oy ichida eng ko'p pul yo'qotgan holatingiz nima bo'ldi va taxminan qancha edi?",
        type: "text_long",
        isKey: true,
        probes: UNIVERSAL_PROBES,
      },
    ],
  },
  {
    code: "E",
    title: "Bolalar jalb qilish va ketishi",
    questions: [
      {
        number: 27,
        text: "Yangi bolalar asosan qayerdan keladi?",
        hint: "tanish-bilish, qo'shnilar, Instagram, ko'chadagi banner va h.k.",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...VACANCY_PROBES],
      },
      {
        number: 28,
        text: "Hech reklama berganmisiz? Bergan bo'lsangiz — qayerga, qancha sarfladingiz va natija qanday bo'ldi?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...VACANCY_PROBES],
      },
      {
        number: 29,
        text: "Hozir bo'sh o'rin bormi? Nechta va qancha vaqtdan beri bo'sh turibdi?",
        type: "number",
        isKey: true,
        probes: VACANCY_PROBES,
      },
      {
        number: 30,
        text: "O'tgan yil davomida nechta bola ketib qoldi? Asosiy sabablari nima edi?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...VACANCY_PROBES],
      },
      {
        number: 31,
        text: "Ota-ona birinchi marta qo'ng'iroq qilganda odatda nima so'raydi? Ularga javob berishga ulgurmay qolgan holat bo'ladimi?",
        type: "text_long",
        probes: [...UNIVERSAL_PROBES, ...VACANCY_PROBES],
      },
    ],
  },
  {
    code: "F",
    title: "Ota-onalar bilan aloqa",
    questions: [
      {
        number: 32,
        text: "Ota-onalar bilan kunlik aloqa qanday olib boriladi? Bolaning surati yoki videosi yuboriladimi, buni kim qiladi va kuniga qancha vaqt oladi?",
        hint: "Telegram guruh, qo'ng'iroq, shaxsiy yozishma",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 33,
        text: "Ota-onalar eng ko'p nimadan norozi bo'ladi yoki nimani ko'p so'raydi?",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 34,
        text: "Ota-ona bilan jiddiy nizo yoki tushunmovchilik bo'lgan holat bo'lganmi? Sababi nima edi?",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
    ],
  },
  {
    code: "G",
    title: "Xodimlar",
    questions: [
      {
        number: 35,
        text: "Tarbiyachilarga oyiga qancha maosh to'laysiz va maoshni qanday hisoblaysiz?",
        hint: "qat'iy summa, soatbay yoki davomatga qarab",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 36,
        text: "O'tgan yil nechta xodim ishdan ketdi va nega? Yangi tarbiyachi topish qanchalik qiyin?",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 37,
        text: "Xodimlarning o'z ish vaqti va davomatini qanday nazorat qilasiz?",
        type: "text_short",
      },
    ],
  },
  {
    code: "H",
    title: "Hozirgi vositalar",
    questions: [
      {
        number: 38,
        text: "Hozir ishingizda qanday dastur yoki ilovalardan foydalanasiz?",
        hint: "daftar, Excel, Telegram, biror CRM va h.k.",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 39,
        text: "Bog'cha uchun biror dasturni sotib olgan yoki sinab ko'rganmisiz? Bo'lsa — nomi, narxi qancha edi va nega davom ettirdingiz yoki tashlab yubordingiz?",
        type: "text_long",
        isKey: true,
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 40,
        text: "Sizga kimdir shunday dastur taklif qilganmi? Olmagan bo'lsangiz — nega olmadingiz?",
        type: "yes_no",
      },
      {
        number: 41,
        text: "Asosan kompyuterda ishlaysizmi yoki telefonda? Internet uzilishi yoki sekinligi muammo bo'ladimi?",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
    ],
  },
  {
    code: "I",
    title: "Yakuniy savollar",
    questions: [
      {
        number: 42,
        text: "Ish kuningizning eng ko'p vaqtini nima oladi? Qaysi ish sizni eng ko'p charchatadi yoki asabingizni buzadi?",
        type: "text_long",
        isKey: true,
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 43,
        text: "Qaysi ishni pul to'lab bo'lsa ham boshqa birov qilib berishini xohlar edingiz?",
        type: "text_long",
        isKey: true,
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 44,
        text: "Bog'cha ochmoqchi bo'lgan tanishingizga \"buni oldindan bilganimda edi\" deb nimani aytgan bo'lar edingiz?",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
      {
        number: 45,
        text: "Boshqa bog'cha rahbarlari bilan qayerda muloqot qilasiz? Guruh nomini yoki havolasini yozib bera olasizmi?",
        hint: "Telegram guruh, uyushma, tanishlar davrasi",
        type: "text_long",
        probes: UNIVERSAL_PROBES,
      },
    ],
  },
];
