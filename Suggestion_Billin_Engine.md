Here’s what I propose:

---

# 📑 Refined POS Billing Strategy (UK, US & India)

This spec unifies Cursor’s suggestions with your regional insights.

---

## 🌍 Regional Tax Approaches

### 🇬🇧 UK

* Uniform **VAT** (usually 20%) across food and alcohol.
* Payment timing (pay first vs pay later) doesn’t matter.
* One consolidated bill.
* Optional **service charge** can be added.

**UX Rule:** Always show `Subtotal → VAT → Service Charge → Total`.

---

### 🇺🇸 US

* **Sales Tax** added at state/city rates.
* Applied uniformly across food and alcohol (with rare exceptions).
* Tips are not included in the bill.
* Payment timing doesn’t matter.

**UX Rule:** Always show `Subtotal → Sales Tax → Total`.

---

### 🇮🇳 India

* **Fine Dine / Pubs (alcohol served):**

  * Split: *Food subtotal* vs *Liquor subtotal*.
  * Discounts → Service charge (optional).
  * **SGST+CGST on food**, **VAT on alcohol**.
  * Pay later, split bill allowed.

* **Premium Cafes (Pay First, product-level GST):**

  * Product-level GST or subtotal GST (SGST+CGST).
  * No service charge.
  * Pay upfront, split bill disabled.

* **Small Cafes / Restaurants:**

  * Sometimes **no GST at all**.
  * Optional service charge.
  * Total = Subtotal (± service charge).

**UX Rule:**

* If `Product Level Tax = ON` → **Pay First mode** (show tax breakdown immediately).
* If `Product Level Tax = OFF` → **Fine Dine mode** (show only running total until billing).
* If `Region = India` and **no tax config** → **No Tax mode** (Subtotal = Total).

---

## 🔑 Business Model Detection

```ts
type BusinessModel = 'COUNTER_SERVICE' | 'FINE_DINE' | 'NO_TAX';

const useBusinessModel = () => {
  const { currentRegion } = useRegion();
  const { productLevelTaxEnabled } = useSettings();

  if (currentRegion === 'india') {
    if (productLevelTaxEnabled) return 'COUNTER_SERVICE';
    return 'FINE_DINE';
  }

  if (currentRegion === 'uk' || currentRegion === 'us') {
    return 'COUNTER_SERVICE'; // uniform tax
  }

  return 'NO_TAX';
};
```

---

## ⚙️ Unified Calculation

```ts
const useOrderCalculations = (orderItems, businessModel, products) => {
  return useMemo(() => {
    if (businessModel === 'FINE_DINE') {
      const subtotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);
      return {
        subtotal,
        totalPayable: subtotal,
        taxAmount: 0,
        serviceCharge: 0,
        note: 'Taxes and charges will be calculated at billing'
      };
    }

    if (businessModel === 'COUNTER_SERVICE') {
      return calculateLegalBilling(orderItems, products);
    }

    // NO_TAX
    const subtotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);
    return { subtotal, totalPayable: subtotal, taxAmount: 0, serviceCharge: 0 };
  }, [orderItems, businessModel, products]);
};
```

---

## 🖥️ UI Rules

### Sidebar

* **Counter Service (QSRs, Cafés, UK, US, Indian cafés with product-level GST):**

  * `Subtotal → Tax → Service Charge → Total`
  * Split bill disabled.

* **Fine Dine (India Restaurants/Pubs):**

  * `Running Total` only.
  * Note: *“Taxes and charges applied at billing”*.
  * Split bill enabled.

* **No Tax (India small cafés):**

  * `Subtotal → Total`.
  * Service charge line if enabled.

---

### Payment Drawer

* Always shows **full legal breakdown**:

  * UK/US: Subtotal + VAT/Sales Tax + Service Charge.
  * India Fine Dine: Food subtotal + Liquor subtotal + Discounts + Service charge + SGST+CGST + VAT.
  * India Pay First Café: Product-level GST totals.
  * Small cafés: Just subtotal (+ service charge).

---

## ⚖️ Compliance Features

* **Enabling Product Level Tax** → forces **Pay First**, disables split bill.
* **Disabling Product Level Tax** → defaults to **Fine Dine** in India, enabling split bill.
* **Region-aware rounding** (IN: nearest ₹1, UK: £0.01, US: \$0.01).
* **Invoices** always generated with region-specific compliance breakdown.

---

## 🚀 Implementation Roadmap

1. Implement `useBusinessModel`.
2. Refactor new order sidebar to use `useOrderCalculations`.
3. Connect Service Charge & Tax settings (currently unused).
4. Add region-specific tax rules into `calculateLegalBilling`.
5. Update UI copy for clarity:

   * *Running Total* vs *Bill Estimate*.
   * Add helper notes: *“Taxes will be applied at billing”* (Fine Dine).

---

👉 Vaibhav, this Markdown spec captures Cursor’s suggestions, your India/UK insights, and compliance requirements.

Would you like me to **expand the spec with exact rounding logic per region** (India, UK, US) so your billing engine team doesn’t have to guess?
