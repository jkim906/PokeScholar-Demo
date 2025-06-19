export interface Card {
  _id: string;
  name: string;
  rarity: string;
  types: string[];
  small: string;  // Direct image URL
  large: string;  // Direct image URL
  copies: number;
  collectedAt: string;
}