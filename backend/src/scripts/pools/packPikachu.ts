// These were all handpicked from no specific set
// 28 in list
const commonCards: string[] = [
  "sv3pt5-63", // Abra
  "sv3pt5-69", // Bellsprout
  "sv3pt5-1", // Bulbasaur
  "sv3pt5-10", // Caterpie
  "sv3pt5-4", // Charmander
  "sv3pt5-35", // Clefairy
  "sv3pt5-104", // Cubone
  "sv3pt5-50", // Diglett
  "sv3pt5-84", // Doduo
  "sv3pt5-147", // Dratini
  "sv3pt5-133", // Eevee
  "sv3pt5-83", // Farfetch'd
  "sv3pt5-92", // Gastly
  "sv3pt5-74", // Geodude
  "sv3pt5-58", // Growlithe
  "sv3pt5-116", // Horsea
  "sv3pt5-39", // Jigglypuff
  "sv3pt5-14", // Kakuna
  "sv3pt5-109", // Koffing
  "sv3pt5-98", // Krabby
  "sv3pt5-108", // Lickitung
  "sv3pt5-66", // Machop
  "sv3pt5-129", // Magikarp
  "sv3pt5-126", // Magmar
  "sv3pt5-56", // Mankey
  "sv3pt5-52", // Meowth
  "sv3pt5-11", // Metapod
  "sv3pt5-43", // Oddish
];

// These were all handpicked from no specific set
// 30 in list
const uncommonCards: string[] = [
  "sv3-10", // Amoonguss
  "sv3-54", // Beartic
  "sv3-27", // Charmeleon
  "sv3-158", // Dragonair
  "sv3-104", // Dugtrio
  "sv3-69", // Elektross
  "sv3-86", // Espeon
  "sv3-147", // Excadrill
  "sv3-49", // Floatzel
  "sv3-133", // Houndoom
  "sv3-165", // Khangaskan
  "sv3-45", // Lapras
  "sv3-92", // Lunastone
  "sv3-65", // Magnezone
  "sv3-143", // Mawile
  "sv3-29", // Ninetales
  "sv3-106", // Pupitar
  "sv3-84", // Togetic
  "sv3-130", // Umbreon
  "sv3-109", // Whiscash
  "sv3pt5-59", // Arcanine
  "sv3pt5-12", // Butterfree
  "sv3pt5-5", // Charmeleon
  "sv3pt5-91", // Cloyster
  "sv3pt5-75", // Graveler
  "sv3pt5-93", // Haunter
  "sv3pt5-140", // Kabuto
  "sv3pt5-30", // Nidorina
  "sv3pt5-33", // Nidorino
  "sv3pt5-95", // Onix
];

// These were all handpicked from no specific set
// 24 in list
const rareCards: string[] = [
  "swsh11-50", // Cramorant
  "swsh11-34", // Dewgong
  "swsh11-10", // Dustox
  "swsh11-61", // Elektross
  "swsh11-96", // Gliscor
  "swsh11-151", // Greedent
  "swsh11-115", // Honchkrow
  "swsh11-22", // Magcargo
  "swsh11-128", // Magearna
  "swsh11-78", // Malamar
  "swsh11-55", // Manectric
  "swsh11-80", // Mimikyu
  "swsh11-67", // Mr. Mime
  "swsh11-5", // Parasect
  "swsh11-32", // Politoed
  "swsh11-85", // Poliwrath
  "swsh11-142", // Porygon-Z
  "swsh11-53", // Raichu
  "swsh11-63", // Clefable
  "swsh11-73", // Banette
  "swsh9-44", // Eiscue
  "swsh9-85", // Muk
  "swsh9-4", // Breloom
  "swsh9-76", // Flygon
];

// These were all handpicked from no specific set
// 10 in list
const illustrationRareCards: string[] = [
  "sv4-210", // Aegislash
  "sv4-211", // Aipom
  "sv2-209", // Arctibax
  "sv5-170", // Bronzor
  "sv1-203", // Armarouge
  "sv5-183", // Cinccino
  "sv1-210", // Drowzee
  "sv6-188", // Eevee
  "sv1-213", // Fidough
  "sv2-213", // Gothorita
];

// These were all handpicked from no specific set
// 8 in list
const doubleRareCards: string[] = [
  "sv2-61", // Chien-Pao ex
  "sv9-11", // Amoonguss ex
  "sv2-15", // Meowscarada ex
  "sv9-69", // Mimikyu
  "sv5-104", // Gengar ex
  "sv1-86", // Gardevoir ex
  "sv7-41", // Greninja ex
  "sv3-135", // Absol ex
];

// These were all handpicked from no specific set
// 2 in list
const specialIllustrationRareCards: string[] = [
  "sv8-238", // Pikachu ex
  "sv8pt5-167", // Eevee ex
  "sv7-169", // Dachsbun ex
];

export const packPikachuCards: string[] = [
  ...commonCards,
  ...uncommonCards,
  ...rareCards,
  ...illustrationRareCards,
  ...doubleRareCards,
  ...specialIllustrationRareCards,
];
