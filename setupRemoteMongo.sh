# Setup file template to upload data to MongoDB Atlas
mongoimport --uri "mongodb+srv://njsqkart-node:#Mongodbnjn11@njsqkart-node.j9q58d3.mongodb.net/qkart?retryWrites=true&w=majority" --drop --collection users --file data/export_qkart_users.json
mongoimport --uri "mongodb+srv://njsqkart-node:#Mongodbnjn11@njsqkart-node.j9q58d3.mongodb.net/qkart?retryWrites=true&w=majority" --drop --collection products --file data/export_qkart_products.json
