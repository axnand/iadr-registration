// pricing-logic.js

// 1 USD = 75 INR is your fallback if the API call fails
async function getUsdToInrRate() {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    if (data && data.rates && data.rates.INR) {
      return data.rates.INR;
    }
    throw new Error("Invalid response");
  } catch (error) {
    console.error("Failed to fetch conversion rate. Using fallback value:", error);
    return 75; // fallback
  }
}

// -------------- PRICING TABLES -------------- //

// Category-based pricing
// All INR amounts include base + 18% GST in your table (e.g. 13000 + 2340 = 15340, etc.)
const categoryPricing = {
  "ISDR Member": {
    earlyBird: 15340,
    standard: 16520,
    late: 17700,
    currency: "INR",
  },
  "Non-Member (Delegate)": {
    earlyBird: 17700,
    standard: 20060,
    late: 23600,
    currency: "INR",
  },
  "Student (ISDR Member)": {
    earlyBird: 14160,
    standard: 16520,
    late: 17700,
    currency: "INR",
  },
  "Student (Non-Member)": {
    earlyBird: 14800,
    standard: 17700,
    late: 20060,
    currency: "INR",
  },
  "Accompanying Person": {
    earlyBird: 15340,
    standard: 17700,
    late: 17700,
    currency: "INR",
  },
  "International Delegate (IADR Member)": {
    earlyBird: 400, // USD
    standard: 450,  // USD
    late: 500,      // USD
    currency: "USD",
  },
  "International Delegate (Non-IADR)": {
    earlyBird: 500, // USD
    standard: 600,  // USD
    late: 700,      // USD
    currency: "USD",
  },
};

// Event-based pricing
const eventTypePricing = {
  "WWW9 Meeting Fee": {
    "International Delegate": 275,                // USD
    "International Delegate (Asia Pacific)": 250, // USD
    "Indian Delegate": 11000,                     // INR (+ GST)
    "UG Students": 6000,                          // INR (+ GST)
    currency: {
      "International Delegate": "USD",
      "International Delegate (Asia Pacific)": "USD",
      "Indian Delegate": "INR",
      "UG Students": "INR",
    },
  },
  "IADR-APR Fee": {
    "International Delegate": 450, // USD
    "Indian Delegate": 14000,      // INR (+ GST)
    "UG Students": 11000,          // INR (+ GST)
    currency: {
      "International Delegate": "USD",
      "Indian Delegate": "INR",
      "UG Students": "INR",
    },
  },
  "Combo (WWW9 & IADR-APR)": {
    "International Delegate": 625, // USD
    "Indian Delegate": 23000,      // INR (+ GST)
    "UG Students": 16000,          // INR (+ GST)
    currency: {
      "International Delegate": "USD",
      "Indian Delegate": "INR",
      "UG Students": "INR",
    },
  },
};

// Accompanying person charges (for each additional person)
const accompanyingPersonPricing = {
  "WWW9 Meeting Fee": 11000,   // INR (+ GST)
  "IADR-APR Fee": 14000,       // INR (+ GST)
  "Combo (WWW9 & IADR-APR)": 23000, // INR (+ GST)
};

// -------------- DATE-BASED TIER LOGIC -------------- //
function getPricingTier(currentDate) {
  const earlyBirdEndDate = new Date("2025-02-28"); // e.g., up to 28th Feb 2025
  const standardEndDate = new Date("2025-06-30"); // after 28th Feb to 30 June 2025

  if (currentDate <= earlyBirdEndDate) {
    return "earlyBird";
  } else if (currentDate <= standardEndDate) {
    return "standard";
  } else {
    return "late";
  }
}

// -------------- DETERMINE DELEGATE TYPE FOR EVENT PRICING -------------- //
function getDelegateTypeForEvent(category) {
  // If category includes "international delegate", treat as "International Delegate"
  if (
    category.toLowerCase().includes("international delegate (iadr member)") ||
    category.toLowerCase().includes("international delegate (non-iadr)")
  ) {
    return "International Delegate";
  } else if (category.toLowerCase().includes("student")) {
    return "UG Students";
  } else {
    // default to "Indian Delegate"
    return "Indian Delegate";
  }
}

// -------------- MAIN CALCULATION FUNCTION -------------- //
export async function calculateTotalAmount(
  category,
  eventType,
  numberOfAccompanying,
  currentDate
) {
  // 1) Fetch the latest USD-to-INR conversion rate
  const usdToInrRate = await getUsdToInrRate();
  let totalInINR = 0;

  let totalUSD = 0;
  const pricingTier = getPricingTier(currentDate);

  // 3) Category-based price
  if (categoryPricing[category]) {
    const basePrice = categoryPricing[category][pricingTier];
    const currency = categoryPricing[category].currency;
    if (currency === "USD") {
      totalUSD += basePrice;
    } else {
      totalInINR += basePrice;
    }
  }

  // 4) Event-based price
  if (eventTypePricing[eventType]) {
    const delegateType = getDelegateTypeForEvent(category);
    const eventData = eventTypePricing[eventType];
    const price = eventData[delegateType];
    const currency = eventData.currency[delegateType];

    if (typeof price === "number") {
      if (currency === "USD") {
        totalUSD += price;
      } else {
        totalInINR += price;
      }
    }
  }

  // 5) Accompanying persons
  if (numberOfAccompanying > 0 && accompanyingPersonPricing[eventType]) {
    // All given in INR
    const accompanyBase = accompanyingPersonPricing[eventType];
    totalInINR += accompanyBase * numberOfAccompanying;
  }

  if (categoryPricing[category] && categoryPricing[category].currency === "USD") {
    // Return amount in USD (convert dollars to cents)
    const totalCents = Math.round(totalUSD * 100);
    return { amount: totalCents, currency: "USD" };
  } else {
    // Return amount in INR (convert rupees to paise)
    const totalPaise = Math.round(totalInINR * 100);
    return { amount: totalPaise, currency: "INR" };
  }

  return Math.round(totalInINR);
}
