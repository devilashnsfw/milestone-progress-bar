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
        // Fetch milestone data
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

        // Fetch issues data
        const milestoneNumber = milestone.number;
        const issuesUrl = `https://api.github.com/repos/${user}/${repo}/issues?milestone=${milestoneNumber}&state=all`;
        const issuesResponse = await fetch(issuesUrl);

        if (!issuesResponse.ok) {
            throw new Error(`HTTP Error: ${issuesResponse.status}`);
        }

        const issues = await issuesResponse.json();
        const totalIssues = issues.length;
        const closedIssues = issues.filter(issue => issue.state === "closed").length;

        // Prepare tag data
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

        // Draw progress bar
        drawProgressBar(milestone.title, closedIssues, totalIssues, tagCounts, tagClosedCounts, filteredTags, tagColors);

    } catch (error) {
        console.error("Error fetching milestone data:", error);
    }
}

function drawProgressBar(title, closedCount, totalCount, tagCounts, tagClosedCounts, filteredTags, tagColors) {
    const canvas = document.getElementById("progressCanvas");
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const barWidth = width - 80;
    const barHeight = 16;
    const startX = 40;
    let startY = 40;

    ctx.clearRect(0, 0, width, canvas.height);

    // Title and overall progress
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.fillText(title, startX, startY);

    const percentage = Math.round((closedCount / totalCount) * 100);
    ctx.textAlign = "right";
    ctx.fillText(`${percentage}% Complete (${closedCount}/${totalCount} Issues)`, width - 40, startY);

    // Draw overall progress bar
    startY += 20;
    let xOffset = startX;
    filteredTags.forEach((tag, index) => {
        const tagCount = tagCounts[tag];
        const closedTagCount = tagClosedCounts[tag];

        const segmentWidth = (tagCount / totalCount) * barWidth;
        const closedSegmentWidth = (closedTagCount / tagCount) * segmentWidth;

        ctx.fillStyle = tagColors[index];
        ctx.fillRect(xOffset, startY, closedSegmentWidth, barHeight);

        xOffset += segmentWidth;
    });

    ctx.fillStyle = "#d6d6d6";
    ctx.fillRect(xOffset, startY, barWidth - xOffset + startX, barHeight);

    // Separator line
    startY += 30;
    ctx.fillStyle = "#ccc";
    ctx.fillRect(startX, startY, barWidth, 2);

    // Draw individual tag progress
    startY += 20;
    filteredTags.forEach((tag, index) => {
        // Add spacing before each tag
        startY += 2;

        // Draw tag name
        ctx.font = "14px Arial";
        ctx.fillStyle = "#000";
        ctx.textAlign = "left";
        ctx.fillText(tag, startX, startY);

        // Draw tag progress bar
        startY += 10;
        ctx.fillStyle = "#d6d6d6";
        ctx.fillRect(startX, startY, barWidth, barHeight);

        const closedTagWidth = (tagClosedCounts[tag] / tagCounts[tag]) * barWidth;
        ctx.fillStyle = tagColors[index];
        ctx.fillRect(startX, startY, closedTagWidth, barHeight);

        startY += 30;
    });
}

function generateTagColors(count) {
    const baseColors = [
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

// Example of embedding as an image
fetchMilestoneProgress().then(() => {
    const img = document.getElementById("generatedImage");
    img.src = convertCanvasToImage();
    img.style.display = "none";
});
