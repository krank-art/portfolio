import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import fs from 'fs';

// Define the pie chart configuration
const pieChartConfig = {
    type: 'doughnut',
    plugins: [ChartDataLabels],
    data: {
        labels: ['Category 1', 'Category 2', 'Category 3', 'Category 4'],
        datasets: [{
            data: [
                {id: "Visual Novel", value: 235}, 
                {id: "Platformer", value: 85}, 
                {id: "Adventure", value: 83}, 
                {id: "Role Playing", value: 56}, 
                {id: "Action", value: 53}, 
                {id: "Puzzle", value: 29}, 
                {id: "Interactive Fiction", value: 27}, 
                {id: "Simulation", value: 26}, 
                {id: "Shooter", value: 23}, 
                {id: "Survival", value: 17}, 
                {id: "Strategy", value: 10}, 
                {id: "Rhythm", value: 8}, 
                {id: "Racing", value: 6}, 
                {id: "Fighting", value: 4}, 
                {id: "Sports", value: 4}, 
                {id: "Card Game", value: 2}, 
                {id: "Educational", value: 2}, 
                {id: "Untagged", value: 77}, 
            ],
            backgroundColor: [
                '#FF5959', 
                '#91BF4C',
                '#51A3CC',
                '#FF836B', 
                '#CAD259',
                '#56D8D8',
                '#FFB07F', 
                '#FFE566',
                '#98EAEA',
                '#49C199',
                '#70C99D',
                '#8CD8A3',
                '#9E5AE2',
                '#C874F2',
                '#E993FF',
                '#8C674F',
                '#A37759',
                '#BF8D61',
            ],
        }],
    },
    options: {
        plugins: {
            datalabels: {
                // https://chartjs-plugin-datalabels.netlify.app/guide/options.html
                render: 'percentage',
                color: 'black',
                font: {
                    family: "Krank",
                    size: "12px",
                },
                textAlign: "center",
                formatter: function(value, context) {
                    const { 
                        dataIndex: i, 
                        chart: { data },
                        dataset,
                    } = context;
                    const totalValue = dataset.data.reduce((accumulator, entry) => accumulator + entry.value, 0);
                    const label = dataset.data[i].id;
                    const absoluteValue = dataset.data[i].value;
                    const relativeValue = absoluteValue / totalValue;
                    return `${label}\n${absoluteValue} (${(relativeValue * 100).toFixed(2)}%)`;
                  },
            },
            legend: {
                display: false
            },
        },
    }
};

const chart = new ChartJSNodeCanvas({ type: 'svg', width: 800, height: 600 });
// For some unknown reason canvas requires use of the sync API's to use SVG's or PDF's.
// See https://www.npmjs.com/package/chartjs-node-canvas#svg-and-pdf
const svgData = chart.renderToBufferSync(pieChartConfig, 'image/svg+xml');
const svgString = svgData.toString('utf-8');

// Create an HTML file with the rendered pie chart
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pie Chart Example</title>
</head>
<body>
    <div id="pie-chart">
        ${svgString}
    </div>
</body>
</html>
`;

// Save HTML to a file (optional)
fs.writeFileSync('piechart2.html', htmlContent);

console.log('Pie chart HTML generated. Open piechart.html to view.');
