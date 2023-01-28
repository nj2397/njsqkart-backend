const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../../src/app");
const setupTestDB = require("../utils/setupTestDB");
const { Cart } = require("../../src/models");
const { userOne, userTwo, insertUsers } = require("../fixtures/user.fixture");
const {
  cartWithProductsUserOne,
  cartWithProductsUserTwo,
  emptyCart,
  insertCart,
} = require("../fixtures/cart.fixture");
const {
  userOneAccessToken,
  userTwoAccessToken,
} = require("../fixtures/token.fixture");
const config = require("../config/config");

// Setup test Mongo database, qkart-test
setupTestDB();

describe("Cart routes", () => {
  describe("Checkout", () => {
    it("should return 401 if access token is missing", async () => {
      // Insert sample user defined by "userOne" fixture to test DB
      await insertUsers([userOne]);
      // Insert sample cart defined by "emptyCart" fixture to test DB
      await insertCart([emptyCart]);

      // Simulate an API request
      const res = await request(app).put(`/v1/cart/checkout`).send();

      // Log response text to terminal
      console.log(res.statusCode, "FROM LINE 34");

      // TODO: CRIO_TASK_MODULE_TEST - Assert if status code is "401 UNAUTHORIZED"
      //  expect(true).toEqual(false);
      expect(res.statusCode).toEqual( httpStatus.UNAUTHORIZED ); 
    });

    it("should return 400 if cart is empty", async () => {
      // Insert sample user defined by "userOne" fixture to test DB
      await insertUsers([userOne]);
      // Insert sample cart defined by "emptyCart" fixture to test DB
      await insertCart([emptyCart]);

      // Simulate an API request
      const res = await request(app)
        .put(`/v1/cart/checkout`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send();

      console.log(res.statusCode, "from 55");

      //  expect(true).toEqual(false); 
      expect(res.statusCode).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should return 400 if user's address is not set", async () => {
      expect(userTwo.address).toEqual(config.default_address);

      await insertUsers([userTwo]);
      await insertCart([cartWithProductsUserTwo]);

      const res = await request(app)
        .put(`/v1/cart/checkout`)
        .set("Authorization", `Bearer ${userTwoAccessToken}`)
        .send();

      console.log(res.statusCode, "from 75");
      //  expect(true).toEqual(false);
      expect(res.statusCode).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should return 400 if not enough wallet balance", async () => {
      const userOneWithZeroBalance = { ...userOne, walletMoney: 0 };
      await insertUsers([userOneWithZeroBalance]);
      await insertCart([cartWithProductsUserOne]);

      const res = await request(app)
        .put(`/v1/cart/checkout`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send();

      console.log(res.statusCode, "from 93");
      //  expect(true).toEqual(false);
      expect(res.statusCode).toEqual(httpStatus.BAD_REQUEST);

    });

    it("should return 204 if cart is valid", async () => {
      await insertUsers([userOne]);
      await insertCart([cartWithProductsUserOne]);

      const res = await request(app)
        .put(`/v1/cart/checkout`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send();


      console.log(res.statusCode, "from line 112");

      //  expect(true).toEqual(false);
      expect(res.statusCode).toEqual(httpStatus.NO_CONTENT);
      // - Cart exists
      // - Length of "cartItems" array is 0

      const userOneCart = await Cart.findOne({ email: userOne.email });
      if(userOneCart)
        expect(userOneCart.cartItems.length).toEqual(0);
    });
  });
});
  
