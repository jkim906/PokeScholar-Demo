// These were all handpicked cards from Journey Together (sv9)
// 28 in list
const commonCards: string[] = [
  "sv9-77", // Swinub
  "sv9-93", // Paldean Wooper
  "sv9-91", // Koffing
  "sv9-88", // Toedscool
  "sv9-84", // Rockruff
  "sv9-83", // Pancham
  "sv9-81", // Pupitar
  "sv9-78", // Pilowswine
  "sv9-76", // Cubone
  "sv9-74", // Milcery
  "sv9-72", // Morgrem
  "sv9-71", // Impidimp
  "sv9-70", // Dhelmise
  "sv9-65", // Oricorio
  "sv9-62", // Metang
  "sv9-61", // Beldum
  "sv9-59", // Shuppet
  "sv9-139", // Lechonk
  "sv9-131", // Skwovet
  "sv9-125", // Minccino
  "sv9-119", // Furret
  "sv9-118", // Sentret
  "sv9-20", // Magmar
  "sv9-113", // Shelgon
  "sv9-112", // Bagon
  "sv9-10", // Foongus
  "sv9-22", // Torchic
  "sv9-50", // Togedemaru
];
// These were all handpicked from Journey Together (sv9), Prismatic Evolutions (sv8pt5),
// Surging Sparks (sv8), and Stellar Crown (sv7)
// 30 in list
const uncommonCards: string[] = [
  "sv9-126", // Cinccino
  "sv9-60", // Banette
  "sv9-23", // Combusken
  "sv9-110", // Copperajah
  "sv9-102", // Escavalier
  "sv9-132", // Greedent
  "sv9-90", // Klawf
  "sv9-140", // Oinkologne
  "sv9-89", // Toedscruel
  "sv9-29", // Volcarona
  "sv9-92", // Weezing
  "sv8pt5-2", // Exeggutor
  "sv8pt5-19", // Slowking
  "sv8-134", // Altaria
  "sv8-100", // Annihilape
  "sv8-34", // Armarouge
  "sv8-74", // Azumarill
  "sv8-153", // Braviary
  "sv8-35", // Ceruledge
  "sv8-59", // Magneton
  "sv8-158", // Maushold
  "sv8-17", // Ninetales
  "sv8-7", // Vivillion
  "sv7-42", // Crabominable
  "sv7-86", // Diancie
  "sv7-61", // Drifblim
  "sv7-31", // Lapras
  "sv7-93", // Pangoro
  "sv7-24", // Salazzle
  "sv7-53", // Vikavolt
];

// These were all handpicked from Journey Together (sv9), Prismatic Evolutions (sv9pt5),
// Stellar Crown (sv7), Paldea Evolved (sv2), Shrouded Fable (sv6pt5), Silver Tempest (swsh12)
// 24 in list
const rareCards: string[] = [
  "sv9-3", // Butterfree
  "sv9-21", // Magmortar
  "sv9-18", // Meowscarada
  "sv9-63", // Metagross
  "sv9-95", // Tyranitar
  "sv9-107", // Magearna
  "sv9-128", // Noivern
  "sv8pt5-33", // Espeon
  "sv8pt5-13", // Flareon
  "sv8pt5-25", // Glaceon
  "sv8pt5-29", // Jolteon
  "sv8pt5-5", // Leafeon
  "sv8pt5-40", // Sylveon
  "sv8pt5-59", // Umbreon
  "sv8pt5-22", // Vaporeon
  "sv7-65", // Alcremie
  "sv6pt5-46", // Haxorus
  "sv6pt5-32", // Zoroark
  "sv2-60", // Baxcalibur
  "sv2-140", // Hydreigon
  "sv2-71", // Luxray
  "swsh12-20", // Arcanine
  "swsh12-27", // Delphox
  "swsh12-32", // Incineroar
];

// These were all handpicked from no specific set
// 10 in list
const illustrationRareCards: string[] = [
  "sv3-204", // Houndour
  "sv6pt5-77", // Fraxure
  "sv8-197", // Ceruledge
  "sv2-211", // Raichu
  "sv4-200", // Mienshao
  "sv4-186", // Magby
  "sv4-189", // Mantyke
  "sv5-164", // Grotle
  "sv3pt5-166", // Bulbasaur
  "sv3pt5-181", // Dragonair
];

// These were all handpicked from no specific set
// 8 in list
const doubleRareCards: string[] = [
  "sv9-75", // Alcremie ex
  "sv8pt5-64", // Tyranitar ex
  "sv1-131", // Toxicroak ex
  "sv9-114", // Salamence ex
  "sv2-63", // Pikachu ex
  "sv7-1", // Venusaur ex
  "sv3pt5-6", // Charizard ex
  "sv3pt5-9", // Blastoise ex
];

// These were all handpicked from Prismatic Evolutions (sv8p5)
// 3 in list
const specialIllustrationRareCards: string[] = [
  "sv8pt5-156", // Sylveon ex
  "sv8pt5-144", // Leafeon ex
  "sv8pt5-150", // Glaceon ex
];

export const packEeveeCards: string[] = [
  ...commonCards,
  ...uncommonCards,
  ...rareCards,
  ...illustrationRareCards,
  ...doubleRareCards,
  ...specialIllustrationRareCards,
];
