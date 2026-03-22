import {
  Badge,
  Button,
  ButtonGroup,
  Divider,
  FormField,
  NumberInput,
  RadioButton,
} from "@utk09/finra-ui";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { products } from "../data/products";
import { addToCart } from "../store/cart";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);

  const [quantity, setQuantity] = useState<number | "">(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2>Product not found</h2>
        <Link to="/">
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const size = selectedSize || product.sizes[0] || "";
  const color = selectedColor || product.colors[0] || "";

  const handleAdd = () => {
    if (quantity === "" || quantity < 1) return;
    addToCart(
      { productId: product.id, name: product.name, price: product.price, size, color },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div>
      <Link to="/" style={{ textDecoration: "none" }}>
        <Button variant="tertiary">&larr; Back to Products</Button>
      </Link>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBlockStart: "1rem",
        }}>
        <div
          style={{
            fontSize: "8rem",
            textAlign: "center",
            padding: "2rem",
            border: "1px solid var(--finra-color-border)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          {product.image}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Badge variant="tertiary">{product.category}</Badge>
            {product.inStock ? (
              <Badge variant="primary" sentiment="success">
                In Stock
              </Badge>
            ) : (
              <Badge variant="primary" sentiment="danger">
                Out of Stock
              </Badge>
            )}
          </div>

          <h1 style={{ margin: 0 }}>{product.name}</h1>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            ${product.price.toFixed(2)}
          </p>
          <p style={{ margin: 0, opacity: 0.8 }}>{product.description}</p>

          <Divider />

          {product.sizes.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 0.5rem" }}>Size</h3>
              <ButtonGroup>
                {product.sizes.map((s) => (
                  <Button
                    key={s}
                    variant={size === s ? "primary" : "secondary"}
                    onClick={() => setSelectedSize(s)}>
                    {s}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          )}

          {product.colors.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 0.5rem" }}>Color</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {product.colors.map((c) => (
                  <RadioButton
                    key={c}
                    name="color"
                    value={c}
                    label={c}
                    checked={color === c}
                    onChange={() => setSelectedColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          <Divider />

          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem" }}>
            <FormField label="Quantity">
              <NumberInput
                value={quantity}
                onChange={(v) => setQuantity(v ?? 1)}
                min={1}
                max={99}
                step={1}
                aria-label="Quantity"
              />
            </FormField>
            <Button variant="primary" disabled={!product.inStock} onClick={handleAdd}>
              Add to Cart
            </Button>
          </div>

          {added && (
            <Badge variant="primary" sentiment="success">
              Added to cart!
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
