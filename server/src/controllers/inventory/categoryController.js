import Category from '../../models/inventory/Category.js';

// Create category
export const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all categories (flat)
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get category tree
export const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find();
    // Build tree
    const map = {};
    categories.forEach(cat => map[cat._id] = { ...cat._doc, children: [] });
    const tree = [];
    categories.forEach(cat => {
      if (cat.parentCategoryId) {
        map[cat.parentCategoryId]?.children.push(map[cat._id]);
      } else {
        tree.push(map[cat._id]);
      }
    });
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
