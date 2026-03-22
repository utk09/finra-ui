import {
  Button,
  Checkbox,
  FileDropZone,
  FormField,
  Input,
  RadioButton,
  Slider,
  Switch,
  Textarea,
} from "@utk09/finra-ui";
import { type ChangeEvent, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";

import { clearCart } from "../store/cart";

export function Checkout() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [saveInfo, setSaveInfo] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [tipPercent, setTipPercent] = useState("5");
  const [files, setFiles] = useState<File[]>([]);

  const nameError = submitted && name.trim().length === 0;
  const emailError = submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const termsError = submitted && !acceptTerms;

  const handleSubmit = useCallback(
    (e: ChangeEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitted(true);
      if (name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && acceptTerms) {
        setOrderPlaced(true);
        clearCart();
      }
    },
    [name, email, acceptTerms],
  );

  if (orderPlaced) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h1>Order Placed!</h1>
        <p style={{ opacity: 0.7, marginBlockEnd: "1.5rem" }}>
          Thank you for your purchase. Your order is being processed.
        </p>
        <Button variant="primary" onClick={() => navigate("/")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Link to="/cart" style={{ textDecoration: "none" }}>
        <Button variant="tertiary">&larr; Back to Cart</Button>
      </Link>

      <h1>Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <FormField
            label="Full Name"
            helperText="As it appears on your card"
            required
            validationStatus={nameError ? "error" : undefined}
            errorMessage={nameError ? "Name is required" : undefined}>
            <Input
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          </FormField>

          <FormField
            label="Email"
            helperText="We'll send order confirmation here"
            required
            validationStatus={emailError ? "error" : undefined}
            errorMessage={emailError ? "Valid email is required" : undefined}>
            <Input
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
          </FormField>

          <FormField label="Phone" helperText="Optional - for delivery updates">
            <Input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />
          </FormField>

          <FormField label="Shipping Address" required>
            <Textarea
              placeholder="123 Main St, Apt 4B&#10;New York, NY 10001"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>

          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 500, marginBlockEnd: "0.5rem" }}>Payment Method</legend>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[
                { value: "credit-card", label: "Credit Card" },
                { value: "paypal", label: "PayPal" },
                { value: "bank-transfer", label: "Bank Transfer" },
              ].map((opt) => (
                <RadioButton
                  key={opt.value}
                  name="payment"
                  value={opt.value}
                  label={opt.label}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                />
              ))}
            </div>
          </fieldset>

          <FormField label="Tip" helperText={`${tipPercent}% of order total`}>
            <Slider
              min={0}
              max={20}
              value={tipPercent}
              onChange={(e) => setTipPercent(e.target.value)}
              label="Tip percentage"
              showValue
              aria-label="Tip percentage"
            />
          </FormField>

          <FormField label="ID Verification" helperText="Upload a photo ID (optional)">
            <FileDropZone onChange={setFiles} accept=".jpg,.jpeg,.png,.pdf" aria-label="Upload ID">
              {files.length > 0 ? <span>{files.map((f) => f.name).join(", ")}</span> : undefined}
            </FileDropZone>
          </FormField>

          <Checkbox
            label="Save shipping information for next time"
            checked={saveInfo}
            onChange={(e) => setSaveInfo(e.target.checked)}
          />

          <Checkbox
            label="I accept the terms and conditions"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          {termsError && (
            <span style={{ color: "var(--finra-color-error)", fontSize: "0.8rem" }}>
              You must accept the terms
            </span>
          )}

          <Switch
            label="Subscribe to newsletter"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
          />

          <div style={{ display: "flex", gap: "0.5rem", marginBlockStart: "1rem" }}>
            <Button type="submit" variant="primary">
              Place Order
            </Button>
            <Link to="/cart">
              <Button type="button" variant="secondary">
                Back to Cart
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
