import './App.css'
import YearCalendar from './components/YearCalendar'

function App() {
  const eventsByYear = {
    2023: [
      { date: '2023-01-01', color: '#ff0000' },
      { date: '2023-02-14', color: '#ff0000' },
      { date: '2023-07-04', color: '#ff0000' },
      { date: '2023-12-25', color: '#ff0000' },
    ],
    2024: [
      { date: '2024-01-01', color: '#ff0000' },
      { date: '2024-02-14', color: '#ff0000' },
      { date: '2024-06-21', color: '#ff0000' },
    ],
    2025: [
      { date: '2025-01-01', color: '#ff0000' },
      { date: '2025-02-14', color: '#ff0000' },
      { date: '2025-07-04', color: '#ff0000' },
      { date: '2025-12-25', color: '#ff0000' },
    ],
  };

  return (
    <div className="App">
      <YearCalendar
        eventsByYear={eventsByYear}
        dayCellWidth={2}
        dayCellHeight={8}
        yearRowHeight={12}
        cellSpacing={0}
      />
    </div>
  )
}

export default App
