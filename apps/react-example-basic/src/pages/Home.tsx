import { Badge, Button, Divider, IconButton, Input, Slider } from "@utk09/finra-ui";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { products } from "../data/products";
import { addToCart } from "../store/cart";

export function Home() {
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("300");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const limit = Number(maxPrice);
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q))
        return false;
      if (p.price > limit) return false;
      return true;
    });
  }, [search, maxPrice]);

  return (
    <div>
      <h1 style={{ marginBlockStart: 0 }}>Products</h1>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "flex-end",
          flexWrap: "wrap",
          marginBlockEnd: "1rem",
        }}>
        <div style={{ flex: "1 1 240px" }}>
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            aria-label="Search products"
          />
        </div>
        <div style={{ flex: "0 0 200px" }}>
          <Slider
            min={0}
            max={300}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            label={`Max price: $${maxPrice}`}
            showValue
            aria-label="Maximum price filter"
          />
        </div>
      </div>

      <Divider />

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
          No products match your filters.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1rem",
          marginBlockStart: "1rem",
        }}>
        {filtered.map((product) => (
          <div
            key={product.id}
            style={{
              border: "1px solid var(--finra-color-border)",
              borderRadius: "8px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}>
            <div style={{ fontSize: "3rem", textAlign: "center", padding: "1rem 0" }}>
              {product.image}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Badge variant="tertiary">{product.category}</Badge>
              {!product.inStock && (
                <Badge variant="primary" sentiment="danger">
                  Out of Stock
                </Badge>
              )}
            </div>

            <Link
              to={`/product/${product.id}`}
              style={{ textDecoration: "none", color: "inherit" }}>
              <h3 style={{ margin: 0 }}>{product.name}</h3>
            </Link>

            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.7, flex: 1 }}>
              {product.description.slice(0, 80)}...
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBlockStart: "0.5rem",
              }}>
              <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                ${product.price.toFixed(2)}
              </span>
              <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                <IconButton
                  variant="tertiary"
                  icon={<span aria-hidden="true">♡</span>}
                  aria-label={`Favourite ${product.name}`}
                  onClick={() => {
                    /* no-op for demo */
                  }}
                />
                <Button
                  variant="primary"
                  disabled={!product.inStock}
                  onClick={() => {
                    addToCart(
                      {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        size: product.sizes[0] ?? "",
                        color: product.colors[0] ?? "",
                      },
                      1,
                    );
                  }}>
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
