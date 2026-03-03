export function useDateNavigation() {
  // Generate array of dates for the date picker (14 days: 7 past + today + 6 future)
  const generateDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = -7; i <= 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const dates = generateDates();
  const today = new Date();

  // Format date for display
  const formatNavDate = (date) => {
    const options = { month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const formatDatePickerDay = (date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
  };

  const formatDatePickerDate = (date) => {
    return date.getDate();
  };

  // Check if date is today
  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in the future
  const isFuture = (date) => {
    return date > today;
  };

  // Check if date is selected
  const isSelected = (date, selectedDate) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return {
    dates,
    today,
    formatNavDate,
    formatDatePickerDay,
    formatDatePickerDate,
    isToday,
    isFuture,
    isSelected,
  };
}
