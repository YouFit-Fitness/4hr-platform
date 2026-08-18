/**
 * Onboarding questionnaire definition. Answers are stored as JSON on the client's
 * onboarding_responses row. Collect only what's needed to coach safely + effectively.
 */
export type OnboardingField = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "date";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type OnboardingSection = { id: string; title: string; fields: OnboardingField[] };

export const onboardingSections: OnboardingSection[] = [
  {
    id: "profile",
    title: "Your details",
    fields: [
      { key: "dob", label: "Date of birth", type: "date" },
      { key: "height_cm", label: "Height (cm)", type: "number", placeholder: "e.g. 178" },
      { key: "weight_kg", label: "Current weight (kg)", type: "number", required: true, placeholder: "e.g. 82" },
      { key: "occupation", label: "Occupation", type: "text" },
      { key: "timezone", label: "Your timezone", type: "text", required: true, placeholder: "e.g. Asia/Beirut, GMT+3" },
    ],
  },
  {
    id: "goal",
    title: "Your goal",
    fields: [
      { key: "primary_goal", label: "Primary goal", type: "select", required: true, options: ["Fat loss", "Muscle gain", "Body recomposition", "Improve fitness/strength"] },
      { key: "desired_result", label: "What result do you most want over the next few months?", type: "textarea", required: true },
      { key: "previous_attempts", label: "What have you tried before?", type: "textarea" },
      { key: "main_obstacles", label: "What's held you back?", type: "textarea" },
    ],
  },
  {
    id: "training",
    title: "Your training",
    fields: [
      { key: "experience", label: "Training experience", type: "select", required: true, options: ["Beginner", "Some experience", "Intermediate", "Advanced"] },
      { key: "current_training", label: "What does your current training look like?", type: "textarea" },
      { key: "days_available", label: "Days per week you can train", type: "number", required: true, placeholder: "e.g. 4" },
      { key: "preferred_days", label: "Preferred training days", type: "text", placeholder: "e.g. Mon, Wed, Fri, Sat" },
      { key: "time_per_session", label: "Time available per session", type: "select", options: ["30–45 min", "45–60 min", "60–75 min", "75+ min"] },
      { key: "location", label: "Where will you train?", type: "select", required: true, options: ["Full gym", "Home gym", "Home (minimal equipment)"] },
      { key: "equipment", label: "Available equipment", type: "textarea", placeholder: "e.g. barbell, dumbbells, machines, bands…" },
      { key: "exercise_preferences", label: "Exercises you love or want to avoid (injuries?)", type: "textarea" },
    ],
  },
  {
    id: "lifestyle",
    title: "Your lifestyle",
    fields: [
      { key: "work_schedule", label: "Typical work schedule", type: "text" },
      { key: "daily_activity", label: "Daily activity level", type: "select", options: ["Mostly sitting", "Moderately active", "On my feet a lot"] },
      { key: "avg_steps", label: "Average daily steps (if known)", type: "number" },
      { key: "sleep", label: "Typical sleep (hours + quality)", type: "text", placeholder: "e.g. 6–7h, often broken" },
      { key: "stress", label: "Current stress level", type: "select", options: ["Low", "Moderate", "High"] },
    ],
  },
  {
    id: "nutrition",
    title: "Your nutrition",
    fields: [
      { key: "current_eating", label: "How do you currently eat?", type: "textarea", required: true },
      { key: "meals_per_day", label: "Meals per day", type: "number" },
      { key: "food_preferences", label: "Foods you love", type: "textarea" },
      { key: "dietary_restrictions", label: "Allergies / dietary restrictions", type: "textarea" },
      { key: "workday_eating", label: "Typical weekday eating pattern", type: "textarea" },
      { key: "weekend_differences", label: "How do weekends differ?", type: "textarea" },
    ],
  },
];

export const onboardingFieldKeys = onboardingSections.flatMap((s) => s.fields.map((f) => f.key));
export const onboardingRequiredKeys = onboardingSections
  .flatMap((s) => s.fields)
  .filter((f) => f.required)
  .map((f) => f.key);
