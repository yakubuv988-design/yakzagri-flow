"use client";
import { t as translateCopy } from "@/lib/i18n";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTrade } from "../TradeContext";
import {
  isValidStellarAddress,
  validateStep1,
  validateDeliveryDeadline,
  formatRelativeDeliveryWindow,
} from "../validation";
import { formatCurrencyAmount, getCurrencyInfo } from "@/lib/currency";
import { COMMODITY_UNITS } from "@/lib/domain-schemas/trade";

const COMMODITIES = ["Maize", "Rice", "Sorghum", "Millet", "Cassava", "Yam", "Groundnut", "Soybean"];
const UNITS = COMMODITY_UNITS;

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT",
];

const MARKET_HUBS: Record<string, string[]> = {
  Kano: ["Dawanau Market", "Kurmi Market", "Sabon Gari Market"],
  Kaduna: ["Giwa Market", "Kaduna Central Market", "Kasuan Magani Market"],
  Katsina: ["Katsina Central Market", "Daura Market"],
  "Cross River": ["Ikom Market", "Ugep Market"],
  Benue: ["Gboko Market", "Otukpo Market", "Makurdi Market"],
  Oyo: ["Bodija Market", "Oja Oba Market"],
  Lagos: ["Mile 12 Market", "Oshodi Market"],
  Niger: ["Bida Market", "Kontagora Market"],
  Bauchi: ["Bauchi Central Market", "Azare Market"],
  Plateau: ["Jos Terminus Market", "Bukuru Market"],
  Sokoto: ["Sokoto Central Market", "Tambuwal Market"],
  Adamawa: ["Yola Market", "Mubi Market"],
  Borno: ["Maiduguri Monday Market", "Biu Market"],
  Gombe: ["Gombe Central Market", "Kaltungo Market"],
  Kwara: ["Oja Oba Market", "Share Market"],
  Nasarawa: ["Lafia Market", "Keffi Market"],
  Zamfara: ["Gusau Market", "Kaura Namoda Market"],
  Jigawa: ["Dutse Market", "Hadejia Market"],
  Kebbi: ["Birnin Kebbi Market", "Argungu Market"],
  Taraba: ["Jalingo Market", "Wukari Market"],
  Yobe: ["Damaturu Market", "Potiskum Market"],
};

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

function SearchableSelect({ id, label, value, options, placeholder, disabled, onChange }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const selectOption = (option: string) => {
    onChange(option);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[activeIndex]) selectOption(filtered[activeIndex]);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="flex flex-col gap-1 flex-1" ref={containerRef}>
      <label htmlFor={id} className="text-sm text-text-secondary">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
          disabled={disabled}
          placeholder={value || placeholder}
          value={open ? query : value}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-bg-input border border-border-default rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-border-focus disabled:opacity-50"
        />
        {open && (
          <ul
            id={`${id}-listbox`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border-default bg-bg-elevated py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-text-secondary">{translateCopy("ui.no_results")}</li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option === value}
                  onMouseDown={(e) => { e.preventDefault(); selectOption(option); }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`cursor-pointer px-4 py-2 text-sm ${index === activeIndex ? "bg-bg-input text-gold" : "text-text-primary"}`}
                >
                  {option}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Step1Details() {
  const { data, update, setStep } = useTrade();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const qty = parseFloat(data.quantity);
  const amount = parseFloat(data.pricePerUnit);
  const totalValue = !isNaN(qty) && !isNaN(amount) ? qty * amount : NaN;
  const unitPrice = !isNaN(totalValue) && qty > 0 ? totalValue / qty : NaN;

  const totalDisplay = isNaN(totalValue)
    ? "—"
    : formatCurrencyAmount(totalValue, data.currency, {
        showCode: true,
        grouping: true,
      });

  const unitPriceDisplay = isNaN(unitPrice)
    ? "—"
    : formatCurrencyAmount(unitPrice, data.currency, {
        showCode: true,
        grouping: true,
      });

  const isQtyValid = data.quantity !== "" && !isNaN(qty) && qty > 0;
  const isPriceValid = data.pricePerUnit !== "" && !isNaN(amount) && amount > 0;
  const isUnitValid = data.unit !== "";
  const isAddressValid = isValidStellarAddress(data.sellerAddress);
  const deliveryDeadlineError = validateDeliveryDeadline(data.deliveryDeadline);
  const deliveryDeadlineSummary = formatRelativeDeliveryWindow(data.deliveryDeadline);

  const valid =
    data.commodity !== "" &&
    isQtyValid &&
    isPriceValid &&
    isAddressValid &&
    deliveryDeadlineError === "";

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validateStep1(data as unknown as Record<string, unknown>);
    setErrors((prev) => ({
      ...prev,
      [field]: errs[field] || "",
    }));
  };

  const handleContinue = () => {
    const allTouched: Record<string, boolean> = {};
    for (const key of ["commodity", "quantity", "unit", "pricePerUnit", "currency", "sellerAddress", "deliveryDeadline"]) {
      allTouched[key] = true;
    }
    setTouched(allTouched);
    const errs = validateStep1(data as unknown as Record<string, unknown>);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep(2);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="commodity" className="text-sm text-text-secondary">{translateCopy("trade.commodity")}</label>
        <select
          id="commodity"
          value={data.commodity}
          onChange={(e) => { update({ commodity: e.target.value }); setErrors((prev) => ({ ...prev, commodity: "" })); }}
          onBlur={() => handleBlur("commodity")}
          className="bg-bg-input border border-border-default rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="">{translateCopy("ui.select_commodity_942e76a")}</option>
          {COMMODITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.commodity && touched.commodity && <p role="alert" aria-live="polite" className="text-status-danger text-xs mt-1">{errors.commodity}</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="quantity" className="text-sm text-text-secondary">{translateCopy("trade.quantity")}</label>
          <input
            id="quantity"
            type="number"
            min="0"
            placeholder={translateCopy("ui.e_g_500_bc628f9")}
            value={data.quantity}
            onChange={(e) => { update({ quantity: e.target.value }); setErrors((prev) => ({ ...prev, quantity: "" })); }}
            onBlur={() => handleBlur("quantity")}
            className="bg-bg-input border border-border-default rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-border-focus"
          />
          {errors.quantity && touched.quantity && <p role="alert" aria-live="polite" className="text-status-danger text-xs mt-1">{errors.quantity}</p>}
        </div>
        <div className="flex flex-col gap-1 w-36">
          <label htmlFor="unit" className="text-sm text-text-secondary">{translateCopy("trade.unit")}</label>
          <select
            id="unit"
            value={data.unit}
            onChange={(e) => { update({ unit: e.target.value }); setErrors((prev) => ({ ...prev, unit: "" })); }}
            onBlur={() => handleBlur("unit")}
            className="bg-bg-input border border-border-default rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-border-focus"
          >
            <option value="">{translateCopy("ui.select_unit_5f1c2a9")}</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          {errors.unit && touched.unit && <p role="alert" aria-live="polite" className="text-status-danger text-xs mt-1">{errors.unit}</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="price-per-unit" className="text-sm text-text-secondary">{translateCopy("ui.price_per_unit_ngn_bd3ba08")}</label>
          <input
            id="price-per-unit"
            type="number"
            min="0"
            placeholder={translateCopy("ui.e_g_450_812070a")}
            value={data.pricePerUnit}
            onChange={(e) => { update({ pricePerUnit: e.target.value }); setErrors((prev) => ({ ...prev, pricePerUnit: "" })); }}
            onBlur={() => handleBlur("pricePerUnit")}
            className="bg-bg-input border border-border-default rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-border-focus"
          />
          {errors.pricePerUnit && touched.pricePerUnit && <p role="alert" aria-live="polite" className="text-status-danger text-xs mt-1">{errors.pricePerUnit}</p>}
        </div>
        <div className="flex flex-col gap-1 w-28">
          <label htmlFor="currency" className="text-sm text-text-secondary">{translateCopy("trade.currency")}</label>
          <select
            id="currency"
            value={data.currency}
            onChange={(e) => update({ currency: e.target.value })}
            className="bg-bg-input border border-border-default rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-border-focus"
          >
            <option value="NGN">{getCurrencyInfo("NGN").code}</option>
            <option value="cNGN">{getCurrencyInfo("cNGN").code}</option>
          </select>
        </div>
      </div>

      {/* Total and unit price preview */}
      <div className="flex flex-col gap-2 rounded-lg bg-bg-elevated px-4 py-3 border border-border-default">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">{translateCopy("ui.estimated_total_1636f5a")}</span>
          <span className="text-gold font-semibold">{totalDisplay}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">{translateCopy("ui.unit_price_7d4e1b2")}</span>
          <span className="text-text-primary font-semibold">{unitPriceDisplay}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <SearchableSelect
          id="delivery-state"
          label={translateCopy("trade.delivery_state")}
          value={data.deliveryState ?? ""}
          options={NIGERIAN_STATES}
          placeholder={translateCopy("ui.select_state")}
          onChange={(state) => update({ deliveryState: state, deliveryMarket: "" })}
        />
        <SearchableSelect
          id="delivery-market"
          label={translateCopy("trade.delivery_market")}
          value={data.deliveryMarket ?? ""}
          options={MARKET_HUBS[data.deliveryState ?? ""] ?? []}
          placeholder={translateCopy("ui.select_market")}
          disabled={!data.deliveryState}
          onChange={(market) => update({ deliveryMarket: market })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="seller-address" className="text-sm text-text-secondary">{translateCopy("ui.seller_stellar_address_89151ee")}</label>
        <input
          id="seller-address"
          type="text"
          placeholder="G..."
          value={data.sellerAddress}
          onChange={(e) => { update({ sellerAddress: e.target.value }); setErrors((prev) => ({ ...prev, sellerAddress: "" })); }}
          onBlur={() => handleBlur("sellerAddress")}
          className="bg-bg-input border border-border-default rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-border-focus"
        />
        {errors.sellerAddress && touched.sellerAddress && <p role="alert" aria-live="polite" className="text-status-danger text-xs mt-1">{errors.sellerAddress}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="delivery-deadline" className="text-sm text-text-secondary">{translateCopy("trade.delivery_deadline")}</label>
        <input
          id="delivery-deadline"
          type="date"
          value={data.deliveryDeadline}
          onChange={(e) => { update({ deliveryDeadline: e.target.value }); setErrors((prev) => ({ ...prev, deliveryDeadline: "" })); }}
          onBlur={() => handleBlur("deliveryDeadline")}
          className="bg-bg-input border border-border-default rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-border-focus"
        />
        {deliveryDeadlineSummary && !deliveryDeadlineError && (
          <p className="text-xs text-text-secondary">{deliveryDeadlineSummary}</p>
        )}
        {errors.deliveryDeadline && touched.deliveryDeadline && <p role="alert" aria-live="polite" className="text-status-danger text-xs mt-1">{errors.deliveryDeadline}</p>}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!valid}
          className="bg-gold text-bg-primary font-semibold rounded-md px-6 py-3 disabled:opacity-50"
        >
          {translateCopy("ui.continue")}
        </button>
      </div>
    </div>
  );
}
