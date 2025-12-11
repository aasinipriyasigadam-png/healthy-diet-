/* script.js
 - Handles the form (#healthForm) in your index.html and writes recommendations into #result.
 - Reads the form fields already present in index.html (name, age, gender, weight, height, activity, dietPref, goal).
 - Produces: BMI, BMR, daily calorie target (adjusted for activity + goal), macro grams, sample meals, and habit tips.
*/

(function () {
  const form = document.getElementById('healthForm');
  const result = document.getElementById('result');
  const resetBtn = document.getElementById('resetBtn');

  if (!form || !result) return;

  function round(n, d = 0) {
    const p = Math.pow(10, d);
    return Math.round(n * p) / p;
  }

  function calcBMI(weightKg, heightCm) {
    const h = heightCm / 100;
    return weightKg / (h * h);
  }

  function calcBMR({weight, height, age, gender}) {
    // Mifflin-St Jeor
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (gender === 'female') {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      // neutral average if gender not specified
      return 10 * weight + 6.25 * height - 5 * age - 78;
    }
  }

  function activityMultiplier(activity) {
    switch (activity) {
      case 'sedentary': return 1.2;
      case 'light': return 1.375;
      case 'moderate': return 1.55;
      case 'active': return 1.725;
      case 'very': return 1.9;
      default: return 1.2;
    }
  }

  function goalCalories(calories, goal) {
    if (goal === 'lose') {
      return Math.max(1200, calories - 500); // safe floor
    } else if (goal === 'gain') {
      return calories + 400;
    } else {
      return calories;
    }
  }

  function macroSplitByDiet(dietPref) {
    // returns percentages for carbs/protein/fat
    switch (dietPref) {
      case 'vegan':
      case 'vegetarian':
      case 'balanced':
        return {carb: 0.50, protein: 0.20, fat: 0.30};
      case 'pescatarian':
        return {carb: 0.45, protein: 0.25, fat: 0.30};
      case 'lowcarb':
        return {carb: 0.30, protein: 0.35, fat: 0.35};
      case 'keto':
        return {carb: 0.05, protein: 0.25, fat: 0.70};
      default:
        return {carb: 0.50, protein: 0.20, fat: 0.30};
    }
  }

  function gramsFromCalories(calories, pct) {
    // carbs & protein = 4 kcal/g, fat = 9 kcal/g
    return {
      carb: round((calories * pct.carb) / 4, 0),
      protein: round((calories * pct.protein) / 4, 0),
      fat: round((calories * pct.fat) / 9, 0)
    };
  }

  function healthCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  function sampleMeals(calories, macros, dietPref) {
    // Simple examples; keep short and editable
    // We'll give proportional portions rather than full recipe details
    const breakfasts = {
      default: 'Oat porridge with fruit, nuts and a spoon of yogurt or plant-based alternative',
      vegetarian: 'Greek yogurt, berries, granola, and a drizzle of honey',
      vegan: 'Overnight oats with almond milk, chia seeds and banana'
    };

    const lunches = {
      default: 'Grain bowl with mixed greens, protein (chicken/legumes/fish), veggies and a light dressing',
      lowcarb: 'Large salad with salmon/eggs, avocado and olive oil dressing',
      keto: 'Grilled salmon or chicken, sautéed greens and generous avocado/olive oil'
    };

    const dinners = {
      default: 'Lean protein, roasted vegetables and a portion of whole grains (quinoa/brown rice)',
      vegan: 'Lentil curry with mixed vegetables and a side of brown rice',
      vegetarian: 'Paneer/tofu stir fry with vegetables and a small portion of whole grain'
    };

    const snacks = [
      'Handful of nuts and a piece of fruit',
      'Hummus with carrot/cucumber sticks',
      'Cottage cheese or a small protein smoothie'
    ];

    const pick = (obj, pref) => {
      if (pref === 'vegan' && obj.vegan) return obj.vegan;
      if (pref === 'vegetarian' && obj.vegetarian) return obj.vegetarian;
      if (pref === 'lowcarb' && obj.lowcarb) return obj.lowcarb;
      if (pref === 'keto' && obj.keto) return obj.keto;
      return obj.default;
    };

    return {
      breakfast: pick(breakfasts, dietPref),
      lunch: pick(lunches, dietPref),
      dinner: pick(dinners, dietPref),
      snack: snacks[Math.floor(Math.random() * snacks.length)]
    };
  }

  function formatNumber(n) {
    return typeof n === 'number' ? n.toLocaleString() : n;
  }

  function renderRecommendations(payload) {
    const {
      name, age, gender, weight, height, bmi, bmiCategory,
      bmr, tdee, targetCalories, macrosPercent,
      macroGrams, meals, tips
    } = payload;

    result.classList.remove('visually-hidden');
    result.innerHTML = `
      <div class="result-inner">
        <h3>Hi ${name ? escapeHtml(name) : 'there'}, here are your personalised recommendations</h3>

        <section class="results-summary card small">
          <ul>
            <li><strong>BMI:</strong> ${formatNumber(bmi)} (${bmiCategory})</li>
            <li><strong>BMR:</strong> ${round(bmr)} kcal/day</li>
            <li><strong>Estimated daily needs (TDEE):</strong> ${round(tdee)} kcal/day</li>
            <li><strong>Target calories (${escapeHtml(payload.goalLabel)}):</strong> ${round(targetCalories)} kcal/day</li>
          </ul>
        </section>

        <section class="macros card small">
          <h4>Macro target</h4>
          <p>${Math.round(macrosPercent.carb * 100)}% carbs • ${Math.round(macrosPercent.protein * 100)}% protein • ${Math.round(macrosPercent.fat * 100)}% fat</p>
          <p><strong>Goal grams / day:</strong> ${macroGrams.carb}g carbs • ${macroGrams.protein}g protein • ${macroGrams.fat}g fat</p>
        </section>

        <section class="meal-suggestions card small">
          <h4>Sample meals</h4>
          <ul>
            <li><strong>Breakfast:</strong> ${escapeHtml(meals.breakfast)}</li>
            <li><strong>Lunch:</strong> ${escapeHtml(meals.lunch)}</li>
            <li><strong>Dinner:</strong> ${escapeHtml(meals.dinner)}</li>
            <li><strong>Snack:</strong> ${escapeHtml(meals.snack)}</li>
          </ul>
        </section>

        <section class="tips card small">
          <h4>Daily habit tips</h4>
          <ul>
            ${tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
          </ul>
        </section>
      </div>
    `;

    // Smooth scroll to results (if needed)
    result.scrollIntoView({behavior: 'smooth'});
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const age = parseInt(document.getElementById('age').value, 10);
    const gender = document.getElementById('gender').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const activity = document.getElementById('activity').value;
    const dietPref = document.getElementById('dietPref').value;
    const goal = document.getElementById('goal').value;

    // Basic validation
    const errors = [];
    if (!age || age < 5 || age > 120) errors.push('Please enter a valid age (5–120).');
    if (!weight || weight < 20 || weight > 500) errors.push('Please enter a valid weight (kg).');
    if (!height || height < 80 || height > 250) errors.push('Please enter a valid height (cm).');

    if (errors.length) {
      result.classList.remove('visually-hidden');
      result.innerHTML = `<div class="card small error"><strong>Please fix these:</strong><ul>${errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>`;
      result.scrollIntoView({behavior: 'smooth'});
      return;
    }

    // Calculations
    const bmi = round(calcBMI(weight, height), 1);
    const bmiCategory = healthCategory(bmi);
    const bmr = calcBMR({weight, height, age, gender});
    const tdee = round(bmr * activityMultiplier(activity), 0);
    const targetCalories = goalCalories(tdee, goal);
    const macrosPercent = macroSplitByDiet(dietPref);
    const macroGrams = gramsFromCalories(targetCalories, macrosPercent);
    const meals = sampleMeals(targetCalories, macroGrams, dietPref);

    const tips = [
      'Prioritise whole foods: vegetables, fruits, whole grains, legumes, nuts, seeds, lean proteins.',
      'Hydrate regularly — aim for several glasses of water spread across the day.',
      'Include a protein source at each meal to support satiety and muscle maintenance.',
      'Aim for consistent sleep (7–9 hours) and regular physical activity.',
      'If you have specific medical conditions, consult a registered dietitian or doctor for tailored advice.'
    ];

    renderRecommendations({
      name, age, gender, weight, height,
      bmi, bmiCategory, bmr, tdee,
      targetCalories, macrosPercent, macroGrams,
      meals, tips,
      goalLabel: (goal === 'lose' ? 'Lose weight' : goal === 'gain' ? 'Gain weight' : 'Maintain / Improve habits')
    });
  });

  resetBtn && resetBtn.addEventListener('click', function () {
    form.reset();
    result.classList.add('visually-hidden');
    result.innerHTML = '';
  });

})();
