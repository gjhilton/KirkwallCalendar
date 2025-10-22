import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const YearCalendar = ({ years, coloredDays = {}, boxSize = 12, boxSpacing = 2 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!svgRef.current || years.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 20, bottom: 20, left: 60 };
    const cellSize = boxSize + boxSpacing;
    const daysInYear = 365; // We'll handle leap years
    const width = daysInYear * cellSize + margin.left + margin.right;
    const height = years.length * (cellSize + 20) + margin.top + margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Helper function to check if a year is a leap year
    const isLeapYear = (year) => {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };

    // Helper function to get day of year (0-364 or 0-365 for leap years)
    const getDayOfYear = (date) => {
      const start = new Date(date.getFullYear(), 0, 0);
      const diff = date - start;
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay) - 1;
    };

    // Draw month markers and labels ONCE at the top (using first year for reference)
    const firstYear = years[0];
    const months = d3.timeMonths(new Date(firstYear, 0, 1), new Date(firstYear, 11, 31));

    const axisGroup = g.append('g')
      .attr('class', 'axis-group')
      .attr('transform', `translate(0,-20)`);

    months.forEach((monthDate) => {
      const dayIndex = getDayOfYear(monthDate);

      // Add month line that spans all years
      axisGroup.append('line')
        .attr('x1', dayIndex * cellSize)
        .attr('x2', dayIndex * cellSize)
        .attr('y1', 15)
        .attr('y2', (years.length * (cellSize + 20)) + 5)
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      // Add month label at the top
      if (dayIndex % 30 === 0 || monthDate.getMonth() % 2 === 0) {
        axisGroup.append('text')
          .attr('x', dayIndex * cellSize + 10)
          .attr('y', 12)
          .style('font-size', '10px')
          .style('fill', '#666')
          .style('font-weight', 'bold')
          .text(d3.timeFormat('%b')(monthDate));
      }
    });

    // Create a row for each year
    years.forEach((year, yearIndex) => {
      const yearGroup = g.append('g')
        .attr('transform', `translate(0,${yearIndex * (cellSize + 20)})`);

      // Add year label
      yearGroup.append('text')
        .attr('x', -10)
        .attr('y', cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(year);

      // Determine number of days in this year
      const numDays = isLeapYear(year) ? 366 : 365;

      // Get colored days for this year
      const yearColoredDays = coloredDays[year] || [];

      // Create a map of day index to color for quick lookup
      const colorMap = new Map();
      yearColoredDays.forEach(({ date, color }) => {
        const d = new Date(date);
        if (d.getFullYear() === year) {
          const dayIndex = getDayOfYear(d);
          colorMap.set(dayIndex, color);
        }
      });

      // Draw boxes for each day
      for (let day = 0; day < numDays; day++) {
        const date = new Date(year, 0, day + 1);
        const dayOfYear = getDayOfYear(date);
        const color = colorMap.get(dayOfYear) || '#eee';

        yearGroup.append('rect')
          .attr('x', day * cellSize)
          .attr('y', 0)
          .attr('width', boxSize)
          .attr('height', boxSize * 3)
          .attr('fill', color)
          /*.attr('stroke', '#fff')
          .attr('stroke-width', 1)*/
          //.attr('rx', 1)
          .style('cursor', 'pointer')
          .append('title')
          .text(() => {
            const dateStr = date.toISOString().split('T')[0];
            const colorInfo = colorMap.get(dayOfYear) ? ` - ${colorMap.get(dayOfYear)}` : '';
            return `${dateStr}${colorInfo}`;
          });
      }
    });

  }, [years, coloredDays, boxSize, boxSpacing]);

  return (
    <div style={{ overflowX: 'auto', padding: '20px' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default YearCalendar;
