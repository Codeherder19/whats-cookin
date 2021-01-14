import fetchRequests from './fetchRequests';
import './css/styles.scss';
import domUpdates from './domUpdates';

import User from './user';
import Recipe from './recipe';
import Pantry from './pantry';
import Ingredient from './ingredient';
import './images/apple-logo-outline.png';
import './images/apple-logo.png';
import './images/search.png';
import './images/cookbook.png';
import './images/cookbook.png';
import './images/seasoning.png';



const allRecipesBtn = document.querySelector(".show-all-btn");
const allRecipesBtn2 = document.querySelector(".show-all-btn2");
const filterBtn = document.querySelector(".filter-btn");
const fullRecipeInfo = document.querySelector(".recipe-instructions");
const main = document.querySelector("main");
const pantryBtn = document.querySelector(".my-pantry-btn");
const savedRecipesBtn = document.querySelector(".saved-recipes-btn");
const searchBtn = document.querySelector(".search-btn");
const searchForm = document.querySelector("#search");
const searchInput = document.querySelector("#search-input");
const showPantryRecipes = document.querySelector(".show-pantry-recipes-btn");
const tagList = document.querySelector(".tag-list");
const tagFilterDropdown = document.querySelector(".filter-dropbtn");
const cookRecipeButton = document.querySelector(".cook-recipe-button");
const recipeOkayButton = document.querySelector(".recipe-okay-button");
const recipesToCookBtn = document.querySelector(".recipes-to-cook-btn");


let viewFavorites = false;
let menuOpen = false;
let viewTags = false;
let viewRecipesToCook = false;
let user;
let recipes;
let ingredients;
let activeSearch;


window.addEventListener("load", loadAllData);
allRecipesBtn.addEventListener("click", showAllRecipes);
allRecipesBtn2.addEventListener("click", showAllRecipes);
filterBtn.addEventListener("click", reloadRecipes);
main.addEventListener("click", runCardButtons);
pantryBtn.addEventListener("click", toggleMenu);
savedRecipesBtn.addEventListener("click", showSavedRecipes);
searchBtn.addEventListener("click", pressEnterSearch);
showPantryRecipes.addEventListener("click", reloadRecipes);
searchForm.addEventListener("submit", pressEnterSearch);
tagFilterDropdown.addEventListener("click", toggleFilter);
cookRecipeButton.addEventListener("click", cookRecipe);
recipesToCookBtn.addEventListener("click", showRecipesToCook);
recipeOkayButton.addEventListener("click", returnToRecipeView);

function loadAllData() {
  Promise.all([fetchRequests.getUsers(), fetchRequests.getRecipes(), fetchRequests.getIngredients()])
  .then(values => {
    user = generateUser(values[0]);
    user.pantry = generateUserPantry(user);
    domUpdates.loadUserDom(user);
    ingredients = generateIngredients(values[2]);
    recipes = generateRecipes(values[1]);
    domUpdates.displayPantryInfo(generatePantryInfo());
    createCards();
    findTags();
  });
}

//LOAD DATA MODEL
function generateUser(users) {
  return new User(users[Math.floor(Math.random() * users.length)]);
}

function generateRecipes(recipes) {
  return recipes.map(recipe => new Recipe(recipe, ingredients));
}

function generatePantryInfo() {
  let ingredientsInPantry = [];
  user.pantry.pantry.forEach((pantryIng, i) => {
    ingredientsInPantry.push(ingredients.find(ing => ing.id === pantryIng.ingredient));
    ingredientsInPantry[i].amount = pantryIng.amount;
  })
  return ingredientsInPantry.sort((a, b) => a.name.localeCompare(b.name));
}

function generateUserPantry(user) {
  return new Pantry(user);
}

function generateIngredients(ingredients) {
  return ingredients.map(ingredient => new Ingredient(ingredient))
}


//CALL domUpdates
function createCards() {
  let recipeArray = filterRecipes(recipes);
  recipeArray.forEach((recipe, index) => {
    let shortRecipeName = recipe.name;
    let iconStatus = checkIfSaved(recipe);
    if (recipe.name.length > 40) {
      shortRecipeName = recipe.name.substring(0, 40) + "...";
    }
    domUpdates.addToDom(index, main, recipe, shortRecipeName, iconStatus);
  });
}

function reloadRecipes() {
  domUpdates.clearCards();
  createCards();
}

function findTags() {
  let tags = new Set(recipes.reduce((tags, recipe) => {
    return tags.concat(recipe.tags).sort();
  }, []));
  domUpdates.listTags(tags, tagList);
}

function checkIfSaved(recipe) {
  if (user.favoriteRecipes.includes(recipe.id)) {
    return '<img src="./images/apple-logo.png" alt="filled apple icon" class="card-apple-icon">';
  } else {
    return '<img src="./images/apple-logo-outline.png" alt="unfilled apple icon" class="card-apple-icon">';
  }
}

function toggleMenu() {
  menuOpen = !menuOpen;
  domUpdates.toggleMenuVis(menuOpen);
}

function toggleFilter() {
  viewTags = !viewTags;
  domUpdates.toggleFilterVis(viewTags);
}

function showSavedRecipes() {
  viewFavorites = true;
  reloadRecipes();
  domUpdates.showMyRecipesBanner();
}

function showRecipesToCook() {
  viewRecipesToCook = true;
  // reloadRecipes();
  domUpdates.clearCards();
  domUpdates.showRecipesToCookBanner();
}

function showAllRecipes() {
  viewFavorites = false;
  viewRecipesToCook = false;
  reloadRecipes();
  domUpdates.showWelcomeBanner();
}


// FAVORITE RECIPE FUNCTIONALITY
function cookRecipe() {
  let recipeId = event.target.id;
  let recipe = recipes.find(recipe => recipe.id === Number(recipeId));
  let missingIngredients = user.pantry.canCook(recipe)
  if (missingIngredients.length) {
    domUpdates.clearModalView(fullRecipeInfo);
    domUpdates.displayTotalCostToCook(missingIngredients, fullRecipeInfo);
    domUpdates.displayMissingIngredients(missingIngredients, cookRecipeButton, fullRecipeInfo, recipeOkayButton);
    domUpdates.generateRecipeTitle(recipe, fullRecipeInfo);
    domUpdates.addRecipeImage(recipe);
  } else {
    domUpdates.displayPantryInfo(generatePantryInfo());
    user.addRecipe("recipesToCook", recipeId);
    updateUserPantryAPI(user, recipe);
  }
}

function updateUserPantryAPI(user, recipe) {
  user.pantry.pantry.forEach(ingredient => {
    if (ingredient.modification) {
      fetchRequests.postIngredient(user, ingredient)
    }
  })
  }

function returnToRecipeView() {
  domUpdates.clearModalView(fullRecipeInfo);
  domUpdates.openRecipeInfo(event, fullRecipeInfo, recipes, cookRecipeButton, recipeOkayButton);
  recipeOkayButton.style.display = "none";
  document.getElementById("overlay").remove();
}

function runCardButtons(event) {
  if (event.target.className === "card-apple-icon") {
    addToMyRecipes(event)
  } else if (event.target.id === "exit-recipe-btn") {
    domUpdates.exitRecipe(fullRecipeInfo, recipeOkayButton);
  } else if (isDescendant(event.target.closest(".recipe-card"), event.target)) {
    domUpdates.openRecipeInfo(event, fullRecipeInfo, recipes, cookRecipeButton, recipeOkayButton);
  }
}

function addToMyRecipes(event) {
  let cardId = parseInt(event.target.closest(".recipe-card").id);
  if (!user.favoriteRecipes.includes(cardId)) {
    event.target.src = "../images/apple-logo.png";
    user.addRecipe('favoriteRecipes', cardId);
  } else {
    event.target.src = "../images/apple-logo-outline.png";
    user.removeRecipe('favoriteRecipes', cardId);
  }
}

function isDescendant(parent, child) {
  let node = child;
  while (node !== null) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

//FILTERING AND SEARCHING
function pressEnterSearch(event) {
  event.preventDefault();
  activeSearch = searchInput.value.toLowerCase();
  reloadRecipes();
}

function filterRecipesByFavorites(recipeArray) {
  recipeArray = recipeArray.filter(recipe => {
    return user.favoriteRecipes.includes(recipe.id);
  })
  return recipeArray;
}

function findSelected(checkboxClass) {
  let checkboxes = document.querySelectorAll(checkboxClass);
  let checkboxInfo = Array.from(checkboxes);
  return checkboxInfo.filter(box => {
    return box.checked;
  })
}

function filterRecipesByTag(recipeArray, selected) {
  selected.forEach(tag => {
    recipeArray = recipeArray.filter(recipe => recipe.tags.includes(tag.id));
  })
  return recipeArray;
}

function filterRecipesByPantry(recipeArray, selected) {
  selected.forEach(ing => {
    recipeArray = recipeArray.filter(recipe => recipe.listIngredientNames().includes(ing.id));
  })
  return recipeArray;
}

function filterRecipesBySearch(recipeArray, search) {
  recipeArray = recipeArray.filter(recipe => {
    return (recipe.listIngredientNames().find(ingredient => ingredient.includes(search)) ||
    recipe.name.toLowerCase().includes(search))});
  return recipeArray
}

function filterRecipes(recipeArray) {
  if (activeSearch) {
    recipeArray = filterRecipesBySearch(recipeArray, activeSearch);
  }
  if(findSelected('.checked-tags')) {
    recipeArray = filterRecipesByTag(recipeArray, findSelected('.checked-tags'));
  }
  if(findSelected('.pantry-checkbox')) {
    recipeArray = filterRecipesByPantry(recipeArray, findSelected('.pantry-checkbox'))
  }
  if (viewFavorites) {
    recipeArray = filterRecipesByFavorites(recipeArray);
  }
  return recipeArray
}
