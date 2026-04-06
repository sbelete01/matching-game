/**
 * data.js
 * All game content lives here. Add/edit characters and level config without
 * touching any game logic.
 */

export const allCharacters = [
  {
    id: 1,
    name: "Almond",
    image: "almond.png",
    fact: "Packed with protein to help your muscles grow!",
    conflictIds: [16, 15], // Steak (protein/muscles), Spaghetti (athlete energy)
  },
  {
    id: 2,
    name: "Kidney Bean",
    image: "bean-V2.png",
    fact: "Great source of iron & fiber!",
  },
  {
    id: 3,
    name: "Blueberry",
    image: "blueberry.png",
    fact: "Boosts brain power & memory!",
  },
  {
    id: 4,
    name: "Cheese",
    image: "cheese.png",
    fact: "Loaded with calcium for strong bones!",
    conflictIds: [12], // Milk (strong bones)
  },
  {
    id: 5,
    name: "Cotton Candy",
    image: "cotton-candy.png",
    fact: "It's 100% sugar, but mostly made of air!",
    conflictIds: [17], // Lollipop (sugary candy)
  },
  {
    id: 6,
    name: "Kale",
    image: "kale.png",
    fact: "More vitamin C than an orange!",
  },
  {
    id: 7,
    name: "Starfruit",
    image: "starfruit.png",
    fact: "Even the waxy skin is totally edible!",
  },
  {
    id: 8,
    name: "Strawberry",
    image: "strawberry.png",
    fact: "The only fruit with its seeds on the outside!",
  },
  {
    id: 9,
    name: "Apple",
    image: "apple-V2.png",
    fact: "7,500+ kinds grow worldwide!",
  },
  {
    id: 10,
    name: "Cauliflower",
    image: "cauliflower.png",
    fact: "Makes a yummy & healthy pizza crust or rice!",
  },
  {
    id: 11,
    name: "Eggplant",
    image: "eggplant.png",
    fact: "Actually a giant berry!",
  },
  {
    id: 12,
    name: "Milk",
    image: "milk.png",
    fact: "Helps build strong bones & teeth!",
    conflictIds: [4], // Cheese (strong bones)
  },
  {
    id: 13,
    name: "Pudding",
    image: "pudding-v2.png",
    fact: "Originally tasted salty and was shaped like a sausage!",
  },
  {
    id: 14,
    name: "Salmon",
    image: "salmon-v2.png",
    fact: "Can leap 6 feet to clear waterfalls!",
  },
  {
    id: 15,
    name: "Spaghetti",
    image: "spaghetti.png",
    fact: "Athletes eat it for pre-race energy!",
    conflictIds: [1, 16], // Almond, Steak (protein/muscle/athlete association)
  },
  {
    id: 16,
    name: "Steak",
    image: "steak.png",
    fact: "Packed with protein for big muscles!",
    conflictIds: [1, 15], // Almond (protein/muscles), Spaghetti (athlete energy)
  },
  {
    id: 17,
    name: "Lollipop",
    image: "sucker.png",
    fact: "Coats teeth in sugar — brush your teeth after eating!",
    conflictIds: [5], // Cotton Candy (sugary candy)
  },
  {
    id: 18,
    name: "Tortilla",
    image: "tortilla.png",
    fact: "Means 'little cake' in Spanish!",
  },
];

/**
 * pairs   — how many unique food pairs appear on the board
 * columns — max grid columns on desktop (responsive overrides apply on mobile)
 */
export const levelsInfo = [
  { pairs: 3, columns: 3 },
  { pairs: 4, columns: 4 },
  { pairs: 6, columns: 4 },
  { pairs: 9, columns: 6 },
  { pairs: 14, columns: 7 },
  { pairs: 18, columns: 6 },
];
