import fs from 'fs';
import { createRequire } from 'module';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
const d3 = require('d3-node')().d3; // has no ES Module exports

// https://observablehq.com/@d3/arc-pad-angle
// https://medium.com/@92sharmasaurabh/generate-svg-files-using-nodejs-d3-647d5b4f56eb
// https://jsfiddle.net/Qh9X5/1196/
// https://stackoverflow.com/questions/21769872/d3-js-pie-chart-with-angled-horizontal-labels]

function generateExampleChart() {
  // Set up D3 SVG container
  const width = 1200;
  const height = 800;
  const radius = 350;
  const innerRadius = 180;
  const labelRadius = 390;
  const fontSize = 16;
  const lineHeight = 24;
  const lineLength = 80;
  const data = [
    { name: "Visual Novel", value: 235 },
    { name: "Platformer", value: 85 },
    { name: "Adventure", value: 83 },
    { name: "Role Playing", value: 56 },
    { name: "Action", value: 53 },
    { name: "Puzzle", value: 29 },
    { name: "Interactive Fiction", value: 27 },
    { name: "Simulation", value: 26 },
    { name: "Shooter", value: 23 },
    { name: "Survival", value: 17 },
    { name: "Strategy", value: 10 },
    { name: "Rhythm", value: 8 },
    { name: "Racing", value: 6 },
    { name: "Fighting", value: 4 },
    { name: "Sports", value: 4 },
    { name: "Card Game", value: 2 },
    { name: "Educational", value: 2 },
    { name: "Untagged", value: 77 },
  ];
  const sum = data.reduce((accumulator, entry) => accumulator + entry.value, 0);

  const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  let body = d3.select(dom.window.document.querySelector("body"))
  let svg = body.append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('width', width)
    .attr('height', height)
    .attr("viewBox", [-width / 2, -height / 2, width, height]);

  // Create a pie chart layout
  const pie = d3.pie()
    .value(d => d.value)
    .padAngle(0.01)
    .sort(null);

  // Create an arc generator
  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius);

  // Create the pie chart data
  const pieData = pie(data);

  // Draw the donut chart
  svg.append("g").selectAll('path')
    .data(pieData)
    .enter()
    .append('path')
    .attr('d', arc);

  // Generate colors
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

  // Add color and attributes to donut chart
  svg.append("g")
    .selectAll()
    .data(pieData)
    .join("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arc)
    .append("title")
    .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);

  // Add text labels
  svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", fontSize)
    .selectAll()
    .data(pieData)
    .join("text")
    .each(function (d) {
      // Get orientation
      const { startAngle, endAngle } = d;
      const angle = (startAngle + endAngle) / 2;
      d.textAlign = angle >= Math.PI ? "end" : "start";

      // Get origin coords
      const angleCoords = angle - Math.PI / 2;
      d.cx = Math.cos(angleCoords) * (radius - 75);
      d.x = Math.cos(angleCoords) * labelRadius;
      d.cy = Math.sin(angleCoords) * (radius - 75);
      d.y = Math.sin(angleCoords) * labelRadius;

      // Get text for labels
      const absoluteValue = d.data.value.toLocaleString("en-US");
      const relativeValue = (d.data.value / sum * 100).toFixed(2);
      d.labelData = `${absoluteValue} (${relativeValue}%)`;
      d.labelTitle = d.data.name;

      // Get bounds
      d.width = Math.max(estimateTextWidth(d.labelTitle, fontSize), estimateTextWidth(d.labelData, fontSize));
      d.height = fontSize * 2 + (lineHeight - fontSize);

      // Get line coords
      // We cannot use d.node().getBBox() because JSDOM has no implementation for getBBox().
      d.sx = d.textAlign === "start" ? d.x : d.x - d.width;
      d.ox = d.textAlign === "start" ? d.x + d.width : d.x;
      d.sy = d.y
      d.oy = d.y
    })
    .attr("x", d => d.x)
    .attr("y", d => d.y - fontSize / 2)
    .attr("text-anchor", d => d.textAlign)
    .call(text => text.append("tspan")
      .attr("font-weight", "bold")
      .text(d => d.labelTitle))
    //.call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.15).append("tspan")
    .call(text => text.append("tspan")
      .attr("x", d => d.x)
      .attr("y", d => d.y + fontSize / 2 + (lineHeight - fontSize))
      .attr("fill-opacity", 0.7)
      .text(d => d.labelData));

  // Add circle marker definition
  svg.append("defs").append("marker")
    .attr("id", "circ")
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("refX", 3)
    .attr("refY", 3)
    .append("circle")
    .attr("cx", 3)
    .attr("cy", 3)
    .attr("r", 3);

  // Add lines from labels to segments
  svg.append("g").selectAll("path.pointer").data(pieData).enter()
    .append("path")
    .attr("class", "pointer")
    .style("fill", "none")
    .style("stroke", "black")
    .attr("marker-end", "url(#circ)")
    .attr("d", function (d) {
      return d.cx > d.ox
        ? `M${d.sx},${d.sy}L${d.ox},${d.oy} ${d.cx},${d.cy}`
        : `M${d.ox},${d.oy}L${d.sx},${d.sy} ${d.cx},${d.cy}`;
    });

  // Save the SVG as a file
  fs.writeFileSync('example-chart.svg', svg.node().outerHTML);
  console.log('Example chart generated: example-chart.svg');
}

function estimateTextWidth(text, fontSize) {
  // Define preset widths for common letters (customize based on your font)
  const letterWidths = {
    'a': 7, 'b': 7, 'c': 7, 'd': 7, 'e': 7, 'f': 4, 'g': 7, 'h': 7, 'i': 3, 'j': 3,
    'k': 7, 'l': 3, 'm': 11, 'n': 7, 'o': 7, 'p': 7, 'q': 7, 'r': 4, 's': 6, 't': 4,
    'u': 7, 'v': 7, 'w': 11, 'x': 7, 'y': 7, 'z': 6,
    'A': 10, 'B': 9, 'C': 9, 'D': 10, 'E': 9, 'F': 8, 'G': 10, 'H': 10, 'I': 4, 'J': 7,
    'K': 9, 'L': 8, 'M': 12, 'N': 10, 'O': 10, 'P': 9, 'Q': 10, 'R': 9, 'S': 9, 'T': 8,
    'U': 10, 'V': 10, 'W': 14, 'X': 10, 'Y': 10, 'Z': 9,
    '0': 7, '1': 4, '2': 7, '3': 7, '4': 7, '5': 7, '6': 7, '7': 7, '8': 7, '9': 7,
    '!': 3, '@': 12, '#': 9, '$': 9, '%': 14, '^': 6, '&': 11, '*': 6, '(': 4, ')': 4,
    '-': 6, '_': 6, '+': 9, '=': 9, '[': 4, ']': 4, '{': 6, '}': 6, '|': 3, ';': 4,
    ':': 4, "'": 3, '"': 6, ',': 4, '.': 4, '/': 6, '?': 7, '<': 9, '>': 9, '~': 9,
    '`': 3, '\\': 6, ' ': 4 // space width
  };

  // Calculate total width based on preset values
  const totalWidth = Array.from(text).reduce((width, char) => {
    return width + (letterWidths[char] || 0);
  }, 0);

  // Adjust for font size
  return totalWidth * (fontSize / 12); // Adjust based on your font size scaling factor
}

// Run the function
generateExampleChart();
