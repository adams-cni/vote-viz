function getCSVFileNameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log(1);
    console.log(urlParams);
    return urlParams.get('data'); // 'data' is the name of the parameter in the URL
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

function calculateCategoryCounts(processedData) {
    // Initialize category counts
    let categoryCounts = {0: 0, 1: 0, 2: 0}; // Map for "yes", "present", and "no" categories

    // Iterate through processedData to count each category occurrence
    processedData.forEach(d => {
        if(categoryCounts.hasOwnProperty(d.category)) {
            categoryCounts[d.category]++;
        } else {
            console.warn(`Unexpected category value encountered: ${d.category}`);
        }
    });

    return categoryCounts;
}

// Function to load data and perform all operations that depend on rawData
async function loadDataAndVisualize() {
    try {
        // Load the CSV data
        var csvFileName = getCSVFileNameFromURL() || 'vote.csv';
        console.log(3);
        var csvFilePath = "votes/"+csvFileName;
        console.log(csvFilePath);
        
        var rawData = await d3.csv(csvFilePath);

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
        
        let categoryCounts = calculateCategoryCounts(processedData);
        console.log("Category Counts:", categoryCounts);

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

    var countsGroup = svg.append("g").attr("class", "labels-and-lines");

    // displaying the cat counts    
    function displayCategoryCountsOnSVG(categoryCounts, xCenter,yCenter) {
        var labelYOffset = height/2-height*0.1;
        var yCountPos = yCenter - labelYOffset + 20;
        var labels = ["Yes", "Present", "No"]; // Corresponding to categories 0, 1, 2
        
        countsGroup.selectAll(".count-label,.count-line,.line,.text").remove();
        
        countsGroup.append("line")
                .attr("class", "center-line") // Assigning an ID for easy selection
                .attr("x1", 0)
                .attr("y1", yCenter)
                .attr("x2", width)
                .attr("y2", yCenter)
                .style("stroke", "lightgray")
                .style("stroke-width", 2);
            
  

        labels.forEach((label, i) => {
            // Assuming xCenter positions from your setup, corresponding to category labels
            countsGroup.append("text")
                .attr("class", "count-line")
                .attr("x", xCenter[i])
                .attr("y", yCountPos)
                .attr("text-anchor", "middle")
                .style("fill", "grey")
                .style("font-family", "Arial, sans-serif")
                .style("font-size", "14px")
                .text(`${categoryCounts[i]}`); // Displaying the count next to its label
            
            var yPosLineBottom = yCountPos + 12 ;
            
            countsGroup.append("line")
            .attr("x1", xCenter[i])
            .attr("y1", yPosLineBottom)
            .attr("x2", xCenter[i])
            .attr("y2", yCenter) // Extend to yCenter
            .style("stroke", "grey")
            .style("opacity", 0.5)
            .style("stroke-width", 1)
            .attr("class", "count-line");
            
            countsGroup.append("text")
            .attr("x", xCenter[i])
            .attr("y", yCenter - labelYOffset) // Adjusting position above the line
            .attr("text-anchor", "middle") // Centers the text at its x position
            .style("fill", "black") // Text color
            .style("font-family", "Arial, sans-serif") // Font styling
            .style("font-size", "16px") // Font size
            .text(label)
            .classed("label-text",true);
    });              
}
    
    // Assuming you calculate categoryCounts here or pass it to this function
    let categoryCounts = calculateCategoryCounts(processedData);

    // Now display these counts on the SVG
    displayCategoryCountsOnSVG(categoryCounts, xCenter,yCenter);
        
    
    var node = createNodes(svg, nodes);
    var nodesGroup = svg.append("g").attr("class", "nodes");

        
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
        .attr("class", "tooltip");

    // Declare a variable at a scope accessible by both handleMouseOver and handleMouseOut
    var hideTooltipTimeout;

    function handleMouseOver(event, d) {
        // Clear any existing timeout to ensure it does not hide the current tooltip
        clearTimeout(hideTooltipTimeout);

        tooltip.html("<b>Name: </b>" + d.id + "<br/><b>Party:</b> " + d.party_long+ "<br/><b>Vote:</b> " + d.vote+ "<br/><b>District:</b> " + d.District)
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
        width = 0.8*window.innerWidth;
        height = calculateAvailableHeight();
        svg.selectAll(".count-label").remove();
        svg.selectAll(".count-line").remove();
        svg.selectAll(".center-line").remove();
        svg.selectAll(".text").remove();
        xCenter = [width / split, width / 2, (width / split) * (split-1)];
        yCenter = height / 2;

        svg.attr("width", width)
           .attr("height", height)
           .attr("viewBox", `0 0 ${width} ${height}`);
        

        // Remove existing labels
        svg.selectAll(".label-text").remove();// This removes all elements with the 'label-text' class

        // Redraw the labels
        
        displayCategoryCountsOnSVG(categoryCounts, xCenter, yCenter);
        
        

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








