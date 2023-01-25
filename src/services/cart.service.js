const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");


/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const userCart = await Cart.findOne({ email: user.email });
  if (!userCart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
   
  return userCart;  
};   

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  let userCart = await Cart.findOne({ email: user.email });

  if (!userCart) {
    userCart = await Cart.create({ email: user.email });
    if (!userCart) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  let productIndex = -1;
  for (let i = 0; i < userCart.cartItems.length; i++) {
    if (productId == userCart.cartItems[i].product._id) {
      productIndex = i;
    }
  }

  // If product not in cart, add to cart. Otherwise, throw error.
  if (productIndex == -1) {
    let product = await Product.findOne({ _id: productId });

    if (product == null) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product doesn't exist in database"
      );
    }

    userCart.cartItems.push({ product: product, quantity: quantity });
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart. Use the cart sidebar to update or remove product from cart"
    );
  }

  const savedCart = await userCart.save();
  return savedCart;
  
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {

    console.log(user);
    let userCart = await Cart.findOne({ email: user.email });

    if (!userCart) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart. Use POST to create cart and add a product");
    }

    let productIndex = -1;
    for (let i = 0; i < userCart.cartItems.length; i++) {
      if (productId == userCart.cartItems[i].product._id) {
        productIndex = i;
      }
    }

    console.log(productIndex);

    // If product not in cart, add to cart. Otherwise, throw error.
    if (productIndex !== -1) {
      let product = await Product.findOne({ _id: productId });

      if (product == null) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Product doesn't exist in database"
        );
      }

      // userCart.cartItems.push({ product: product, quantity: quantity });
      userCart.cartItems[productIndex].quantity = quantity;

    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product not in cart"
      );
    }
    
    const savedCart = await userCart.save();
    return savedCart;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * 
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
    let userCart = await Cart.findOne({ email: user.email });

    if (!userCart) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
    }

    let productIndex = -1;
    for (let i = 0; i < userCart.cartItems.length; i++) {
      if (productId == userCart.cartItems[i].product._id) {
        productIndex = i;
      }
    }
    
    // If product not in cart, add to cart. Otherwise, throw error.
    // console.log(userCart.cartItems, "from 196");
    if (productIndex !== -1) {
      userCart.cartItems.splice(productIndex, 1);
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product not in cart"
      );
    }

    const savedCart = await userCart.save();
    return savedCart;
};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  
  // console.log(user.email, "from cart service");

  let userCart = await Cart.findOne({ email: user.email });
  if(!userCart)
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  
  if(userCart.cartItems.length === 0)
    throw new ApiError(httpStatus.BAD_REQUEST);

  let hasSetNonDefaultAddress = await user.hasSetNonDefaultAddress();
  if (!hasSetNonDefaultAddress) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Address not set");
  }


  let sum = 0;
  userCart.cartItems.forEach((ele) => {
    return sum += ele.product.cost * ele.quantity;  
  });

  // console.log(user.walletMoney);
  // console.log(sum, "--sum");
  
  if(sum > user.walletMoney)
    throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient Balance");
  

  user.walletMoney -= sum;
  await user.save();
  // console.log(user.walletMoney);

  userCart.cartItems = []; 
  await userCart.save();
  return userCart;
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
