API Contract 5 — Add a comment
Fixed input for the prompt-decomposition experiment

POST https://dummyjson.com/comments/add
Content-Type: application/json

{
  "body": "Great product",
  "postId": 1,
  "userId": 1
}

postId = the selected product’s id.
userId = the authenticated user’s id from login (1 for emilys).

The API simulates create and does not persist. After success, append the comment to that product’s reviews in frontend state.

Experimental instruction: Use this API as provided. Do not use GET /comments as the product review list. Product reviews still come from products[].reviews.
