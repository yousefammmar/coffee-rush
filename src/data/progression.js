export const DAY_TITLES = {
  1: 'First Brew', 2: 'Morning Crowd', 3: 'Sweet Tooth', 4: 'Cold Brew Season', 5: 'The First Rush',
  6: 'Fresh Faces', 7: 'Chocolate Monday', 8: 'Nutty Neighbourhood', 9: 'Deluxe Day', 10: 'Grand Rush',
};
export const LATER_TITLES = ['Regular Rush', 'Busy Street', 'Market Morning', 'Rainy Day Crowd', 'Festival Weekend', 'Latte Art Contest'];
// Days (>=5) that have a rush hour window.
export const RUSH_DAYS = new Set([5, 7, 8, 10]);
export const isRushDay = (d) => d >= 5 && (RUSH_DAYS.has(d) || d > 10);
export const MASTERY_STEPS = [5, 15, 30]; // correct makes per mastery level (each level +1 coin base price)
export const BUSINESS_START_HOUR = 8; // 8:00
export const BUSINESS_HOURS = 10; // until 18:00
