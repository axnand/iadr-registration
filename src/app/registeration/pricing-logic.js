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

const validCoupons = {
  "IADR2025": {
    applicableCategories: [
      "International Delegate (IADR Member)",
      "International Delegate (Non-IADR Member)"
    ],
    discountType: "fixed", 
    discountValues: {
      "International Delegate (IADR Member)": 410,
      "International Delegate (Non-IADR Member)": 512
    },
    currency: "USD",
    description: "Special discount for International Delegates"
  }
};

function validateAndApplyCoupon(couponCode, category, originalAmount, currency) {
  if (!couponCode || couponCode.trim() === '') {
    return { isValid: false, discount: 0, finalAmount: originalAmount };
  }

  const coupon = validCoupons[couponCode.toUpperCase()];
  
  if (!coupon) {
    return { isValid: false, discount: 0, finalAmount: originalAmount };
  }

  // Check if the coupon is applicable to the current category
  if (!coupon.applicableCategories.includes(category)) {
    return { isValid: false, discount: 0, finalAmount: originalAmount };
  }

  let discount = 0;
  let finalAmount = originalAmount;

  if (coupon.discountType === "fixed" && coupon.currency === currency) {
    const targetAmount = coupon.discountValues[category] * 100;
    if (originalAmount > targetAmount) {
      discount = originalAmount - targetAmount;
      finalAmount = targetAmount;
    }
  } else if (coupon.discountType === "percentage") {
    discount = Math.round((originalAmount * coupon.discountValue) / 100);
    finalAmount = originalAmount - discount;
  }

  return {
    isValid: true,
    discount: discount,
    finalAmount: Math.max(0, finalAmount),
    discountDescription: coupon.description
  };
}


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
  // "Domestic Student Presenting Paper": { 
  //   earlyBird: { fee: 10620, convenienceFee: 250 }, 
  //   standard: { fee: 10620, convenienceFee: 250 }, 
  //   late: { fee: 10620, convenienceFee: 250 }, 
  //   currency: "INR" 
  // },
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

export async function calculateTotalAmount(category, eventType, numberOfAccompanying, currentDate, couponCode = "") {
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

  const originalBaseFee = baseFee;
  const originalConvenienceFee = convenienceFee;
  let totalAmountBeforeCoupon = baseFee + convenienceFee;

  const couponResult = validateAndApplyCoupon(
    couponCode, 
    category, 
    totalAmountBeforeCoupon * 100, 
    currency
  );

  let mainDelegateAmount = couponResult.isValid ? couponResult.finalAmount : totalAmountBeforeCoupon * 100;
  let discount = couponResult.isValid ? couponResult.discount : 0;

  let accompanyingPersonTotal = 0;
  if (numberOfAccompanying > 0) {   
    if (category.includes("International Delegate")) {
      numberOfAccompanying = 1;
      accompanyingPersonTotal = (originalBaseFee + originalConvenienceFee) * numberOfAccompanying * 100;
    } else {
      const accompanyKey = eventType === "IADR-APR" ? "Accompanying Person (Non-Dentist)" : "Accompanying Person";
      if (accompanyingPersonPricing[eventType] && accompanyingPersonPricing[eventType][accompanyKey]) {
        let accompanyCharge = 0;
        let accompanyConvenienceFee = 0;
        const accompanyCurrency = accompanyingPersonPricing[eventType][accompanyKey].currency || "INR";

        if (eventType === "IADR-APR") {
          const accompanyPricing = accompanyingPersonPricing[eventType][accompanyKey][pricingTier];
          accompanyCharge = accompanyPricing.fee;
          accompanyConvenienceFee = accompanyPricing.convenienceFee;
        } else {
          accompanyCharge = accompanyingPersonPricing[eventType][accompanyKey].amount || 0;
        }

        
        if (accompanyCurrency === "USD" && currency === "INR") {
          accompanyCharge = Math.round(accompanyCharge * usdToInrRate);
          accompanyConvenienceFee = Math.round(accompanyConvenienceFee * usdToInrRate);
        }

        accompanyingPersonTotal = (accompanyCharge + accompanyConvenienceFee) * numberOfAccompanying * 100;
      }
    }
  }

  let finalAmount = mainDelegateAmount + accompanyingPersonTotal;
  let totalAmount = {
    amount: finalAmount,
    currency,
    baseFee: currency === "INR" ? `₹${baseFee}` : `$${baseFee}`,
    convenienceFee: currency === "INR" ? `₹${convenienceFee}` : `$${convenienceFee}`
  };

    if (couponResult.isValid && discount > 0) {
    totalAmount.discount = currency === "INR" ? `₹${(discount / 100).toFixed(2)}` : `$${(discount / 100).toFixed(2)}`;
    totalAmount.couponApplied = true;
    totalAmount.couponCode = couponCode;
    totalAmount.originalAmount = (totalAmountBeforeCoupon * 100) + accompanyingPersonTotal;
  }
    return totalAmount;
}