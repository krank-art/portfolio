import fs from 'fs';
import { createRequire } from 'module';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
const d3 = require('d3-node')().d3; // has no ES Module exports

// https://observablehq.com/@d3/arc-pad-angle
// https://medium.com/@92sharmasaurabh/generate-svg-files-using-nodejs-d3-647d5b4f56eb

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
  svg
  .append("g").selectAll('path')
    .data(pieData)
    .enter()
    .append('path')
    .attr('d', arc);

  // Generate colors
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

  // https://jsfiddle.net/Qh9X5/1196/
  // https://stackoverflow.com/questions/21769872/d3-js-pie-chart-with-angled-horizontal-labels]

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
    .attr("x", function (d) {
      var a = d.startAngle + (d.endAngle - d.startAngle) / 2 - Math.PI / 2;
      d.cx = Math.cos(a) * (radius - 75);
      d.x = Math.cos(a) * (/*radius -*/ labelRadius);
      return d.x;
    })
    .attr("y", function (d) {
      var a = d.startAngle + (d.endAngle - d.startAngle) / 2 - Math.PI / 2;
      d.cy = Math.sin(a) * (radius - 75);
      d.y = Math.sin(a) * (/*radius -*/ labelRadius);
      return d.y - fontSize / 2;
    })
    //.attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", function (d) {
      const { startAngle, endAngle } = d;
      const angle = (startAngle + endAngle) / 2;
      return d.textAlign = angle >= Math.PI ? "end" : "start";
    })
    .each(function (d) {
      //const node = d.node();
      //const nodeType = node.constructor.name;
      //var bbox = node.getBBox();
      //const bbox = getBBoxPolyfill(dom.window, node);
      //const bbox = d.node().getBoundingClientRect();
      // d.sx = d.x - bbox.width / 2 - 2;
      // d.ox = d.x + bbox.width / 2 + 2;
      // d.sy = d.oy = d.y + 5;
      d.sx = d.textAlign === "start" ? d.x : d.x - lineLength;
      d.ox = d.textAlign === "start" ? d.x + lineLength : d.x;
      d.sy = d.y
      d.oy = d.y
    })
    .call(text => text.append("tspan")
      .attr("font-weight", "bold")
      .text(d => d.data.name))
    //.call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.15).append("tspan")
    .call(text => text.append("tspan")
      .attr("x", d => d.x)
      .attr("y", d => d.y + fontSize / 2 + (lineHeight - fontSize))
      .attr("fill-opacity", 0.7)
      .text(d => {
        const absoluteValue = d.data.value.toLocaleString("en-US");
        const relativeValue = (d.data.value / sum * 100).toFixed(2);
        return `${absoluteValue} (${relativeValue}%)`
      }));

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

function getBBoxPolyfill(window, textElement) {
  // By shannonhochkins, Feb 8 2023
  const { document } = window;
  const span = document.createElement('span');
  span.style.font = window.getComputedStyle(textElement).font;
  span.style.display = 'inline-block';
  span.textContent = textElement.textContent;
  document.body.appendChild(span);
  const rect = span.getBoundingClientRect();
  document.body.removeChild(span);
  const bbox = {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    top: rect.top,
  };
  return {
    ...bbox,
    toJSON: () => bbox,
  };
}

// Run the function
generateExampleChart();
