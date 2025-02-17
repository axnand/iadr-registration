// pricing-logic.js

// Fetch the latest USD-to-INR conversion rate from an API
async function getUsdToInrRate() {
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await response.json();
      // Ensure the API returned a valid INR rate
      if (data && data.rates && data.rates.INR) {
        return data.rates.INR;
      }
      throw new Error("Invalid response");
    } catch (error) {
      console.error("Failed to fetch conversion rate. Using fallback value:", error);
      return 75; // Fallback value if the API call fails
    }
  }
  
  // -------------- PRICING TABLES -------------- //
  
  const categoryPricing = {
    "ISDR Member": {
      earlyBird: 15340,
      standard: 16520,
      late: 17700,
      currency: "INR",
    },
    "Non-Member": {
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
      earlyBird: 400, // in USD
      standard: 450,  // in USD
      late: 500,      // in USD
      currency: "USD",
    },
    "International Delegate (Non-IADR)": {
      earlyBird: 500, // in USD
      standard: 600,  // in USD
      late: 700,      // in USD
      currency: "USD",
    },
  };
  
  const eventTypePricing = {
    "WWW9 Meeting Fee": {
      "International Delegate": 275,         // USD
      "International Delegate (Asia Pacific)": 250, // USD
      "Indian Delegate": 11000,             // INR (+ GST)
      "UG Students": 6000,                  // INR (+ GST)
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
  
  const accompanyingPersonPricing = {
    "WWW9 Meeting Fee": 11000,   // INR (+ GST)
    "IADR-APR Fee": 14000,       // INR (+ GST)
    "Combo (WWW9 & IADR-APR)": 23000, // INR (+ GST)
  };
  
  // -------------- DATE-BASED TIER LOGIC -------------- //
  function getPricingTier(currentDate) {
    const earlyBirdEndDate = new Date("2025-05-31");
    const standardEndDate = new Date("2025-06-30");
  
    if (currentDate <= earlyBirdEndDate) {
      return "earlyBird";
    } else if (currentDate <= standardEndDate) {
      return "standard";
    } else {
      return "late";
    }
  }
  
  // -------------- DELEGATE TYPE FOR EVENT PRICING -------------- //
  function getDelegateTypeForEvent(category) {
    if (
      category.toLowerCase().includes("international delegate (iadr member)") ||
      category.toLowerCase().includes("international delegate (non-iadr)")
    ) {
      return "International Delegate";
    } else if (category.toLowerCase().includes("student")) {
      return "UG Students";
    } else {
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
    // Fetch the latest USD to INR conversion rate
    const usdToInrRate = await getUsdToInrRate();
    let totalInINR = 0;
    const pricingTier = getPricingTier(currentDate);
  
    // 1) Category-based price
    if (categoryPricing[category]) {
      const basePrice = categoryPricing[category][pricingTier];
      const currency = categoryPricing[category].currency;
      if (currency === "USD") {
        totalInINR += basePrice * usdToInrRate;
      } else {
        totalInINR += basePrice;
      }
    }
  
    // 2) Event-based price
    if (eventTypePricing[eventType]) {
      const delegateType = getDelegateTypeForEvent(category);
      const eventData = eventTypePricing[eventType];
      const price = eventData[delegateType];
      const currency = eventData.currency[delegateType];
      if (typeof price === "number") {
        if (currency === "USD") {
          totalInINR += price * usdToInrRate;
        } else {
          totalInINR += price;
        }
      }
    }
  
    // 3) Accompanying persons
    if (numberOfAccompanying > 0 && accompanyingPersonPricing[eventType]) {
      const accompanyBase = accompanyingPersonPricing[eventType];
      totalInINR += accompanyBase * numberOfAccompanying;
    }
  
    // 4) GST for domestic participants (18%)
    if (!category.toLowerCase().includes("international delegate")) {
      totalInINR *= 1.18;
    }
  
    return Math.round(totalInINR);
  }
  