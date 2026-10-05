API Contract 4 — Product search and lazy load
Fixed input for the prompt-decomposition experiment

Lazy load (pagination)
GET https://dummyjson.com/products?limit=10&skip=0
Then increase skip by 10 for each Load more (skip=10, 20, …).
Do not use limit=0.

Search
GET https://dummyjson.com/products/search?q={query}

Use products[] fields as in the products contract, including thumbnail, images[], reviews.

Experimental instruction: Use these URLs as provided. Do not substitute another catalog API.
