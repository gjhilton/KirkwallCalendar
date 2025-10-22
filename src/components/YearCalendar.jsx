import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// Constants
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_CELL_COLOR = '#eee';
const MONTH_LINE_COLOR = '#ddd';
const MONTH_LABEL_COLOR = '#666';
const ROW_SPACING = 20;
const AXIS_OFFSET = -20;

// Helper functions extracted outside component
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

const getDayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / MILLISECONDS_PER_DAY) - 1;
};

// Draw the month axis with markers and labels
const drawMonthAxis = (group, years, cellSize, rowHeight) => {
  if (years.length === 0) return;

  const firstYear = years[0];
  const months = d3.timeMonths(new Date(firstYear, 0, 1), new Date(firstYear, 11, 31));

  const axisGroup = group.append('g')
    .attr('class', 'axis-group')
    .attr('transform', `translate(0,${AXIS_OFFSET})`);

  const monthFormatter = d3.timeFormat('%b');

  months.forEach((monthDate) => {
    const dayIndex = getDayOfYear(monthDate);

    // Add vertical gridline for month boundary
    axisGroup.append('line')
      .attr('x1', dayIndex * cellSize)
      .attr('x2', dayIndex * cellSize)
      .attr('y1', 15)
      .attr('y2', (years.length * rowHeight) + 5)
      .attr('stroke', MONTH_LINE_COLOR)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    // Add month label (show every other month to avoid crowding)
    const monthIndex = monthDate.getMonth();
    if (monthIndex % 2 === 0) {
      axisGroup.append('text')
        .attr('x', dayIndex * cellSize + 10)
        .attr('y', 12)
        .style('font-size', '10px')
        .style('fill', MONTH_LABEL_COLOR)
        .style('font-weight', 'bold')
        .text(monthFormatter(monthDate));
    }
  });
};

// Draw a single year row
const drawYearRow = (group, year, yearIndex, cellSize, rowHeight, boxSize, boxHeight, colorMap) => {
  const yearGroup = group.append('g')
    .attr('transform', `translate(0,${yearIndex * rowHeight})`);

  // Add year label on the left
  yearGroup.append('text')
    .attr('x', -10)
    .attr('y', boxHeight / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text(year);

  // Determine number of days in this year
  const numDays = isLeapYear(year) ? 366 : 365;

  // Draw a box for each day
  for (let day = 0; day < numDays; day++) {
    const date = new Date(year, 0, day + 1);
    const dayOfYear = getDayOfYear(date);
    const color = colorMap?.get(dayOfYear) || DEFAULT_CELL_COLOR;

    yearGroup.append('rect')
      .attr('x', day * cellSize)
      .attr('y', 0)
      .attr('width', boxSize)
      .attr('height', boxHeight)
      .attr('fill', color)
      .style('cursor', 'pointer')
      .append('title')
      .text(() => {
        const dateStr = date.toISOString().split('T')[0];
        const colorInfo = colorMap?.get(dayOfYear) ? ` - ${colorMap.get(dayOfYear)}` : '';
        return `${dateStr}${colorInfo}`;
      });
  }
};

/**
 * YearCalendar component - Displays a calendar visualization with years as rows and days as boxes
 *
 * @param {Object} props - Component props
 * @param {number[]} props.years - Array of years to display
 * @param {Object.<number, Array<{date: string, color: string}>>} props.coloredDays - Object mapping years to colored day configurations
 * @param {number} props.boxSize - Width of each day box in pixels
 * @param {number} props.boxHeight - Height of each day box in pixels
 * @param {number} props.boxSpacing - Spacing between boxes in pixels
 * @param {Object} props.margin - Margin configuration {top, right, bottom, left}
 */
const YearCalendar = ({
  years = [],
  coloredDays = {},
  boxSize = 12,
  boxHeight = 12,
  boxSpacing = 2,
  margin = { top: 40, right: 20, bottom: 20, left: 60 }
}) => {
  const svgRef = useRef(null);

  // Memoize calculations that don't need to be recomputed on every render
  const dimensions = useMemo(() => {
    const cellSize = boxSize + boxSpacing;
    const rowHeight = boxHeight + ROW_SPACING;
    const daysInYear = 366; // Use max to accommodate leap years
    const width = daysInYear * cellSize + margin.left + margin.right;
    const height = years.length * rowHeight + margin.top + margin.bottom;

    return { cellSize, rowHeight, width, height };
  }, [boxSize, boxHeight, boxSpacing, margin, years.length]);

  // Memoize color map creation
  const colorMaps = useMemo(() => {
    const maps = {};

    years.forEach(year => {
      const yearColoredDays = coloredDays[year] || [];
      const colorMap = new Map();

      yearColoredDays.forEach(({ date, color }) => {
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime()) && d.getFullYear() === year) {
            const dayIndex = getDayOfYear(d);
            colorMap.set(dayIndex, color);
          }
        } catch (error) {
          console.warn(`Invalid date format: ${date}`, error);
        }
      });

      maps[year] = colorMap;
    });

    return maps;
  }, [years, coloredDays]);

  useEffect(() => {
    if (!svgRef.current || years.length === 0) return;

    const { cellSize, rowHeight, width, height } = dimensions;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Set SVG dimensions
    svg
      .attr('width', width)
      .attr('height', height);

    // Create main group with margins
    const mainGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw month axis (markers and labels)
    drawMonthAxis(mainGroup, years, cellSize, rowHeight);

    // Draw year rows
    years.forEach((year, yearIndex) => {
      drawYearRow(mainGroup, year, yearIndex, cellSize, rowHeight, boxSize, boxHeight, colorMaps[year]);
    });

  }, [years, coloredDays, boxSize, boxHeight, boxSpacing, dimensions, colorMaps, margin]);

  return (
    <div style={{ overflowX: 'auto', padding: '20px' }}>
      <svg ref={svgRef} aria-label="Year calendar visualization" />
    </div>
  );
};

export default YearCalendar;
