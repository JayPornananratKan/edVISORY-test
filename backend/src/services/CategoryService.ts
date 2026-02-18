import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { I18nUtils } from '../utils/i18n';

interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  is_expense: boolean;
  userId: number;
}

interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  is_expense?: boolean;
  is_active?: boolean;
}

interface CategoryTreeNode {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_expense: boolean;
  parent_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  children: CategoryTreeNode[];
}

export class CategoryService {
  private categoryRepository = AppDataSource.getRepository(Category);

  async createCategory(categoryData: CreateCategoryData) {
    const { name, description, color, icon, parent_id, is_expense, userId } = categoryData;

    // Check if category with same name already exists for this user
    const existingCategory = await this.categoryRepository.findOne({
      where: { name, user_id: userId }
    });

    if (existingCategory) {
      throw new Error('Category name already exists');
    }

    // Check for circular reference if parent_id is provided
    if (parent_id) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: parent_id, user_id: userId }
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }

      // Check if parent is expense and child is income or vice versa
      if (parentCategory.is_expense !== is_expense) {
        throw new Error('Category type mismatch with parent category');
      }
    }

    const category = this.categoryRepository.create({
      user_id: userId,
      name,
      description,
      color,
      icon,
      is_expense,
      parent_id,
      is_active: true
    });

    await this.categoryRepository.save(category);

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      is_expense: category.is_expense,
      parent_id: category.parent_id,
      is_active: category.is_active,
      created_at: category.created_at
    };
  }

  async getCategories(userId: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [categories, total] = await this.categoryRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
      skip,
      take: limit
    });

    return {
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        is_expense: category.is_expense,
        parent_id: category.parent_id,
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getCategoryById(categoryId: number, userId: number) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, user_id: userId }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      is_expense: category.is_expense,
      parent_id: category.parent_id,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at
    };
  }

  async updateCategory(categoryId: number, userId: number, updateData: UpdateCategoryData) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, user_id: userId }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if name is being updated and if new name already exists
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateData.name, user_id: userId }
      });

      if (existingCategory) {
        throw new Error('Category name already exists');
      }
    }

    // Check for circular reference if parent_id is being updated
    if (updateData.parent_id !== undefined) {
      if (updateData.parent_id === categoryId) {
        throw new Error('Category cannot be its own parent');
      }

      if (updateData.parent_id) {
        const parentCategory = await this.categoryRepository.findOne({
          where: { id: updateData.parent_id, user_id: userId }
        });

        if (!parentCategory) {
          throw new Error('Parent category not found');
        }

        const categoryType = updateData.is_expense !== undefined ? updateData.is_expense : category.is_expense;
        if (parentCategory.is_expense !== categoryType) {
          throw new Error('Category type mismatch with parent category');
        }
      }
    }

    // Update category
    Object.assign(category, updateData);
    await this.categoryRepository.save(category);

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      is_expense: category.is_expense,
      parent_id: category.parent_id,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at
    };
  }

  async deleteCategory(categoryId: number, userId: number) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, user_id: userId }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has children
    const childCategories = await this.categoryRepository.find({
      where: { parent_id: categoryId }
    });

    if (childCategories.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Check if category has transactions (you might want to add this check)
    // For now, we'll allow deletion

    await this.categoryRepository.remove(category);

    return {
      message: 'Category deleted successfully'
    };
  }

  async getCategoryTree(userId: number) {
    const categories = await this.categoryRepository.find({
      where: { user_id: userId, is_active: true },
      order: { created_at: 'ASC' }
    });

    // Build tree structure
    const categoryMap = new Map<number, CategoryTreeNode>();
    const rootCategories: CategoryTreeNode[] = [];

    // Create category map
    categories.forEach(category => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        is_expense: category.is_expense,
        parent_id: category.parent_id,
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at,
        children: []
      });
    });

    // Build tree
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id);
      
      if (categoryNode) {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(categoryNode);
          }
        } else {
          rootCategories.push(categoryNode);
        }
      }
    });

    return {
      categories: rootCategories,
      total_count: categories.length
    };
  }

  async getCategoriesByType(userId: number, is_expense: boolean) {
    const categories = await this.categoryRepository.find({
      where: { user_id: userId, is_expense, is_active: true },
      order: { name: 'ASC' }
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      is_expense: category.is_expense,
      parent_id: category.parent_id,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at
    }));
  }
}
