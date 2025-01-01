async function fetchMilestoneProgress() {
    const queryParams = new URLSearchParams(window.location.search);
    const user = queryParams.get("user");
    const repo = queryParams.get("repo");
    const milestoneTitle = queryParams.get("milestone");

    if (!user || !repo || !milestoneTitle) {
        console.error("Invalid URL parameters.");
        return;
    }

    try {
        const milestonesUrl = `https://api.github.com/repos/${user}/${repo}/milestones`;
        const milestonesResponse = await fetch(milestonesUrl);

        if (!milestonesResponse.ok) {
            throw new Error(`HTTP Error: ${milestonesResponse.status}`);
        }

        const milestones = await milestonesResponse.json();
        const milestone = milestones.find(m => m.title === milestoneTitle);

        if (!milestone) {
            throw new Error("Milestone not found.");
        }

        const milestoneNumber = milestone.number;
        const issuesUrl = `https://api.github.com/repos/${user}/${repo}/issues?milestone=${milestoneNumber}&state=all`;
        const issuesResponse = await fetch(issuesUrl);

        if (!issuesResponse.ok) {
            throw new Error(`HTTP Error: ${issuesResponse.status}`);
        }

        const issues = await issuesResponse.json();
        const totalIssues = issues.length;
        const closedIssues = issues.filter(issue => issue.state === "closed").length;

        const tagCounts = {};
        const tagClosedCounts = {};
        issues.forEach(issue => {
            issue.labels.forEach(label => {
                const tag = label.name;
                if (!tagCounts[tag]) {
                    tagCounts[tag] = 0;
                    tagClosedCounts[tag] = 0;
                }
                tagCounts[tag]++;
                if (issue.state === "closed") {
                    tagClosedCounts[tag]++;
                }
            });
        });

        const filteredTags = Object.keys(tagCounts).filter(tag => tagCounts[tag] > 0);
        const tagColors = generateTagColors(filteredTags.length);

        drawProgressBar(milestone.title, closedIssues, totalIssues, tagCounts, tagClosedCounts, filteredTags, tagColors);

    } catch (error) {
        console.error("Error fetching milestone data:", error);
    }
}

function drawProgressBar(title, closedCount, totalCount, tagCounts, tagClosedCounts, filteredTags, tagColors) {
    const canvas = document.getElementById("progressCanvas");
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const barWidth = width - 40;
    const barHeight = 16;
    const startX = 20;
    let startY = 40;

    ctx.clearRect(0, 0, width, canvas.height);

    // Draw title and overall progress
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#fbf1c7"; // "#000";
    ctx.textAlign = "left";
    ctx.fillText(title, startX, startY);

    const percentage = Math.round((closedCount / totalCount) * 100);
    ctx.font = "16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`${percentage}% Complete [${closedCount}/${totalCount}]`, width - 20, startY);

    startY += 20;

    // Draw overall progress bar
    let xOffset = startX;

    // Draw segments for tags (closed issues per tag)
    filteredTags.forEach((tag, index) => {
        const segmentWidth = (tagCounts[tag] / totalCount) * barWidth; // Full width for this tag
        const closedSegmentWidth = (tagClosedCounts[tag] / tagCounts[tag]) * segmentWidth; // Closed progress for this tag

        // Draw closed progress in tag color
        ctx.fillStyle = tagColors[index];
        ctx.fillRect(xOffset, startY, closedSegmentWidth, barHeight);

        // Move xOffset forward by the full segment width
        xOffset += segmentWidth;
    });

    // Incomplete progress
    ctx.fillStyle = "#928374"; // "#d6d6d6";
    ctx.fillRect(xOffset, startY, barWidth - xOffset + startX, barHeight);

    // Separator between main bar and individual tags
    startY += 30;
    ctx.fillStyle = "#928374"; // "#ccc";
    ctx.fillRect(startX, startY, barWidth, 2);

    // Draw individual tag progress
    startY += 20;
    filteredTags.forEach((tag, index) => {
        startY += 2;

        // Draw tag name
        ctx.font = "14px Arial";
        ctx.fillStyle = "#fbf1c7"; // "#000";
        ctx.textAlign = "left";
        ctx.fillText(tag, startX, startY);
    
        // Tag info
        ctx.textAlign = "right";
        ctx.fillText(`[${tagClosedCounts[tag]}/${tagCounts[tag]}]`, width - 20, startY);

        startY += 10;

        ctx.fillStyle = `${tagColors[index]}50`;
        ctx.fillRect(startX, startY, barWidth, barHeight);

        const closedTagWidth = (tagClosedCounts[tag] / tagCounts[tag]) * barWidth;
        ctx.fillStyle = tagColors[index];
        ctx.fillRect(startX, startY, closedTagWidth, barHeight);

        startY += 30;
    });
}

function generateTagColors(count) {
    const baseColors = [
        "#CC241D", "#458588", "#D65D0E", "#B16286", "#689D6A", "98971A",
        "#E57373", "#FFB74D", "#81C784", "#64B5F6", "#9575CD",
        "#F06292", "#4DB6AC", "#7986CB", "#FFD54F", "#4DD0E1"
    ];
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// Convert canvas to image URL
function convertCanvasToImage() {
    const canvas = document.getElementById("progressCanvas");
    return canvas.toDataURL("image/png");
}

fetchMilestoneProgress().then(() => {
    const img = document.getElementById("generatedImage");
    img.src = convertCanvasToImage();
    img.alt = "Milestone Progress";
    img.style.borderRadius = "5px";
});
