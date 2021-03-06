class User {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.pantry = user.pantry;
    this.favoriteRecipes = [];
    this.recipesToCook = [];
  }

  addRecipe(array, recipeId) {
    if (!this[array].includes(recipeId)) {
      this[array].push(recipeId)
    }
  }

  removeRecipe(array, recipeId) {
    let i = this[array].indexOf(recipeId);
    this[array].splice(i, 1);
  }
}

module.exports = User;
