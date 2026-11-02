/* data/more.js – extra lessons. Adds 12 questions (3 lessons) to every English and GK list in content.js. */
function addLines(list, text) { text.trim().split("\n").forEach(function (l) { list.push(l.trim()); }); }

addLines(SK.english[0], `
Which animal has a long trunk?|Elephant|Cat|Duck|Frog
Which color is grass?|Green|Red|Pink|Black
What letter comes after C?|D|F|Z|A
Which word rhymes with cat?|Hat|Dog|Sun|Pen
Which animal says woof?|Dog|Cat|Cow|Hen
How many letters are in the word CAT?|3|2|4|5
What do we wear on our feet?|Shoes|Hat|Gloves|Scarf
Which one is a color?|Red|Dog|Cup|Run
Which word starts with S?|Sun|Moon|Tree|Fish
Which one is a pet?|Dog|Lion|Tiger|Bear
What is the first letter of Apple?|A|B|C|P
Which one is a body part?|Hand|Chair|Book|Door`);
addLines(SK.english[1], `
What is the plural of mouse?|Mice|Mouses|Mices|Mouse
What is the past tense of go?|Went|Goed|Gone|Going
Which word is a verb?|Jump|Happy|Table|Blue
What is the opposite of open?|Close|Push|Wide|Start
Which word is an adjective?|Tall|Run|Book|Slowly
What is the plural of leaf?|Leaves|Leafs|Leafes|Leaf
Which mark ends a question?|?|.|,|!
Which word is spelled correctly?|Because|Becuase|Becaus|Becose
What is the opposite of day?|Night|Noon|Sun|Light
Which word means the same as small?|Little|Huge|Tall|Heavy
Which sentence starts with a capital letter?|The cat sleeps.|the cat sleeps.|the Cat sleeps.|tHe cat sleeps.
Which word is a pronoun?|She|Run|Apple|Green`);
addLines(SK.english[2], `
Which word is a conjunction?|but|run|blue|happy
What is the plural of city?|Cities|Citys|Cityes|Citis
Which word means the same as happy?|Joyful|Gloomy|Angry|Tired
Which sentence is in the past tense?|She walked home.|She walks home.|She will walk home.|She is walking home.
Which word is a noun?|Honesty|Quickly|Beautiful|Slowly
Which spelling is correct?|Necessary|Neccessary|Necesary|Nessessary
What is the opposite of generous?|Selfish|Kind|Giving|Helpful
Choose the right word: ___ going to the park.|They're|Their|There|Thier
Which is a proper noun?|India|country|river|city
Which figure of speech compares using like or as?|Simile|Metaphor|Noun|Verb
What is the plural of knife?|Knives|Knifes|Knifs|Knife
Which word is a pronoun?|They|Jump|Brave|Table`);

addLines(SK.gk[0], `
Which animal is called the king of the jungle?|Lion|Rabbit|Duck|Cow
What do bees make?|Honey|Milk|Bread|Juice
Which part of the body do we smell with?|Nose|Ears|Eyes|Hands
How many eyes do we have?|2|1|3|4
Which fruit is red and round?|Apple|Banana|Lemon|Coconut
What do plants need to grow?|Water|Toys|Paper|Coins
Which animal has stripes?|Zebra|Elephant|Cow|Goat
Which one is hot?|Fire|Ice|Snow|Rain
Where do fish live?|In water|In a nest|On a tree|In the sky
What do we wear when it rains?|Raincoat|Sweater|Sandals|Cap
Which one is a bird?|Parrot|Bat|Cat|Frog
Which season is the coldest?|Winter|Summer|Spring|Monsoon`);
addLines(SK.gk[1], `
Which is the largest planet?|Jupiter|Earth|Mars|Venus
How many colors are in a rainbow?|7|5|6|8
Which part of a plant takes in water?|Roots|Leaves|Flowers|Fruits
Which is the fastest land animal?|Cheetah|Lion|Horse|Rabbit
What is the capital of Maharashtra?|Mumbai|Delhi|Chennai|Kolkata
Which animal is known as the ship of the desert?|Camel|Horse|Donkey|Goat
How many months are in a year?|12|10|11|13
Which planet is closest to the Sun?|Mercury|Venus|Earth|Mars
What do we call a baby dog?|Puppy|Kitten|Cub|Calf
Which organ do we use to think?|Brain|Heart|Lungs|Stomach
Which festival is called the festival of lights?|Diwali|Holi|Eid|Christmas
What is the national flower of India?|Lotus|Rose|Sunflower|Tulip`);
addLines(SK.gk[2], `
Which gas do plants take in?|Carbon dioxide|Oxygen|Nitrogen|Helium
What is the hardest natural substance?|Diamond|Gold|Iron|Silver
How many bones are in an adult human body?|206|106|306|256
Which planet is famous for its rings?|Saturn|Mars|Earth|Mercury
Which is the largest continent?|Asia|Africa|Europe|Australia
What is the capital of Japan?|Tokyo|Beijing|Seoul|Bangkok
Which vitamin do we get from sunlight?|Vitamin D|Vitamin C|Vitamin A|Vitamin B
Who is known as the Father of the Nation in India?|Mahatma Gandhi|Jawaharlal Nehru|Subhas Chandra Bose|Sardar Patel
At what temperature in °C does water boil?|100|50|90|150
Which is the tallest animal?|Giraffe|Elephant|Camel|Horse
Which ocean lies between Africa and Australia?|Indian Ocean|Atlantic Ocean|Pacific Ocean|Arctic Ocean
Which organ cleans our blood?|Kidneys|Heart|Stomach|Skin`);
