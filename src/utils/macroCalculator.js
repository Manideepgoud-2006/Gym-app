export const calculateBulkingTargets = (weightKg, goal = 'bulking') => {
  // Safe number conversion for ANY weight
  const parsed = parseFloat(weightKg);
  const weight = (!isNaN(parsed) && parsed > 0) ? parsed : 60;

  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let recommendedSteps = 8000;
  let cardioMinutes = 0;

  if (goal === 'cutting') {
    proteinG = Math.round(weight * 2.4);
    carbsG = Math.round(weight * 3.0);
    fatG = Math.round(weight * 0.8);
    recommendedSteps = 10000;
    cardioMinutes = 20;
  } else {
    // Bulking Mode (Default)
    proteinG = Math.round(weight * 2.0);
    carbsG = Math.round(weight * 5.0);
    fatG = Math.round(weight * 1.0);
    recommendedSteps = 8000;
    cardioMinutes = 0;
  }

  // Calculate total calories safely from macros
  const totalCalories = (proteinG * 4) + (carbsG * 4) + (fatG * 9);
  const fiberG = Math.max(25, Math.round((totalCalories / 1000) * 14));

  return {
    goal,
    weightKg: weight,
    totalCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    recommendedSteps,
    cardioMinutes
  };
};