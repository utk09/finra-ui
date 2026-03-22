import {
  Badge,
  Button,
  ButtonGroup,
  Divider,
  FormField,
  IconButton,
  NumberInput,
  PillInput,
} from "@utk09/finra-ui";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Link } from "react-router";

import { clearCart, getCart, getCartTotal, removeFromCart, updateQuantity } from "../store/cart";

function subscribe(cb: () => void) {
  window.addEventListener("cart-updated", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("cart-updated", cb);
    window.removeEventListener("storage", cb);
  };
}

export function Cart() {
  const items = useSyncExternalStore(subscribe, getCart);
  const total = useSyncExternalStore(subscribe, getCartTotal);
  const [promoCodes, setPromoCodes] = useState<string[]>([]);

  const discount = promoCodes.includes("SAVE10") ? 0.1 : promoCodes.includes("SAVE20") ? 0.2 : 0;
  const discountedTotal = total * (1 - discount);

  const handleRemove = useCallback((productId: string, size: string, color: string) => {
    removeFromCart(productId, size, color);
  }, []);

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2>Your cart is empty</h2>
        <p style={{ opacity: 0.7, marginBlockEnd: "1rem" }}>Add some products to get started.</p>
        <Link to="/">
          <Button variant="primary">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginBlockStart: 0 }}>Shopping Cart</h1>
        <Button variant="tertiary" sentiment="danger" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {items.map((item, i) => (
          <div key={`${item.productId}-${item.size}-${item.color}`}>
            {i > 0 && <Divider />}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 0",
              }}>
              <div style={{ flex: 1 }}>
                <Link
                  to={`/product/${item.productId}`}
                  style={{ textDecoration: "none", color: "inherit" }}>
                  <strong>{item.name}</strong>
                </Link>
                <div style={{ display: "flex", gap: "0.5rem", marginBlockStart: "0.25rem" }}>
                  {item.size && <Badge variant="tertiary">{item.size}</Badge>}
                  {item.color && <Badge variant="tertiary">{item.color}</Badge>}
                </div>
              </div>

              <NumberInput
                value={item.quantity}
                onChange={(v) => updateQuantity(item.productId, item.size, item.color, v ?? 0)}
                min={1}
                max={99}
                step={1}
                aria-label={`Quantity for ${item.name}`}
              />

              <span
                style={{ minInlineSize: "5rem", textAlign: "end", fontWeight: 600, flexShrink: 0 }}>
                ${(item.price * item.quantity).toFixed(2)}
              </span>

              <IconButton
                variant="tertiary"
                sentiment="danger"
                icon={<span aria-hidden="true">✕</span>}
                aria-label={`Remove ${item.name}`}
                onClick={() => handleRemove(item.productId, item.size, item.color)}
              />
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <div style={{ marginBlockStart: "1rem", maxWidth: 400 }}>
        <FormField label="Promo Codes" helperText="Try SAVE10 or SAVE20">
          <PillInput
            values={promoCodes}
            onChange={setPromoCodes}
            placeholder="Enter code..."
            maxPills={3}
          />
        </FormField>
        {discount > 0 && (
          <Badge variant="primary" sentiment="success" style={{ marginBlockStart: "0.5rem" }}>
            {discount * 100}% discount applied!
          </Badge>
        )}
      </div>

      <Divider />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
        }}>
        <div>
          {discount > 0 && (
            <span
              style={{ textDecoration: "line-through", opacity: 0.5, marginInlineEnd: "0.5rem" }}>
              ${total.toFixed(2)}
            </span>
          )}
          <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Total: ${discountedTotal.toFixed(2)}
          </span>
        </div>
        <ButtonGroup>
          <Link to="/">
            <Button variant="secondary">Continue Shopping</Button>
          </Link>
          <Link to="/checkout">
            <Button variant="primary">Checkout</Button>
          </Link>
        </ButtonGroup>
      </div>
    </div>
  );
}
