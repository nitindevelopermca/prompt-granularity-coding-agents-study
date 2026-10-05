// Add-to-cart API client.
//
// Contract (spec/apis_contract/03_Add_To_Cart_API_Contract.docx, spec/SPEC_FREEZE.md):
//   POST https://dummyjson.com/carts/add
//   body: { userId, products: [{ id, quantity }] }
//   No GET-cart — session cart is frontend state after a successful add.
//   Authorization header is optional; DummyJSON does not require it.

const CARTS_ADD_URL = 'https://dummyjson.com/carts/add';

export interface AddToCartPayload {
  userId: number;
  products: Array<{ id: number; quantity: number }>;
}

export type CartErrorKind = 'network' | 'unknown';

export class CartError extends Error {
  kind: CartErrorKind;

  constructor(message: string, kind: CartErrorKind) {
    super(message);
    this.name = 'CartError';
    this.kind = kind;
  }
}

/** Posts a cart add. Resolves on HTTP success; local cart state is updated by the caller. */
export async function addToCart(payload: AddToCartPayload): Promise<void> {
  let response: Response;

  try {
    response = await fetch(CARTS_ADD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new CartError(
      'Unable to reach the server. Please check your internet connection and try again.',
      'network',
    );
  }

  if (!response.ok) {
    throw new CartError('Unable to add this item to your cart right now. Please try again.', 'unknown');
  }
}
