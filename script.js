function getCSVFileNameFromURL() {
    var urlParams = new URLSearchParams(window.location.search);
    console.log(1);
    console.log(urlParams);
    console.log(2);
    console.log(urlParams.get('data'));
    var dataFileName = urlParams.get('data');
    return dataFileName; // 'data' is the name of the parameter in the URL
}

var voteToCategory = {
    "yes": 0,
    "no": 2,
    "present": 1
};

var red = "#e63225";
var blue = "#3f5bd4";

var radius = 11; 

if (window.innerWidth < 500){
    radius = 7;
} else {
    radius = 11;
}
rawData = [];
// Function to load data and perform all operations that depend on rawData
async function loadDataAndVisualize() {
    try {
        // Load the CSV data
        const csvFileName = getCSVFileNameFromURL() || 'vote.csv';
        console.log(3);
        console.log(csvFileName);
        const filePath = `${csvFileName}`;
        console.log(4);
        console.log(filePath);

        // Transform and prepare rawData
        const processedData = rawData.map(d => {
            // Apply voteToCategory mapping, with a fallback if the vote type is unrecognized
            var category = voteToCategory[d.vote.trim().toLowerCase()] || 0; // Using 0 as a fallback category

            return {
                ...d,
                radius:radius,
                color: d.Party === "R" ? red:blue,
                category: category
            };
        });

        createVisualization(processedData);

    } catch (error) {
        // Handle any errors that occurred during loading or processing
        console.error("Failed to load or process the CSV data:", error);
    }
}

// Function that uses rawData to create the visualization
function createVisualization(processedData) {
    // Calculate the available height for the SVG, minus the header and footer
    function calculateAvailableHeight() {
        const hedHeight = document.getElementById('hed').clientHeight;
        const subHeight = document.getElementById('sub').clientHeight;
        const creditHeight = document.getElementById('credit').clientHeight;
        const totalTextHeight = hedHeight + subHeight + creditHeight;
        const availableHeight = 0.9*(window.innerHeight - totalTextHeight);
        return availableHeight;
    }

    // Initialize dimensions based on the available window size
    var width = 0.8*window.innerWidth,
        height = calculateAvailableHeight();

    var xBounds = { left: 50, right: width - 50 };
    var yBounds = { top: 50, bottom: height - 50 };

    // Your original variables remain unchanged
    var split = 7;
    var xCenter = [width / split, width / 2, (width / split) * (split-1)];
    var yCenter = height / 2;

    var labels = ["Yes", "Present", "No"];
    var labelYOffset = height/2-height*0.1; // Adjust this value as needed to position the labels above or below the line

    var nodes = processedData;

    var simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(1))
        .force('x', d3.forceX().x(function(d) {
            return xCenter[d.category];
        }).strength(0.2))
        .force('y', d3.forceY(yCenter).strength(0.1))
        .force('collision', d3.forceCollide().radius(function(d) {
            return d.radius + 1;
        }))
        .on('tick', ticked);

    var svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin", "0 auto")
        .attr("class", "graph-svg-component")
        .attr("viewBox", `0 0 ${width} ${height}`);

    svg.append("line")
        .attr("id", "center-line") // Assigning an ID for easy selection
        .attr("x1", 0)
        .attr("y1", yCenter)
        .attr("x2", width)
        .attr("y2", yCenter)
        .style("stroke", "lightgray")
        .style("stroke-width", 2);

    // Append each label to the SVG
    labels.forEach(function(label, i) {
        svg.append("text")
            .attr("x", xCenter[i])
            .attr("y", yCenter - labelYOffset) // Adjusting position above the line
            .attr("text-anchor", "middle") // Centers the text at its x position
            .style("fill", "black") // Text color
            .style("font-family", "Arial, sans-serif") // Font styling
            .style("font-size", "16px") // Font size
            .text(label)
            .classed("label-text",true);
    });

    var node = createNodes(svg, nodes);

    // Function to create nodes
    function createNodes(svg, nodes) {
        var nodeSelection = svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", function(d) { return d.radius; }) // Add padding to the radius
            .attr("fill", function(d) { return d.color; }) // Color based on random color assignment
            .style("stroke", "none");

        return nodeSelection;
    }
    
    var selectContainer = d3.select("#sub")
        .append("div")
        .classed("select-container", true);

    selectContainer.append("span")
        .text("")
        .style("font-family", "sans-serif")
        .style("font-weight", "bold");

    // Function to update nodes' opacity based on search query
    function updateNodeVisibility(query) {
        var lowerCaseQuery = query.toLowerCase();
        node.style("opacity", function(d) {
            // Convert node id to lower case for case-insensitive comparison
            var nodeIdLowerCase = d.id.toLowerCase();
            return nodeIdLowerCase.includes(lowerCaseQuery) ? 1 : 0.2;
        });
    }

    // Event listener for the search input
    d3.select("#searchNode").on("input", function(event) {
        updateNodeVisibility(event.target.value);
    });

    var drag = d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded);

    node.call(drag);

    // Drag functions
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0.1).alphaMin(0.1005).restart();
        d.fx = null;
        d.fy = null;
    }

    // Ensure the tooltip is appended to the body and has an absolute position
    var tooltip = d3.select("body").selectAll(".tooltip").data([0]).enter()
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("padding", "10px")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("pointer-events", "none");

    // Declare a variable at a scope accessible by both handleMouseOver and handleMouseOut
    var hideTooltipTimeout;

    function handleMouseOver(event, d) {
        // Clear any existing timeout to ensure it does not hide the current tooltip
        clearTimeout(hideTooltipTimeout);

        tooltip.html("Name: " + d.id + "<br/>Party: " + d.party_long)
            .style("opacity", 1)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");

        d3.select(this)
            .style("stroke", "black")
            .style("stroke-width", "3.5px");
    }

    function handleMouseOut(event, d) {
        // Set a timeout to hide the tooltip, giving a buffer to prevent premature hiding
        d3.select(this).style("stroke", null).style("stroke-width", null);
        hideTooltipTimeout = setTimeout(() => {
            tooltip.style("opacity", 0);
        }, 5); // Adjust the delay as necessary
    }

    // Ensure the rest of your setup for mouse events remains the same
    node.on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);


    function ticked() {
        node
            .attr("cx", function(d) { 
                return Math.max(radius, Math.min(width - radius, d.x)); 
            })
            .attr("cy", function(d) { 
                return Math.max(radius, Math.min(height - radius, d.y)); 
            });
    }


    // Function to update the SVG dimensions on window resize
    function updateSVGSize() {
        width = window.innerWidth;
        height = calculateAvailableHeight();
        var xCenter = [width / split, width / 2, (width / split) * (split-1)];
        var yCenter = height / 2;

        svg.attr("width", width)
           .attr("height", height)
           .attr("viewBox", `0 0 ${width} ${height}`);

        d3.select("#center-line")
            .attr("x1", 0)
            .attr("y1", yCenter)
            .attr("x2", width)
            .attr("y2", yCenter);

        // Remove existing labels
        svg.selectAll(".label-text").remove(); // This removes all elements with the 'label-text' class

        // Redraw the labels
        var labels = ["Yes", "Present", "No"];
        var labelYOffset = height/2-height*0.1; // Adjust as necessary

        labels.forEach(function(label, i) {
            svg.insert("text", ":first-child") // This ensures the text is added behind existing elements
                .attr("class", "label-text")
                .attr("x", xCenter[i])
                .attr("y", yCenter - labelYOffset)
                .attr("text-anchor", "middle")
                .style("fill", "black")
                .style("font-family", "Arial, sans-serif")
                .style("font-size", "16px")
                .text(label);
        });

        simulation.force('x', d3.forceX().x(function(d) {
            return xCenter[d.category];
        }));

        simulation.force('y', d3.forceY(yCenter));
        simulation.alpha(1).restart();
    }

    // Listen to window resize events
    window.addEventListener('resize', updateSVGSize);
}

// Call the async function to load data and create the visualization
loadDataAndVisualize();








