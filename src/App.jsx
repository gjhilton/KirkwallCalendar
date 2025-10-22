import { useState } from 'react'
import './App.css'
import YearCalendar from './components/YearCalendar'

function App() {
  // Example: Display years 2023, 2024, 2025
  const years = [2023, 2024, 2025];

  // Example: Color specific days
  // Format: { year: [{ date: 'YYYY-MM-DD', color: 'color-value' }, ...] }
  const coloredDays = {
    2023: [
      { date: '2023-01-01', color: '#ff0000' }, // New Year - Red
      { date: '2023-02-14', color: '#ff69b4' }, // Valentine's Day - Pink
      { date: '2023-07-04', color: '#0000ff' }, // Independence Day - Blue
      { date: '2023-12-25', color: '#00ff00' }, // Christmas - Green
    ],
    2024: [
      { date: '2024-01-01', color: '#ff0000' },
      { date: '2024-02-14', color: '#ff69b4' },
      { date: '2024-07-04', color: '#0000ff' },
      { date: '2024-12-25', color: '#00ff00' },
      // Add a range of summer days
      { date: '2024-06-21', color: '#ffd700' },
      { date: '2024-06-22', color: '#ffd700' },
      { date: '2024-06-23', color: '#ffd700' },
      { date: '2024-06-24', color: '#ffd700' },
      { date: '2024-06-25', color: '#ffd700' },
    ],
    2025: [
      { date: '2025-01-01', color: '#ff0000' },
      { date: '2025-02-14', color: '#ff69b4' },
      { date: '2025-07-04', color: '#0000ff' },
      { date: '2025-12-25', color: '#00ff00' },
    ],
  };

  return (
    <div className="App">
      <h1>Year Calendar Visualization</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        Each row represents a year, with each box representing a day.
        Hover over boxes to see dates.
      </p>
      <YearCalendar
        years={years}
        coloredDays={coloredDays}
        boxSize={2}
        boxSpacing={0}
      />
    </div>
  )
}

export default App
