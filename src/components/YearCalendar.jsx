import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// Constants
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_CELL_COLOR = '#eee';
const MONTH_LINE_COLOR = '#000';
const MONTH_LABEL_COLOR = '#000';
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
const drawMonthAxis = (svgGroup, yearsToDisplay, dayCellWidth, totalRowHeight) => {
  if (yearsToDisplay.length === 0) return;

  const referenceYear = yearsToDisplay[0];
  const monthBoundaries = d3.timeMonths(
    new Date(referenceYear, 0, 1),
    new Date(referenceYear, 11, 31)
  );

  const axisGroup = svgGroup.append('g')
    .attr('class', 'axis-group')
    .attr('transform', `translate(0,${AXIS_OFFSET})`);

  const monthFormatter = d3.timeFormat('%b');

  monthBoundaries.forEach((monthStartDate) => {
    const dayOfYearIndex = getDayOfYear(monthStartDate);

    // Add vertical gridline for month boundary
    axisGroup.append('line')
      .attr('x1', dayOfYearIndex * dayCellWidth)
      .attr('x2', dayOfYearIndex * dayCellWidth)
      .attr('y1', 15)
      .attr('y2', (yearsToDisplay.length * totalRowHeight) + 5)
      .attr('stroke', MONTH_LINE_COLOR)
      .attr('stroke-width', 1);

    // Add month label - show first letter in uppercase for all months
    const monthLabel = monthFormatter(monthStartDate).charAt(0).toUpperCase();
    axisGroup.append('text')
      .attr('x', dayOfYearIndex * dayCellWidth + 5)
      .attr('y', 12)
      .style('font-size', '10px')
      .style('fill', MONTH_LABEL_COLOR)
      .style('font-weight', 'bold')
      .text(monthLabel);
  });
};

// Draw a single year row
const drawYearRow = (
  svgGroup,
  year,
  yearIndex,
  dayCellWidth,
  totalRowHeight,
  yearRowHeight,
  dayCellBoxWidth,
  dayColorMap
) => {
  const yearRowGroup = svgGroup.append('g')
    .attr('transform', `translate(0,${yearIndex * totalRowHeight})`);

  // Add year label on the left, vertically centered within the row height
  yearRowGroup.append('text')
    .attr('x', -10)
    .attr('y', yearRowHeight / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text(year);

  // Determine number of days in this year
  const totalDaysInYear = isLeapYear(year) ? 366 : 365;

  // Draw a box for each day - boxes fill the entire row height
  for (let dayIndex = 0; dayIndex < totalDaysInYear; dayIndex++) {
    const currentDate = new Date(year, 0, dayIndex + 1);
    const dayOfYearIndex = getDayOfYear(currentDate);
    const dayColor = dayColorMap?.get(dayOfYearIndex) || DEFAULT_CELL_COLOR;

    yearRowGroup.append('rect')
      .attr('x', dayIndex * dayCellWidth)
      .attr('y', 0)
      .attr('width', dayCellBoxWidth)
      .attr('height', yearRowHeight)
      .attr('fill', dayColor)
      .style('cursor', 'pointer')
      .append('title')
      .text(() => {
        const dateString = currentDate.toISOString().split('T')[0];
        const colorInfo = dayColorMap?.get(dayOfYearIndex)
          ? ` - ${dayColorMap.get(dayOfYearIndex)}`
          : '';
        return `${dateString}${colorInfo}`;
      });
  }
};

/**
 * YearCalendar component - Displays a calendar visualization with years as rows and days as boxes
 *
 * @param {Object} props - Component props
 * @param {Object.<number, Array<{date: string, color: string}>>} props.eventsByYear - Object mapping years to arrays of events with dates and colors
 * @param {number} props.dayCellWidth - Width of each day cell in pixels
 * @param {number} props.yearRowHeight - Height of each year row (day cells fill this height)
 * @param {number} props.cellSpacing - Horizontal spacing between day cells in pixels
 * @param {number} props.rowSpacing - Vertical spacing between year rows in pixels
 * @param {Object} props.chartMargin - Margin configuration {top, right, bottom, left}
 */
const YearCalendar = ({
  eventsByYear = {},
  dayCellWidth = 2,
  yearRowHeight = 30,
  cellSpacing = 2,
  rowSpacing = 10,
  chartMargin = { top: 40, right: 20, bottom: 20, left: 60 }
}) => {
  const svgRef = useRef(null);

  // Infer years from eventsByYear keys and sort them chronologically
  const sortedYears = useMemo(() => {
    return Object.keys(eventsByYear)
      .map(Number)
      .filter(year => !isNaN(year))
      .sort((a, b) => a - b);
  }, [eventsByYear]);

  // Memoize layout calculations that don't need to be recomputed on every render
  const layoutDimensions = useMemo(() => {
    const totalCellWidth = dayCellWidth + cellSpacing;
    const totalRowHeight = yearRowHeight + rowSpacing;
    const maxDaysInYear = 366; // Use max to accommodate leap years
    const totalWidth = maxDaysInYear * totalCellWidth + chartMargin.left + chartMargin.right;
    const totalHeight = sortedYears.length * totalRowHeight + chartMargin.top + chartMargin.bottom;

    return {
      dayCellWidth: totalCellWidth,
      totalRowHeight: totalRowHeight,
      svgWidth: totalWidth,
      svgHeight: totalHeight
    };
  }, [dayCellWidth, cellSpacing, yearRowHeight, rowSpacing, chartMargin, sortedYears.length]);

  // Memoize color map creation - converts events to day-of-year indexed color lookups
  const colorMapsByYear = useMemo(() => {
    const mapsByYear = {};

    sortedYears.forEach(year => {
      const eventsForYear = eventsByYear[year] || [];
      const dayColorMap = new Map();

      eventsForYear.forEach(({ date, color }) => {
        try {
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() === year) {
            const dayOfYearIndex = getDayOfYear(parsedDate);
            dayColorMap.set(dayOfYearIndex, color);
          }
        } catch (error) {
          console.warn(`Invalid date format: ${date}`, error);
        }
      });

      mapsByYear[year] = dayColorMap;
    });

    return mapsByYear;
  }, [sortedYears, eventsByYear]);

  useEffect(() => {
    if (!svgRef.current || sortedYears.length === 0) return;

    const { dayCellWidth, totalRowHeight, svgWidth, svgHeight } = layoutDimensions;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Set SVG dimensions
    svg
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    // Create main group with margins
    const mainGroup = svg.append('g')
      .attr('transform', `translate(${chartMargin.left},${chartMargin.top})`);

    // Draw month axis (markers and labels)
    drawMonthAxis(mainGroup, sortedYears, dayCellWidth, totalRowHeight);

    // Draw year rows
    sortedYears.forEach((year, yearIndex) => {
      drawYearRow(
        mainGroup,
        year,
        yearIndex,
        dayCellWidth,
        totalRowHeight,
        yearRowHeight,
        dayCellWidth,
        colorMapsByYear[year]
      );
    });

  }, [eventsByYear, dayCellWidth, yearRowHeight, rowSpacing, cellSpacing, layoutDimensions, colorMapsByYear, chartMargin, sortedYears]);

  return (
    <div style={{ overflowX: 'auto', padding: '20px' }}>
      <svg ref={svgRef} aria-label="Year calendar visualization" />
    </div>
  );
};

export default YearCalendar;
