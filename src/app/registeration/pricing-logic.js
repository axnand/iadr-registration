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

const iadrAprPricing = {
  "ISDR Member": { earlyBird: 15340, standard: 16520, late: 17700, currency: "INR" },
  "Non-Member (Delegate)": { earlyBird: 17700, standard: 20060, late: 23600, currency: "INR" },
  "Student (ISDR Member)": { earlyBird: 15340, standard: 17700, late: 17700, currency: "INR" },
  "Student (Non-Member)": { earlyBird: 15340, standard: 17700, late: 20060, currency: "INR" },
  "Accompanying Person (Non-Dentist)": { earlyBird: 15340, standard: 17700, late: 17700, currency: "INR" },
  "International Delegate (IADR Member)": { earlyBird: 400, standard: 450, late: 500, currency: "USD" },
  "International Delegate (Non-IADR Member)": { earlyBird: 500, standard: 600, late: 700, currency: "USD" },
  "Domestic Student Presenting Paper": { earlyBird: 10620 , standard: 10620 , late: 10620 , currency: "INR" },
};

const eventTypePricing = {
  "WW9 Meeting": {
    "International Delegate": { amount: 275, currency: "USD" },
    "International Delegate (Asia Pacific)": { amount: 250, currency: "USD" },
    "Indian Delegate": { amount: 11000, currency: "INR" },
    "Accompanying Person": { amount: 11000, currency: "INR" },
    "UG Students": { amount: 6000, currency: "INR" },
  },

  "Combo (WW9 & IADR-APR)": {
    "International Delegate": { amount: 625, currency: "USD" },
    "International Delegate (Asia Pacific)": { amount: 625, currency: "USD" },
    "Indian Delegate": { amount: 23000, currency: "INR" },
    "Accompanying Person": { amount: 23000, currency: "INR" },
    "UG Students": { amount: 16000, currency: "INR" },
  }
};

const accompanyingPersonPricing = {
  "WW9 Meeting": {
    "Accompanying Person": { amount: 11000, currency: "INR" }
  },
  "IADR-APR": {
    "Accompanying Person (Non-Dentist)": { earlyBird: 15340, standard: 17700, late: 17700, currency: "INR" }
  },
  "Combo (WW9 & IADR-APR)": {
    "Accompanying Person": { amount: 23000, currency: "INR" }
  }
  
};

function getPricingTier(currentDate) {
  const earlyBirdEndDate = new Date("2025-07-16");
  const standardEndDate = new Date("2025-08-16");

  if (currentDate <= earlyBirdEndDate) return "earlyBird";
  if (currentDate <= standardEndDate) return "standard";
  return "late";
}

export async function calculateTotalAmount(category, eventType, numberOfAccompanying, currentDate) {
  const pricingTier = getPricingTier(currentDate);
  let baseFee = 0;
  let currency = "INR";

  // Fetch the latest USD to INR conversion rate
  const usdToInrRate = await getUsdToInrRate();

  // Calculate base fee from either the IADR-APR or eventTypePricing table
  if (eventType === "IADR-APR" && iadrAprPricing[category]) {
    baseFee = iadrAprPricing[category][pricingTier];
    currency = iadrAprPricing[category].currency;
  } else if (eventTypePricing[eventType] && eventTypePricing[eventType][category]) {
    baseFee = eventTypePricing[eventType][category].amount;
    currency = eventTypePricing[eventType][category].currency;
  }

  let totalAmount = { amount: baseFee, currency };

  // Handle accompanying person charges if applicable
  if (numberOfAccompanying > 0) {
    // If category is an international delegate, allow only one accompanying person
    // and set the additional charge equal to the base fee.
    if (category.includes("International Delegate")) {
      numberOfAccompanying = 1;
      totalAmount.amount += baseFee;
    } else {
      // Use a fixed key for accompanying person pricing based on the event type.
      const accompanyKey = eventType === "IADR-APR" ? "Accompanying Person (Non-Dentist)" : "Accompanying Person";
      if (accompanyingPersonPricing[eventType] && accompanyingPersonPricing[eventType][accompanyKey]) {
        let accompanyCharge =
          accompanyingPersonPricing[eventType][accompanyKey].amount ||
          accompanyingPersonPricing[eventType][accompanyKey][pricingTier] ||
          0;
        const accompanyCurrency =
          accompanyingPersonPricing[eventType][accompanyKey].currency || "INR";

        // If accompanying fee is in USD but our base fee is in INR, convert the accompanying fee.
        if (accompanyCurrency === "USD") {
          accompanyCharge = Math.round(accompanyCharge * usdToInrRate);
        }

        totalAmount.amount += accompanyCharge * numberOfAccompanying;
      }
    }
  }

  // Convert to smallest currency unit.
  // For INR, multiply by 100 (paise) and for USD, multiply by 100 (cents).
  totalAmount.amount = Math.round(totalAmount.amount * 100);

  return totalAmount;
}
