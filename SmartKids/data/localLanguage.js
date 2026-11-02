/* data/localLanguage.js – Local Language content (Marathi + Urdu).
   LL_TOPICS holds the English word + picture once; each language supplies its own words
   in the same order. To add a language later (e.g. Hindi), add one more entry to
   localLanguageData and one SUBJECTS entry in app.js. minAge = youngest age group (0,1,2). */
const LL_TOPICS = [
  { id: "basic",     name: "Basic Words",     icon: "🔤", minAge: 0, en: ["Water", "Book", "House", "Sun", "Moon", "Tree"], pic: ["💧", "📖", "🏠", "☀️", "🌙", "🌳"] },
  { id: "animals",   name: "Animals",         icon: "🐾", minAge: 0, en: ["Cat", "Dog", "Cow", "Lion", "Elephant", "Bird"], pic: ["🐱", "🐶", "🐮", "🦁", "🐘", "🐦"] },
  { id: "fruits",    name: "Fruits",          icon: "🍎", minAge: 0, en: ["Apple", "Banana", "Mango", "Orange", "Grapes", "Watermelon"], pic: ["🍎", "🍌", "🥭", "🍊", "🍇", "🍉"] },
  { id: "colors",    name: "Colors",          icon: "🎨", minAge: 0, en: ["Red", "Blue", "Green", "Yellow", "White", "Black"], pic: ["🔴", "🔵", "🟢", "🟡", "⚪", "⚫"] },
  { id: "numbers",   name: "Numbers",         icon: "🔢", minAge: 0, en: ["One", "Two", "Three", "Four", "Five", "Ten"], pic: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "🔟"] },
  { id: "family",    name: "Family",          icon: "👨‍👩‍👧", minAge: 0, en: ["Mother", "Father", "Brother", "Sister", "Grandfather", "Grandmother"], pic: ["👩", "👨", "👦", "👧", "👴", "👵"] },
  { id: "body",      name: "Body Parts",      icon: "🖐️", minAge: 0, en: ["Eye", "Ear", "Nose", "Hand", "Leg", "Mouth"], pic: ["👁️", "👂", "👃", "✋", "🦵", "👄"] },
  { id: "objects",   name: "Everyday Objects", icon: "🎒", minAge: 0, en: ["Chair", "Bed", "Pen", "School bag", "Door", "Clock"], pic: ["🪑", "🛏️", "🖊️", "🎒", "🚪", "⏰"] },
  { id: "actions",   name: "Common Actions",  icon: "🏃", minAge: 1, en: ["Eat", "Drink", "Sleep", "Run", "Read", "Write"], pic: ["🍽️", "🥤", "😴", "🏃", "📖", "✏️"] },
  { id: "sentences", name: "Simple Sentences", icon: "💬", minAge: 1, en: ["I am a student.", "This is my house.", "I drink water.", "The cat is small.", "I love my mother.", "The sun is hot."], pic: ["🎒", "🏠", "💧", "🐱", "❤️", "☀️"] }
];

const localLanguageData = {
  marathi: {
    languageName: "Marathi", nativeName: "मराठी", htmlLang: "mr", speechCode: "mr-IN", direction: "ltr",
    words: {
      basic: ["पाणी", "पुस्तक", "घर", "सूर्य", "चंद्र", "झाड"],
      animals: ["मांजर", "कुत्रा", "गाय", "सिंह", "हत्ती", "पक्षी"],
      fruits: ["सफरचंद", "केळे", "आंबा", "संत्रे", "द्राक्षे", "कलिंगड"],
      colors: ["लाल", "निळा", "हिरवा", "पिवळा", "पांढरा", "काळा"],
      numbers: ["एक", "दोन", "तीन", "चार", "पाच", "दहा"],
      family: ["आई", "वडील", "भाऊ", "बहीण", "आजोबा", "आजी"],
      body: ["डोळा", "कान", "नाक", "हात", "पाय", "तोंड"],
      objects: ["खुर्ची", "पलंग", "पेन", "दप्तर", "दार", "घड्याळ"],
      actions: ["खाणे", "पिणे", "झोपणे", "धावणे", "वाचणे", "लिहिणे"],
      sentences: ["मी विद्यार्थी आहे.", "हे माझे घर आहे.", "मी पाणी पितो.", "मांजर लहान आहे.", "मला माझी आई आवडते.", "सूर्य गरम आहे."]
    }
  },
  urdu: {
    languageName: "Urdu", nativeName: "اردو", htmlLang: "ur", speechCode: "ur-PK", direction: "rtl",
    words: {
      basic: ["پانی", "کتاب", "گھر", "سورج", "چاند", "درخت"],
      animals: ["بلی", "کتا", "گائے", "شیر", "ہاتھی", "پرندہ"],
      fruits: ["سیب", "کیلا", "آم", "سنگترہ", "انگور", "تربوز"],
      colors: ["لال", "نیلا", "ہرا", "پیلا", "سفید", "کالا"],
      numbers: ["ایک", "دو", "تین", "چار", "پانچ", "دس"],
      family: ["ماں", "والد", "بھائی", "بہن", "دادا", "دادی"],
      body: ["آنکھ", "کان", "ناک", "ہاتھ", "ٹانگ", "منہ"],
      objects: ["کرسی", "بستر", "قلم", "بستہ", "دروازہ", "گھڑی"],
      actions: ["کھانا", "پینا", "سونا", "دوڑنا", "پڑھنا", "لکھنا"],
      sentences: ["میں طالب علم ہوں۔", "یہ میرا گھر ہے۔", "میں پانی پیتا ہوں۔", "بلی چھوٹی ہے۔", "مجھے اپنی ماں سے محبت ہے۔", "سورج گرم ہے۔"]
    }
  }
};
