class PantryController {
    constructor(pantryService) {
        this.pantryService = pantryService;
    }

    async getAllItems(req, res) {
        try {
            const items = await this.pantryService.getAllItems();
            res.status(200).json(items);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving items', error });
        }
    }

    async addItem(req, res) {
        try {
            const newItem = await this.pantryService.addItem(req.body);
            res.status(201).json(newItem);
        } catch (error) {
            res.status(400).json({ message: 'Error adding item', error });
        }
    }

    async updateItem(req, res) {
        try {
            const updatedItem = await this.pantryService.updateItem(req.params.id, req.body);
            res.status(200).json(updatedItem);
        } catch (error) {
            res.status(400).json({ message: 'Error updating item', error });
        }
    }

    async deleteItem(req, res) {
        try {
            await this.pantryService.deleteItem(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ message: 'Error deleting item', error });
        }
    }
}

export default PantryController;