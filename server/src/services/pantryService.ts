import { PantryItem } from '../models/pantryItem';

export class PantryService {
    private pantryItems: PantryItem[] = [];

    public getAllItems(): PantryItem[] {
        return this.pantryItems;
    }

    public getItemById(id: string): PantryItem | undefined {
        return this.pantryItems.find(item => item.id === id);
    }

    public addItem(item: PantryItem): void {
        this.pantryItems.push(item);
    }

    public updateItem(id: string, updatedItem: PantryItem): boolean {
        const index = this.pantryItems.findIndex(item => item.id === id);
        if (index !== -1) {
            this.pantryItems[index] = { ...this.pantryItems[index], ...updatedItem };
            return true;
        }
        return false;
    }

    public deleteItem(id: string): boolean {
        const index = this.pantryItems.findIndex(item => item.id === id);
        if (index !== -1) {
            this.pantryItems.splice(index, 1);
            return true;
        }
        return false;
    }
}