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

// -------------- UPDATED PRICING TABLES -------------- //

const iadrAprPricing = {
  "ISDR Member": { 
    earlyBird: { fee: 15340, convenienceFee: 360 }, 
    standard: { fee: 16520, convenienceFee: 390 }, 
    late: { fee: 17700, convenienceFee: 420 }, 
    currency: "INR" 
  },
  "Non-Member (Delegate)": { 
    earlyBird: { fee: 17700, convenienceFee: 420 }, 
    standard: { fee: 20060, convenienceFee: 470 }, 
    late: { fee: 23600, convenienceFee: 560 }, 
    currency: "INR" 
  },
  "Student (ISDR Member)": { 
    earlyBird: { fee: 14160, convenienceFee: 330 }, 
    standard: { fee: 16520, convenienceFee: 390 }, 
    late: { fee: 17700, convenienceFee: 420 }, 
    currency: "INR" 
  },
  "Student (Non-Member)": { 
    earlyBird: { fee: 14800, convenienceFee: 350 }, 
    standard: { fee: 17700, convenienceFee: 420 }, 
    late: { fee: 20060, convenienceFee: 470 }, 
    currency: "INR" 
  },
  "Accompanying Person (Non-Dentist)": { 
    earlyBird: { fee: 15340, convenienceFee: 360 }, 
    standard: { fee: 17700, convenienceFee: 420 }, 
    late: { fee: 17700, convenienceFee: 420 }, 
    currency: "INR" 
  },
  "International Delegate (IADR Member)": { 
    earlyBird: { fee: 400, convenienceFee: 10 }, 
    standard: { fee: 450, convenienceFee: 11 }, 
    late: { fee: 500, convenienceFee: 12 }, 
    currency: "USD" 
  },
  "International Delegate (Non-IADR Member)": { 
    earlyBird: { fee: 500, convenienceFee: 12 }, 
    standard: { fee: 600, convenienceFee: 14 }, 
    late: { fee: 700, convenienceFee: 17 }, 
    currency: "USD" 
  },
  "Domestic Student Presenting Paper": { 
    earlyBird: { fee: 10620, convenienceFee: 250 }, 
    standard: { fee: 10620, convenienceFee: 250 }, 
    late: { fee: 10620, convenienceFee: 250 }, 
    currency: "INR" 
  },
};


// WW9 offer for IADR APR registered delegates (only early bird period)
const ww9OfferPricing = {
  "Indian IADR APR delegate": { fee: 5000, convenienceFee: 120, currency: "INR" },
  "International IADR APR delegate": { fee: 60, convenienceFee: 3, currency: "USD" }
};

const accompanyingPersonPricing = {
  "IADR-APR": {
    "Accompanying Person (Non-Dentist)": { 
      earlyBird: { fee: 15340, convenienceFee: 360 }, 
      standard: { fee: 17700, convenienceFee: 420 }, 
      late: { fee: 17700, convenienceFee: 420 }, 
      currency: "INR" 
    }
  },
};

function getPricingTier(currentDate) {
  const earlyBirdEndDate = new Date("2025-07-16"); // Updated to 15 July 2025
  const standardEndDate = new Date("2025-08-16"); // Updated to 15 August 2025

  if (currentDate <= earlyBirdEndDate) return "earlyBird";
  if (currentDate <= standardEndDate) return "standard";
  return "late";
}

export async function calculateTotalAmount(category, eventType, numberOfAccompanying, currentDate) {
  const pricingTier = getPricingTier(currentDate);
  let baseFee = 0;
  let convenienceFee = 0;
  let currency = "INR";

  // Fetch the latest USD to INR conversion rate
  const usdToInrRate = await getUsdToInrRate();

  // Calculate base fee from either the IADR-APR or eventTypePricing table
  if (eventType === "IADR-APR" && iadrAprPricing[category]) {
    const pricing = iadrAprPricing[category][pricingTier];
    baseFee = pricing.fee;
    convenienceFee = pricing.convenienceFee;
    currency = iadrAprPricing[category].currency;
  } else if (eventType && ww9OfferPricing[category]) {
    const pricing = ww9OfferPricing[category];
    baseFee = pricing.fee;
    convenienceFee = pricing.convenienceFee;
    currency = pricing.currency;
  }

  let totalAmount = { amount: baseFee + convenienceFee, currency, baseFee, convenienceFee };

  // Handle accompanying person charges if applicable
  if (numberOfAccompanying > 0) {
    // If category is an international delegate, allow only one accompanying person
    // and set the additional charge equal to the base fee + convenience fee.
    if (category.includes("International Delegate")) {
      numberOfAccompanying = 1;
      totalAmount.amount += baseFee + convenienceFee;
    } else {
      // Use a fixed key for accompanying person pricing based on the event type.
      const accompanyKey = eventType === "IADR-APR" ? "Accompanying Person (Non-Dentist)" : "Accompanying Person";
      if (accompanyingPersonPricing[eventType] && accompanyingPersonPricing[eventType][accompanyKey]) {
        let accompanyCharge = 0;
        let accompanyConvenienceFee = 0;
        const accompanyCurrency = accompanyingPersonPricing[eventType][accompanyKey].currency || "INR";

        if (eventType === "IADR-APR") {
          // For IADR-APR, use tier-based pricing
          const accompanyPricing = accompanyingPersonPricing[eventType][accompanyKey][pricingTier];
          accompanyCharge = accompanyPricing.fee;
          accompanyConvenienceFee = accompanyPricing.convenienceFee;
        } else {
          // For other events, use fixed amount
          accompanyCharge = accompanyingPersonPricing[eventType][accompanyKey].amount || 0;
        }

        // If accompanying fee is in USD but our base fee is in INR, convert the accompanying fee.
        if (accompanyCurrency === "USD" && currency === "INR") {
          accompanyCharge = Math.round(accompanyCharge * usdToInrRate);
          accompanyConvenienceFee = Math.round(accompanyConvenienceFee * usdToInrRate);
        }

        totalAmount.amount += (accompanyCharge + accompanyConvenienceFee) * numberOfAccompanying;
      }
    }
  }

  // Convert to smallest currency unit.
  // For INR, multiply by 100 (paise) and for USD, multiply by 100 (cents).
  totalAmount.amount = Math.round(totalAmount.amount * 100);

  return totalAmount;
}