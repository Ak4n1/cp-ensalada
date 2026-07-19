import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Material } from '../../core/models/material.model';
import { CpDataService } from '../../core/services/cp-data.service';
import { ItemIconComponent } from '../../shared/ui/atoms/item-icon/item-icon.component';

interface RecipeItem {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface Recipe {
  id: string;
  recipeId: string;
  recipeName: string;
  craftLevel: number;
  type: string;
  successRate: number;
  production: RecipeItem;
  ingredients: RecipeItem[];
}

interface CraftNode extends RecipeItem {
  totalCount: number;
  hasRecipe: boolean;
  children: CraftNode[];
}

interface CraftTotal extends RecipeItem {}

interface CraftView {
  recipe: Recipe;
  tree: CraftNode[];
  totals: CraftTotal[];
}

@Component({
  selector: 'app-materiales-page',
  imports: [CommonModule, FormsModule, ItemIconComponent],
  templateUrl: './materiales.page.html',
  styleUrl: './materiales.page.css',
})
export class MaterialesPage implements OnInit {
  items: Material[] = [];
  recipes: Recipe[] = [];
  searchText = '';
  selectedItem: Material | null = null;
  selectedRecipeId: string | null = null;
  private recipesByProduction = new Map<string, Recipe[]>();

  constructor(public data: CpDataService) {}

  async ngOnInit(): Promise<void> {
    const [itemsResponse, recipesResponse] = await Promise.all([
      fetch('/assets/item-catalog.json'),
      fetch('/assets/recipe-catalog.json'),
    ]);

    this.items = ((await itemsResponse.json()) as Material[]).map((item) => ({
      id: item.id.toString(),
      name: item.name,
      icon: item.icon,
    }));
    this.recipes = (await recipesResponse.json()) as Recipe[];
    this.recipesByProduction = this.recipes.reduce((map, recipe) => {
      const recipes = map.get(recipe.production.id) ?? [];
      recipes.push(recipe);
      recipes.sort((first, second) => second.successRate - first.successRate);
      map.set(recipe.production.id, recipes);
      return map;
    }, new Map<string, Recipe[]>());
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.closeRecipe();
  }

  get visibleItems(): Material[] {
    const query = this.searchText.trim().toLowerCase();
    const source = query ? this.items : this.data.materials();

    const filtered = source.filter((item) =>
      !query || item.name.toLowerCase().includes(query) || item.id.includes(query),
    );

    return filtered.slice(0, 160);
  }

  get visibleItemsLabel(): string {
    return this.searchText.trim()
      ? `Mostrando ${this.visibleItems.length} resultados de ${this.items.length} items del juego.`
      : `Mostrando los ${this.visibleItems.length} materiales rápidos del formulario de carga.`;
  }

  get selectedRecipes(): Recipe[] {
    if (!this.selectedItem) {
      return [];
    }

    return this.recipesByProduction.get(this.selectedItem.id) ?? [];
  }

  get selectedRecipe(): Recipe | null {
    return (
      this.selectedRecipes.find((recipe) => recipe.id === this.selectedRecipeId) ??
      this.selectedRecipes[0] ??
      null
    );
  }

  get selectedCraftView(): CraftView | null {
    return this.selectedRecipe ? this.createCraftView(this.selectedRecipe) : null;
  }

  clearSearch(): void {
    this.searchText = '';
  }

  openRecipe(item: Material): void {
    this.selectedItem = item;
    this.selectedRecipeId = this.selectedRecipes[0]?.id ?? null;
  }

  closeRecipe(): void {
    this.selectedItem = null;
    this.selectedRecipeId = null;
  }

  setActiveRecipe(recipe: Recipe): void {
    this.selectedRecipeId = recipe.id;
  }

  private createCraftView(recipe: Recipe): CraftView {
    const tree: CraftNode[] = [];
    const totals = new Map<string, CraftTotal>();

    for (const ingredient of recipe.ingredients) {
      tree.push(this.createCraftNode(ingredient, 1, totals, new Set([recipe.production.id])));
    }

    return {
      recipe,
      tree,
      totals: Array.from(totals.values()).sort((first, second) =>
        first.name.localeCompare(second.name),
      ),
    };
  }

  private createCraftNode(
    ingredient: RecipeItem,
    multiplier: number,
    totals: Map<string, CraftTotal>,
    visited: Set<string>,
  ): CraftNode {
    const totalCount = ingredient.count * multiplier;
    const subRecipe = this.recipesByProduction.get(ingredient.id)?.[0];
    const hasRecipe = Boolean(subRecipe) && !visited.has(ingredient.id);
    const node: CraftNode = {
      ...ingredient,
      totalCount,
      hasRecipe,
      children: [],
    };

    if (!hasRecipe || !subRecipe) {
      const currentTotal = totals.get(ingredient.id);
      totals.set(ingredient.id, {
        ...ingredient,
        count: (currentTotal?.count ?? 0) + totalCount,
      });
      return node;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(ingredient.id);

    for (const childIngredient of subRecipe.ingredients) {
      node.children.push(this.createCraftNode(childIngredient, totalCount, totals, nextVisited));
    }

    return node;
  }
}
