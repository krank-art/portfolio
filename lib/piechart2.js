import fs from 'fs';
import { createRequire } from 'module';
import { JSDOM } from 'jsdom';

// https://observablehq.com/@d3/arc-pad-angle


const require = createRequire(import.meta.url);
const d3 = require('d3-node')().d3; // has no ES Module exports
//import * as d3 from 'd3-node';

/*
// https://medium.com/@92sharmasaurabh/generate-svg-files-using-nodejs-d3-647d5b4f56eb
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
let body = d3.select(dom.window.document.querySelector("body"))
let svg = body.append('svg').attr('width', 100).attr('height', 100).attr('xmlns', 'http://www.w3.org/2000/svg');
svg.append("rect")
    .attr("x", 10)
    .attr("y", 10)
    .attr("width", 80)
    .attr("height", 80)
    .style("fill", "orange");

fs.writeFileSync('out.svg', body.html());
*/


function generateExampleChart() {
  // Set up D3 SVG container
  const width = 1200;
  const height = 800;

  const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  let body = d3.select(dom.window.document.querySelector("body"))
  let svg = body.append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('width', width)
    .attr('height', height)
    .attr("viewBox", [-width / 2, -height / 2, width, height]);


  //const svg = d3.select('<svg xmlns="http://www.w3.org/2000/svg"/>')
  //  .attr('width', width)
  //  .attr('height', height);

  // Example data for the bar chart
  //const data = [10, 30, 45, 60, 20];


  //// Create scales
  //const xScale = d3.scaleBand().domain(d3.range(data.length)).range([0, width]).padding(0.1);
  //const yScale = d3.scaleLinear().domain([0, d3.max(data)]).range([height, 0]);

  /*
  // Draw bars
  svg.selectAll('rect')
    .data(data)
    .enter().append('rect')
    .attr('x', (d, i) => xScale(i))
    .attr('y', d => yScale(d))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d))
    .attr('fill', 'steelblue');
  */

  // Customize the labels, data, and colors
  const labels = ['Label 1', 'Label 2', 'Label 3'];
  //const data = [30, 40, 30];
  const data = [
    {name: "Visual Novel", value: 235}, 
    {name: "Platformer", value: 85}, 
    {name: "Adventure", value: 83}, 
    {name: "Role Playing", value: 56}, 
    {name: "Action", value: 53}, 
    {name: "Puzzle", value: 29}, 
    {name: "Interactive Fiction", value: 27}, 
    {name: "Simulation", value: 26}, 
    {name: "Shooter", value: 23}, 
    {name: "Survival", value: 17}, 
    {name: "Strategy", value: 10}, 
    {name: "Rhythm", value: 8}, 
    {name: "Racing", value: 6}, 
    {name: "Fighting", value: 4}, 
    {name: "Sports", value: 4}, 
    {name: "Card Game", value: 2}, 
    {name: "Educational", value: 2}, 
    {name: "Untagged", value: 77}, 
  ];
  const colors = ['#ff0000', '#00ff00', '#0000ff'];

  // Calculate total data sum
  const total = d3.sum(data);

  // Set up D3 SVG container
  //const width = 400;
  //const height = 300;


  // Define the center and radius of the donut chart
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;
  const innerRadius = 200;

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
    .attr('d', arc)
    .attr('fill', (d, i) => colors[i]);

  // Generate colors
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

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
      .attr("y", "-0.4em")
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
