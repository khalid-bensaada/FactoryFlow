# FactoryFlow
## Low stock alerts

A material is in alert when quantity <= alertThreshold.
A material with threshold 0 and quantity 0 is therefore also in alert.

## Products

- A composition item that references a missing raw material is rejected with 400
  (the request body is invalid), and the message lists the missing ids.
- A product reference is immutable after creation.
- Updating a product never changes existing orders, which keep their own copy
  of the composition.

  
## Manufacturing orders

- An order copies the product composition at creation and never changes afterwards.
- Only a planned order (planifié) can be updated or cancelled, otherwise 409.
- The product of an order cannot be changed. To use another product, cancel and create a new order.
- Assigning an order to a missing user or to a user who is not an Operator returns 400.
- An operator requesting an order assigned to someone else gets 404, so the existence of the order is not revealed.
- The from and to filters apply to the creation date. A date-only value for to includes the whole day.
- Operators list their orders through GET /api/orders/mine, which always filters by the id in the token.
