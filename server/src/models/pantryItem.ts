export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string; // Optional property for the unit of measurement
  expirationDate?: Date; // Optional property for the expiration date
}