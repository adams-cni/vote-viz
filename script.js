console.log("SCRIPT");
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

var nodes = rawData;

console.log("position1");
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
        .style("stroke", "none")
        .on("mouseover", handleMouseOver) // Add mouseover event listener
        .on("mouseout", handleMouseOut); // Add mouseout event listener

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

/*
var dropdown = selectContainer.append("select")
    .on("change", function() {
        var selectedId = this.value;
        updateOpacity(selectedId);
    });

// Add the placeholder option
dropdown.append("option")
    .attr("value", "")
    .attr("disabled", true)
    .attr("selected", true)
    .text("Select a node")
    .style("color", "rgba(0, 0, 0, 0.1)");

// Populate the dropdown with options
dropdown.selectAll("option.node-option")
    .data(nodes)
    .enter().append("option")
    .classed("node-option", true)
    .attr("value", function(d) { return d.id; })
    .text(function(d) { return d.id; });

// Update opacity based on selected option
function updateOpacity(selectedId) {
    node.style("opacity", function(d) {
        return selectedId ? (d.id === selectedId ? 1 : 0.5) : 1;
    });
}

var clearButton = selectContainer.append("button")
    .text("Clear")
    .on("click", function() {
        dropdown.property("value", ""); // Set the dropdown value to empty
        updateOpacity(null);
    });

// Position the clear button next to the dropdown
clearButton.style("margin-left", "10px")
      .style("border", "none")
      .style("background-color", "transparent")
      .style("color", "#7d7d7d")
      .style("font-weight", "bold");

function updateOpacity(selectedId) {
    node.style("opacity", function(d) {
        return selectedId ? (d.id === selectedId ? 1 : 0.5) : 1;
    });
}
*/



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
    if (!event.active) simulation.alphaTarget(0.1);
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

function handleMouseOver(event, d) {
    // Update the tooltip position and content as before
    tooltip.html("Name: " + d.id + "<br/>Party: " + d.party_long)
        .style("opacity", 1)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");

    // Apply a 3.5px black stroke to the hovered node
    d3.select(this)
        .style("stroke", "black")
        .style("stroke-width", "3.5px");
}

function handleMouseOut(d) {
    // Hide the tooltip as before
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);

    // Remove the stroke from the node
    d3.select(this)
        .style("stroke", null) // This removes the stroke style
        .style("stroke-width", null); // This removes the stroke-width style
}

// Attach the mouseover and mouseout event handlers to the nodes again
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
