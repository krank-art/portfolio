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
  const radius = Math.min(width, height) / 2;
  const innerRadius = 200;
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
  svg.selectAll('path')
    .data(pieData)
    .enter()
    .append('path')
    .attr('d', arc);

  // Generate colors
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

  // https://jsfiddle.net/Qh9X5/1196/

  // Add labels
  svg.append("g")
    .selectAll()
    .data(pie(data))
    .join("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arc)
    .append("title")
    .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);

  svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 16)
    .attr("text-anchor", "middle")
    .selectAll()
    .data(pie(data))
    .join("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .call(text => text.append("tspan")
      .attr("x", function (d) {
        var a = d.startAngle + (d.endAngle - d.startAngle) / 2 - Math.PI / 2;
        d.cx = Math.cos(a) * (radius - 75);
        return d.x = Math.cos(a) * (radius - 200);
      })
      .attr("y", function (d) {
        var a = d.startAngle + (d.endAngle - d.startAngle) / 2 - Math.PI / 2;
        d.cy = Math.sin(a) * (radius - 75);
        return d.y = Math.sin(a) * (radius - 200);
      })
      //.attr("y", "-0.4em")
      .attr("font-weight", "bold")
      .text(d => d.data.name))
    .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.15).append("tspan")
      //.call(text => text.append("tspan")
      .attr("x", 0)
      .attr("y", "0.7em")
      .attr("fill-opacity", 0.7)
      .text(d => d.data.value.toLocaleString("en-US")));

  // Save the SVG as a file
  fs.writeFileSync('example-chart.svg', svg.node().outerHTML);
  console.log('Example chart generated: example-chart.svg');
}

// Run the function
generateExampleChart();
