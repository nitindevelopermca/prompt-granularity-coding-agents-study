// Local cart types. DummyJSON has no session GET-cart; after a successful
// POST /carts/add the app keeps quantity and product identity locally.

export interface CartLine {
  id: number;
  quantity: number;
  title: string;
  price: number;
  thumbnail: string;
}
