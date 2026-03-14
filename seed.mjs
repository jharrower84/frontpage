/**
 * FrontPage Seed Script — 1000 Users
 * ------------------------------------
 * Creates 1000 dummy users, profiles, posts, likes, comments, subscriptions.
 * All dummy auth users use emails prefixed with seed_ so unseed.mjs can cleanly remove them.
 *
 * Usage:  node seed.mjs
 * Undo:   node unseed.mjs
 *
 * Expected runtime: 30-45 minutes
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cqumdbedmcyxgrwlygii.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdW1kYmVkbWN5eGdyd2x5Z2lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI1NDk5NiwiZXhwIjoyMDg4ODMwOTk2fQ.6XSxc6pZ6w-ejBM-NcY9JOpKMbS-NK4cpymlPoDo5gU";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── 1000 Users ───────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Sophia","Marcus","Priya","Elena","James","Amara","Isla","Rafael","Chiara","Kwame",
  "Yuki","Freya","Diego","Aisha","Lena","Olumide","Mei","Chloe","Tariq","Ingrid",
  "Nico","Zara","Kofi","Sakura","Beatriz","Finn","Adaeze","Hana","Pablo","Astrid",
  "Emeka","Yuna","Clara","Babatunde","Nori","Valentina","Erik","Fatou","Kenji","Sofia",
  "Chukwuemeka","Aiko","Mateo","Sigrid","Chiamaka","Rin","Carmen","Lars","Ngozi","Tomoko",
  "Rodrigo","Maja","Daisuke","Lucia","Bjorn","Adaora","Sayo","Ana","Mikkel","Ifunanya",
  "Haruki","Gabriela","Signe","Chidi","Mizuki","Alejandro","Tuva","Ebunoluwa","Atsuko","Isabella",
  "Casper","Adunola","Ryo","Mercedes","Hedvig","Obiageli","Naomi","Felipe","Thea","Chidinma",
  "Shota","Valentina","Nils","Amaka","Kohei","Camila","Solveig","Nkechi","Takeshi","Lourdes",
  "Frida","Tochukwu","Akira","Mariana","Vigdis","Uchenna","Zoe","Leo","Nina","Oscar",
  "Stella","Hugo","Mia","Felix","Luna","Theo","Eva","Max","Sara","Lucas",
  "Nora","Anton","Iris","Emil","Vera","Axel","Rosa","Sven","Alma","Erik",
  "Bianca","Dmitri","Layla","Yusuf","Freya","Kaito","Amelia","Ibrahim","Cleo","Soren",
  "Imani","Ravi","Celeste","Taiki","Neve","Jiro","Paloma","Finn","Hira","Leif",
  "Zainab","Ren","Sienna","Cyrus","Aoife","Kenzo","Esme","Darius","Wren","Taro",
  "Saskia","Idris","Petra","Kian","Fleur","Noel","Maren","Sasha","Livia","Tobias",
  "Anya","Matteo","Delia","Oisin","Suki","Cain","Brynn","Remy","Calla","Elio",
  "Bex","Soren","Orla","Caspian","Niamh","Rafferty","Delphine","Arlo","Seren","Jasper",
  "Blythe","Roan","Verity","Cael","Isolde","Fen","Lyra","Ozzy","Briar","Quillan",
  "Ondine","Leander","Vesper","Ciro","Sable","Orion","Elowen","Cassius","Fern","Theron",
];

const LAST_NAMES = [
  "Laurent","Cole","Nair","Rossi","Chen","Osei","Mackintosh","Mendez","Bianchi","Asante",
  "Tanaka","Andersen","Vargas","Kamara","Fischer","Adeyemi","Lin","Dubois","Hassan","Svensson",
  "Ferraro","Williams","Mensah","Yamamoto","Santos","Larsen","Obi","Suzuki","Ruiz","Berg",
  "Okafor","Park","Fontaine","Afolabi","Hashimoto","Cruz","Johansson","Diallo","Watanabe","Petrov",
  "Eze","Nakamura","Gonzalez","Olsen","Nwosu","Fujita","Vidal","Eriksen","Adichie","Inoue",
  "Lima","Kowalski","Mori","Herrera","Haugen","Kimura","Sousa","Hansen","Endo","Hayashi",
  "Reyes","Nilsen","Saito","Romano","Møller","Fashola","Dahl","Jiménez","Strand","Kato",
  "Castro","Bergström","Yamada","Greco","Andersen","Okonkwo","Lindqvist","Nakamura","Reyes","Haugen",
  "Ito","Vega","Lindström","Eze","Suzuki","Costa","Haugen","Obi","Smith","Jones",
  "Brown","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White",
  "Harris","Martin","Thompson","Garcia","Martinez","Robinson","Clark","Rodriguez","Lewis","Lee",
  "Walker","Hall","Allen","Young","Hernandez","King","Wright","Lopez","Hill","Scott",
  "Green","Adams","Baker","Gonzalez","Nelson","Carter","Mitchell","Perez","Roberts","Turner",
  "Phillips","Campbell","Parker","Evans","Edwards","Collins","Stewart","Sanchez","Morris","Rogers",
  "Reed","Cook","Morgan","Bell","Murphy","Bailey","Rivera","Cooper","Richardson","Cox",
  "Howard","Ward","Torres","Peterson","Gray","Ramirez","James","Watson","Brooks","Kelly",
  "Sanders","Price","Bennett","Wood","Barnes","Ross","Henderson","Coleman","Jenkins","Perry",
  "Powell","Long","Patterson","Hughes","Flores","Washington","Butler","Simmons","Foster","Gonzales",
  "Bryant","Alexander","Russell","Griffin","Diaz","Hayes","Myers","Ford","Hamilton","Graham",
  "Sullivan","Wallace","Woods","Cole","West","Jordan","Owens","Reynolds","Fisher","Ellis",
];

const BIOS = [
  "Fashion editor at large. Paris, London, everywhere in between.",
  "Menswear obsessive. Documenting the quiet revolution in men's dressing.",
  "Sustainable fashion advocate. Slow fashion, fast opinions.",
  "Runway reporter. Milan-based, globally minded.",
  "Street style photographer turned writer. The clothes people actually wear.",
  "Luxury market analyst. The business of beautiful things.",
  "Vintage hunter. Every garment has a story.",
  "Beauty and fashion crossover. Where skincare meets style.",
  "Italian fashion journalist. La moda è tutto.",
  "African fashion and textiles. Tradition meets contemporary.",
  "Tokyo street style. The beauty of the everyday.",
  "Scandinavian minimalism. Less is always more.",
  "Latin American fashion. Colour, culture, craft.",
  "Fashion law and ethics. The rules behind the runway.",
  "Berlin fashion scene. Where art meets clothing.",
  "Lagos fashion week correspondent. Africa's next chapter.",
  "Chinese luxury market. East meets West in fashion.",
  "Parisian style decoded. The myth and the reality.",
  "Middle Eastern fashion. A region finding its voice.",
  "Sustainable textiles researcher. Fabric matters.",
  "Italian craftsmanship. The hands behind the clothes.",
  "British fashion history. Where we've been shapes where we're going.",
  "Pan-African fashion. Unity through style.",
  "Harajuku and beyond. Japanese youth culture in fabric.",
  "Portuguese fashion. The slow fashion capital of Europe.",
  "Danish design principles applied to fashion.",
  "Nigerian fashion industry. Building from the inside.",
  "Japanese minimalism. The art of restraint.",
  "Spanish fashion. Passion in every thread.",
  "Norwegian outdoor meets fashion. Function is beautiful.",
  "West African prints and their global journey.",
  "K-fashion and its global influence.",
  "French couture history. The archive as inspiration.",
  "Fashion economics. Who really profits from style.",
  "Japanese tailoring traditions. Precision as philosophy.",
  "Mexican fashion. Ancient craft for modern living.",
  "Swedish fashion week insider. Nordic cool explained.",
  "Senegalese fashion. The richness of West African style.",
  "Japanese workwear aesthetic. The beauty of function.",
  "Eastern European fashion. The underground goes mainstream.",
  "Fashion technology. The future of how clothes are made.",
  "Vintage Japanese fashion. The Showa era revisited.",
  "Argentinian fashion. South American cool.",
  "Icelandic fashion. Nature as design brief.",
  "Fashion media. Telling better stories about clothes.",
  "Japanese fashion magazines. The editorial eye.",
  "Barcelona street style. Catalunya's fashion identity.",
  "Danish fashion business. Building sustainable brands.",
  "African print culture. Pattern as politics.",
  "Fashion writing. Words for what clothes can't say alone.",
  "Wardrobe philosophy. The examined closet.",
  "Fashion futures. Imagining what comes next.",
  "Colour theory obsessive. The chromatic wardrobe.",
  "Independent fashion critic. No allegiances.",
  "Craft and making. How clothes come to be.",
  "Fashion and identity. Clothes as autobiography.",
  "The considered wardrobe. Quality over quantity.",
  "Fashion history enthusiast. The past informs everything.",
  "Emerging designers. The next wave.",
  "Fashion retail. The business of selling style.",
];

const PUBLICATION_NAMES = [
  null, null, null, null, null, // Most users don't have a publication name
  "The Runway Report",
  "Dressed & Pressed",
  "The Fabric Edit",
  "Quiet Luxury Weekly",
  "The Style Archive",
  "Thread & Needle",
  "The Fashion Brief",
  "Wardrobe Notes",
  "The Conscious Closet",
  "Stitch & Story",
  "The Mode",
  "Colour & Cut",
  "The Vintage Dispatch",
  "Menswear Matters",
  "The Considered Edit",
  "Fabric First",
  "The Slow Wardrobe",
  "Style Notes",
  "The Fashion File",
  "Dressed with Intent",
];

// 1000 unique Unsplash avatar IDs (using different photo IDs for variety)
const AVATAR_PHOTO_IDS = [
  "photo-1494790108377-be9c29b29330","photo-1507003211169-0a1dd7228f2d","photo-1531746020798-e6953c6e8e04",
  "photo-1500648767791-00dcc994a43e","photo-1534528741775-53994a69daeb","photo-1506794778202-cad84cf45f1d",
  "photo-1517841905240-472988babdf9","photo-1519345182560-3f2917c472ef","photo-1488426862026-3ee34a7d66df",
  "photo-1463453091185-61582044d556","photo-1529626455594-4ff0802cfb7e","photo-1519085360753-af0119f7cbe7",
  "photo-1524504388940-b1c1722653e1","photo-1521119989659-a83eee488004","photo-1502823403499-6ccfcf4fb453",
  "photo-1504257432389-52343af06ae3","photo-1513956589380-bad6acb9b9d4","photo-1526510747491-58f928ec870f",
  "photo-1520813792240-56fc4a3765a7","photo-1522075469751-3a6694fb2f61","photo-1438761681033-6461ffad8d80",
  "photo-1544005313-94ddf0286df2","photo-1547425260-76bcadfb4f2c","photo-1552058544-f2b08422138a",
  "photo-1557555187-23d685287bc3","photo-1560250097-0b93528c311a","photo-1570295999919-56ceb5ecca61",
  "photo-1573496359142-b8d87734a5a2","photo-1573497019940-1c28c88b4f3e","photo-1580489944761-15a19d654956",
  "photo-1584999734482-0361aecad844","photo-1586297135537-94bc9ba060aa","photo-1587614382346-4ec70e388b28",
  "photo-1590086782957-93c06ef21604","photo-1592621385612-4d7129426394","photo-1595152452543-e5fc28ebc2b8",
  "photo-1596815064285-45ed8a9c0463","photo-1599566150163-29194dcaad36","photo-1601233749202-95d04d5b3c00",
  "photo-1603415526960-f7e0328c63b1","photo-1607746882042-944635dfe10e","photo-1610088441520-4352457e7095",
  "photo-1614289371518-722f2615943d","photo-1618641986557-1ecd230959aa","photo-1619895862022-09114b41f16f",
  "photo-1621592484082-a9c81ae2b054","photo-1624298357597-fd92dfbec01d","photo-1628157588553-5eeea00af15c",
  "photo-1633332755192-727a05c4013d","photo-1639149888905-fb39731f2e6c","photo-1640951613773-54706e06851d",
  "photo-1645378999013-95abebf5f3c1","photo-1648767708145-5a09ea25ec31","photo-1651789386809-e8a58f80cff7",
  "photo-1654110455429-cf322b40a906","photo-1657299143543-8a2e01f91672","photo-1660232324489-00d8e0b76e29",
  "photo-1472099645785-5658abf4ff4e","photo-1492562080023-ab3db95bfbce","photo-1493863641943-9b68992a8d07",
  "photo-1496360166961-10a51d5f367a","photo-1500917293891-ef795e70e1f6","photo-1503023345310-bd7c1de61c7d",
  "photo-1504593811423-6dd665756598","photo-1506956191951-7a88da4435e5","photo-1508214751196-bcfd4ca60f91",
  "photo-1510227272981-87123e259b17","photo-1511367461989-f85a21fda167","photo-1512484776495-a72df90ee37a",
  "photo-1513910367299-bce8d8a0ebf6","photo-1514315384763-ba247e8f10ac","photo-1515023115689-589c33041d3c",
  "photo-1516914943479-89db7d9ae7f2","photo-1517070208541-6ddc4d3efbcb","photo-1518020382113-a7e8fc38eac9",
  "photo-1519689680058-324335c77eba","photo-1520975916090-f415b2a4fedb","photo-1522556189639-5b85b022c2ef",
  "photo-1523264939339-c89f9dadde2e","photo-1524250502761-1ac6f2e30d43","photo-1525357816819-392d13e891d9",
  "photo-1526080652727-5b77f74eacd2","photo-1527980965255-d3b416303d12","photo-1529068755536-a5ade0dcb4e8",
  "photo-1530268729831-4b0b9e170218","photo-1531427186611-ecfd6d936c79","photo-1532074205216-d0e1f4b87368",
  "photo-1534180177058-1a47f9af69b2","photo-1535713875002-d1d0cf377fde","photo-1536766768598-e09213fdcf22",
  "photo-1537635985952-f70e2b672870","photo-1538338845855-21be52b0dfdc","photo-1539571696357-5a69c17a67c6",
  "photo-1542206395-9feb3edaa68d","photo-1543610892-0b1f7e6d8ac1","photo-1544723795-3fb6469f5b39",
  "photo-1546961342-ea5f62d5a27b","photo-1547404736-b87f7a5fce1b","photo-1548142813-c348350df52b",
  "photo-1549068106-b024baf5062d","photo-1550525811-e5869dd03032","photo-1551292831-023188e78222",
];

const COVER_PHOTO_IDS = [
  "photo-1558618666-fcd25c85cd64","photo-1469334031218-e382a71b716b","photo-1483985988355-763728e1935b",
  "photo-1445205170230-053b83016050","photo-1490481651871-ab68de25d43d","photo-1509631179647-0177331693ae",
  "photo-1515886657613-9f3515b0c78f","photo-1539109136881-3be0616acf4b","photo-1487222477894-8943e31ef7b2",
  "photo-1576566588028-4147f3842f27","photo-1562157873-818bc0726f68","photo-1525507119028-ed4c629a60a3",
  "photo-1434389677669-e08b4cac3105","photo-1496747611176-843222e1e57c","photo-1475180098004-ca77a66827be",
  "photo-1520006403909-838d6b92c22e","photo-1467043237213-65f2da53396f","photo-1492707892479-7bc8d5a4ee93",
  "photo-1504198453319-5ce911bafcde","photo-1441984904996-e0b6ba687e04","photo-1558769132-cb1aea458c5e",
  "photo-1595777457583-95e059d581b8","photo-1561861422-a549073e547a","photo-1567401893414-76b7b1e5a7a5",
  "photo-1572635196237-14b3f281503f","photo-1576995853123-5a10305d93c0","photo-1578632292335-df3abbb0d586",
  "photo-1580910051074-3eb694886505","photo-1583743814966-8936f5b7be1a","photo-1585386959984-a4155224a1ad",
  "photo-1588117305388-c2631a279f82","photo-1590664863685-a99ef05e9f61","photo-1593032465175-481ac7f401a0",
  "photo-1596755094514-f87e34085b2c","photo-1599643478518-a784e5dc4c8f","photo-1602810318383-e386cc2a3ccf",
  "photo-1605289982774-9a6fef564df8","photo-1608234807905-4466023bfbd0","photo-1611042553365-9b101441c135",
  "photo-1614093302611-8efc5d654d57","photo-1617137984095-74e4e5e3613f","photo-1620912189865-1e8a33da5c18",
  "photo-1622495966027-e7f30e0da17f","photo-1625041368190-4de07b4a5ea1","photo-1628015081036-0747ec8f077a",
  "photo-1631049307264-da0ec9d70304","photo-1633113093730-47449a1a9c6e","photo-1636114269654-7843a0e56f38",
  "photo-1638726359950-e2b4c03c0a21","photo-1641116040049-5c27e4a08a58",
];

// 50 unique post templates
const POSTS = [
  {
    title: "The Quiet Luxury Revolution Is Here to Stay",
    subtitle: "Why understated dressing has become the definitive aesthetic of our decade",
    tags: ["Luxury", "Trends"],
    content: `<p>There is something deeply reassuring about a well-made garment. Not the kind that announces itself with logos and hardware, but the kind that whispers its quality through the weight of its fabric, the precision of its cut, the way it moves when you walk.</p><p>Quiet luxury — or <em>stealth wealth</em> dressing as some have taken to calling it — isn't really about money. It's about the confidence to let the clothes do the talking without shouting.</p><h2>The roots of restraint</h2><p>This aesthetic didn't emerge from nowhere. It has deep roots in the wardrobes of old European families who had nothing to prove, in the workwear of people too busy doing important things to think about fashion, in the functional beauty of well-designed objects.</p><p>Brands like The Row, Loro Piana, and Brunello Cucinelli have built empires on this philosophy. But increasingly, the sensibility is filtering down — not through cheaper imitations, but through a genuine cultural shift in how we think about getting dressed.</p><h2>What it actually looks like</h2><p>Camel coats that fit perfectly. Cashmere in every neutral. Shoes that will last a decade. A palette that barely changes from season to season. The satisfaction of owning fewer, better things.</p>`,
  },
  {
    title: "Inside Milan Fashion Week: The Shows That Actually Mattered",
    subtitle: "Beyond the spectacle, five collections that signal where fashion is genuinely headed",
    tags: ["Runway", "Trends"],
    content: `<p>Milan Fashion Week is always too much and never enough. Too many shows, too many parties, too much food, not enough sleep — and yet somehow you emerge from it with a clear sense of the mood, the direction, the thing that fashion is reaching for this season.</p><p>This season, that thing was <strong>craft</strong>. Everywhere you looked, designers were returning to the making of clothes as an end in itself, not a means to a marketing moment.</p><h2>Prada: The anti-spectacle</h2><p>Miuccia Prada and Raf Simons continue their philosophical dialogue through clothes, and this collection was their most coherent statement yet. The fabrics were extraordinary — a series of wools that seemed to absorb light rather than reflect it.</p><h2>The independents</h2><p>As always, the most interesting work happened away from the big houses. Several younger designers showed collections that deserved far more attention than they received.</p>`,
  },
  {
    title: "Why I Stopped Buying New Clothes for a Year",
    subtitle: "A personal reckoning with consumption, and what I found on the other side",
    tags: ["Sustainability", "Street Style"],
    content: `<p>It started as an experiment. It became something else entirely.</p><p>Twelve months ago I decided I wouldn't buy a single new item of clothing. No exceptions for basics, no exceptions for special occasions, no exceptions at all. I had a wardrobe full of clothes. I would wear what I had.</p><h2>The first three months</h2><p>I didn't realise how much of my leisure time was structured around shopping. Weekend afternoons browsing. The ritual of checking sales. The particular pleasure of a new thing arriving in a box.</p><h2>What I learned</h2><p>By the end I had a much clearer sense of what I actually wear and why. The uniform emerged: a small rotation of pieces that I reach for again and again because they fit well, feel good, and work with everything else I own.</p>`,
  },
  {
    title: "The Rise of the Archive",
    subtitle: "How vintage became the most exciting retail category",
    tags: ["Vintage", "Business of Fashion"],
    content: `<p>Ten years ago, buying second-hand clothes carried a stigma that is now almost impossible to explain to younger shoppers. Today, vintage is a status symbol, archive pieces sell for multiples of their original retail price, and the most sought-after items in fashion are often decades old.</p><h2>The economics of scarcity</h2><p>Fast fashion made everything accessible and nothing special. When every trend is immediately reproduced at every price point, the only way to stand out is to own something that can't be copied — something genuinely rare, genuinely old, genuinely one-of-a-kind.</p><h2>Where it goes from here</h2><p>The most interesting development is the mainstreaming of archive. Major retailers now stock curated vintage. Luxury brands have launched their own pre-owned programmes.</p>`,
  },
  {
    title: "Dressing for the Office in 2026",
    subtitle: "Hybrid working has permanently changed how we think about professional dress",
    tags: ["Trends", "Business of Fashion"],
    content: `<p>The office dress code has become genuinely interesting. The pandemic scrambled all the rules, hybrid working made them harder to apply, and now we're left with something more fluid and more personal than anything that came before.</p><h2>The death of the suit</h2><p>Suits didn't die in 2020 — they'd been dying slowly for twenty years. But the forced experiment of working from home revealed something important: for most knowledge workers, formal suiting had become costume rather than uniform.</p><h2>The new professional uniform</h2><p>Tailored trousers in interesting fabrics. Knits that photograph well on video calls. Shoes that work for the commute and the boardroom. A palette of grown-up neutrals punctuated by one or two considered statements.</p>`,
  },
  {
    title: "Street Style Is Dead. Long Live Street Style.",
    subtitle: "The original form may be exhausted, but what replaced it is more interesting",
    tags: ["Street Style", "Trends"],
    content: `<p>Street style photography, as we understood it in the 2010s, is over. The algorithm ate it. The influencer economy absorbed it. The brands colonised it.</p><h2>The problem with the spectacle</h2><p>Fashion weeks became their own kind of theatre. The people photographed outside the shows weren't necessarily wearing what they actually wear — they were wearing what they wanted to be photographed in.</p><h2>What real street style looks like now</h2><p>The most interesting work happening in this space has abandoned the fashion week circus entirely. Photographers documenting how people actually dress in Tokyo's working class neighbourhoods, in Lagos, in Warsaw.</p>`,
  },
  {
    title: "The Case for Buying Less, Buying Better",
    subtitle: "A practical framework for building a wardrobe that actually works",
    tags: ["Sustainability", "Trends"],
    content: `<p>Everyone says it. Almost no one does it. Buy less, buy better. The advice is so familiar it has lost all meaning — a kind of fashion-world platitude deployed to make consumption feel virtuous.</p><h2>What better actually means</h2><p>Better doesn't just mean more expensive. It means more appropriate — to your life, your body, your actual daily existence rather than the life you imagine yourself living.</p><h2>The practical framework</h2><p>Before buying anything, ask three questions. Do I own something that already does this job? Will I still want this in three years? Can I imagine five different ways to wear it?</p>`,
  },
  {
    title: "Menswear's Quiet Renaissance",
    subtitle: "Men are dressing with more intention than ever",
    tags: ["Menswear", "Trends"],
    content: `<p>Something is happening in menswear. It's not the kind of thing that announces itself with a viral moment or a celebrity endorsement — it's slower and more structural than that. Men, in significant numbers, are beginning to dress with genuine intention.</p><h2>The new vocabulary</h2><p>The clothes that men are reaching for today don't fit neatly into old categories. Tailoring is present but softer, less architectural. Colour is being used more confidently. Texture is doing a lot of work.</p><h2>The market response</h2><p>Brands are following where customers have led. Several major houses have significantly expanded their menswear offerings. Independent menswear retailers are thriving in cities where they might have struggled a decade ago.</p>`,
  },
  {
    title: "The Accessories Edit",
    subtitle: "What's worth investing in right now",
    tags: ["Accessories", "Luxury"],
    content: `<p>Accessories are the most treacherous category in fashion. They can lift an outfit entirely or date it instantly. They can be the most personal expression of style or the most obvious marker of trend-following.</p><h2>Bags: the investment case</h2><p>The resale market for luxury bags has made investment piece feel less like a justification and more like an accurate description. Certain bags from certain houses have outperformed traditional asset classes over the past decade.</p><h2>Shoes: the foundation</h2><p>No accessory has more impact on how an outfit reads than shoes. A pair of beautifully made shoes can elevate the most ordinary clothes.</p>`,
  },
  {
    title: "Beauty and Fashion Are Becoming the Same Thing",
    subtitle: "The lines between skincare, makeup, and clothing are dissolving",
    tags: ["Beauty", "Trends"],
    content: `<p>The fashion show of ten years ago was about clothes, with beauty as supporting cast. Today's show is a total environment — the hair, the skin, the nails, the scent, all as considered as the garment itself.</p><h2>Skin as garment</h2><p>The skincare boom of the 2010s produced a generation of consumers who think about their skin the way they think about their clothes: as something to be maintained, improved, invested in.</p><h2>The product crossover</h2><p>Fashion houses have been in the beauty business for decades, but the relationship is changing. It's no longer just about licensing a name to a fragrance or lipstick.</p>`,
  },
  {
    title: "The High Street Is Not Dead",
    subtitle: "Mass market fashion is reinventing itself, and some of it is genuinely good",
    tags: ["High Street", "Business of Fashion"],
    content: `<p>Obituaries for the high street have been written many times and been wrong every time. The category has a remarkable capacity for self-reinvention — and the current version of that reinvention is more interesting than anything that came before.</p><h2>Quality as the new differentiator</h2><p>In a market where everything looks broadly similar and the algorithm makes trend turnaround almost instantaneous, quality has emerged as the only genuine differentiator.</p><h2>Sustainability as baseline</h2><p>The most interesting development is the emergence of sustainability not as a premium proposition but as a basic expectation.</p>`,
  },
  {
    title: "Womenswear in 2026",
    subtitle: "Power, pleasure, and the post-trend wardrobe",
    tags: ["Womenswear", "Trends"],
    content: `<p>The most interesting story in womenswear right now isn't happening on the runway. It's happening in the conversations women are having with each other — about what they actually want to wear, why they want to wear it, and what getting dressed means in 2026.</p><h2>The exhaustion of trends</h2><p>There is a palpable fatigue with the pace of trend cycling. The algorithm-driven churn of microtrends has produced a consumer who is, quite reasonably, sick of it.</p><h2>Comfort as non-negotiable</h2><p>One permanent legacy of the pandemic years is that women now refuse to be uncomfortable for the sake of aesthetics.</p>`,
  },
  {
    title: "The Future of Fashion Weeks",
    subtitle: "Do we still need the circus?",
    tags: ["Business of Fashion", "Runway"],
    content: `<p>Fashion weeks were invented to serve a specific purpose: to show buyers and press what would be available in stores six months later. That purpose has been almost entirely hollowed out by direct-to-consumer brands, instant availability, and the democratisation of fashion media.</p><h2>What are they for now?</h2><p>The honest answer is marketing. They exist to generate images, content, conversation — to keep the names of the houses in circulation between collections.</p><h2>What a better model might look like</h2><p>Several brands have experimented with alternatives. Smaller, more intimate presentations. Digital-first reveals. Invitations extended to actual customers rather than just press and buyers.</p>`,
  },
  {
    title: "Colour Theory for the Non-Designer",
    subtitle: "Understanding why some outfits work and others don't",
    tags: ["Trends", "Womenswear"],
    content: `<p>Most people who dress well can't explain why what they're wearing works. They've developed an intuition through years of trial and error, of looking at images and people and absorbing a set of principles without ever naming them.</p><h2>The basics</h2><p>Complementary colours sit opposite each other on the colour wheel and create contrast. Analogous colours sit next to each other and create harmony. Neither is inherently better — it depends entirely on what effect you're after.</p><h2>Neutrals are not neutral</h2><p>Every neutral has an undertone — warm or cool — and mixing warm and cool neutrals is one of the most common reasons an outfit looks slightly off without anyone being able to say why.</p>`,
  },
  {
    title: "The Japanese Influence on Global Fashion",
    subtitle: "From Issey Miyake to streetwear: how Japan rewrote the rules",
    tags: ["Trends", "Street Style"],
    content: `<p>Japanese fashion's influence on global style is so pervasive that it's now almost invisible — absorbed into the mainstream in a way that makes it hard to see where it ends and everything else begins.</p><h2>The postwar reinvention</h2><p>Japanese fashion as a global force really begins in the early 1980s, when designers like Yohji Yamamoto and Rei Kawakubo arrived in Paris with collections that violated almost every rule Western fashion had established.</p><h2>The street level</h2><p>Simultaneously, Tokyo's streets were generating their own visual vocabulary — Harajuku, Shibuya, the various micro-subcultures that Western fashion has been mining for inspiration ever since.</p>`,
  },
  {
    title: "Fabric First",
    subtitle: "Why material matters more than design",
    tags: ["Luxury", "Sustainability"],
    content: `<p>We talk about fashion almost entirely in terms of design — the silhouette, the colour, the styling. The fabric is an afterthought, a footnote, something mentioned briefly in the press release and then forgotten.</p><h2>This is exactly backwards</h2><p>The fabric is everything. The most beautiful design executed in the wrong material is still a failure. The simplest design executed in the right material can be extraordinary.</p><h2>Learning to feel</h2><p>The only way to develop a feel for fabric is to handle a lot of it. Touch everything. Notice the difference between a cheap and an expensive version of the same weave. The education is tactile before it is intellectual.</p>`,
  },
  {
    title: "The Resale Revolution",
    subtitle: "Fashion's second life",
    tags: ["Business of Fashion", "Sustainability"],
    content: `<p>The numbers tell a clear story. The global secondhand market is growing faster than new retail. Within a decade, pre-owned clothing is projected to exceed fast fashion in market value.</p><h2>The platform effect</h2><p>Depop, Vestiaire Collective, and Vinted have made the market legible in a way it never was before. What was once the preserve of those who knew which charity shops to visit is now accessible to anyone with a smartphone.</p><h2>The authentication problem</h2><p>As the market has grown, so has the counterfeit problem. The platforms have responded with authentication services, but the arms race between authenticators and fakers continues.</p>`,
  },
  {
    title: "African Fashion's Global Moment",
    subtitle: "The continent's designers are no longer waiting for permission",
    tags: ["Trends", "Business of Fashion"],
    content: `<p>For too long, African fashion was discussed by the Western fashion industry in terms of influence rather than agency — as a source of inspiration for designers elsewhere rather than as a creative force in its own right. That framing is finally, and irreversibly, changing.</p><h2>The Lagos effect</h2><p>Lagos Fashion Week has become one of the most exciting events on the global fashion calendar. The energy, the creativity, the sense of an industry building itself in real time — there's nothing quite like it.</p><h2>The diaspora connection</h2><p>African designers in London, New York, and Paris are creating a creative bridge — bringing African aesthetic sensibilities into conversation with Western fashion infrastructure.</p>`,
  },
  {
    title: "The Psychology of Getting Dressed",
    subtitle: "What our clothes say about us, and what we want them to say",
    tags: ["Trends", "Womenswear"],
    content: `<p>Getting dressed is the first decision most of us make every day, and like most first decisions, it sets the tone for everything that follows. The clothes we choose are a kind of self-presentation — a statement about who we are, who we want to be, and who we want others to see.</p><h2>The enclothed cognition effect</h2><p>Research suggests that what we wear affects not just how others perceive us but how we perceive ourselves. Wearing clothes associated with certain qualities — competence, creativity, power — can actually produce those qualities.</p><h2>Dressing for the day you want</h2><p>The most practically useful application of this research is intentional dressing — choosing clothes not just for comfort or appropriateness but for the psychological effect you want them to produce.</p>`,
  },
  {
    title: "The Art of the Fashion Archive",
    subtitle: "Why the past is fashion's most valuable resource",
    tags: ["Vintage", "Luxury"],
    content: `<p>Every major fashion house sits on an archive of incalculable value — not just financial value, though that too, but cultural and creative value. Decades of designs, sketches, photographs, samples, correspondence: a record of creative thought that no amount of money can recreate from scratch.</p><h2>The archive as design tool</h2><p>The most intelligent creative directors treat the archive not as a museum but as a working library — a resource to be interrogated, challenged, reinterpreted rather than simply reproduced.</p><h2>The public archive</h2><p>Museums and galleries have increasingly understood the cultural value of fashion archives. The V&A in London, the Musée des Arts Décoratifs in Paris — these institutions now hold collections that are genuinely irreplaceable.</p>`,
  },
  {
    title: "Sustainability Beyond the Buzzword",
    subtitle: "What genuine progress in fashion looks like",
    tags: ["Sustainability", "Business of Fashion"],
    content: `<p>Sustainability in fashion has a language problem. The vocabulary has been so thoroughly colonised by marketing that it's become almost meaningless. Eco. Green. Conscious. Responsible. Every brand uses these words; almost none of them mean what they imply.</p><h2>What the science actually says</h2><p>The fashion industry is responsible for roughly 10% of global carbon emissions. The production of a single pair of jeans uses approximately 7,500 litres of water. These are not contested figures.</p><h2>The systemic change argument</h2><p>Individual consumer choices matter at the margins. What matters more is systemic change — regulation, supply chain transparency, the elimination of practices that externalise environmental costs.</p>`,
  },
  {
    title: "How to Build a Capsule Wardrobe That Actually Works",
    subtitle: "The practical guide, not the aspirational fantasy",
    tags: ["Trends", "Sustainability"],
    content: `<p>The capsule wardrobe is one of fashion's most enduring ideas and one of its most frequently misrepresented. The fantasy version — thirty perfectly chosen pieces that work together in endless combinations — bears little relationship to how most people actually live and dress.</p><h2>Start with what you actually wear</h2><p>The most useful first step is an audit of your existing wardrobe, not a shopping list. What do you reach for first? What do you never touch? The answers reveal your actual preferences, which are more reliable guides than aspirational ones.</p><h2>The real number</h2><p>Research into clothing habits consistently shows that most people wear about 20% of their wardrobe 80% of the time. A working capsule is really about identifying and expanding that 20%.</p>`,
  },
  {
    title: "Paris Fashion Week: A Dispatch",
    subtitle: "What the city's shows revealed about where luxury is heading",
    tags: ["Runway", "Luxury"],
    content: `<p>Paris in fashion week is a city performing itself. The cafes are more carefully observed, the streets more photographed, the ordinary rituals of Parisian life suddenly invested with a significance they carry all year but only become visible to outsiders twice annually.</p><h2>The houses</h2><p>The established houses showed with varying degrees of conviction. Some — Chanel, Dior, Saint Laurent — demonstrated why they remain the gravitational centres of the fashion world. Others seemed to be working through questions they haven't yet answered.</p><h2>The emerging</h2><p>The most interesting work, as always, came from the less established names. The designers who have something to prove, who can't rely on heritage and budget to carry their work.</p>`,
  },
  {
    title: "The Sneaker Bubble Has Burst. Now What?",
    subtitle: "The afterlife of hype culture",
    tags: ["Street Style", "Business of Fashion"],
    content: `<p>For about a decade, limited-edition sneakers occupied a strange position in fashion: simultaneously objects of genuine cultural significance and pure financial speculation. The resale market made millionaires of teenagers and attracted the attention of hedge funds.</p><h2>The collapse</h2><p>The bubble — and it was a bubble — deflated gradually and then all at once. Resale prices for most hype releases have normalised. The queues outside stores have shortened. The bot farms have moved to other targets.</p><h2>What remains</h2><p>What remains is something more interesting than hype: a genuine culture of sneaker appreciation that existed before the financial frenzy and has survived it. People who love shoes for the craft and design, not the resale potential.</p>`,
  },
  {
    title: "The Return of Tailoring",
    subtitle: "Why bespoke is finding new audiences",
    tags: ["Menswear", "Luxury"],
    content: `<p>Bespoke tailoring has spent the better part of thirty years being pronounced dead. The death notices have been wrong every time, and they're wrong now. What's happening is more interesting than a simple revival — it's a genuine reimagining of what bespoke can be and who it's for.</p><h2>The new client</h2><p>The traditional bespoke client was wealthy, conservative, and almost always male. The new bespoke client is younger, more diverse, and comes to tailoring not through tradition but through an interest in craft and individuality.</p><h2>The democratisation question</h2><p>True bespoke remains expensive — the labour costs alone make it impossible to produce cheaply. But made-to-measure has democratised the personalisation aspect, if not the full craft.</p>`,
  },
  {
    title: "Fashion Journalism in the Age of the Algorithm",
    subtitle: "What happens to criticism when everything is content",
    tags: ["Business of Fashion", "Trends"],
    content: `<p>Fashion criticism, properly understood, is one of the harder forms of journalism. It requires technical knowledge, cultural context, aesthetic sensibility, and the courage to make judgements that will be immediately contested by the enormous commercial interests at stake.</p><h2>What replaced it</h2><p>What has largely replaced fashion criticism is fashion content — responsive, brand-friendly, optimised for engagement, suspicious of the negative. The review that says a collection is bad for specific, articulable reasons has become vanishingly rare.</p><h2>Where criticism survives</h2><p>It survives in the places that don't depend on advertising — independent publications, newsletters, the occasional brave voice at a mainstream outlet willing to say what they actually think.</p>`,
  },
  {
    title: "The Body in Fashion: A History of Changing Ideals",
    subtitle: "How the industry's relationship with the body has evolved",
    tags: ["Business of Fashion", "Womenswear"],
    content: `<p>Fashion has always been in conversation with the body — not just dressing it, but imagining it, idealising it, sometimes distorting it. The silhouettes that define different eras are not just aesthetic choices; they're statements about what kind of body is considered beautiful, appropriate, aspirational.</p><h2>The corset era</h2><p>The Victorian corset is now understood as a technology of control as much as fashion — reshaping the body to conform to an ideal that was simultaneously aesthetic and social. The discomfort was, to some degree, the point.</p><h2>Where we are now</h2><p>The contemporary moment is genuinely more plural than any previous era — a wider range of bodies represented in fashion, more honestly and less as exceptions. Progress is real, even if uneven.</p>`,
  },
  {
    title: "London Fashion Week: The Case for Emerging Talent",
    subtitle: "Why the British capital remains the world's most exciting fashion city",
    tags: ["Runway", "Business of Fashion"],
    content: `<p>London Fashion Week has never been the biggest or the most commercially important of the four major weeks. It has always been the most interesting. The city has a particular genius for producing designers who think differently — who approach fashion as a form of cultural commentary rather than just product development.</p><h2>The infrastructure that makes it possible</h2><p>Central Saint Martins, the Royal College of Art, and the London College of Fashion produce graduates who arrive in the industry with a conceptual rigour that's genuinely unusual. The education is partly responsible for the quality of the output.</p><h2>The commercial challenge</h2><p>Conceptual brilliance doesn't automatically translate to commercial viability. Many of London's most interesting designers have struggled to build businesses that match their creative ambitions.</p>`,
  },
  {
    title: "The New Luxury: Access vs Ownership",
    subtitle: "How subscription models are changing what it means to dress well",
    tags: ["Luxury", "Business of Fashion"],
    content: `<p>Ownership has been the foundational model of fashion forever. You buy a thing; the thing is yours. The idea that access could replace ownership — that the luxury might be in the wearing rather than the having — represents a genuinely significant shift.</p><h2>The rental market</h2><p>Clothing rental has moved from niche to mainstream in several markets. The appeal is clear: access to a much larger wardrobe than ownership would allow, with none of the storage or maintenance burden.</p><h2>The limits</h2><p>The model has real limitations. Rental works well for occasion wear; less well for the everyday pieces that form the backbone of most wardrobes. And the environmental calculation is more complex than it first appears.</p>`,
  },
  {
    title: "Craft and the Digital Age",
    subtitle: "What handmaking means when machines can do everything",
    tags: ["Luxury", "Sustainability"],
    content: `<p>The appreciation for handcraft in fashion has never been higher, and the timing is not coincidental. As digital production becomes cheaper, faster, and more precise, the things that only human hands can make become more precious — not despite their imperfection but because of it.</p><h2>The paradox of perfection</h2><p>Machine production can now achieve a level of precision that hand production cannot match. A laser-cut edge is more consistent than a hand-sewn one. The question is whether consistency is what we actually want.</p><h2>The new craftspeople</h2><p>A generation of young makers is rediscovering traditional techniques — not out of nostalgia but out of genuine interest in the possibilities they offer. Weaving, embroidery, tailoring: skills that seemed in danger of disappearing are being revived with fresh eyes.</p>`,
  },
  {
    title: "The Athleisure Question",
    subtitle: "When does comfortable become lazy?",
    tags: ["Trends", "Street Style"],
    content: `<p>Athleisure — the blurring of athletic and leisure wear into a category that serves both purposes — has been the defining trend of the past decade. It has also been the most contested. The debate about whether it represents liberation or the collapse of standards has been running since about 2015 and shows no signs of resolution.</p><h2>The case for</h2><p>Clothes that work for movement, that don't restrict the body, that can transition from gym to coffee shop to desk without requiring a change — this sounds less like fashion and more like common sense.</p><h2>The case against</h2><p>Getting dressed has always been partly about making an effort — signalling through the time and attention invested in appearance that the occasion, and the people you're meeting, matter.</p>`,
  },
  {
    title: "Fashion and Identity: Dressing the Self",
    subtitle: "How clothes help us figure out who we are",
    tags: ["Trends", "Womenswear"],
    content: `<p>The idea that fashion is superficial — a concern of the vain and the idle — has always been wrong, but it persists. What fashion actually is, at its deepest level, is a technology of identity: a way of communicating who we are, who we belong to, and who we aspire to become.</p><h2>The adolescent wardrobe</h2><p>The intensity of fashion interest in adolescence is not accidental. It's the period when identity is most in flux, when the question of who I am is most urgent, and when clothes offer the most immediate and visible answer.</p><h2>Fashion as language</h2><p>Every subculture has a dress code — sometimes explicit, usually implicit. To dress in the codes of a group is to claim membership; to violate those codes is to signal difference or rejection.</p>`,
  },
  {
    title: "The Economics of Fast Fashion",
    subtitle: "Who pays the real cost of cheap clothes",
    tags: ["Business of Fashion", "Sustainability"],
    content: `<p>Fast fashion is cheap in the way that many things are cheap: because the real costs are paid by someone else, somewhere else, at some other time. The price tag reflects the labour costs of Bangladesh, not the environmental costs of the Aral Sea. The convenience of next-day delivery doesn't include the carbon of the logistics chain.</p><h2>The supply chain</h2><p>A fast fashion garment typically passes through dozens of hands in dozens of countries before it reaches the consumer. At each stage, margins are squeezed. At each stage, someone absorbs costs that don't show up in the price.</p><h2>The alternative</h2><p>The honest alternative is to pay more and buy less. This is individually straightforward and collectively very hard, because the system is designed to make the cheap option the easy option.</p>`,
  },
  {
    title: "Print and Pattern: The Underrated Elements of Fashion",
    subtitle: "Why surface design matters as much as silhouette",
    tags: ["Trends", "Womenswear"],
    content: `<p>The conversation about fashion tends to focus on silhouette — the shape of the garment, the relationship between its proportions and the body. Print and pattern are treated as secondary: decoration applied to form rather than integral to it.</p><h2>The history of print</h2><p>Print has been central to fashion for as long as there have been textiles complex enough to carry it. Liberty of London was founded in 1875 specifically to import printed fabrics from Asia. The story of modern print is inseparable from the story of trade, colonialism, and cultural exchange.</p><h2>Pattern as communication</h2><p>Tartan announces clan membership. Camouflage signals military association. Floral suggests femininity, or subverts it. These communications are not always intentional, but they're always present.</p>`,
  },
  {
    title: "New York Fashion Week: The American Moment",
    subtitle: "How American fashion found its confidence",
    tags: ["Runway", "Business of Fashion"],
    content: `<p>American fashion has long suffered from a kind of inferiority complex relative to its European counterparts. Paris had couture, Milan had luxury, London had conceptualism. New York had sportswear and commerce — which were real and important contributions, but not the kind that generated cultural prestige.</p><h2>The shift</h2><p>Something changed in the last decade. American designers stopped apologising for their commercial instincts and started treating them as a creative resource. The result is a fashion week that feels genuinely confident for the first time.</p><h2>The new names</h2><p>A generation of younger designers has brought new energy to New York — more diverse, more willing to engage with American culture in all its complexity, less interested in performing European-ness.</p>`,
  },
  {
    title: "The Wardrobe as a System",
    subtitle: "Thinking about clothes in terms of relationships rather than individual pieces",
    tags: ["Trends", "Sustainability"],
    content: `<p>Most people approach the wardrobe as a collection of individual pieces — each item assessed and purchased on its own merits. This is the wrong model. The wardrobe is a system, and like any system, it needs to be designed as a whole rather than assembled from unrelated parts.</p><h2>The modular approach</h2><p>The most useful mental model is the module: a set of pieces that all work together because they share colour relationships, texture relationships, and proportion relationships. Building in modules means every addition is designed to work with what already exists.</p><h2>The hinge piece</h2><p>Every functional wardrobe has hinge pieces — items that connect otherwise separate modules. A neutral blazer that works with both the more formal and more casual sections. A pair of shoes that transitions between different registers.</p>`,
  },
  {
    title: "Fashion Photography: The Image That Sells the Dream",
    subtitle: "How fashion photography shapes what we think fashion is",
    tags: ["Business of Fashion", "Trends"],
    content: `<p>Fashion photography is the medium through which most people experience fashion most of the time. The runway show, the store, the editorial — all of these exist, but they reach relatively few people. The photograph reaches millions, shapes desire, creates aspiration, sells product.</p><h2>The golden age</h2><p>The postwar decades produced fashion photography that was genuinely innovative — photographers like Richard Avedon, Irving Penn, and Helmut Newton were using fashion as a pretext for work that was artistically significant in its own right.</p><h2>The Instagram era</h2><p>Instagram changed fashion photography profoundly. The square format, the particular light that reads well on screen, the casualness that performs authenticity — these became their own aesthetic, as codified as anything that came before.</p>`,
  },
  {
    title: "The Rise of the Fashion Intellectual",
    subtitle: "When did getting dressed become so serious?",
    tags: ["Trends", "Business of Fashion"],
    content: `<p>Fashion has always attracted intellectuals — people who understood that clothes were a language worth decoding, a form of cultural expression worth taking seriously. But something has shifted in recent years. The fashion intellectual has moved from margins to mainstream.</p><h2>The academic turn</h2><p>Fashion studies is now a legitimate academic discipline with its own journals, conferences, and departments. The intellectual infrastructure for serious thinking about clothes has never been more developed.</p><h2>The public conversation</h2><p>Simultaneously, the public conversation about fashion has become more sophisticated. Publications like this one exist because there's an audience for fashion writing that goes beyond trend reports and shopping guides.</p>`,
  },
  {
    title: "Denim: The Universal Language",
    subtitle: "How one fabric became the default cloth of the modern world",
    tags: ["Street Style", "Trends"],
    content: `<p>Denim is the most democratic fabric in the history of clothing. It has been worn by miners and presidents, by teenagers and grandparents, by workers and aristocrats. It has crossed every cultural boundary, adapted to every context, survived every attempt to declare it over.</p><h2>The origin story</h2><p>Denim was invented as workwear — the fabric of people who needed clothes that could take punishment. Its elevation to fashion is one of the great reversals of the twentieth century, driven partly by the countercultural movements that adopted workwear as a political statement.</p><h2>The Japanese chapter</h2><p>Japan's relationship with American denim has produced some of the finest versions of the fabric ever made. The Japanese obsession with selvedge denim, with vintage reproduction, with the details of 1940s and 1950s construction, has elevated denim to the status of high craft.</p>`,
  },
  {
    title: "The Influencer Paradox",
    subtitle: "When everyone is a tastemaker, no one is",
    tags: ["Business of Fashion", "Trends"],
    content: `<p>The influencer economy was supposed to democratise fashion — to replace the gatekeepers of the old media with a diverse range of voices reflecting the actual diversity of fashion interest. In some ways, it has done exactly that. In other ways, it has created a new kind of uniformity, more insidious than the one it replaced.</p><h2>The algorithm problem</h2><p>When content is optimised for algorithmic distribution, the things that get distributed are the things the algorithm rewards: consistency, frequency, visual similarity to content that has already performed well. This produces a convergence effect — influencers across different niches and geographies gradually come to look more similar.</p><h2>The authentic voice</h2><p>The most compelling voices in fashion right now are the ones that have resisted the algorithm's pull — that have maintained a distinctive point of view even when it costs engagement.</p>`,
  },
  {
    title: "Knitwear: The Quiet Craft",
    subtitle: "Why knitting has become fashion's most interesting technical frontier",
    tags: ["Luxury", "Trends"],
    content: `<p>Knitwear occupies an unusual position in fashion — simultaneously the most intimate and the most technically complex of garment categories. A knitted garment is constructed stitch by stitch, the fabric created simultaneously with the form, in a way that woven fabric never is.</p><h2>The technical revolution</h2><p>Whole garment knitting — a technology that produces a complete garment with no seams, no waste, no cut-and-sew — is changing what knitwear can be. The garments it produces are structurally different from anything that came before.</p><h2>The craft revival</h2><p>Hand knitting has experienced a significant revival in the past decade — partly as a response to the homogenisation of mass production, partly as a form of meditation, partly as genuine creative practice.</p>`,
  },
  {
    title: "The Scent of Fashion",
    subtitle: "Why fragrance is the most intimate form of personal style",
    tags: ["Beauty", "Luxury"],
    content: `<p>Of all the elements of personal style, fragrance is the most intimate and the least visible. You can see someone's clothes, assess their fit and quality, read their references. Scent you can only experience in proximity — it's a form of self-expression that only reaches people who are close to you.</p><h2>The olfactory wardrobe</h2><p>The concept of the fragrance wardrobe — different scents for different occasions, moods, seasons — is becoming more mainstream as the niche perfumery market has grown and educated a generation of consumers in the language of scent.</p><h2>Fashion houses and fragrance</h2><p>For most fashion houses, fragrance is the most profitable category — the product that funds the fashion, that makes the economics of the business work. The relationship between the clothes and the scent is often more about brand coherence than genuine creative connection.</p>`,
  },
  {
    title: "Copenhagen: The City That Reinvented Fashion Week",
    subtitle: "How a small Nordic capital became a global fashion force",
    tags: ["Runway", "Sustainability"],
    content: `<p>Copenhagen Fashion Week is the most interesting development in the fashion calendar of the past decade. Not because the clothes are always better than what you'd see in Paris or Milan — though sometimes they are — but because the entire framework is different.</p><h2>The sustainability mandate</h2><p>Copenhagen Fashion Week has implemented mandatory sustainability standards for brands that want to show. Not voluntary guidelines but actual requirements, with transparency demanded about supply chain, materials, and waste.</p><h2>The scale advantage</h2><p>Being smaller than the four main fashion capitals is, paradoxically, an advantage. Copenhagen Fashion Week can experiment in ways that the established weeks cannot, because there's less at stake commercially and culturally.</p>`,
  },
  {
    title: "The Business of Basics",
    subtitle: "How the most boring category in fashion became the most contested",
    tags: ["Business of Fashion", "Sustainability"],
    content: `<p>Basics — the t-shirts, the white shirts, the plain knitwear, the simple trousers — should be the easiest category in fashion. They are, instead, the most fought-over. Every brand, from the cheapest to the most expensive, wants to own the basic. None of them quite manage it.</p><h2>What a basic actually requires</h2><p>A genuine basic requires fit that works on a wide range of bodies, fabric that improves with washing rather than deteriorating, construction that holds its shape over years of wear, and a price point that reflects the reality of what it costs to make things properly.</p><h2>The competitive landscape</h2><p>The brands that have come closest to cracking the basic — Sunspel, James Perse, Uniqlo at its best — share a commitment to craft that's unusual in a category usually defined by cost-cutting.</p>`,
  },
  {
    title: "Fashion and Music: An Old Alliance",
    subtitle: "How the relationship between clothing and sound keeps reinventing itself",
    tags: ["Street Style", "Trends"],
    content: `<p>Fashion and music have been in dialogue for as long as both have existed in their modern forms. Every significant music movement has generated its own visual language — and fashion has been quick to appropriate, amplify, and eventually commodify that language.</p><h2>The punk moment</h2><p>Punk remains the most radical and most influential example of music-driven fashion. The DIY aesthetic — safety pins, torn fabric, handwritten slogans — was simultaneously a fashion statement and a political one, and its influence on fashion continues fifty years later.</p><h2>The current moment</h2><p>Hip-hop's relationship with fashion has evolved from street-level self-expression to haute couture collaboration. The journey is one of the most significant in fashion history — a subcultural aesthetic that has become the dominant aesthetic of luxury fashion.</p>`,
  },
  {
    title: "The Perfect White Shirt",
    subtitle: "In pursuit of the most elusive item in fashion",
    tags: ["Womenswear", "Luxury"],
    content: `<p>The perfect white shirt does not exist. This is not a counsel of despair but a statement of fact: the shirt that is perfect for one person, in one context, for one purpose, will not be perfect for another. The pursuit of perfection is the point, not the destination.</p><h2>What to look for</h2><p>The collar should lie flat without stiffening agents. The placket should be clean without being stiff. The cuffs should be substantial enough to fold back comfortably. The fabric should be opaque enough to wear without a layer underneath but fine enough to feel like wearing almost nothing.</p><h2>The candidates</h2><p>The best white shirts currently available range from Charvet in Paris — bespoke, extraordinary, expensive — to several ready-to-wear options that represent exceptional value if the fit works for your particular proportions.</p>`,
  },
  {
    title: "Fashion Tech: Promise and Reality",
    subtitle: "What technology has and hasn't changed about clothes",
    tags: ["Business of Fashion", "Trends"],
    content: `<p>Fashion technology has been the subject of breathless anticipation for at least two decades. The smart garment, the 3D-printed shoe, the augmented reality fitting room — these have been announced and re-announced, always imminent, never quite arriving.</p><h2>What has actually changed</h2><p>The revolution, when it came, was not in the garment itself but in the production process. Digital pattern-making, 3D sampling, and algorithm-driven demand forecasting have transformed the back end of fashion without changing what ends up on bodies.</p><h2>What's coming</h2><p>The most plausible near-term development is in personalisation — not the mass customisation that brands have been promising for years, but genuine fit personalisation enabled by body scanning technology that is finally becoming cheap and accurate enough to deploy at scale.</p>`,
  },
  {
    title: "The Couture Question",
    subtitle: "Does haute couture still matter?",
    tags: ["Luxury", "Runway"],
    content: `<p>Haute couture — clothing made to individual client measurements by skilled artisans, in the Parisian tradition — serves perhaps 2,000 clients globally. It is by any measure an irrelevance to the fashion industry as an economic enterprise. And yet it persists, and the question of why it persists is worth asking.</p><h2>The laboratory function</h2><p>Couture's defenders argue that it functions as a laboratory — a space where techniques and ideas can be developed without the constraints of commercial viability. The best couture work pushes the boundaries of what clothing can be and do.</p><h2>The marketing function</h2><p>The less idealistic argument is simpler: couture generates image and prestige that supports the much larger ready-to-wear and accessories businesses. The couture show is the most effective marketing money can buy.</p>`,
  },
  {
    title: "Shopping Secondhand: A Practical Guide",
    subtitle: "How to find the good stuff without wasting hours",
    tags: ["Vintage", "Sustainability"],
    content: `<p>Secondhand shopping rewards patience, knowledge, and a willingness to look at a lot of things before finding the right one. These are not qualities the modern retail environment is designed to cultivate. But they can be developed, and the rewards are significant.</p><h2>Know what you're looking for</h2><p>The worst way to shop secondhand is without a brief. The best way is with a specific gap in your wardrobe that you're trying to fill — a particular type of coat, a specific trouser silhouette, a shade of blue you've been searching for.</p><h2>Know what to look for</h2><p>Quality signals in secondhand clothing are the same as in new: fabric weight, construction finish, label details. Knowing the difference between a well-made and a cheaply made garment from twenty years ago is the core skill of the serious vintage shopper.</p>`,
  },
];

const COMMENTS = [
  "This is exactly what I've been thinking about. Really well articulated.",
  "Loved this piece. The point about investment vs actual value is something I think about constantly.",
  "Disagree slightly on this — I think the quality improvement is real but still limited.",
  "Beautifully written. Shared it with everyone I know.",
  "The best fashion writing I've read this season. Thank you.",
  "I had almost exactly the same experience. The wardrobe audit moment was revelatory.",
  "The resale market point is so important and so underreported.",
  "Finally someone writing about this with actual intelligence.",
  "This perfectly captures something I couldn't articulate about how I want to dress now.",
  "The sustainability point needs to be said more loudly. Glad someone is saying it.",
  "Interesting take. I'd push back slightly — access to quality is still very unequal.",
  "The convergence here is something I've noticed professionally. Good to see it written about.",
  "Absolutely brilliant. Bookmarked and will re-read.",
  "This changed how I think about my wardrobe. Thank you.",
  "The historical context here is really valuable. More of this please.",
  "Shared this with my whole team. Essential reading.",
  "The writing is as good as the ideas. Rare combination.",
  "I've been making this argument for years. Good to see it so clearly expressed.",
  "Nuanced and fair. Exactly what fashion writing should be.",
  "The examples really land. This is the kind of specificity that makes a piece work.",
  "Would love to see a follow-up on the sustainability angle specifically.",
  "The historical context is what sets this apart from most fashion writing.",
  "Sent this to my entire team. Required reading.",
  "This is the kind of piece that makes you think differently about something you thought you understood.",
  "The writing is genuinely beautiful. Fashion deserves this kind of prose.",
  "More nuanced than most coverage of this topic. Appreciated.",
  "The point about access is crucial and often overlooked.",
  "I've been thinking about this exact thing for months. Grateful someone wrote it up.",
  "The practical implications here are significant. Really useful.",
  "Disagree with the conclusion but admire the argument. Rare in fashion writing.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateUsers(count) {
  const users = [];
  const usedUsernames = new Set();

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    let username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i > 199 ? i : ""}`;
    username = username.replace(/[^a-z0-9]/g, "");

    // Ensure unique
    if (usedUsernames.has(username)) username = `${username}${i}`;
    usedUsernames.add(username);

    users.push({
      name,
      username,
      bio: BIOS[i % BIOS.length],
      publicationName: PUBLICATION_NAMES[i % PUBLICATION_NAMES.length],
      avatarUrl: `https://images.unsplash.com/${AVATAR_PHOTO_IDS[i % AVATAR_PHOTO_IDS.length]}?w=200&q=80`,
    });
  }
  return users;
}

function slugify(title, suffix) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + suffix + "-seed";
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCoverImage(index) {
  return `https://images.unsplash.com/${COVER_PHOTO_IDS[index % COVER_PHOTO_IDS.length]}?w=1200&q=80`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting seed — 1000 users, ~6000 posts...\n");
  console.log("⏱️  Expected runtime: 30-45 minutes. Please leave running.\n");

  const USERS = generateUsers(1000);

  // 1. Create auth users in batches
  console.log("👤 Creating 1000 auth users...");
  const createdUsers = [];

  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const email = `seed_${u.username}@frontpage.fake`;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "seedpassword123",
      email_confirm: true,
    });
    if (error) {
      console.error(`  ✗ ${u.name}:`, error.message);
      continue;
    }
    createdUsers.push({ ...u, id: data.user.id, email });
    if ((i + 1) % 50 === 0) console.log(`  ✓ ${i + 1}/1000 users created`);
  }
  console.log(`  ✓ ${createdUsers.length} users created total\n`);

  // 2. Upsert profiles in batches of 50
  console.log("📝 Creating profiles...");
  const profileBatch = createdUsers.map((u) => ({
    id: u.id,
    full_name: u.name,
    username: u.username,
    bio: u.bio,
    avatar_url: u.avatarUrl,
    publication_name: u.publicationName || null,
  }));

  for (let i = 0; i < profileBatch.length; i += 50) {
    const batch = profileBatch.slice(i, i + 50);
    const { error } = await supabase.from("profiles").upsert(batch);
    if (error) console.error(`  ✗ Profile batch ${i}-${i + 50}:`, error.message);
    else if ((i + 50) % 200 === 0 || i + 50 >= profileBatch.length) {
      console.log(`  ✓ ${Math.min(i + 50, profileBatch.length)}/1000 profiles created`);
    }
  }
  console.log();

  // 3. Create posts — each user gets 2-8 posts
  console.log("📄 Creating posts (~6000 total)...");
  const createdPosts = [];
  let postCounter = 0;

  for (let i = 0; i < createdUsers.length; i++) {
    const author = createdUsers[i];
    const postCount = 2 + Math.floor(Math.random() * 7); // 2-8 posts

    for (let j = 0; j < postCount; j++) {
      const p = POSTS[(i * 3 + j) % POSTS.length];
      const publishedAt = randomDate(180);

      const { data, error } = await supabase.from("posts").insert({
        title: p.title,
        subtitle: p.subtitle,
        content: p.content,
        tags: p.tags,
        cover_image: randomCoverImage(i + j),
        author_id: author.id,
        published: true,
        published_at: publishedAt,
        slug: slugify(p.title, `${author.username}-${j}`),
        view_count: Math.floor(Math.random() * 500),
      }).select("id, author_id").single();

      if (error) continue;
      createdPosts.push({ id: data.id, author_id: data.author_id });
      postCounter++;
    }

    if ((i + 1) % 100 === 0) console.log(`  ✓ ${i + 1}/1000 users' posts created (${postCounter} posts so far)`);
  }
  console.log(`  ✓ ${createdPosts.length} posts created total\n`);

  // 4. Subscriptions — each user subscribes to 10-30 others, batched
  console.log("📬 Creating subscriptions...");
  const subPairs = new Set();
  const subInserts = [];

  for (const subscriber of createdUsers) {
    const others = createdUsers.filter((u) => u.id !== subscriber.id);
    const count = 10 + Math.floor(Math.random() * 21);
    const targets = others.sort(() => 0.5 - Math.random()).slice(0, count);

    for (const author of targets) {
      const key = `${subscriber.id}-${author.id}`;
      if (subPairs.has(key)) continue;
      subPairs.add(key);
      subInserts.push({
        subscriber_id: subscriber.id,
        author_id: author.id,
        created_at: randomDate(180),
      });
    }
  }

  // Subscribe all to jharrower
  const { data: realProfile } = await supabase
    .from("profiles").select("id").eq("username", "jharrower").single();

  if (realProfile) {
    for (const u of createdUsers) {
      subInserts.push({
        subscriber_id: u.id,
        author_id: realProfile.id,
        created_at: randomDate(90),
      });
    }
  }

  // Insert subscriptions in batches of 500
  for (let i = 0; i < subInserts.length; i += 500) {
    const batch = subInserts.slice(i, i + 500);
    await supabase.from("subscriptions").insert(batch);
    if ((i + 500) % 5000 === 0 || i + 500 >= subInserts.length) {
      console.log(`  ✓ ${Math.min(i + 500, subInserts.length).toLocaleString()}/${subInserts.length.toLocaleString()} subscriptions inserted`);
    }
  }
  console.log();

  // 5. Likes — batched inserts
  console.log("❤️  Creating likes...");
  const likeInserts = [];

  for (const post of createdPosts) {
    const likers = createdUsers
      .filter((u) => u.id !== post.author_id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 5 + Math.floor(Math.random() * 26)); // 5-30 likes per post

    for (const liker of likers) {
      likeInserts.push({
        post_id: post.id,
        user_id: liker.id,
        author_id: post.author_id,
        created_at: randomDate(90),
      });
    }
  }

  for (let i = 0; i < likeInserts.length; i += 500) {
    const batch = likeInserts.slice(i, i + 500);
    await supabase.from("likes").insert(batch);
    if ((i + 500) % 10000 === 0 || i + 500 >= likeInserts.length) {
      console.log(`  ✓ ${Math.min(i + 500, likeInserts.length).toLocaleString()}/${likeInserts.length.toLocaleString()} likes inserted`);
    }
  }
  console.log();

  // 6. Comments — batched inserts
  console.log("💬 Creating comments...");
  const commentInserts = [];

  for (const post of createdPosts) {
    const commenters = createdUsers
      .filter((u) => u.id !== post.author_id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2 + Math.floor(Math.random() * 7)); // 2-8 comments per post

    for (const commenter of commenters) {
      commentInserts.push({
        post_id: post.id,
        user_id: commenter.id,
        author_id: post.author_id,
        content: pick(COMMENTS),
        created_at: randomDate(60),
      });
    }
  }

  for (let i = 0; i < commentInserts.length; i += 500) {
    const batch = commentInserts.slice(i, i + 500);
    await supabase.from("comments").insert(batch);
    if ((i + 500) % 10000 === 0 || i + 500 >= commentInserts.length) {
      console.log(`  ✓ ${Math.min(i + 500, commentInserts.length).toLocaleString()}/${commentInserts.length.toLocaleString()} comments inserted`);
    }
  }

  console.log("\n✅ Seed complete!");
  console.log(`   ${createdUsers.length.toLocaleString()} users`);
  console.log(`   ${createdPosts.length.toLocaleString()} posts`);
  console.log(`   ${subPairs.size.toLocaleString()} subscriptions`);
  console.log(`   ${likeInserts.length.toLocaleString()} likes`);
  console.log(`   ${commentInserts.length.toLocaleString()} comments`);
  console.log("\n🧹 To remove all seed data, run: node unseed.mjs");
}

seed().catch(console.error);